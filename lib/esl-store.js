import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Redis from 'ioredis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const MEMORY_FILE = path.join(PROJECT_ROOT, '.data', 'esl-memory.json')

const KEY_IDS = 'esl:nomenclature:ids'

/** @param {string} id */
function productKey(id) {
  return `esl:product:${id}`
}

/** @param {string} macNorm normalized aa:bb:cc:dd:ee:ff */
function deviceKey(macNorm) {
  return `device:${macNorm}`
}

let redis = null

function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (redis) return redis
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    })
    redis.on('error', () => {})
    return redis
  } catch {
    return null
  }
}

const memory = {
  /** @type {Map<string, { id: string, name: string, article: string, price: string, discount: string }>} */
  products: new Map(),
  /** @type {Map<string, string>} macNorm -> productId */
  devices: new Map(),
}

async function loadMemoryFile() {
  try {
    const raw = await fs.readFile(MEMORY_FILE, 'utf8')
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        if (p && p.id) memory.products.set(String(p.id), normalizeProduct(p))
      }
    }
    if (data.devices && typeof data.devices === 'object') {
      for (const [k, v] of Object.entries(data.devices)) {
        const nm = normalizeMac(k)
        if (nm && v) memory.devices.set(nm, String(v))
      }
    }
  } catch {
    // ignore
  }
}

let memoryLoaded = false
async function ensureMemoryLoaded() {
  if (memoryLoaded) return
  memoryLoaded = true
  await loadMemoryFile()
  if (memory.products.size === 0) {
    seedDemoProducts()
    await persistMemory()
  }
}

async function persistMemory() {
  if (getRedis()) return
  try {
    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true })
    const products = [...memory.products.values()]
    const devices = Object.fromEntries(memory.devices)
    await fs.writeFile(
      MEMORY_FILE,
      JSON.stringify({ products, devices }, null, 0),
      'utf8',
    )
  } catch {
    // ignore
  }
}

function seedDemoProducts() {
  const demo = [
    { id: '1', name: 'Демо-товар A', article: 'DEMO-001', price: '1990', discount: '0' },
    { id: '2', name: 'Демо-товар B', article: 'DEMO-002', price: '3490', discount: '5' },
    { id: '3', name: 'Демо-товар C', article: 'DEMO-003', price: '890', discount: '10' },
  ]
  for (const p of demo) memory.products.set(p.id, p)
}

/** @param {unknown} p */
function normalizeProduct(p) {
  const o = p && typeof p === 'object' ? p : {}
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    article: String(o.article ?? ''),
    price: String(o.price ?? ''),
    discount: String(o.discount ?? '0'),
  }
}

export function normalizeMac(mac) {
  const hex = String(mac ?? '').replace(/[^a-fA-F0-9]/g, '')
  if (hex.length !== 12) return null
  return hex.toLowerCase().match(/.{2}/g).join(':')
}

async function useRedis() {
  const r = getRedis()
  if (!r) return false
  try {
    await r.ping()
    return true
  } catch {
    try {
      r.disconnect()
    } catch {
      // ignore
    }
    redis = null
    return false
  }
}

async function readIdsRedis(r) {
  const raw = await r.get(KEY_IDS)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

async function writeIdsRedis(r, ids) {
  await r.set(KEY_IDS, JSON.stringify(ids))
}

export async function getNomenclature() {
  await ensureMemoryLoaded()
  if (await useRedis()) {
    const r = getRedis()
    const ids = await readIdsRedis(r)
    const out = []
    for (const id of ids) {
      const raw = await r.get(productKey(id))
      if (raw) {
        try {
          out.push(normalizeProduct(JSON.parse(raw)))
        } catch {
          // skip
        }
      }
    }
    return out.sort((a, b) => a.id.localeCompare(b.id, 'ru'))
  }
  return [...memory.products.values()].sort((a, b) => a.id.localeCompare(b.id, 'ru'))
}

/**
 * @param {string} id
 */
export async function getProductById(id) {
  await ensureMemoryLoaded()
  const pid = String(id)
  if (await useRedis()) {
    const r = getRedis()
    const raw = await r.get(productKey(pid))
    if (!raw) return null
    try {
      return normalizeProduct(JSON.parse(raw))
    } catch {
      return null
    }
  }
  return memory.products.get(pid) ?? null
}

export async function setDeviceBinding(macRaw, productId) {
  await ensureMemoryLoaded()
  const mac = normalizeMac(macRaw)
  if (!mac) throw new Error('Некорректный MAC-адрес')
  const pid = String(productId ?? '').trim()
  if (!pid) throw new Error('Укажите товар')
  const product = await getProductById(pid)
  if (!product) throw new Error('Товар не найден в номенклатуре')

  if (await useRedis()) {
    const r = getRedis()
    await r.set(deviceKey(mac), pid)
    return { mac, productId: pid }
  }
  memory.devices.set(mac, pid)
  await persistMemory()
  return { mac, productId: pid }
}

export async function getProductIdForDevice(macRaw) {
  await ensureMemoryLoaded()
  const mac = normalizeMac(macRaw)
  if (!mac) return null
  if (await useRedis()) {
    const r = getRedis()
    const v = await r.get(deviceKey(mac))
    return v ? String(v) : null
  }
  return memory.devices.get(mac) ?? null
}

export async function getTagPayloadForMac(macRaw) {
  const mac = normalizeMac(macRaw)
  if (!mac) return { error: 'bad_mac', status: 400 }
  const productId = await getProductIdForDevice(macRaw)
  if (!productId) return { error: 'not_found', status: 404 }
  const product = await getProductById(productId)
  if (!product) return { error: 'not_found', status: 404 }
  return {
    status: 200,
    body: {
      id: product.id,
      name: product.name,
      article: product.article,
      price: product.price,
      discount: product.discount,
    },
  }
}

const SYNC_STUB_PRODUCTS = [
  { id: '1c-100', name: 'Синхр. позиция 100', article: '1C-100', price: '12500', discount: '0' },
  { id: '1c-101', name: 'Синхр. позиция 101', article: '1C-101', price: '780', discount: '15' },
  { id: '1c-102', name: 'Синхр. позиция 102', article: '1C-102', price: '4520', discount: '7' },
]

/** Имитация загрузки номенклатуры из 1С в Redis. */
export async function syncFrom1CStub() {
  await ensureMemoryLoaded()
  const merged = [...SYNC_STUB_PRODUCTS]
  if (await useRedis()) {
    const r = getRedis()
    const existing = await readIdsRedis(r)
    const set = new Set(existing)
    for (const p of merged) {
      set.add(p.id)
      await r.set(productKey(p.id), JSON.stringify(normalizeProduct(p)))
    }
    await writeIdsRedis(r, [...set].sort())
    return { ok: true, message: 'Номенклатура обновлена (заглушка 1С → Redis)', count: merged.length }
  }
  for (const p of merged) {
    memory.products.set(p.id, normalizeProduct(p))
  }
  await persistMemory()
  return { ok: true, message: 'Номенклатура обновлена локально (заглушка, без Redis)', count: merged.length }
}

export function eslBackendMode() {
  return getRedis() ? 'redis' : 'memory'
}

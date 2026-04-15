import Redis from 'ioredis'

const KEY_NIGHT = 'esl:night_mode'
const KEY_QUEUE = 'price_updates_queue'
const KEY_PRODUCTS = 'esl:product_ids'
const KEY_STORES = 'esl:stores'

let redis = null
const memory = {
  products: new Map(),
  esl: new Map(),
  stores: new Map(),
  queue: [],
  nightMode: { enabled: false, time: '02:00' },
}

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

async function withRedis() {
  const r = getRedis()
  if (!r) return null
  try {
    await r.ping()
    return r
  } catch {
    try {
      r.disconnect()
    } catch {}
    redis = null
    return null
  }
}

function normalizeMac(mac) {
  const hex = String(mac ?? '').replace(/[^a-fA-F0-9]/g, '')
  if (hex.length !== 12) return null
  return hex.toLowerCase().match(/.{2}/g).join(':')
}

function productKey(id) {
  return `product:${id}`
}
function eslKey(mac) {
  return `esl:${mac}`
}
function storeUnitsKey(storeId) {
  return `store:${storeId}:units`
}

function nowIso() {
  return new Date().toISOString()
}

function seedMemory() {
  if (memory.products.size) return
  const products = [
    { id: 'p-100', name: 'Кофе Arabica 250г', article: 'CF-250', supplier: 'CoffeeTrade', price1c: '2390', imageUrl: '' },
    { id: 'p-101', name: 'Чай Green 100г', article: 'TG-100', supplier: 'Tea Group', price1c: '1290', imageUrl: '' },
    { id: 'p-102', name: 'Печенье Choco', article: 'CK-033', supplier: 'Sweet House', price1c: '890', imageUrl: '' },
  ]
  for (const p of products) memory.products.set(p.id, { ...p })

  const storeId = 'rp-1'
  memory.stores.set(storeId, { id: storeId, name: 'Торговая точка 1', wifiLoad: 35 })
  const macs = ['aa:bb:cc:dd:ee:01', 'aa:bb:cc:dd:ee:02', 'aa:bb:cc:dd:ee:03']
  memory.stores.set(`${storeId}:units`, new Set(macs))
  macs.forEach((mac, i) => {
    const productId = products[i % products.length].id
    memory.esl.set(mac, {
      mac,
      productId,
      priceOnScreen: products[i % products.length].price1c,
      battery: String(80 - i * 12),
      powerStatus: 'ok',
      firmware: '1.0.0',
      ip: `192.168.1.${40 + i}`,
      storeId,
      online: i !== 2,
      needsUpdate: false,
      lastSeenAt: nowIso(),
      rack: `R-${1 + i}`,
    })
  })
}

async function ensureSeed() {
  const r = await withRedis()
  if (!r) {
    seedMemory()
    return 'memory'
  }
  const cnt = await r.scard(KEY_PRODUCTS)
  if (cnt > 0) return 'redis'

  const demo = [
    { id: 'p-100', name: 'Кофе Arabica 250г', article: 'CF-250', supplier: 'CoffeeTrade', price1c: '2390', imageUrl: '' },
    { id: 'p-101', name: 'Чай Green 100г', article: 'TG-100', supplier: 'Tea Group', price1c: '1290', imageUrl: '' },
    { id: 'p-102', name: 'Печенье Choco', article: 'CK-033', supplier: 'Sweet House', price1c: '890', imageUrl: '' },
  ]
  const storeId = 'rp-1'
  await r.sadd(KEY_STORES, storeId)
  const macs = ['aa:bb:cc:dd:ee:01', 'aa:bb:cc:dd:ee:02', 'aa:bb:cc:dd:ee:03']
  for (const p of demo) {
    await r.hmset(productKey(p.id), p)
    await r.sadd(KEY_PRODUCTS, p.id)
  }
  for (let i = 0; i < macs.length; i += 1) {
    const mac = macs[i]
    const p = demo[i % demo.length]
    await r.hmset(eslKey(mac), {
      productId: p.id,
      priceOnScreen: p.price1c,
      battery: String(80 - i * 12),
      powerStatus: 'ok',
      firmware: '1.0.0',
      ip: `192.168.1.${40 + i}`,
      storeId,
      online: i !== 2 ? '1' : '0',
      needsUpdate: '0',
      lastSeenAt: nowIso(),
      rack: `R-${1 + i}`,
    })
    await r.sadd(storeUnitsKey(storeId), mac)
  }
  await r.hmset(KEY_NIGHT, { enabled: '0', time: '02:00' })
  return 'redis'
}

export async function getBackendMode() {
  const mode = await ensureSeed()
  return mode
}

async function readProductsAndTags(storeId) {
  const mode = await ensureSeed()
  if (mode === 'memory') {
    const macs = [...(memory.stores.get(`${storeId}:units`) || new Set())]
    return { mode, macs, products: [...memory.products.values()], eslRows: macs.map((m) => ({ ...memory.esl.get(m), mac: m })) }
  }
  const r = await withRedis()
  const productIds = await r.smembers(KEY_PRODUCTS)
  const products = []
  for (const id of productIds) {
    const h = await r.hgetall(productKey(id))
    if (Object.keys(h).length) products.push({ id, ...h })
  }
  const macs = await r.smembers(storeUnitsKey(storeId))
  const eslRows = []
  for (const mac of macs) {
    const h = await r.hgetall(eslKey(mac))
    if (Object.keys(h).length) {
      eslRows.push({
        mac,
        ...h,
        online: h.online === '1',
        needsUpdate: h.needsUpdate === '1',
      })
    }
  }
  return { mode, macs, products, eslRows }
}

export async function getDashboard(storeId = 'rp-1') {
  const { eslRows } = await readProductsAndTags(storeId)
  const total = eslRows.length
  const online = eslRows.filter((x) => x.online).length
  const offline = total - online
  const needsUpdate = eslRows.filter((x) => x.needsUpdate).length
  const wifiLoad = total ? Math.min(100, Math.round((online / total) * 65 + (needsUpdate / total) * 25)) : 0
  return { total, online, offline, needsUpdate, wifiLoad }
}

export async function getProductsTable({ storeId = 'rp-1', discrepancyOnly = false, search = '' } = {}) {
  const { products, eslRows } = await readProductsAndTags(storeId)
  const byProduct = new Map(products.map((p) => [String(p.id), p]))
  const rows = eslRows.map((e) => {
    const p = byProduct.get(String(e.productId)) || {}
    const price1c = String(p.price1c || '')
    const priceEsl = String(e.priceOnScreen || '')
    const discrepancy = price1c && priceEsl && price1c !== priceEsl
    return {
      mac: e.mac,
      rack: e.rack || '',
      photo: p.imageUrl || '',
      productId: e.productId || p.id || '',
      name: p.name || '—',
      supplier: p.supplier || '—',
      price1c,
      priceEsl,
      discrepancy,
      online: Boolean(e.online),
      needsUpdate: Boolean(e.needsUpdate),
    }
  })
  const q = String(search || '').trim().toLowerCase()
  return rows.filter((r) => {
    if (discrepancyOnly && !r.discrepancy) return false
    if (!q) return true
    return [r.name, r.supplier, r.productId, r.mac, r.rack].some((x) => String(x).toLowerCase().includes(q))
  })
}

export async function bindTagToProduct({ storeId = 'rp-1', mac, productId }) {
  const mode = await ensureSeed()
  const macNorm = normalizeMac(mac)
  if (!macNorm) throw new Error('Некорректный MAC-адрес')
  if (!productId) throw new Error('Укажите товар')
  if (mode === 'memory') {
    if (!memory.products.has(String(productId))) throw new Error('Товар не найден')
    if (!memory.stores.has(storeId)) memory.stores.set(storeId, { id: storeId, name: storeId, wifiLoad: 0 })
    if (!memory.stores.get(`${storeId}:units`)) memory.stores.set(`${storeId}:units`, new Set())
    memory.stores.get(`${storeId}:units`).add(macNorm)
    const prev = memory.esl.get(macNorm) || {}
    memory.esl.set(macNorm, {
      ...prev,
      mac: macNorm,
      productId: String(productId),
      storeId,
      online: prev.online ?? true,
      needsUpdate: prev.needsUpdate ?? false,
      priceOnScreen: prev.priceOnScreen ?? memory.products.get(String(productId)).price1c,
      battery: prev.battery ?? '100',
      powerStatus: prev.powerStatus ?? 'ok',
      firmware: prev.firmware ?? '1.0.0',
      ip: prev.ip ?? '0.0.0.0',
      lastSeenAt: nowIso(),
      rack: prev.rack ?? 'R-1',
    })
    return { ok: true, mac: macNorm, productId: String(productId) }
  }
  const r = await withRedis()
  const p = await r.hgetall(productKey(productId))
  if (!Object.keys(p).length) throw new Error('Товар не найден')
  await r.sadd(KEY_STORES, storeId)
  await r.sadd(storeUnitsKey(storeId), macNorm)
  const prev = await r.hgetall(eslKey(macNorm))
  await r.hmset(eslKey(macNorm), {
    ...prev,
    productId: String(productId),
    storeId,
    lastSeenAt: nowIso(),
    online: prev.online || '1',
    needsUpdate: prev.needsUpdate || '0',
    priceOnScreen: prev.priceOnScreen || p.price1c || '',
    battery: prev.battery || '100',
    powerStatus: prev.powerStatus || 'ok',
    firmware: prev.firmware || '1.0.0',
    ip: prev.ip || '0.0.0.0',
    rack: prev.rack || 'R-1',
  })
  return { ok: true, mac: macNorm, productId: String(productId) }
}

export async function setEslPrice({ mac, priceEsl }) {
  const mode = await ensureSeed()
  const macNorm = normalizeMac(mac)
  if (!macNorm) throw new Error('Некорректный MAC')
  const nextPrice = String(priceEsl ?? '').trim()
  if (!nextPrice) throw new Error('Цена не может быть пустой')
  if (mode === 'memory') {
    const row = memory.esl.get(macNorm)
    if (!row) throw new Error('Ценник не найден')
    row.priceOnScreen = nextPrice
    row.needsUpdate = false
    row.lastSeenAt = nowIso()
    memory.esl.set(macNorm, row)
    return { ok: true }
  }
  const r = await withRedis()
  const row = await r.hgetall(eslKey(macNorm))
  if (!Object.keys(row).length) throw new Error('Ценник не найден')
  await r.hmset(eslKey(macNorm), {
    ...row,
    priceOnScreen: nextPrice,
    needsUpdate: '0',
    lastSeenAt: nowIso(),
  })
  return { ok: true }
}

export async function getNightMode() {
  const mode = await ensureSeed()
  if (mode === 'memory') return { ...memory.nightMode }
  const r = await withRedis()
  const h = await r.hgetall(KEY_NIGHT)
  return {
    enabled: h.enabled === '1',
    time: h.time || '02:00',
  }
}

export async function setNightMode({ enabled, time }) {
  const mode = await ensureSeed()
  const cleanTime = String(time || '02:00')
  if (mode === 'memory') {
    memory.nightMode = { enabled: Boolean(enabled), time: cleanTime }
    return { ok: true, ...memory.nightMode }
  }
  const r = await withRedis()
  await r.hmset(KEY_NIGHT, { enabled: enabled ? '1' : '0', time: cleanTime })
  return { ok: true, enabled: Boolean(enabled), time: cleanTime }
}

export async function enqueuePriceUpdate(payload) {
  const mode = await ensureSeed()
  const row = { ...payload, at: nowIso() }
  if (mode === 'memory') {
    memory.queue.push(row)
    return { ok: true, length: memory.queue.length }
  }
  const r = await withRedis()
  await r.rpush(KEY_QUEUE, JSON.stringify(row))
  const len = await r.llen(KEY_QUEUE)
  return { ok: true, length: len }
}

export async function getQueueLength() {
  const mode = await ensureSeed()
  if (mode === 'memory') return memory.queue.length
  const r = await withRedis()
  return r.llen(KEY_QUEUE)
}

export async function runNightQueue({ sendByMqtt }) {
  const mode = await ensureSeed()
  let processed = 0
  if (mode === 'memory') {
    while (memory.queue.length) {
      const job = memory.queue.shift()
      if (sendByMqtt) await sendByMqtt(job)
      processed += 1
    }
    return { ok: true, processed }
  }
  const r = await withRedis()
  while (true) {
    const raw = await r.lpop(KEY_QUEUE)
    if (!raw) break
    let job = null
    try {
      job = JSON.parse(raw)
    } catch {
      job = null
    }
    if (job && sendByMqtt) await sendByMqtt(job)
    processed += 1
  }
  return { ok: true, processed }
}

export async function pingEsl(mac) {
  const macNorm = normalizeMac(mac)
  if (!macNorm) throw new Error('Некорректный MAC')
  return { ok: true, message: `Ценник ${macNorm} мигает (эмуляция)` }
}

export async function batchAction(storeId, action) {
  const { macs } = await readProductsAndTags(storeId)
  if (!macs.length) return { ok: true, affected: 0 }
  if (action === 'restart_store') {
    return { ok: true, affected: macs.length, message: 'Команда перезагрузки отправлена всем ESP32 (эмуляция)' }
  }
  return { ok: true, affected: macs.length, message: 'Обновление стеллажа отправлено (эмуляция)' }
}

export async function randomizeRuntimeStatus(storeId = 'rp-1') {
  const mode = await ensureSeed()
  if (mode === 'memory') {
    const macs = [...(memory.stores.get(`${storeId}:units`) || [])]
    for (const mac of macs) {
      const row = memory.esl.get(mac)
      if (!row) continue
      const flip = Math.random() > 0.82
      row.online = flip ? !row.online : row.online
      row.battery = String(Math.max(5, Number(row.battery || 100) - (Math.random() > 0.75 ? 1 : 0)))
      row.lastSeenAt = nowIso()
      row.needsUpdate = row.needsUpdate || Math.random() > 0.93
      memory.esl.set(mac, row)
    }
    return
  }
  const r = await withRedis()
  const macs = await r.smembers(storeUnitsKey(storeId))
  for (const mac of macs) {
    const h = await r.hgetall(eslKey(mac))
    if (!Object.keys(h).length) continue
    const onlineNow = h.online === '1'
    const flip = Math.random() > 0.82
    const online = flip ? !onlineNow : onlineNow
    const battery = Math.max(5, Number(h.battery || 100) - (Math.random() > 0.75 ? 1 : 0))
    const needsUpdate = h.needsUpdate === '1' || Math.random() > 0.93
    await r.hmset(eslKey(mac), {
      ...h,
      online: online ? '1' : '0',
      battery: String(battery),
      needsUpdate: needsUpdate ? '1' : '0',
      lastSeenAt: nowIso(),
    })
  }
}


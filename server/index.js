import express from 'express'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eslExpressMiddleware } from '../lib/esl-handlers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_VALUE = { name: '', price: '' }
const DATA_FILE = path.join(PROJECT_ROOT, '.data', 'electronic_price.json')
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_TABLE = process.env.SUPABASE_PRICE_TABLE || 'electronic_price'

// Для статического хостинга: физический файл, который ESP32 должна читать.
const PUBLIC_API_DATA_FILE = path.join(PROJECT_ROOT, 'public', 'api', 'data.json')
const PUBLIC_ROOT_JSON = path.join(PROJECT_ROOT, 'public', 'data.json')

// Бэкап/совместимость со старым вариантом
const PUBLIC_API_PRICE_FILE = path.join(PROJECT_ROOT, 'public', 'api', 'price.json')
const PUBLIC_LEGACY_ROOT_PRICE_FILE = path.join(PROJECT_ROOT, 'public', 'price.json')

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_VALUE }
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      price: typeof parsed.price === 'string' ? parsed.price : '',
    }
  } catch (_) {
    return { ...DEFAULT_VALUE }
  }
}

function writeMirroredFiles(payload) {
  const next = {
    name: String(payload?.name ?? '').trim(),
    price: String(payload?.price ?? '').trim(),
  }

  if (!next.name) throw new Error('Введите название товара')
  if (!next.price) throw new Error('Введите цену')

  const json = JSON.stringify(next)

  // Важно: синхронная запись в api/update-price по запросу пользователя.
  const targets = [
    DATA_FILE,
    PUBLIC_API_DATA_FILE,
    PUBLIC_ROOT_JSON,
    PUBLIC_API_PRICE_FILE,
    PUBLIC_LEGACY_ROOT_PRICE_FILE,
  ]

  for (const target of targets) {
    const dir = path.dirname(target)
    fsSync.mkdirSync(dir, { recursive: true })
    fsSync.accessSync(dir, fsSync.constants.W_OK)
    fsSync.writeFileSync(target, json, 'utf8')
  }

  return next
}

function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

async function readFromSupabase() {
  const base = SUPABASE_URL.replace(/\/$/, '')
  const url = `${base}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}?id=eq.1&select=name,price&limit=1`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Supabase read failed (${res.status})`)
  }

  const rows = await res.json()
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return { ...DEFAULT_VALUE }
  return {
    name: typeof row.name === 'string' ? row.name : '',
    price: typeof row.price === 'string' ? row.price : String(row.price ?? ''),
  }
}

async function writeToSupabase(payload) {
  const next = {
    name: String(payload?.name ?? '').trim(),
    price: String(payload?.price ?? '').trim(),
  }

  if (!next.name) throw new Error('Введите название товара')
  if (!next.price) throw new Error('Введите цену')

  const base = SUPABASE_URL.replace(/\/$/, '')
  const url = `${base}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}?on_conflict=id`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([{ id: 1, name: next.name, price: next.price }]),
  })

  if (!res.ok) {
    throw new Error(`Supabase write failed (${res.status})`)
  }

  const rows = await res.json()
  const row = Array.isArray(rows) ? rows[0] : next
  return {
    name: typeof row.name === 'string' ? row.name : next.name,
    price: typeof row.price === 'string' ? row.price : next.price,
  }
}

async function readPriceValue() {
  if (isSupabaseEnabled()) {
    return await readFromSupabase()
  }
  return await readJsonFile(DATA_FILE)
}

async function writePriceValue(payload) {
  if (isSupabaseEnabled()) {
    const updated = await writeToSupabase(payload)
    // Optional mirror for static URLs/caching consistency
    writeMirroredFiles(updated)
    return updated
  }
  return writeMirroredFiles(payload)
}

const app = express()
app.use(express.json({ type: ['application/json', '*/json'] }))
app.use(eslExpressMiddleware)

// 1) Строго JSON
app.get(['/api/price', '/api/price/'], async (req, res) => {
  const data = await readPriceValue()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

app.get(['/api/price.json', '/api/price.json/', '/price.json', '/price.json/'], async (req, res) => {
  const data = await readPriceValue()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

// Новый основной эндпоинт под ESP32: /api/data.json
app.get(['/api/data.json', '/api/data.json/', '/data.json', '/data.json/'], async (req, res) => {
  const data = await readPriceValue()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

// 2) Обновление
app.post(['/api/update-price', '/api/update-price/'], async (req, res) => {
  try {
    const updated = await writePriceValue(req.body)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(JSON.stringify(updated)) // {"name":"...","price":"..."}
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(400).send(JSON.stringify({ success: false, message: err?.message || 'Ошибка' }))
  }
})

// Прямое сохранение в /api/price(.json), чтобы админка писала "в него".
app.post(
  ['/api/price', '/api/price/', '/api/price.json', '/api/price.json/'],
  async (req, res) => {
    try {
      const updated = await writePriceValue(req.body)
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(200).send(JSON.stringify(updated))
    } catch (err) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).send(JSON.stringify({ success: false, message: err?.message || 'Ошибка' }))
    }
  },
)

// 3) Статическая часть (SPA)
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
app.use(express.static(DIST_DIR))

// SPA fallback: НЕ трогаем API и запросы с расширением .json/.css/.js
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).end()
  if (req.path.includes('.')) return res.status(404).end()
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

// Старт сервера: убедимся, что файл существует
await (async () => {
  try {
    await ensureDir(DATA_FILE)
    const cur = await readJsonFile(DATA_FILE)
    await fs.writeFile(DATA_FILE, JSON.stringify(cur), 'utf8')
  } catch (_) {
    // если нельзя создать — сервер всё равно отдаст default
  }
})()

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`)
})


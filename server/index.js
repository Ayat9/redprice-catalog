import express from 'express'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import { eslExpressMiddleware } from '../lib/esl-handlers.js'
import { handleNewsRequest } from '../lib/news-api.js'
import { handleEslAdminRequest } from '../lib/esl-admin-handlers.js'
import { handleInvestorSupportRequest } from '../lib/investor-support-handler.js'
import { getDashboard, getProductsTable, randomizeRuntimeStatus } from '../lib/esl-admin-store.js'
import { getPublicPriceByMac } from '../lib/esl-catalog-store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_VALUE = { name: '', price: '' }
const DATA_FILE = path.join(PROJECT_ROOT, '.data', 'electronic_price.json')
const CONTACTS_FILE = path.join(PROJECT_ROOT, '.data', 'contacts.json')
const PARTNER_CONDITIONS_DIR = path.join(PROJECT_ROOT, 'public', 'mock', 'conditions')
const PARTNER_CONDITIONS = {
  early: {
    label: 'EARLY',
    filename: 'early.pdf',
  },
  strategic: {
    label: 'STRATEGIC PARTNER',
    filename: 'strategic.pdf',
  },
}
const DEFAULT_CONTACTS = {
  phone: '+7 777 123 45 67',
  whatsapp: 'https://wa.me/77771234567',
  email: 'info@redprice.kz',
  address: 'Алматы, Казахстан',
  workingHours: 'Пн-Вс 09:00-21:00',
  mapEmbed:
    '<iframe src="https://www.google.com/maps?q=Almaty%2C%20Kazakhstan&output=embed" width="100%" height="360" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
}
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

async function readContactsValue() {
  try {
    const raw = await fs.readFile(CONTACTS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_CONTACTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
  } catch (_) {
    return { ...DEFAULT_CONTACTS }
  }
}

async function writeContactsValue(payload) {
  const next = {
    phone: String(payload?.phone ?? '').trim(),
    whatsapp: String(payload?.whatsapp ?? '').trim(),
    email: String(payload?.email ?? '').trim(),
    address: String(payload?.address ?? '').trim(),
    workingHours: String(payload?.workingHours ?? '').trim(),
    mapEmbed: String(payload?.mapEmbed ?? '').trim(),
  }
  await ensureDir(CONTACTS_FILE)
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(next, null, 2), 'utf8')
  return next
}

async function getPartnerConditionsValue() {
  const entries = await Promise.all(
    Object.entries(PARTNER_CONDITIONS).map(async ([id, meta]) => {
      const filePath = path.join(PARTNER_CONDITIONS_DIR, meta.filename)
      try {
        const stat = await fs.stat(filePath)
        return {
          id,
          label: meta.label,
          url: `/mock/conditions/${meta.filename}`,
          filename: meta.filename,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
          exists: true,
        }
      } catch (_) {
        return {
          id,
          label: meta.label,
          url: `/mock/conditions/${meta.filename}`,
          filename: meta.filename,
          size: 0,
          updatedAt: null,
          exists: false,
        }
      }
    }),
  )
  return { items: entries }
}

async function writePartnerConditionFile(planId, payload) {
  const meta = PARTNER_CONDITIONS[planId]
  if (!meta) throw new Error('Неизвестный тип условий')

  const rawData = String(payload?.dataUrl || payload?.base64 || '')
  const base64 = rawData.includes(',') ? rawData.split(',').pop() : rawData
  if (!base64) throw new Error('Файл не передан')

  const buffer = Buffer.from(base64, 'base64')
  if (!buffer.length) throw new Error('Файл пустой')
  if (buffer.length > 15 * 1024 * 1024) throw new Error('PDF не должен быть больше 15 МБ')
  if (!buffer.subarray(0, 5).toString('utf8').startsWith('%PDF-')) {
    throw new Error('Загрузите файл в формате PDF')
  }

  await fs.mkdir(PARTNER_CONDITIONS_DIR, { recursive: true })
  const filePath = path.join(PARTNER_CONDITIONS_DIR, meta.filename)
  await fs.writeFile(filePath, buffer)
  const stat = await fs.stat(filePath)
  return {
    id: planId,
    label: meta.label,
    url: `/mock/conditions/${meta.filename}`,
    filename: meta.filename,
    originalName: String(payload?.filename || '').trim(),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    exists: true,
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
// CMS: загрузка видео в /api/news/media как base64 (до ~100 МБ файла)
app.use(express.json({ type: ['application/json', '*/json'], limit: '120mb' }))
app.use(eslExpressMiddleware)

app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'public', 'uploads')))
app.use('/mock', express.static(path.join(PROJECT_ROOT, 'public', 'mock')))

app.use(async (req, res, next) => {
  let pathname = (req.path || req.url || '').split('?')[0]
  if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')
  if (!pathname.startsWith('/api/news')) return next()
  const search = req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''
  let bodyText = ''
  if (req.method === 'POST' || req.method === 'PUT') {
    bodyText = typeof req.body === 'object' && req.body !== null ? JSON.stringify(req.body) : String(req.body || '')
  }
  const out = await handleNewsRequest(req.method || 'GET', pathname, search, bodyText, req.headers)
  if (!out) return next()
  res.status(out.status || 200)
  for (const [k, v] of Object.entries(out.headers || {})) {
    res.setHeader(k, v)
  }
  res.send(out.body)
})

app.use(async (req, res, next) => {
  let pathname = (req.path || req.url || '').split('?')[0]
  if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')
  if (!pathname.startsWith('/api/v1/esl/admin')) return next()
  const search = req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''
  const bodyText =
    req.method === 'POST' || req.method === 'PUT'
      ? typeof req.body === 'object' && req.body !== null
        ? JSON.stringify(req.body)
        : String(req.body || '')
      : ''
  const out = await handleEslAdminRequest(pathname, req.method || 'GET', bodyText, search)
  if (!out?.handled) return next()
  res.status(out.status || 200)
  for (const [k, v] of Object.entries(out.headers || {})) {
    res.setHeader(k, v)
  }
  res.send(out.body)
})

// 1) Строго JSON
app.get(['/api/price', '/api/price/'], async (req, res) => {
  const mac = String(req.query?.mac || '').trim()
  if (mac) {
    const out = await getPublicPriceByMac(mac)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(out.status || 200).send(JSON.stringify(out.ok ? out.data : { error: out.error || 'Not found' }))
    return
  }
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
app.post(['/api/investor-support', '/api/investor-support/'], async (req, res) => {
  try {
    const out = await handleInvestorSupportRequest(req.body || {})
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(out.status || 200).send(out.body)
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).send(JSON.stringify({ ok: false, error: err?.message || 'Server error' }))
  }
})

app.get(['/api/contacts', '/api/contacts/'], async (_req, res) => {
  const data = await readContactsValue()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

app.put(['/api/contacts', '/api/contacts/'], async (req, res) => {
  try {
    const updated = await writeContactsValue(req.body || {})
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(JSON.stringify(updated))
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).send(JSON.stringify({ ok: false, error: err?.message || 'Server error' }))
  }
})

app.get(['/api/partner-conditions', '/api/partner-conditions/'], async (_req, res) => {
  const data = await getPartnerConditionsValue()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

app.post(['/api/partner-conditions/:plan', '/api/partner-conditions/:plan/'], async (req, res) => {
  try {
    const updated = await writePartnerConditionFile(String(req.params.plan || ''), req.body || {})
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(JSON.stringify(updated))
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(400).send(JSON.stringify({ ok: false, error: err?.message || 'Ошибка загрузки PDF' }))
  }
})

app.post(['/api/partner-conditions', '/api/partner-conditions/'], async (req, res) => {
  try {
    const plan = String(req.body?.plan || '').trim()
    if (!plan) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(400).send(JSON.stringify({ ok: false, error: 'Не указан тип условий' }))
    }
    const updated = await writePartnerConditionFile(plan, req.body || {})
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).send(JSON.stringify(updated))
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(400).send(JSON.stringify({ ok: false, error: err?.message || 'Ошибка загрузки PDF' }))
  }
})

app.get(['/api/partner-conditions/file/:plan', '/api/partner-conditions/file/:plan/'], async (req, res) => {
  const plan = String(req.params.plan || '').trim()
  const meta = PARTNER_CONDITIONS[plan]
  if (!meta) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(404).send(JSON.stringify({ ok: false, error: 'Неизвестный тип условий' }))
  }
  const filePath = path.join(PARTNER_CONDITIONS_DIR, meta.filename)
  try {
    const buffer = await fs.readFile(filePath)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${meta.filename}"`)
    return res.status(200).send(buffer)
  } catch {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(404).send(JSON.stringify({ ok: false, error: 'Файл не найден' }))
  }
})

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

const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  socket.on('esl:subscribe', ({ storeId } = {}) => {
    socket.join(`store:${storeId || 'rp-1'}`)
  })
})

setInterval(async () => {
  try {
    const storeId = 'rp-1'
    await randomizeRuntimeStatus(storeId)
    const dashboard = await getDashboard(storeId)
    const rows = await getProductsTable({ storeId, discrepancyOnly: false, search: '' })
    io.to(`store:${storeId}`).emit('esl:status', {
      storeId,
      dashboard,
      changedAt: new Date().toISOString(),
      rows: rows.map((x) => ({
        mac: x.mac,
        online: x.online,
        needsUpdate: x.needsUpdate,
        priceEsl: x.priceEsl,
        price1c: x.price1c,
      })),
    })
  } catch (_) {
    // ignore realtime tick errors
  }
}, 8000)

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`)
})


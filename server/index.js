import express from 'express'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_VALUE = { name: '', price: '' }
const DATA_FILE = path.join(PROJECT_ROOT, '.data', 'electronic_price.json')

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

const app = express()
app.use(express.json({ type: ['application/json', '*/json'] }))

// 1) Строго JSON
app.get(['/api/price', '/api/price/'], async (req, res) => {
  const data = await readJsonFile(DATA_FILE)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

app.get(['/api/price.json', '/api/price.json/', '/price.json', '/price.json/'], async (req, res) => {
  const data = await readJsonFile(DATA_FILE)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

// Новый основной эндпоинт под ESP32: /api/data.json
app.get(['/api/data.json', '/api/data.json/', '/data.json', '/data.json/'], async (req, res) => {
  const data = await readJsonFile(DATA_FILE)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(JSON.stringify(data))
})

// 2) Обновление
app.post(['/api/update-price', '/api/update-price/'], async (req, res) => {
  try {
    const updated = await writeMirroredFiles(req.body)
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
      const updated = await writeMirroredFiles(req.body)
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


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'electronic_price.json')

const DEFAULT_VALUE = { name: '', price: '' }

async function readStoredPrice() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
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

async function writeStoredPrice(payload) {
  const next = {
    name: String(payload?.name ?? '').trim(),
    price: String(payload?.price ?? '').trim(),
  }

  if (!next.name) throw new Error('Введите название товара')
  if (!next.price) throw new Error('Введите цену')

  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(next), 'utf8')
  return next
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['antd'],
  },
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      try {
        let pathname = (req.url || '').split('?')[0]
        // ESP32 иногда вызывает endpoint с завершающим слэшем: /api/price/
        // Нормализуем, чтобы отдать JSON и не попасть в SPA fallback (index.html).
        if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')

        if (pathname === '/api/price' && req.method === 'GET') {
          const data = await readStoredPrice()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (pathname === '/api/update-price' && req.method === 'POST') {
          const body = await new Promise((resolve, reject) => {
            let text = ''
            req.on('data', (chunk) => { text += chunk })
            req.on('end', () => resolve(text))
            req.on('error', reject)
          })

          const parsed = (() => {
            try {
              return JSON.parse(body || '{}')
            } catch (_) {
              return null
            }
          })()

          if (!parsed) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: 'Некорректный JSON' }))
            return
          }

          const updated = await writeStoredPrice(parsed)

          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = 200
          res.end(JSON.stringify(updated))
          return
        }
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ success: false, message: err?.message || 'Server error' }))
        return
      }

      next()
    })
  },
  configurePreview(server) {
    server.middlewares.use(async (req, res, next) => {
      try {
        let pathname = (req.url || '').split('?')[0]
        if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')

        if (pathname === '/api/price' && req.method === 'GET') {
          const data = await readStoredPrice()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (pathname === '/api/update-price' && req.method === 'POST') {
          const body = await new Promise((resolve, reject) => {
            let text = ''
            req.on('data', (chunk) => { text += chunk })
            req.on('end', () => resolve(text))
            req.on('error', reject)
          })

          const parsed = (() => {
            try {
              return JSON.parse(body || '{}')
            } catch (_) {
              return null
            }
          })()

          if (!parsed) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: 'Некорректный JSON' }))
            return
          }

          const updated = await writeStoredPrice(parsed)

          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = 200
          res.end(JSON.stringify(updated))
          return
        }
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ success: false, message: err?.message || 'Server error' }))
        return
      }

      next()
    })
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

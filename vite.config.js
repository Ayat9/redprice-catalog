import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleEslRequest, readBody } from './lib/esl-handlers.js'
import { handleNewsRequest } from './lib/news-api.js'
import { handleEslAdminRequest } from './lib/esl-admin-handlers.js'
import { handleInvestorSupportRequest } from './lib/investor-support-handler.js'
import { getPublicPriceByMac } from './lib/esl-catalog-store.js'
import { handleSupplierRequest } from './lib/supplier-api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATA_DIR = path.resolve(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'electronic_price.json')
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads')

const DEFAULT_VALUE = { name: '', price: '' }

function getMimeByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.ogg') return 'video/ogg'
  if (ext === '.mov') return 'video/quicktime'
  return 'application/octet-stream'
}

function createDevApiPlugin() {
  async function middleware(req, res, next) {
    try {
      let pathname = (req.url || '').split('?')[0]
      if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')

      if (pathname.startsWith('/uploads/')) {
        const abs = path.resolve(process.cwd(), 'public', pathname.slice(1))
        if (!abs.startsWith(UPLOADS_DIR)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        try {
          const file = await readFile(abs)
          res.statusCode = 200
          res.setHeader('Content-Type', getMimeByExt(abs))
          res.end(file)
          return
        } catch (_) {
          res.statusCode = 404
          res.end('Not Found')
          return
        }
      }

      if (pathname === '/api/investor-support' && req.method === 'POST') {
        const bodyText = await readBody(req)
        let parsed = {}
        try {
          parsed = JSON.parse(bodyText || '{}')
        } catch (_) {
          parsed = {}
        }
        const out = await handleInvestorSupportRequest(parsed)
        res.statusCode = out.status || 200
        for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
        res.end(out.body)
        return
      }

      if (pathname.startsWith('/api/news')) {
        let bodyText = ''
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
          bodyText = await readBody(req)
        }
        const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
        const out = await handleNewsRequest(req.method || 'GET', pathname, q, bodyText, req.headers)
        if (out) {
          res.statusCode = out.status || 200
          for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
          res.end(out.body)
          return
        }
      }

      if (pathname === '/api/price' && req.method === 'GET') {
        const u = new URL(req.url || '/api/price', 'http://localhost')
        const mac = String(u.searchParams.get('mac') || '').trim()
        if (mac) {
          const out = await getPublicPriceByMac(mac)
          res.statusCode = out.status || 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(out.ok ? out.data : { error: out.error || 'Not found' }))
          return
        }
        const data = await readStoredPrice()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(data))
        return
      }
    } catch (err) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ success: false, message: err?.message || 'Server error' }))
      return
    }

    next()
  }

  return {
    name: 'redprice-dev-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreview(server) {
      server.middlewares.use(middleware)
    },
  }
}

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY
  if (env.OPENAI_MODEL) process.env.OPENAI_MODEL = env.OPENAI_MODEL

  const devApiPlugin = createDevApiPlugin()

  return {
  plugins: [react(), tailwindcss(), devApiPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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

        if (pathname.startsWith('/uploads/')) {
          const abs = path.resolve(process.cwd(), 'public', pathname.slice(1))
          if (!abs.startsWith(UPLOADS_DIR)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          try {
            const file = await readFile(abs)
            res.statusCode = 200
            res.setHeader('Content-Type', getMimeByExt(abs))
            res.end(file)
            return
          } catch (_) {
            res.statusCode = 404
            res.end('Not Found')
            return
          }
        }

        if (pathname === '/api/investor-support' && req.method === 'POST') {
          const bodyText = await readBody(req)
          let parsed = {}
          try {
            parsed = JSON.parse(bodyText || '{}')
          } catch (_) {
            parsed = {}
          }
          const out = await handleInvestorSupportRequest(parsed)
          res.statusCode = out.status || 200
          for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
          res.end(out.body)
          return
        }

        if (pathname.startsWith('/api/news')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleNewsRequest(req.method || 'GET', pathname, q, bodyText, req.headers)
          if (out) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) {
              res.setHeader(k, v)
            }
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/supplier')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleSupplierRequest(req.method || 'GET', pathname, bodyText, q, req.headers)
          if (out) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/v1/esl/admin')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleEslAdminRequest(pathname, req.method || 'GET', bodyText, q)
          if (out?.handled) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/v1/esl') || pathname.startsWith('/api/v1/tag/')) {
          let bodyText = ''
          if (req.method === 'POST') {
            bodyText = await readBody(req)
          }
          const out = await handleEslRequest(pathname, req.method || 'GET', bodyText)
          if (out.handled) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) {
              res.setHeader(k, v)
            }
            res.end(out.body)
            return
          }
        }

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

        if (pathname.startsWith('/uploads/')) {
          const abs = path.resolve(process.cwd(), 'public', pathname.slice(1))
          if (!abs.startsWith(UPLOADS_DIR)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          try {
            const file = await readFile(abs)
            res.statusCode = 200
            res.setHeader('Content-Type', getMimeByExt(abs))
            res.end(file)
            return
          } catch (_) {
            res.statusCode = 404
            res.end('Not Found')
            return
          }
        }

        if (pathname === '/api/investor-support' && req.method === 'POST') {
          const bodyText = await readBody(req)
          let parsed = {}
          try {
            parsed = JSON.parse(bodyText || '{}')
          } catch (_) {
            parsed = {}
          }
          const out = await handleInvestorSupportRequest(parsed)
          res.statusCode = out.status || 200
          for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
          res.end(out.body)
          return
        }

        if (pathname.startsWith('/api/news')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleNewsRequest(req.method || 'GET', pathname, q, bodyText, req.headers)
          if (out) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) {
              res.setHeader(k, v)
            }
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/supplier')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleSupplierRequest(req.method || 'GET', pathname, bodyText, q, req.headers)
          if (out) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/v1/esl/admin')) {
          let bodyText = ''
          if (req.method === 'POST' || req.method === 'PUT') {
            bodyText = await readBody(req)
          }
          const q = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : ''
          const out = await handleEslAdminRequest(pathname, req.method || 'GET', bodyText, q)
          if (out?.handled) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v)
            res.end(out.body)
            return
          }
        }

        if (pathname.startsWith('/api/v1/esl') || pathname.startsWith('/api/v1/tag/')) {
          let bodyText = ''
          if (req.method === 'POST') {
            bodyText = await readBody(req)
          }
          const out = await handleEslRequest(pathname, req.method || 'GET', bodyText)
          if (out.handled) {
            res.statusCode = out.status || 200
            for (const [k, v] of Object.entries(out.headers || {})) {
              res.setHeader(k, v)
            }
            res.end(out.body)
            return
          }
        }

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
  }
})

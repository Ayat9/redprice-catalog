/**
 * API новостей (CMS) — Prisma BlogPost + загрузка медиа в public/uploads/news
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'news')

let prismaSingleton = null

async function getPrisma() {
  if (prismaSingleton) return prismaSingleton
  const { PrismaClient } = await import('@prisma/client')
  prismaSingleton = new PrismaClient()
  return prismaSingleton
}

function jsonBody(data, status = 200) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data),
  }
}

function writeKeyOk(headers) {
  const key = process.env.NEWS_WRITE_KEY || process.env.VITE_NEWS_WRITE_KEY || ''
  if (!key) {
    // В dev без ключа разрешаем запись (локальная разработка). В production ключ обязателен.
    return process.env.NODE_ENV !== 'production'
  }
  const sent = headers['x-news-write-key'] || headers['X-News-Write-Key'] || ''
  return sent === key
}

function hasDatabase() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

function slugifyTitle(title) {
  const t = String(title || 'post')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яёії_-]+/gi, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
  return t || `post-${Date.now()}`
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerptFromBody(html, max = 200) {
  const t = stripHtml(html)
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function mediaExtFromTypeOrName(mime, filename) {
  const mt = String(mime || '').toLowerCase()
  const base = String(filename || 'file').replace(/[^a-z0-9._-]/gi, '')
  const e = path.extname(base).toLowerCase()
  const allowed = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.avif', '.heic', '.heif', '.tif', '.tiff',
    '.mp4', '.webm', '.ogg', '.mov',
  ]
  if (allowed.includes(e)) return e
  if (mt.includes('jpeg') || mt.includes('jpg')) return '.jpg'
  if (mt.includes('png')) return '.png'
  if (mt.includes('webp')) return '.webp'
  if (mt.includes('gif')) return '.gif'
  if (mt.includes('bmp')) return '.bmp'
  if (mt.includes('svg')) return '.svg'
  if (mt.includes('avif')) return '.avif'
  if (mt.includes('heic')) return '.heic'
  if (mt.includes('heif')) return '.heif'
  if (mt.includes('tiff') || mt.includes('tif')) return '.tiff'
  if (mt.includes('mp4')) return '.mp4'
  if (mt.includes('webm')) return '.webm'
  if (mt.includes('ogg')) return '.ogg'
  if (mt.includes('quicktime') || mt.includes('mov')) return '.mov'
  if (mt.startsWith('image/')) return '.img'
  return '.bin'
}

function mimeByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.bmp') return 'image/bmp'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.avif') return 'image/avif'
  if (ext === '.heic') return 'image/heic'
  if (ext === '.heif') return 'image/heif'
  if (ext === '.tif' || ext === '.tiff') return 'image/tiff'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.ogg') return 'video/ogg'
  if (ext === '.mov') return 'video/quicktime'
  return 'application/octet-stream'
}

export async function saveNewsMediaBase64({ dataUrl, filename }) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/s)
  if (!m) throw new Error('Ожидается data URL base64')
  const buf = Buffer.from(m[2], 'base64')
  const mt = (m[1] || '').toLowerCase()
  const ext = mediaExtFromTypeOrName(mt, filename)
  const isVideo =
    mt.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov'].includes(ext)
  const maxBytes = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024
  if (buf.length > maxBytes) {
    throw new Error(
      isVideo ? 'Видео слишком большое (макс. 100 МБ)' : 'Файл слишком большой (макс. 15 МБ)'
    )
  }
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  const full = path.join(UPLOAD_DIR, name)
  await fs.writeFile(full, buf)
  return `/api/news/media-file/${encodeURIComponent(name)}`
}

function serializePost(p) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    body: p.body,
    contentJson: p.contentJson,
    coverImageUrl: p.coverImageUrl,
    videoUrl: p.videoUrl,
    layoutType: p.layoutType,
    category: p.category,
    published: p.published,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

function serializeComment(c) {
  return {
    id: c.id,
    postId: c.postId,
    author: c.author,
    body: c.body,
    approved: c.approved,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

/**
 * @param {string} method
 * @param {string} pathname нормализованный путь без query
 * @param {string} search querystring с ?
 * @param {string} bodyText
 * @param {Record<string, string>} headers lowercased keys preferred
 */
export async function handleNewsRequest(method, pathname, search, bodyText, headers) {
  const lower = {}
  for (const [k, v] of Object.entries(headers || {})) {
    lower[k.toLowerCase()] = v
  }

  if (method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-News-Write-Key',
      },
      body: '',
    }
  }

  try {
  const dbReady = hasDatabase()

  // POST /api/news/media
  if (pathname === '/api/news/media' && method === 'POST') {
    if (!writeKeyOk(lower)) return jsonBody({ ok: false, error: 'Нужен ключ NEWS_WRITE_KEY (заголовок X-News-Write-Key)' }, 401)
    let payload
    try {
      payload = JSON.parse(bodyText || '{}')
    } catch {
      return jsonBody({ ok: false, error: 'Некорректный JSON' }, 400)
    }
    try {
      const url = await saveNewsMediaBase64({ dataUrl: payload.dataUrl, filename: payload.filename })
      return jsonBody({ ok: true, url })
    } catch (err) {
      return jsonBody({ ok: false, error: err?.message || 'Ошибка загрузки' }, 400)
    }
  }

  // GET /api/news/media-file/:name
  const mediaMatch = pathname.match(/^\/api\/news\/media-file\/([^/]+)$/)
  if (mediaMatch && method === 'GET') {
    const name = decodeURIComponent(mediaMatch[1] || '')
    if (!/^[a-z0-9._-]+$/i.test(name)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
        body: 'Bad file name',
      }
    }
    const full = path.join(UPLOAD_DIR, name)
    const rel = path.relative(UPLOAD_DIR, full)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
        body: 'Forbidden',
      }
    }
    try {
      const file = await fs.readFile(full)
      return {
        status: 200,
        headers: {
          'Content-Type': mimeByExt(full),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
        body: file,
      }
    } catch {
      return {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
        body: 'Not Found',
      }
    }
  }

  // GET /api/news — список, черновики (?all=1), одна запись (?slug=)
  if (pathname === '/api/news' && method === 'GET') {
    if (!dbReady) {
      const qs = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      const slugOne = qs.get('slug')
      if (slugOne) return jsonBody({ ok: false, error: 'Не найдено' }, 404)
      return jsonBody({ ok: true, posts: [] })
    }
    const prisma = await getPrisma()
    const qs = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    const slugOne = qs.get('slug')
    if (slugOne) {
      const post = await prisma.blogPost.findUnique({ where: { slug: slugOne } })
      if (!post) return jsonBody({ ok: false, error: 'Не найдено' }, 404)
      if (!post.published) {
        if (!writeKeyOk(lower)) return jsonBody({ ok: false, error: 'Не найдено' }, 404)
      }
      return jsonBody({ ok: true, post: serializePost(post) })
    }
    const all = qs.get('all') === '1'
    const category = qs.get('category') || undefined
    if (all) {
      if (!writeKeyOk(lower)) return jsonBody({ ok: false, error: 'Нужен ключ для списка черновиков' }, 401)
      const where = category ? { category } : {}
      const rows = await prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      })
      return jsonBody({ ok: true, posts: rows.map(serializePost) })
    }
    const where = {
      published: true,
      ...(category ? { category } : {}),
    }
    const rows = await prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return jsonBody({ ok: true, posts: rows.map(serializePost) })
  }

  // POST /api/news
  if (pathname === '/api/news' && method === 'POST') {
    if (!dbReady) return jsonBody({ ok: false, error: 'База данных не настроена (DATABASE_URL)' }, 503)
    const prisma = await getPrisma()
    if (!writeKeyOk(lower)) return jsonBody( { ok: false, error: 'Нужен ключ NEWS_WRITE_KEY' }, 401)
    let payload
    try {
      payload = JSON.parse(bodyText || '{}')
    } catch {
      return jsonBody({ ok: false, error: 'Некорректный JSON' }, 400)
    }
    const title = String(payload.title || '').trim()
    if (!title) return jsonBody( { ok: false, error: 'Укажите заголовок' }, 400)
    let slug = String(payload.slug || '').trim() || slugifyTitle(title)
    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`
    const bodyHtml = String(payload.body ?? '')
    const excerpt = String(payload.excerpt || '').trim() || excerptFromBody(bodyHtml)
    const published = Boolean(payload.published)
    let publishedAt = null
    if (payload.publishedAt) {
      const d = new Date(payload.publishedAt)
      if (!Number.isNaN(d.getTime())) publishedAt = d
    } else if (published) {
      publishedAt = new Date()
    }
    const row = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        body: bodyHtml,
        contentJson: payload.contentJson ?? undefined,
        coverImageUrl: payload.coverImageUrl || null,
        videoUrl: payload.videoUrl || null,
        layoutType: String(payload.layoutType || 'stack'),
        category: String(payload.category || 'customers'),
        published,
        publishedAt,
      },
    })
    return jsonBody( { ok: true, post: serializePost(row) }, 201)
  }

  // PUT /api/news/:id
  const putMatch = pathname.match(/^\/api\/news\/([^/]+)$/)
  if (putMatch && method === 'PUT') {
    if (!dbReady) return jsonBody({ ok: false, error: 'База данных не настроена (DATABASE_URL)' }, 503)
    const prisma = await getPrisma()
    if (!writeKeyOk(lower)) return jsonBody( { ok: false, error: 'Нужен ключ NEWS_WRITE_KEY' }, 401)
    const id = putMatch[1]
    let payload
    try {
      payload = JSON.parse(bodyText || '{}')
    } catch {
      return jsonBody({ ok: false, error: 'Некорректный JSON' }, 400)
    }
    const prev = await prisma.blogPost.findUnique({ where: { id } })
    if (!prev) return jsonBody( { ok: false, error: 'Запись не найдена' }, 404)
    const title = payload.title != null ? String(payload.title).trim() : prev.title
    let slug = payload.slug != null ? String(payload.slug).trim() : prev.slug
    if (slug !== prev.slug) {
      const clash = await prisma.blogPost.findUnique({ where: { slug } })
      if (clash && clash.id !== id) return jsonBody( { ok: false, error: 'Такой slug уже занят' }, 400)
    }
    const bodyHtml = payload.body != null ? String(payload.body) : prev.body
    const excerpt =
      payload.excerpt != null ? String(payload.excerpt).trim() : prev.excerpt || excerptFromBody(bodyHtml)
    const published = payload.published != null ? Boolean(payload.published) : prev.published
    let publishedAt = prev.publishedAt
    if (payload.publishedAt !== undefined) {
      if (payload.publishedAt === null) publishedAt = null
      else {
        const d = new Date(payload.publishedAt)
        if (!Number.isNaN(d.getTime())) publishedAt = d
      }
    } else if (published && !prev.publishedAt) {
      publishedAt = new Date()
    }
    const row = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        body: bodyHtml,
        contentJson: payload.contentJson !== undefined ? payload.contentJson : prev.contentJson,
        coverImageUrl: payload.coverImageUrl !== undefined ? payload.coverImageUrl || null : prev.coverImageUrl,
        videoUrl: payload.videoUrl !== undefined ? payload.videoUrl || null : prev.videoUrl,
        layoutType: payload.layoutType != null ? String(payload.layoutType) : prev.layoutType,
        category: payload.category != null ? String(payload.category) : prev.category,
        published,
        publishedAt,
      },
    })
    return jsonBody( { ok: true, post: serializePost(row) })
  }

  // DELETE /api/news/:id
  const deleteMatch = pathname.match(/^\/api\/news\/([^/]+)$/)
  if (deleteMatch && method === 'DELETE') {
    if (!dbReady) return jsonBody({ ok: false, error: 'База данных не настроена (DATABASE_URL)' }, 503)
    const prisma = await getPrisma()
    if (!writeKeyOk(lower)) return jsonBody({ ok: false, error: 'Нужен ключ NEWS_WRITE_KEY' }, 401)
    const id = deleteMatch[1]
    const prev = await prisma.blogPost.findUnique({ where: { id } })
    if (!prev) return jsonBody({ ok: false, error: 'Запись не найдена' }, 404)
    await prisma.blogPost.delete({ where: { id } })
    return jsonBody({ ok: true, deletedId: id })
  }

  // GET /api/news/:slug/comments
  const commentsGetMatch = pathname.match(/^\/api\/news\/([^/]+)\/comments$/)
  if (commentsGetMatch && method === 'GET') {
    if (!dbReady) return jsonBody({ ok: true, comments: [] })
    const prisma = await getPrisma()
    const slug = commentsGetMatch[1]
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, published: true },
    })
    if (!post) return jsonBody({ ok: false, error: 'Новость не найдена' }, 404)
    if (!post.published && !writeKeyOk(lower)) return jsonBody({ ok: false, error: 'Новость не найдена' }, 404)
    const rows = await prisma.blogComment.findMany({
      where: {
        postId: post.id,
        ...(writeKeyOk(lower) ? {} : { approved: true }),
      },
      orderBy: { createdAt: 'desc' },
    })
    return jsonBody({ ok: true, comments: rows.map(serializeComment) })
  }

  // POST /api/news/:slug/comments
  const commentsPostMatch = pathname.match(/^\/api\/news\/([^/]+)\/comments$/)
  if (commentsPostMatch && method === 'POST') {
    if (!dbReady) return jsonBody({ ok: false, error: 'Комментарии недоступны: не настроена БД' }, 503)
    const prisma = await getPrisma()
    const slug = commentsPostMatch[1]
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, published: true },
    })
    if (!post || !post.published) return jsonBody({ ok: false, error: 'Новость не найдена' }, 404)
    let payload
    try {
      payload = JSON.parse(bodyText || '{}')
    } catch {
      return jsonBody({ ok: false, error: 'Некорректный JSON' }, 400)
    }
    const author = String(payload.author || '').trim().slice(0, 80)
    const body = String(payload.body || '').trim().slice(0, 3000)
    if (!author) return jsonBody({ ok: false, error: 'Укажите имя' }, 400)
    if (!body) return jsonBody({ ok: false, error: 'Введите комментарий' }, 400)
    const row = await prisma.blogComment.create({
      data: {
        postId: post.id,
        author,
        body,
      },
    })
    return jsonBody({ ok: true, comment: serializeComment(row) }, 201)
  }

  if (pathname.startsWith('/api/news')) {
    return jsonBody({ ok: false, error: 'Метод или путь не поддерживаются' }, 404)
  }
  return null
  } catch (e) {
    console.error('[news-api]', e)
    return jsonBody({ ok: false, error: e?.message || 'Ошибка БД или Prisma' }, 500)
  }
}

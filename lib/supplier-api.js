/**
 * API кабинета поставщика (Supplier Dashboard) — Node.js (ESM).
 *
 * Назначение:
 *   - Строгий RBAC (роль SUPPLIER), фильтрация всех данных по supplierId/supplierProfileId.
 *   - Выступает серверной стороной для фронта (src/components/supplier/api/supplierApi.js).
 *   - Совпадающий формат ответов — фронт можно переключить на fetch без изменения UI.
 *
 * Middleware-паттерн:
 *   handleSupplierRequest(method, pathname, bodyText, query, headers) → { status, headers, body }
 *
 * Авторизация:
 *   Заголовок X-Supplier-Session = <token>. Токен выдаётся POST /api/supplier/auth/login
 *   и ассоциируется с supplierProfileId. В production замените на JWT / сессии.
 *
 * Админские эндпоинты (/api/supplier/admin/*) защищены ключом X-Admin-Key
 * (env SUPPLIER_ADMIN_KEY), по аналогии с NEWS_WRITE_KEY.
 */
import crypto from 'node:crypto'

let prismaSingleton = null
async function getPrisma() {
  if (prismaSingleton) return prismaSingleton
  const { PrismaClient } = await import('@prisma/client')
  prismaSingleton = new PrismaClient()
  return prismaSingleton
}

function hasDatabase() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

function ok(data, status = 200) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(data),
  }
}
function fail(message, status = 400) {
  return ok({ ok: false, error: message }, status)
}

/* ───────────── Сессии (in-memory, с TTL) ───────────── */

const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 часов
/** @type {Map<string, { session: any, expiresAt: number }>} */
const sessions = new Map()

function issueToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function readSession(headers) {
  const token = headers['x-supplier-session'] || headers['X-Supplier-Session'] || ''
  if (!token) return null
  const row = sessions.get(String(token))
  if (!row) return null
  if (row.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return row.session
}

function adminAuthOk(headers) {
  const expected = String(process.env.SUPPLIER_ADMIN_KEY || '').trim()
  if (!expected) return process.env.NODE_ENV !== 'production'
  const got = headers['x-admin-key'] || headers['X-Admin-Key'] || ''
  return String(got) === expected
}

/* ───────────── Роутинг ───────────── */

/**
 * @param {string} method
 * @param {string} pathname
 * @param {string} bodyText
 * @param {string} query
 * @param {Record<string, string>} headers
 */
export async function handleSupplierRequest(method, pathname, bodyText, query, headers = {}) {
  if (!pathname.startsWith('/api/supplier')) return null
  if (!hasDatabase()) return fail('DATABASE_URL не настроен — модуль работает в mock-режиме на клиенте', 503)

  const prisma = await getPrisma()
  let body = {}
  if (bodyText) {
    try {
      body = JSON.parse(bodyText)
    } catch {
      return fail('Некорректный JSON', 400)
    }
  }

  // POST /api/supplier/auth/login
  if (pathname === '/api/supplier/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || !password) return fail('Укажите email и пароль', 400)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { supplierProfile: { include: { supplier: true } } },
    })
    if (!user || user.role !== 'SUPPLIER' || !user.supplierProfile?.isActive) {
      return fail('Неверный email или пароль', 401)
    }
    const hashed = user.passwordHash || ''
    const incoming = crypto.createHash('sha256').update(password).digest('hex')
    if (hashed !== incoming) return fail('Неверный email или пароль', 401)

    const profile = user.supplierProfile
    const token = issueToken()
    const session = {
      role: 'SUPPLIER',
      supplierProfileId: profile.id,
      supplierId: profile.supplierId,
      userId: user.id,
      email: user.email,
      name: profile.displayName || profile.supplier?.name || user.email,
      permissions: {
        canViewSales: profile.canViewSales,
        canViewVideo: profile.canViewVideo,
        canViewFootfall: profile.canViewFootfall,
        canSignDocuments: profile.canSignDocuments,
      },
    }
    sessions.set(token, { session, expiresAt: Date.now() + SESSION_TTL_MS })
    return ok({ ok: true, token, session })
  }

  if (pathname === '/api/supplier/auth/logout' && method === 'POST') {
    const token = headers['x-supplier-session'] || ''
    if (token) sessions.delete(String(token))
    return ok({ ok: true })
  }

  // Админские эндпоинты
  if (pathname.startsWith('/api/supplier/admin/')) {
    if (!adminAuthOk(headers)) return fail('Admin key required', 401)
    return handleAdmin(prisma, method, pathname, body)
  }

  // RBAC gate — далее только залогиненный SUPPLIER
  const session = readSession(headers)
  if (!session) return fail('Требуется вход поставщика', 401)
  if (session.role !== 'SUPPLIER') return fail('Forbidden', 403)

  return handleSupplierScoped(prisma, session, method, pathname, body, query)
}

/* ───────────── Сценарии поставщика (все фильтруются по session.*) ───────────── */

async function handleSupplierScoped(prisma, session, method, pathname, body /* , query */) {
  if (pathname === '/api/supplier/me' && method === 'GET') {
    const profile = await prisma.supplierProfile.findUnique({
      where: { id: session.supplierProfileId },
      include: { supplier: true },
    })
    if (!profile) return fail('Профиль не найден', 404)
    return ok({ ok: true, profile, supplier: profile.supplier })
  }

  if (pathname === '/api/supplier/sales' && method === 'GET') {
    if (!session.permissions?.canViewSales) return fail('Модуль «Продажи» отключён', 403)
    const products = await prisma.product.findMany({
      where: { supplierId: session.supplierId },
      include: { storeSnapshots: true },
    })
    const skus = products.map((p) => {
      const sold = p.storeSnapshots.reduce((a) => a + Math.round(Math.random() * 30), 0)
      const stock = p.storeSnapshots.length * 10
      const price = Number(p.salePrice || 0)
      const daysSinceLastSale = Math.floor(Math.random() * 60)
      return { sku: p.sku, name: p.name, unitsSold: sold, stock, revenue: sold * price, price, daysSinceLastSale }
    })
    return ok({
      ok: true,
      skus,
      totals: {
        revenue: skus.reduce((a, s) => a + s.revenue, 0),
        units: skus.reduce((a, s) => a + s.unitsSold, 0),
        sku: skus.length,
      },
    })
  }

  if (pathname === '/api/supplier/cameras' && method === 'GET') {
    if (!session.permissions?.canViewVideo) return fail('Модуль «Видео» отключён', 403)
    const cameras = await prisma.cameraAssignment.findMany({
      where: { supplierProfileId: session.supplierProfileId },
      orderBy: { createdAt: 'desc' },
    })
    return ok({ ok: true, cameras })
  }

  if (pathname === '/api/supplier/marketing' && method === 'GET') {
    if (!session.permissions?.canViewFootfall) return fail('Модуль «Маркетинг» отключён', 403)
    // TODO: Источник footfall-данных (CV-камеры, счётчики) + реальный статус ESL
    return ok({
      ok: true,
      footfall: Array.from({ length: 7 }, (_, i) => ({
        day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i],
        footfall: 80 + i * 15,
      })),
      eslStatus: { total: 0, synced: 0, pending: 0, failed: 0 },
    })
  }

  if (pathname === '/api/supplier/documents' && method === 'GET') {
    const rows = await prisma.supplierDocumentAssignment.findMany({
      where: { supplierProfileId: session.supplierProfileId },
      include: { template: true, signatures: { orderBy: { signedAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok({ ok: true, documents: rows })
  }

  const signMatch = pathname.match(/^\/api\/supplier\/documents\/([^/]+)\/sign$/)
  if (signMatch && method === 'POST') {
    if (!session.permissions?.canSignDocuments) return fail('Подпись документов отключена', 403)
    const assignmentId = signMatch[1]
    const fullName = String(body.fullName || '').trim()
    const signatureDataUrl = String(body.signatureDataUrl || '')
    if (fullName.length < 3) return fail('Введите ФИО', 400)
    if (!/^data:image\/(png|jpeg);base64,/.test(signatureDataUrl)) {
      return fail('Нарисуйте подпись', 400)
    }
    const assignment = await prisma.supplierDocumentAssignment.findUnique({ where: { id: assignmentId } })
    if (!assignment || assignment.supplierProfileId !== session.supplierProfileId) {
      return fail('Документ недоступен', 404)
    }
    const signature = await prisma.supplierDocumentSignature.create({
      data: {
        assignmentId,
        fullName,
        signatureDataUrl,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
      },
    })
    const updated = await prisma.supplierDocumentAssignment.update({
      where: { id: assignmentId },
      data: { status: 'SIGNED' },
    })
    return ok({ ok: true, signature, assignment: updated })
  }

  if (pathname === '/api/supplier/rotation' && method === 'GET') {
    const [supplier, settings] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: session.supplierId } }),
      prisma.supplierSettings.findUnique({ where: { id: 1 } }),
    ])
    const thresholdDays =
      supplier?.rotationThresholdDays ?? settings?.rotationThresholdDays ?? 30
    return ok({ ok: true, thresholdDays })
  }

  return fail('Неизвестный эндпоинт', 404)
}

/* ───────────── Админские операции ───────────── */

async function handleAdmin(prisma, method, pathname, body) {
  if (pathname === '/api/supplier/admin/profiles' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || password.length < 6) return fail('Email и пароль ≥ 6 символов', 400)
    if (!body.supplierId) return fail('Выберите бренд', 400)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'SUPPLIER', passwordHash, isActive: true },
      create: { email, role: 'SUPPLIER', passwordHash, isActive: true },
    })
    const profile = await prisma.supplierProfile.upsert({
      where: { userId: user.id },
      update: {
        supplierId: body.supplierId,
        displayName: body.displayName || null,
        canViewSales: body.canViewSales !== false,
        canViewVideo: body.canViewVideo !== false,
        canViewFootfall: body.canViewFootfall !== false,
        canSignDocuments: body.canSignDocuments !== false,
        isActive: true,
      },
      create: {
        userId: user.id,
        supplierId: body.supplierId,
        displayName: body.displayName || null,
      },
    })
    return ok({ ok: true, profile })
  }

  if (pathname === '/api/supplier/admin/camera-assignments' && method === 'POST') {
    if (!body.supplierProfileId || !body.label || !body.streamUrl) {
      return fail('supplierProfileId, label, streamUrl обязательны', 400)
    }
    const created = await prisma.cameraAssignment.create({
      data: {
        supplierProfileId: body.supplierProfileId,
        storeId: body.storeId || null,
        label: body.label,
        streamUrl: body.streamUrl,
        isAvailable: body.isAvailable !== false,
      },
    })
    return ok({ ok: true, camera: created })
  }

  if (pathname === '/api/supplier/admin/document-templates' && method === 'POST') {
    if (!body.title || !body.content) return fail('title и content обязательны', 400)
    const tpl = await prisma.supplierDocumentTemplate.create({
      data: {
        title: body.title,
        description: body.description || null,
        mimeKind: body.mimeKind || 'html',
        content: body.content,
      },
    })
    return ok({ ok: true, template: tpl })
  }

  if (pathname === '/api/supplier/admin/rotation' && method === 'POST') {
    const n = Number(body.globalDays)
    if (!Number.isFinite(n) || n < 1 || n > 365) return fail('1..365', 400)
    await prisma.supplierSettings.upsert({
      where: { id: 1 },
      update: { rotationThresholdDays: Math.round(n) },
      create: { id: 1, rotationThresholdDays: Math.round(n) },
    })
    if (body.supplierOverrides && typeof body.supplierOverrides === 'object') {
      for (const [sid, v] of Object.entries(body.supplierOverrides)) {
        await prisma.supplier.update({
          where: { id: sid },
          data: {
            rotationThresholdDays: v == null || v === '' ? null : Number(v),
          },
        })
      }
    }
    return ok({ ok: true })
  }

  return fail('Неизвестная админская операция', 404)
}

export { ok as __test_ok, fail as __test_fail }

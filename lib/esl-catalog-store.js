import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const CATALOG_UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'catalog')

let prismaSingleton = null

async function getPrisma() {
  if (prismaSingleton) return prismaSingleton
  const { PrismaClient } = await import('@prisma/client')
  prismaSingleton = new PrismaClient()
  return prismaSingleton
}

function dbEnabled() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

function normalizeMac12(mac) {
  const hex = String(mac || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase()
  return hex.length === 12 ? hex : null
}

function formatPrice(value) {
  if (value == null) return ''
  return String(value)
}

function serializeCatalogRow(r) {
  return {
    id: r.id,
    name: r.name,
    full_name: r.fullName || '',
    sku: r.sku,
    cost_price: formatPrice(r.costPrice),
    sale_price: formatPrice(r.salePrice),
    unit: r.unit || '',
    characteristics: r.characteristics ?? null,
    image_url: r.imageUrl || '',
    device_mac: r.deviceMac || '',
    supplier: r.supplier?.name || '—',
    is_active: r.isActive,
    updated_at: r.updatedAt.toISOString(),
  }
}

function parsePrice(raw, label) {
  const txt = String(raw ?? '').trim()
  if (!txt) return null
  const num = Number(txt)
  if (Number.isNaN(num)) throw new Error(`${label}: некорректное число`)
  return num
}

export async function getPublicPriceByMac(mac) {
  const normalized = normalizeMac12(mac)
  if (!normalized) return { ok: false, status: 400, error: 'Некорректный MAC' }
  if (!dbEnabled()) return { ok: false, status: 503, error: 'База данных не настроена (DATABASE_URL)' }

  const prisma = await getPrisma()
  const product = await prisma.product.findFirst({
    where: { deviceMac: normalized, isActive: true },
    select: { name: true, salePrice: true, imageUrl: true },
  })
  if (!product) return { ok: false, status: 404, error: 'Товар не найден для MAC' }

  return {
    ok: true,
    status: 200,
    data: {
      name: product.name || '',
      price: formatPrice(product.salePrice),
      image: product.imageUrl || '',
    },
  }
}

export async function getCatalogRows({ q = '' } = {}) {
  if (!dbEnabled()) return { ok: true, rows: [] }
  const prisma = await getPrisma()
  const query = String(q || '').trim()
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { deviceMac: { contains: query.toUpperCase(), mode: 'insensitive' } },
        ],
      }
    : {}

  const rows = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 2000,
    select: {
      id: true,
      name: true,
      fullName: true,
      sku: true,
      costPrice: true,
      salePrice: true,
      unit: true,
      characteristics: true,
      imageUrl: true,
      deviceMac: true,
      supplier: { select: { name: true } },
      isActive: true,
      updatedAt: true,
    },
  })
  return {
    ok: true,
    rows: rows.map(serializeCatalogRow),
  }
}

export async function updateCatalogBindingAndPrice({ id, salePrice, deviceMac }) {
  if (!dbEnabled()) throw new Error('База данных не настроена (DATABASE_URL)')
  const prisma = await getPrisma()
  const payload = {}
  if (salePrice !== undefined) {
    const raw = String(salePrice ?? '').trim()
    payload.salePrice = raw === '' ? null : Number(raw)
    if (raw !== '' && Number.isNaN(payload.salePrice)) throw new Error('Некорректная цена продажи')
  }
  if (deviceMac !== undefined) {
    const raw = String(deviceMac || '').trim()
    if (!raw) payload.deviceMac = null
    else {
      const normalized = normalizeMac12(raw)
      if (!normalized) throw new Error('MAC должен быть в формате AABBCCDDEEFF')
      payload.deviceMac = normalized
    }
  }
  if (!Object.keys(payload).length) throw new Error('Нет полей для обновления')

  const row = await prisma.product.update({
    where: { id: String(id) },
    data: payload,
    select: { id: true, salePrice: true, deviceMac: true },
  })
  return { ok: true, id: row.id, sale_price: formatPrice(row.salePrice), device_mac: row.deviceMac || '' }
}

export async function createCatalogProduct(payload) {
  if (!dbEnabled()) throw new Error('База данных не настроена (DATABASE_URL)')
  const prisma = await getPrisma()
  const sku = String(payload?.sku || '').trim()
  const name = String(payload?.name || '').trim()
  if (!sku) throw new Error('Укажите sku')
  if (!name) throw new Error('Укажите name')
  const macRaw = String(payload?.device_mac || '').trim()
  const deviceMac = macRaw ? normalizeMac12(macRaw) : null
  if (macRaw && !deviceMac) throw new Error('MAC должен быть в формате AABBCCDDEEFF')

  const row = await prisma.product.create({
    data: {
      sku,
      name: name.slice(0, 255),
      fullName: payload?.full_name ? String(payload.full_name) : null,
      costPrice: parsePrice(payload?.cost_price, 'cost_price'),
      salePrice: parsePrice(payload?.sale_price, 'sale_price'),
      unit: payload?.unit ? String(payload.unit).slice(0, 20) : null,
      characteristics: payload?.characteristics ?? null,
      imageUrl: payload?.image_url ? String(payload.image_url).slice(0, 500) : null,
      deviceMac,
      article: payload?.article ? String(payload.article) : null,
      barcode: payload?.barcode ? String(payload.barcode) : null,
      isActive: payload?.is_active === undefined ? true : Boolean(payload.is_active),
    },
    select: {
      id: true, name: true, fullName: true, sku: true, costPrice: true, salePrice: true, unit: true,
      characteristics: true, imageUrl: true, deviceMac: true, supplier: { select: { name: true } }, isActive: true, updatedAt: true,
    },
  })
  return { ok: true, row: serializeCatalogRow(row) }
}

export async function updateCatalogProduct(payload) {
  if (!dbEnabled()) throw new Error('База данных не настроена (DATABASE_URL)')
  const prisma = await getPrisma()
  const id = String(payload?.id || '')
  if (!id) throw new Error('Не указан id')
  const macRaw = payload?.device_mac !== undefined ? String(payload.device_mac || '').trim() : undefined
  const nextMac = macRaw === undefined ? undefined : (macRaw ? normalizeMac12(macRaw) : null)
  if (macRaw && !nextMac) throw new Error('MAC должен быть в формате AABBCCDDEEFF')
  const data = {
    ...(payload?.name !== undefined ? { name: String(payload.name || '').slice(0, 255) } : {}),
    ...(payload?.full_name !== undefined ? { fullName: payload.full_name ? String(payload.full_name) : null } : {}),
    ...(payload?.sku !== undefined ? { sku: String(payload.sku || '').trim() } : {}),
    ...(payload?.cost_price !== undefined ? { costPrice: parsePrice(payload.cost_price, 'cost_price') } : {}),
    ...(payload?.sale_price !== undefined ? { salePrice: parsePrice(payload.sale_price, 'sale_price') } : {}),
    ...(payload?.unit !== undefined ? { unit: payload.unit ? String(payload.unit).slice(0, 20) : null } : {}),
    ...(payload?.characteristics !== undefined ? { characteristics: payload.characteristics } : {}),
    ...(payload?.image_url !== undefined ? { imageUrl: payload.image_url ? String(payload.image_url).slice(0, 500) : null } : {}),
    ...(nextMac !== undefined ? { deviceMac: nextMac } : {}),
    ...(payload?.is_active !== undefined ? { isActive: Boolean(payload.is_active) } : {}),
  }
  const row = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true, name: true, fullName: true, sku: true, costPrice: true, salePrice: true, unit: true,
      characteristics: true, imageUrl: true, deviceMac: true, supplier: { select: { name: true } }, isActive: true, updatedAt: true,
    },
  })
  return { ok: true, row: serializeCatalogRow(row) }
}

export async function deleteCatalogProduct(id) {
  if (!dbEnabled()) throw new Error('База данных не настроена (DATABASE_URL)')
  const prisma = await getPrisma()
  await prisma.product.delete({ where: { id: String(id) } })
  return { ok: true, deletedId: String(id) }
}

export async function uploadCatalogImageBase64({ dataUrl, filename }) {
  await fs.mkdir(CATALOG_UPLOAD_DIR, { recursive: true })
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/s)
  if (!m) throw new Error('Ожидается data URL base64')
  const buf = Buffer.from(m[2], 'base64')
  if (!m[1].toLowerCase().startsWith('image/')) throw new Error('Разрешены только изображения')
  if (buf.length > 20 * 1024 * 1024) throw new Error('Файл слишком большой (макс. 20 МБ)')
  const ext = (() => {
    const e = path.extname(String(filename || '').toLowerCase())
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.avif', '.heic', '.heif', '.tif', '.tiff'].includes(e)) return e
    if (m[1].includes('png')) return '.png'
    if (m[1].includes('webp')) return '.webp'
    if (m[1].includes('gif')) return '.gif'
    if (m[1].includes('bmp')) return '.bmp'
    if (m[1].includes('svg')) return '.svg'
    if (m[1].includes('avif')) return '.avif'
    return '.jpg'
  })()
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  const full = path.join(CATALOG_UPLOAD_DIR, name)
  await fs.writeFile(full, buf)
  return { ok: true, url: `/uploads/catalog/${name}` }
}

export async function syncCatalogFrom1C(items) {
  if (!dbEnabled()) throw new Error('База данных не настроена (DATABASE_URL)')
  const prisma = await getPrisma()
  if (!Array.isArray(items)) throw new Error('Ожидается массив данных')

  let created = 0
  let updated = 0
  for (const item of items) {
    const sku = String(item?.sku || '').trim()
    if (!sku) continue
    const data = {
      name: String(item?.name || item?.full_name || sku).slice(0, 255),
      fullName: item?.full_name != null ? String(item.full_name) : null,
      costPrice: item?.cost_price != null && String(item.cost_price).trim() !== '' ? Number(item.cost_price) : null,
      salePrice: item?.sale_price != null && String(item.sale_price).trim() !== '' ? Number(item.sale_price) : null,
      unit: item?.unit != null ? String(item.unit).slice(0, 20) : null,
      characteristics: item?.characteristics ?? null,
      imageUrl: item?.image_url != null ? String(item.image_url).slice(0, 500) : null,
      article: item?.article != null ? String(item.article) : null,
      barcode: item?.barcode != null ? String(item.barcode) : null,
      isActive: item?.is_active === undefined ? true : Boolean(item.is_active),
    }
    const existed = await prisma.product.findUnique({ where: { sku }, select: { id: true } })
    if (existed) {
      await prisma.product.update({
        where: { sku },
        data,
      })
      updated += 1
    } else {
      await prisma.product.create({
        data: {
          sku,
          ...data,
        },
      })
      created += 1
    }
  }
  return { ok: true, created, updated, total: created + updated }
}

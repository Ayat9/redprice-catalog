/**
 * Клиент данных для кабинета поставщика.
 * Сейчас — localStorage (mock), на проде заменить каждый метод на fetch к
 * /api/supplier/*, серверные контракты совместимы (см. lib/supplier-api.js).
 *
 * RBAC: каждый метод принимает текущий supplierProfileId / роль, и ВСЕГДА
 * фильтрует данные по profileId — поставщик не может увидеть чужой товар.
 */
import { loadSupplierData, makeId, saveSupplierData } from './supplierAccessStorage'

const SESSION_KEY = 'redprice_supplier_session_v1'
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/* ────────────── Сессия ────────────── */

export function readSupplierSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeSupplierSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

export function clearSupplierSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Вход поставщика. Возвращает сессию с supplierProfileId/supplierId/role.
 */
export async function loginSupplier(email, password) {
  await delay(100)
  const data = loadSupplierData()
  const em = String(email || '').trim().toLowerCase()
  const pw = String(password || '')
  const profile = data.profiles.find(
    (p) => String(p.email || '').toLowerCase() === em && String(p.password || '') === pw
  )
  if (!profile) return { ok: false, error: 'Неверный email или пароль' }
  if (profile.isActive === false) return { ok: false, error: 'Учётная запись отключена' }
  const supplier = data.suppliers.find((s) => s.id === profile.supplierId) || null
  const session = {
    role: 'SUPPLIER',
    supplierProfileId: profile.id,
    supplierId: profile.supplierId,
    userId: profile.userId,
    email: profile.email,
    name: profile.displayName || supplier?.name || profile.email,
    permissions: {
      canViewSales: profile.canViewSales !== false,
      canViewVideo: profile.canViewVideo !== false,
      canViewFootfall: profile.canViewFootfall !== false,
      canSignDocuments: profile.canSignDocuments !== false,
    },
  }
  writeSupplierSession(session)
  return { ok: true, session }
}

/* ────────────── Профиль/контекст ────────────── */

export async function fetchSupplierContext(session) {
  await delay(60)
  if (!session?.supplierProfileId) return { ok: false, error: 'Нет активной сессии поставщика' }
  const data = loadSupplierData()
  const profile = data.profiles.find((p) => p.id === session.supplierProfileId)
  if (!profile) return { ok: false, error: 'Профиль поставщика не найден' }
  const supplier = data.suppliers.find((s) => s.id === profile.supplierId) || null
  return {
    ok: true,
    profile: { ...profile, password: undefined },
    supplier: supplier ? { ...supplier } : null,
  }
}

/* ────────────── Продажи (демо-данные по бренду) ────────────── */

/**
 * Sales-модуль. Возвращает агрегат по выручке/остаткам и список SKU,
 * строго по supplierId. В проде — join Product + StoreProductSnapshot с WHERE supplierId = :id.
 * @param {{ supplierId: string }} ctx
 */
export async function fetchSupplierSales(ctx) {
  await delay(100)
  if (!ctx?.supplierId) return { ok: false, error: 'Не передан supplierId' }
  // Демо-выборка: стабильная (по hash supplierId), чтобы таблица не прыгала.
  const seed = ctx.supplierId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (n) => Math.abs(Math.sin(seed + n) * 1000) % 1
  const skus = Array.from({ length: 6 }, (_, i) => {
    const unitsSold = Math.floor(20 + rand(i) * 180)
    const stock = Math.floor(rand(i + 100) * 400)
    const price = Math.round((500 + rand(i + 50) * 5000) / 10) * 10
    const daysSinceLastSale = Math.floor(rand(i + 200) * 60)
    return {
      sku: `${ctx.supplierId.toUpperCase().slice(-4)}-${String(i + 1).padStart(3, '0')}`,
      name: `Товар #${i + 1}`,
      unitsSold,
      stock,
      revenue: unitsSold * price,
      price,
      daysSinceLastSale,
    }
  })
  const revenue = skus.reduce((s, r) => s + r.revenue, 0)
  const units = skus.reduce((s, r) => s + r.unitsSold, 0)
  return { ok: true, skus, totals: { revenue, units, sku: skus.length } }
}

/* ────────────── Камеры ────────────── */

export async function fetchSupplierCameras(ctx) {
  await delay(60)
  if (!ctx?.supplierProfileId) return { ok: false, error: 'Нет supplierProfileId' }
  const data = loadSupplierData()
  const list = data.cameraAssignments.filter(
    (c) => c.supplierProfileId === ctx.supplierProfileId
  )
  return { ok: true, cameras: list.map((c) => ({ ...c })) }
}

/* ────────────── Маркетинг/ESL ────────────── */

export async function fetchSupplierMarketing(ctx) {
  await delay(80)
  if (!ctx?.supplierId) return { ok: false, error: 'Не передан supplierId' }
  const seed = ctx.supplierId.length
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i],
    footfall: 50 + ((seed * (i + 2)) % 150),
  }))
  return {
    ok: true,
    footfall: days,
    eslStatus: {
      total: 40 + (seed % 20),
      synced: 35 + (seed % 15),
      pending: 3,
      failed: 1,
    },
  }
}

/* ────────────── Документы и подписи ────────────── */

export async function fetchSupplierDocuments(ctx) {
  await delay(60)
  if (!ctx?.supplierProfileId) return { ok: false, error: 'Нет supplierProfileId' }
  const data = loadSupplierData()
  const assignments = data.documentAssignments.filter(
    (a) => a.supplierProfileId === ctx.supplierProfileId
  )
  const rows = assignments.map((a) => {
    const template = data.documentTemplates.find((t) => t.id === a.templateId)
    const history = data.documentSignatures
      .filter((s) => s.assignmentId === a.id)
      .sort((x, y) => (x.signedAt > y.signedAt ? -1 : 1))
    return {
      assignmentId: a.id,
      status: a.status,
      dueAt: a.dueAt || null,
      createdAt: a.createdAt,
      template: template
        ? {
            id: template.id,
            title: template.title,
            description: template.description || '',
            mimeKind: template.mimeKind || 'html',
            content: template.content || '',
          }
        : null,
      history,
      lastSignedAt: history[0]?.signedAt ?? null,
    }
  })
  return { ok: true, documents: rows }
}

/**
 * Подпись документа. На сервере ipAddress/userAgent выставит middleware.
 */
export async function signSupplierDocument({ session, assignmentId, fullName, signatureDataUrl }) {
  await delay(80)
  if (!session?.permissions?.canSignDocuments) {
    return { ok: false, error: 'Роль не разрешает подпись документов' }
  }
  const name = String(fullName || '').trim()
  if (name.length < 3) return { ok: false, error: 'Введите ФИО (минимум 3 символа)' }
  if (!/^data:image\/(png|jpeg);base64,/.test(String(signatureDataUrl || ''))) {
    return { ok: false, error: 'Нарисуйте подпись перед отправкой' }
  }
  const data = loadSupplierData()
  const assignment = data.documentAssignments.find(
    (a) => a.id === assignmentId && a.supplierProfileId === session.supplierProfileId
  )
  if (!assignment) return { ok: false, error: 'Документ не найден или недоступен' }
  const signature = {
    id: makeId('sig'),
    assignmentId,
    fullName: name,
    signatureDataUrl,
    ipAddress: null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
    signedAt: new Date().toISOString(),
  }
  data.documentSignatures.push(signature)
  assignment.status = 'SIGNED'
  assignment.updatedAt = new Date().toISOString()
  saveSupplierData(data)
  return { ok: true, signature, assignment: { ...assignment } }
}

/* ────────────── Ротация/неликвид ────────────── */

export async function fetchRotationReport(ctx) {
  await delay(80)
  if (!ctx?.supplierId) return { ok: false, error: 'Не передан supplierId' }
  const data = loadSupplierData()
  const supplier = data.suppliers.find((s) => s.id === ctx.supplierId)
  const threshold =
    supplier?.rotationThresholdDays ?? data.settings.rotationThresholdDays ?? 30
  const sales = await fetchSupplierSales(ctx)
  if (!sales.ok) return sales
  const stagnant = sales.skus
    .filter((s) => s.daysSinceLastSale >= threshold)
    .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
  return { ok: true, thresholdDays: threshold, stagnant }
}

/* ────────────── АДМИНКА модуля поставщиков ────────────── */

export async function fetchSupplierAdminBundle() {
  await delay(60)
  return { ok: true, ...loadSupplierData() }
}

export async function upsertSupplierBrand(patch) {
  await delay(80)
  const name = String(patch?.name || '').trim()
  if (!name) return { ok: false, error: 'Укажите название бренда' }
  const data = loadSupplierData()
  if (patch?.id) {
    const idx = data.suppliers.findIndex((s) => s.id === patch.id)
    if (idx < 0) return { ok: false, error: 'Бренд не найден' }
    data.suppliers[idx] = { ...data.suppliers[idx], ...patch, name }
  } else {
    data.suppliers.push({
      id: makeId('brand'),
      name,
      phone: String(patch?.phone || '').trim(),
      address: String(patch?.address || '').trim(),
      external1cId: patch?.external1cId || null,
      rotationThresholdDays:
        typeof patch?.rotationThresholdDays === 'number' ? patch.rotationThresholdDays : null,
    })
  }
  saveSupplierData(data)
  return { ok: true }
}

export async function deleteSupplierBrand(brandId) {
  await delay(60)
  const data = loadSupplierData()
  if (data.profiles.some((p) => p.supplierId === brandId)) {
    return { ok: false, error: 'Нельзя удалить бренд с активными кабинетами' }
  }
  data.suppliers = data.suppliers.filter((s) => s.id !== brandId)
  saveSupplierData(data)
  return { ok: true }
}

export async function createSupplierProfile(input) {
  await delay(100)
  const email = String(input?.email || '').trim().toLowerCase()
  const password = String(input?.password || '')
  const supplierId = String(input?.supplierId || '')
  if (!email.includes('@')) return { ok: false, error: 'Укажите корректный email' }
  if (password.length < 6) return { ok: false, error: 'Пароль ≥ 6 символов' }
  if (!supplierId) return { ok: false, error: 'Выберите бренд' }
  const data = loadSupplierData()
  if (data.profiles.some((p) => String(p.email).toLowerCase() === email)) {
    return { ok: false, error: 'Поставщик с таким email уже существует' }
  }
  data.profiles.push({
    id: makeId('sp'),
    userId: makeId('usr'),
    supplierId,
    email,
    password,
    displayName: String(input?.displayName || '').trim() || email,
    isActive: true,
    canViewSales: input?.canViewSales !== false,
    canViewVideo: input?.canViewVideo !== false,
    canViewFootfall: input?.canViewFootfall !== false,
    canSignDocuments: input?.canSignDocuments !== false,
  })
  saveSupplierData(data)
  return { ok: true }
}

export async function updateSupplierProfile(id, patch) {
  await delay(80)
  const data = loadSupplierData()
  const idx = data.profiles.findIndex((p) => p.id === id)
  if (idx < 0) return { ok: false, error: 'Кабинет не найден' }
  data.profiles[idx] = { ...data.profiles[idx], ...patch }
  saveSupplierData(data)
  return { ok: true }
}

export async function deleteSupplierProfile(id) {
  await delay(80)
  const data = loadSupplierData()
  data.profiles = data.profiles.filter((p) => p.id !== id)
  data.cameraAssignments = data.cameraAssignments.filter((c) => c.supplierProfileId !== id)
  data.documentAssignments = data.documentAssignments.filter((a) => a.supplierProfileId !== id)
  saveSupplierData(data)
  return { ok: true }
}

export async function upsertCameraAssignment(payload) {
  await delay(80)
  const data = loadSupplierData()
  const profile = data.profiles.find((p) => p.id === payload?.supplierProfileId)
  if (!profile) return { ok: false, error: 'Кабинет поставщика не найден' }
  if (!String(payload?.label || '').trim()) return { ok: false, error: 'Укажите метку камеры' }
  if (!String(payload?.streamUrl || '').trim()) return { ok: false, error: 'Укажите URL потока' }
  if (payload.id) {
    const idx = data.cameraAssignments.findIndex((c) => c.id === payload.id)
    if (idx < 0) return { ok: false, error: 'Привязка не найдена' }
    data.cameraAssignments[idx] = { ...data.cameraAssignments[idx], ...payload }
  } else {
    data.cameraAssignments.push({
      id: makeId('cam'),
      supplierProfileId: payload.supplierProfileId,
      storeId: payload.storeId || null,
      label: payload.label,
      streamUrl: payload.streamUrl,
      isAvailable: payload.isAvailable !== false,
      createdAt: new Date().toISOString(),
    })
  }
  saveSupplierData(data)
  return { ok: true }
}

export async function deleteCameraAssignment(id) {
  await delay(60)
  const data = loadSupplierData()
  data.cameraAssignments = data.cameraAssignments.filter((c) => c.id !== id)
  saveSupplierData(data)
  return { ok: true }
}

export async function saveDocumentTemplate(payload) {
  await delay(80)
  const title = String(payload?.title || '').trim()
  if (!title) return { ok: false, error: 'Введите название шаблона' }
  if (!String(payload?.content || '').trim()) return { ok: false, error: 'Добавьте содержимое (HTML/URL)' }
  const data = loadSupplierData()
  if (payload.id) {
    const idx = data.documentTemplates.findIndex((t) => t.id === payload.id)
    if (idx < 0) return { ok: false, error: 'Шаблон не найден' }
    data.documentTemplates[idx] = { ...data.documentTemplates[idx], ...payload, title }
  } else {
    data.documentTemplates.push({
      id: makeId('tpl'),
      title,
      description: String(payload?.description || '').trim(),
      mimeKind: payload?.mimeKind || 'html',
      content: payload.content,
      isArchived: false,
      createdAt: new Date().toISOString(),
    })
  }
  saveSupplierData(data)
  return { ok: true }
}

export async function assignDocumentToProfiles(templateId, profileIds) {
  await delay(80)
  const data = loadSupplierData()
  const template = data.documentTemplates.find((t) => t.id === templateId)
  if (!template) return { ok: false, error: 'Шаблон не найден' }
  const ids = Array.isArray(profileIds) ? profileIds : []
  for (const pid of ids) {
    const exists = data.documentAssignments.some(
      (a) => a.templateId === templateId && a.supplierProfileId === pid
    )
    if (!exists) {
      data.documentAssignments.push({
        id: makeId('doc'),
        templateId,
        supplierProfileId: pid,
        status: 'PENDING',
        dueAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }
  saveSupplierData(data)
  return { ok: true }
}

export async function saveRotationSettings({ globalDays, supplierOverrides }) {
  await delay(60)
  const data = loadSupplierData()
  const n = Number(globalDays)
  if (!Number.isFinite(n) || n < 1 || n > 365) {
    return { ok: false, error: 'Порог должен быть 1–365 дней' }
  }
  data.settings.rotationThresholdDays = Math.round(n)
  if (supplierOverrides && typeof supplierOverrides === 'object') {
    data.suppliers = data.suppliers.map((s) => {
      if (Object.prototype.hasOwnProperty.call(supplierOverrides, s.id)) {
        const v = supplierOverrides[s.id]
        return { ...s, rotationThresholdDays: v == null || v === '' ? null : Number(v) }
      }
      return s
    })
  }
  saveSupplierData(data)
  return { ok: true }
}

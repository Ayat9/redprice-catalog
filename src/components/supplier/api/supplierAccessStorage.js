/**
 * Mock-хранилище модуля «Поставщики» (localStorage).
 * Отражает форму Prisma-моделей SupplierProfile / CameraAssignment /
 * SupplierDocumentTemplate / SupplierDocumentAssignment / SupplierDocumentSignature.
 * Когда появится реальный backend — переключить API-клиент на fetch
 * без изменения UI.
 */

const STORAGE_KEY = 'redprice_supplier_access_v1'

const DEFAULT_ROTATION_DAYS = 30

const DEFAULT_DATA = {
  /** Глобальные настройки модуля (совпадают с SupplierSettings) */
  settings: {
    rotationThresholdDays: DEFAULT_ROTATION_DAYS,
  },
  /**
   * Поставщики-бренды (соответствует модели Supplier).
   * Поле rotationThresholdDays — null = использовать глобальный порог.
   */
  suppliers: [
    {
      id: 'brand-demo',
      name: 'Demo Brand',
      phone: '',
      address: '',
      external1cId: null,
      rotationThresholdDays: null,
    },
  ],
  /** Профили личных кабинетов поставщиков */
  profiles: [
    {
      id: 'sp-demo',
      userId: 'usr-supplier-1',
      supplierId: 'brand-demo',
      email: 'supplier@redprice.kz',
      password: 'supplier123',
      displayName: 'Demo Brand · Manager',
      isActive: true,
      canViewSales: true,
      canViewVideo: true,
      canViewFootfall: true,
      canSignDocuments: true,
    },
  ],
  cameraAssignments: [],
  documentTemplates: [],
  documentAssignments: [],
  /** История подписей. Неизменяемый append-only список */
  documentSignatures: [],
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function ensureShape(data) {
  const next = {
    settings: {
      rotationThresholdDays: Number(
        data?.settings?.rotationThresholdDays ?? DEFAULT_ROTATION_DAYS
      ),
    },
    suppliers: Array.isArray(data?.suppliers) ? data.suppliers.map((s) => ({ ...s })) : [],
    profiles: Array.isArray(data?.profiles) ? data.profiles.map((p) => ({ ...p })) : [],
    cameraAssignments: Array.isArray(data?.cameraAssignments)
      ? data.cameraAssignments.map((c) => ({ ...c }))
      : [],
    documentTemplates: Array.isArray(data?.documentTemplates)
      ? data.documentTemplates.map((d) => ({ ...d }))
      : [],
    documentAssignments: Array.isArray(data?.documentAssignments)
      ? data.documentAssignments.map((a) => ({ ...a }))
      : [],
    documentSignatures: Array.isArray(data?.documentSignatures)
      ? data.documentSignatures.map((s) => ({ ...s }))
      : [],
  }
  if (!next.suppliers.length) next.suppliers = DEFAULT_DATA.suppliers.map((s) => ({ ...s }))
  if (!next.profiles.length) next.profiles = DEFAULT_DATA.profiles.map((p) => ({ ...p }))
  return next
}

export function loadSupplierData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ensureShape(DEFAULT_DATA)
    return ensureShape(JSON.parse(raw))
  } catch {
    return ensureShape(DEFAULT_DATA)
  }
}

export function saveSupplierData(next) {
  const safe = ensureShape(next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  } catch {
    /* ignore quota */
  }
  return safe
}

export function makeId(prefix) {
  return uid(prefix)
}

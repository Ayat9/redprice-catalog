const STORAGE_KEY = 'redprice_investor_store_access_v1'

const MODULE_TEMPLATE = [
  { id: 'video', label: 'Видеонаблюдение', visible: true },
  { id: 'finance', label: 'Финансовые KPI', visible: true },
  { id: 'traffic', label: 'Трафик и маркетинг', visible: true },
  { id: 'planogram', label: 'Планограмма', visible: true },
  { id: 'reports', label: 'Отчёты и дивиденды', visible: true },
]

const DEFAULT_ROLES = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Полный доступ к финансовым и операционным данным.',
    permissions: {
      sections: ['overview', 'video', 'finance', 'traffic', 'planogram', 'reports'],
      canViewStoreSecrets: true,
      canExportReports: true,
    },
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Только просмотр обзорной и аналитической информации.',
    permissions: {
      sections: ['overview', 'traffic', 'reports'],
      canViewStoreSecrets: false,
      canExportReports: false,
    },
  },
]

const DEFAULT_DATA = {
  investors: [
    {
      id: 'inv-1',
      name: 'Инвестор 1',
      email: 'investor1@redprice.kz',
      password: 'investor123',
      isActive: true,
      roleId: 'role-owner',
    },
  ],
  stores: [
    {
      id: 'rp-1',
      name: 'Торговая точка 1',
      address: '',
      timezone: 'Asia/Almaty',
      currency: 'KZT',
      videoUrl: '',
      posApiKey: '',
      trafficCounterId: '',
      investorId: 'inv-1',
    },
  ],
  modulesByStore: {
    'rp-1': MODULE_TEMPLATE,
  },
  roles: DEFAULT_ROLES,
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function cloneModules(list) {
  return (list || MODULE_TEMPLATE).map((m) => ({ ...m }))
}

function ensureShape(data) {
  const next = {
    investors: Array.isArray(data?.investors) ? data.investors.map((i) => ({ ...i })) : [],
    stores: Array.isArray(data?.stores) ? data.stores.map((s) => ({ ...s })) : [],
    modulesByStore: data?.modulesByStore && typeof data.modulesByStore === 'object' ? { ...data.modulesByStore } : {},
    roles: Array.isArray(data?.roles) ? data.roles.map((r) => ({ ...r })) : [],
  }

  if (!next.investors.length) next.investors = DEFAULT_DATA.investors.map((i) => ({ ...i }))
  if (!next.stores.length) next.stores = DEFAULT_DATA.stores.map((s) => ({ ...s }))
  if (!next.roles.length) next.roles = DEFAULT_ROLES.map((r) => ({ ...r }))

  const hasRole = (id) => next.roles.some((r) => r.id === id)

  // Инвариант: один магазин -> максимум один investorId; investor -> много магазинов
  for (const s of next.stores) {
    if (!s.id) s.id = uid('rp')
    if (s.investorId && !next.investors.some((i) => i.id === s.investorId)) {
      s.investorId = null
    }
    if (!next.modulesByStore[s.id]) next.modulesByStore[s.id] = cloneModules(MODULE_TEMPLATE)
    else next.modulesByStore[s.id] = cloneModules(next.modulesByStore[s.id])
    if (!s.timezone) s.timezone = 'Asia/Almaty'
    if (!s.currency) s.currency = 'KZT'
  }

  for (const i of next.investors) {
    if (!i.id) i.id = uid('inv')
    if (!i.roleId || !hasRole(i.roleId)) i.roleId = next.roles[0]?.id || null
  }

  return next
}

export function loadAccessData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ensureShape(DEFAULT_DATA)
    return ensureShape(JSON.parse(raw))
  } catch (_) {
    return ensureShape(DEFAULT_DATA)
  }
}

export function saveAccessData(next) {
  const safe = ensureShape(next)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  return safe
}

export function getModuleTemplate() {
  return cloneModules(MODULE_TEMPLATE)
}

export function makeId(prefix) {
  return uid(prefix)
}


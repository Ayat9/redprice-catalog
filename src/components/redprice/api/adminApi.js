import { getModuleTemplate, loadAccessData, makeId, saveAccessData } from './storeAccessStorage'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Список торговых точек без заполненных секретов — статус «не настроено».
 */
export async function fetchStoreLocations() {
  await delay(120)
  const data = loadAccessData()
  return data.stores.map((s) => ({ ...s }))
}

/**
 * @param {string} storeId
 * @param {{ videoUrl?: string, posApiKey?: string, trafficCounterId?: string }} patch
 */
export async function saveStoreLocation(storeId, patch) {
  await delay(200)
  const data = loadAccessData()
  data.stores = data.stores.map((s) => (s.id === storeId ? { ...s, ...patch } : s))
  saveAccessData(data)
  return { ok: true, id: storeId, ...patch }
}

export async function createStoreLocation(payload) {
  await delay(120)
  const data = loadAccessData()
  const row = {
    id: makeId('rp'),
    name: String(payload?.name || '').trim() || 'Новая точка',
    address: String(payload?.address || '').trim(),
    timezone: String(payload?.timezone || 'Asia/Almaty').trim(),
    currency: String(payload?.currency || 'KZT').trim(),
    videoUrl: '',
    posApiKey: '',
    trafficCounterId: '',
    investorId: null,
  }
  data.stores.push(row)
  data.modulesByStore[row.id] = getModuleTemplate()
  saveAccessData(data)
  return { ok: true, store: row }
}

export async function deleteStoreLocation(storeId) {
  await delay(120)
  const data = loadAccessData()
  const exists = data.stores.some((s) => s.id === storeId)
  if (!exists) return { ok: false, error: 'Магазин не найден' }
  data.stores = data.stores.filter((s) => s.id !== storeId)
  if (data.modulesByStore && typeof data.modulesByStore === 'object') {
    delete data.modulesByStore[storeId]
  }
  saveAccessData(data)
  return { ok: true }
}

export async function fetchInvestors() {
  await delay(100)
  const data = loadAccessData()
  return data.investors.map((i) => ({ ...i, password: undefined }))
}

export async function fetchInvestorRoles() {
  await delay(90)
  const data = loadAccessData()
  return data.roles.map((r) => ({ ...r, permissions: { ...r.permissions } }))
}

export async function createInvestorRole(payload) {
  await delay(120)
  const data = loadAccessData()
  const name = String(payload?.name || '').trim()
  if (!name) return { ok: false, error: 'Название роли обязательно' }
  const exists = data.roles.some((r) => r.name.toLowerCase() === name.toLowerCase())
  if (exists) return { ok: false, error: 'Роль с таким названием уже существует' }
  const role = {
    id: makeId('role'),
    name,
    description: String(payload?.description || '').trim(),
    permissions: {
      sections: Array.isArray(payload?.permissions?.sections) ? payload.permissions.sections : ['overview'],
      canViewStoreSecrets: Boolean(payload?.permissions?.canViewStoreSecrets),
      canExportReports: Boolean(payload?.permissions?.canExportReports),
    },
  }
  data.roles.push(role)
  saveAccessData(data)
  return { ok: true, role }
}

export async function updateInvestorRole(roleId, patch) {
  await delay(120)
  const data = loadAccessData()
  const idx = data.roles.findIndex((r) => r.id === roleId)
  if (idx < 0) return { ok: false, error: 'Роль не найдена' }
  const cur = data.roles[idx]
  data.roles[idx] = {
    ...cur,
    name: patch?.name != null ? String(patch.name).trim() || cur.name : cur.name,
    description: patch?.description != null ? String(patch.description).trim() : cur.description,
    permissions: {
      ...cur.permissions,
      ...(patch?.permissions || {}),
      sections: Array.isArray(patch?.permissions?.sections)
        ? patch.permissions.sections
        : cur.permissions?.sections || ['overview'],
    },
  }
  saveAccessData(data)
  return { ok: true, role: data.roles[idx] }
}

export async function createInvestorAccount(payload) {
  await delay(120)
  const data = loadAccessData()
  const email = String(payload?.email || '')
    .trim()
    .toLowerCase()
  if (!email) return { ok: false, error: 'Укажите email инвестора' }
  if (data.investors.some((i) => i.email.toLowerCase() === email)) {
    return { ok: false, error: 'Инвестор с таким email уже существует' }
  }
  const investor = {
    id: makeId('inv'),
    name: String(payload?.name || '').trim() || 'Инвестор',
    email,
    password: String(payload?.password || '').trim() || 'investor123',
    isActive: true,
    roleId: payload?.roleId || data.roles[0]?.id || null,
  }
  data.investors.push(investor)
  saveAccessData(data)
  return { ok: true, investor: { ...investor, password: undefined } }
}

export async function updateInvestorAccount(investorId, patch) {
  await delay(120)
  const data = loadAccessData()
  const idx = data.investors.findIndex((i) => i.id === investorId)
  if (idx < 0) return { ok: false, error: 'Инвестор не найден' }
  if (patch?.roleId && !data.roles.some((r) => r.id === patch.roleId)) {
    return { ok: false, error: 'Роль не найдена' }
  }
  data.investors[idx] = {
    ...data.investors[idx],
    name: patch?.name != null ? String(patch.name).trim() : data.investors[idx].name,
    roleId: patch?.roleId != null ? patch.roleId : data.investors[idx].roleId,
    isActive: patch?.isActive != null ? Boolean(patch.isActive) : data.investors[idx].isActive,
  }
  saveAccessData(data)
  return { ok: true, investor: { ...data.investors[idx], password: undefined } }
}

export async function assignInvestorToStore(storeId, investorId) {
  await delay(150)
  const data = loadAccessData()
  const store = data.stores.find((s) => s.id === storeId)
  if (!store) return { ok: false, error: 'Магазин не найден' }
  if (investorId && !data.investors.some((i) => i.id === investorId)) {
    return { ok: false, error: 'Инвестор не найден' }
  }
  store.investorId = investorId || null
  saveAccessData(data)
  return { ok: true }
}

export async function fetchInvestorContentSettings(storeId) {
  await delay(80)
  const data = loadAccessData()
  const id = storeId || data.stores[0]?.id
  if (!id) return getModuleTemplate()
  const list = data.modulesByStore[id] || getModuleTemplate()
  return list.map((m) => ({ ...m }))
}

/**
 * @param {{ id: string, visible: boolean }[]} next
 */
export async function saveInvestorContentSettings(storeId, next) {
  await delay(200)
  const data = loadAccessData()
  const id = storeId || data.stores[0]?.id
  if (!id) return { ok: false, error: 'Нет магазина для сохранения модулей' }
  data.modulesByStore[id] = (next || []).map((m) => ({ ...m }))
  saveAccessData(data)
  return { ok: true, modules: next }
}

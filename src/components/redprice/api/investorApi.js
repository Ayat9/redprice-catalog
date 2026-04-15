/**
 * RedPrice Group — инвесторский API.
 * Заглушки без демо-цифр; подключите реальный fetch.
 */
import { loadAccessData } from './storeAccessStorage'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const SESSION_KEY = 'redprice_investor_session_v1'
const ADMIN_USERS_KEY = 'redprice_admin_users'

/** @typedef {'day' | 'month' | 'year'} Period */

const ZERO_METRICS = {
  revenue: 0,
  marginPct: 0,
  grossProfit: 0,
  footfall: 0,
}

/**
 * @param {Period} period
 */
export async function fetchInvestorMetrics(period) {
  await delay(120)
  return { ...ZERO_METRICS, period }
}

/**
 * @param {Period} _period
 */
export async function fetchFootfallFunnel(_period) {
  await delay(80)
  return [
    { name: 'Уличный трафик', value: 0 },
    { name: 'Зашли в магазин', value: 0 },
  ]
}

/**
 * Планограмма: стеллажи из API.
 * profitability — 0…100 для heatmap; col/row/colSpan/rowSpan — позиция в сетке (0-based).
 * Пустой массив — нет данных с бэкенда.
 *
 * Пример ответа API:
 * [
 *   { "id": "A1", "name": "Хлеб", "profitability": 72, "col": 0, "row": 0, "colSpan": 1, "rowSpan": 1 }
 * ]
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   profitability: number,
 *   col: number,
 *   row: number,
 *   colSpan?: number,
 *   rowSpan?: number
 * }>>}
 */
export async function fetchPlanogramShelves() {
  await delay(80)
  return []
}

export async function fetchQuarterlyReports() {
  await delay(100)
  return []
}

export async function fetchDividendTimeline() {
  await delay(80)
  return []
}

export function readInvestorSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

export function clearInvestorSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (_) {}
}

export async function loginInvestor(email, password) {
  await delay(120)
  const data = loadAccessData()
  const em = String(email || '').trim().toLowerCase()
  const pw = String(password || '')

  // Админу разрешаем вход в REDPRICE GROUP со всеми магазинами.
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    const admin = Array.isArray(users)
      ? users.find(
          (u) =>
            (u?.email || '').toLowerCase() === em &&
            String(u?.password || '') === pw &&
            String(u?.roleId || '') === 'admin'
        )
      : null
    if (admin) {
      const session = {
        investorId: '__admin__',
        email: admin.email,
        name: admin.name || 'Администратор',
        roleId: 'role-owner',
        isAdmin: true,
      }
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      } catch (_) {}
      return { ok: true, session }
    }
  } catch (_) {
    // ignore localStorage parsing errors
  }

  const investor = data.investors.find(
    (i) => i.isActive !== false && i.email.toLowerCase() === em && i.password === pw
  )
  if (!investor) return { ok: false, error: 'Неверный email или пароль' }
  const storeIds = data.stores.filter((s) => s.investorId === investor.id).map((s) => s.id)
  if (!storeIds.length) return { ok: false, error: 'Для вашего аккаунта пока не назначен магазин' }
  const session = {
    investorId: investor.id,
    email: investor.email,
    name: investor.name,
    roleId: investor.roleId || null,
  }
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (_) {}
  return { ok: true, session }
}

export async function fetchInvestorAccessContext(investorId) {
  await delay(80)
  const data = loadAccessData()

  if (investorId === '__admin__') {
    const modulesByStore = {}
    for (const s of data.stores) {
      modulesByStore[s.id] = (data.modulesByStore[s.id] || []).map((m) => ({ ...m, visible: true }))
    }
    const ownerRole = data.roles.find((r) => r.id === 'role-owner') || null
    return {
      ok: true,
      investor: { id: '__admin__', name: 'Администратор', email: 'admin@redprice.kz', roleId: 'role-owner' },
      role: ownerRole
        ? { ...ownerRole, permissions: { ...ownerRole.permissions, sections: ['overview', 'video', 'finance', 'traffic', 'planogram', 'reports'] } }
        : {
            id: 'role-owner',
            name: 'Owner',
            permissions: {
              sections: ['overview', 'video', 'finance', 'traffic', 'planogram', 'reports'],
              canViewStoreSecrets: true,
              canExportReports: true,
            },
          },
      stores: data.stores.map((s) => ({ ...s })),
      modulesByStore,
    }
  }

  const investor = data.investors.find((i) => i.id === investorId)
  if (!investor) return { ok: false, error: 'Инвестор не найден' }
  const role = data.roles.find((r) => r.id === investor.roleId) || null
  const stores = data.stores.filter((s) => s.investorId === investorId)
  const modulesByStore = {}
  for (const s of stores) {
    modulesByStore[s.id] = (data.modulesByStore[s.id] || []).map((m) => ({ ...m }))
  }
  return {
    ok: true,
    investor: {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      roleId: investor.roleId || null,
    },
    role: role ? { ...role, permissions: { ...role.permissions } } : null,
    stores: stores.map((s) => ({ ...s })),
    modulesByStore,
  }
}

const STORAGE_KEY = 'redprice_electronic_price_v1'

const DEFAULT_VALUE = {
  name: '',
  price: '',
}

function safeJsonParse(raw) {
  try {
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function normalizeInput({ name, price }) {
  const next = {
    name: String(name ?? '').trim(),
    price: String(price ?? '').trim(),
  }
  if (!next.name) throw new Error('Введите название товара')
  if (!next.price) throw new Error('Введите цену')
  return next
}

async function parseApiError(res, fallbackMessage) {
  try {
    const data = await res.json()
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
  } catch (_) {
    // ignore JSON parse errors
  }
  return fallbackMessage
}

export async function getPrice() {
  if (typeof window === 'undefined') return { ...DEFAULT_VALUE }

  // 1) Читаем серверный API (Vercel function / backend route)
  try {
    const res = await fetch('/api/price', { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      return {
        name: typeof data?.name === 'string' ? data.name : '',
        price: typeof data?.price === 'string' ? data.price : String(data?.price ?? ''),
      }
    }
  } catch (_) {
    // fallback ниже
  }

  // 1.1) Fallback for static JSON route
  try {
    const res = await fetch('/api/price.json', { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      return {
        name: typeof data?.name === 'string' ? data.name : '',
        price: typeof data?.price === 'string' ? data.price : String(data?.price ?? ''),
      }
    }
  } catch (_) {
    // fallback ниже
  }

  // 2) localStorage fallback if backend is unreachable
  const parsed = safeJsonParse(window.localStorage.getItem(STORAGE_KEY))
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_VALUE }

  return {
    name: typeof parsed.name === 'string' ? parsed.name : '',
    price: typeof parsed.price === 'string' ? parsed.price : '',
  }
}

export async function updatePrice({ name, price }) {
  if (typeof window === 'undefined') {
    throw new Error('updatePrice must be called in browser')
  }

  const next = normalizeInput({ name, price })
  const isLocalDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  // 1) Пишем через /api/update-price (основной endpoint админки)
  try {
    const res = await fetch('/api/update-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    if (res.ok) {
      const data = await res.json()
      const updated = {
        name: typeof data?.name === 'string' ? data.name : next.name,
        price: typeof data?.price === 'string' ? data.price : String(data?.price ?? next.price),
      }
      window.dispatchEvent(
        new CustomEvent('redprice_electronic_price_updated', { detail: updated }),
      )
      return updated
    }
    if (!isLocalDev) {
      const message = await parseApiError(res, `Ошибка сохранения (${res.status})`)
      throw new Error(message)
    }
  } catch (_) {
    if (!isLocalDev) throw _
  }

  // 1.1) Совместимость: прямой POST в /api/price(.json)
  try {
    const res = await fetch('/api/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    if (res.ok) {
      const data = await res.json()
      const updated = {
        name: typeof data?.name === 'string' ? data.name : next.name,
        price: typeof data?.price === 'string' ? data.price : String(data?.price ?? next.price),
      }
      window.dispatchEvent(
        new CustomEvent('redprice_electronic_price_updated', { detail: updated }),
      )
      return updated
    }
    if (!isLocalDev) {
      const message = await parseApiError(res, `Ошибка сохранения (${res.status})`)
      throw new Error(message)
    }
  } catch (_) {
    if (!isLocalDev) throw _
  }

  // 2) Dev fallback: localStorage
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(
    new CustomEvent('redprice_electronic_price_updated', { detail: next }),
  )
  return next
}


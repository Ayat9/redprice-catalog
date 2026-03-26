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

export async function getPrice() {
  if (typeof window === 'undefined') return { ...DEFAULT_VALUE }

  // 1) Читаем физический JSON-файл на статике (ESP32/SPA обычно его и запрашивают)
  try {
    const res = await fetch('/api/data.json', { method: 'GET' })
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

  // 2) Fallback: localStorage (на случай если JSON недоступен)
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

  // 1) Пишем напрямую в /api/price(.json) endpoint
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
  } catch (_) {
    // fallback ниже
  }

  // 1.1) Совместимость со старым endpoint
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
  } catch (_) {
    // fallback ниже
  }

  // 2) Fallback: localStorage
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(
    new CustomEvent('redprice_electronic_price_updated', { detail: next }),
  )
  return next
}


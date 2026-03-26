const DEFAULT_VALUE = { name: '', price: '' }

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const table = process.env.SUPABASE_PRICE_TABLE || 'electronic_price'
  return { url, key, table }
}

function ensureConfigured() {
  const { url, key, table } = getSupabaseConfig()
  if (!url || !key) {
    throw new Error('Supabase env is not configured')
  }
  return { url: url.replace(/\/$/, ''), key, table }
}

function normalizePayload(input) {
  const next = {
    name: String(input?.name ?? '').trim(),
    price: String(input?.price ?? '').trim(),
  }
  if (!next.name) throw new Error('Введите название товара')
  if (!next.price) throw new Error('Введите цену')
  return next
}

async function readPrice() {
  const { url, key, table } = ensureConfigured()
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?id=eq.1&select=name,price&limit=1`

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Supabase read failed (${res.status})`)
  }

  const rows = await res.json()
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return { ...DEFAULT_VALUE }
  return {
    name: typeof row.name === 'string' ? row.name : '',
    price: typeof row.price === 'string' ? row.price : String(row.price ?? ''),
  }
}

async function writePrice(input) {
  const { url, key, table } = ensureConfigured()
  const next = normalizePayload(input)
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?on_conflict=id`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([{ id: 1, name: next.name, price: next.price }]),
  })

  if (!res.ok) {
    throw new Error(`Supabase write failed (${res.status})`)
  }

  const rows = await res.json()
  const row = Array.isArray(rows) ? rows[0] : next
  return {
    name: typeof row.name === 'string' ? row.name : next.name,
    price: typeof row.price === 'string' ? row.price : next.price,
  }
}

export {
  readPrice,
  writePrice,
}


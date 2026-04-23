/** Клиент API новостей (совпадает с lib/news-api.js на сервере) */
const API = '/api/news'

export function newsWriteHeaders() {
  const k = import.meta.env.VITE_NEWS_WRITE_KEY || ''
  return k ? { 'X-News-Write-Key': k } : {}
}

async function parseApiResponse(response) {
  const raw = await response.text()
  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch (_) {
    data = null
  }

  if (response.ok) {
    if (data && typeof data === 'object') return data
    return { ok: false, error: 'Пустой ответ сервера' }
  }

  const messageFromJson =
    data && typeof data === 'object' ? data.error || data.message || null : null
  return {
    ok: false,
    error: messageFromJson || `Ошибка ${response.status}: ${response.statusText || 'запрос не выполнен'}`,
  }
}

export async function fetchPublishedNews(category) {
  const q = new URLSearchParams()
  if (category) q.set('category', category)
  const url = q.toString() ? `${API}?${q}` : API
  const r = await fetch(url)
  return parseApiResponse(r)
}

export async function fetchNewsAll() {
  const r = await fetch(`${API}?all=1`, { headers: { ...newsWriteHeaders() } })
  return parseApiResponse(r)
}

export async function fetchNewsBySlug(slug) {
  const r = await fetch(`${API}?slug=${encodeURIComponent(slug)}`)
  return parseApiResponse(r)
}

export async function createNewsPost(payload) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify(payload),
  })
  return parseApiResponse(r)
}

export async function updateNewsPost(id, payload) {
  const r = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify(payload),
  })
  return parseApiResponse(r)
}

export async function deleteNewsPost(id) {
  const r = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: { ...newsWriteHeaders() },
  })
  return parseApiResponse(r)
}

export async function uploadNewsMedia(dataUrl, filename) {
  const r = await fetch(`${API}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify({ dataUrl, filename }),
  })
  return parseApiResponse(r)
}

export async function fetchNewsComments(slug) {
  const r = await fetch(`${API}/${encodeURIComponent(slug)}/comments`)
  return parseApiResponse(r)
}

export async function createNewsComment(slug, payload) {
  const r = await fetch(`${API}/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseApiResponse(r)
}

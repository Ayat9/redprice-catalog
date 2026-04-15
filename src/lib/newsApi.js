/** Клиент API новостей (совпадает с lib/news-api.js на сервере) */
const API = '/api/news'

export function newsWriteHeaders() {
  const k = import.meta.env.VITE_NEWS_WRITE_KEY || ''
  return k ? { 'X-News-Write-Key': k } : {}
}

export async function fetchPublishedNews(category) {
  const q = new URLSearchParams()
  if (category) q.set('category', category)
  const url = q.toString() ? `${API}?${q}` : API
  const r = await fetch(url)
  return r.json()
}

export async function fetchNewsAll() {
  const r = await fetch(`${API}?all=1`, { headers: { ...newsWriteHeaders() } })
  return r.json()
}

export async function fetchNewsBySlug(slug) {
  const r = await fetch(`${API}?slug=${encodeURIComponent(slug)}`)
  return r.json()
}

export async function createNewsPost(payload) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function updateNewsPost(id, payload) {
  const r = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function uploadNewsMedia(dataUrl, filename) {
  const r = await fetch(`${API}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...newsWriteHeaders() },
    body: JSON.stringify({ dataUrl, filename }),
  })
  return r.json()
}

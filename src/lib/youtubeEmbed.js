/**
 * Извлекает id ролика/трансляции YouTube из типичных URL (watch, live, embed, shorts, youtu.be).
 * @param {string} rawUrl
 * @returns {string | null}
 */
export function extractYouTubeVideoId(rawUrl) {
  const value = String(rawUrl || '').trim()
  if (!value) return null
  try {
    const u = new URL(value)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const [first, second] = u.pathname.split('/').filter(Boolean)
      if (first === 'embed' || first === 'live' || first === 'shorts') return second || null
    }
  } catch {
    // Ignore parsing errors and fall back to regex below.
  }

  const fallback = value.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([\w-]{8,})/i
  )
  return fallback?.[1] || null
}

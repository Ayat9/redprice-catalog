/**
 * Рендер полной новости с учётом layout_type (как на публичной странице, так и в превью админки).
 */
function extractYouTubeVideoId(rawUrl) {
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

function VideoBlock({ url }) {
  const value = String(url || '').trim()
  if (!value) return null
  if (/^rtmp:\/\//i.test(value)) {
    return (
      <p className="text-sm text-slate-500">
        Указан RTMP-адрес публикации. Для отображения на сайте вставьте ссылку просмотра YouTube
        (например, `https://www.youtube.com/watch?v=...` или `https://www.youtube.com/live/...`).
      </p>
    )
  }
  const ytId = extractYouTubeVideoId(value)
  if (ytId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5">
        <iframe
          title="Видео"
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${ytId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(value) || value.startsWith('blob:') || value.startsWith('/uploads/')) {
    return (
      <video
        className="w-full rounded-xl shadow-sm ring-1 ring-black/5"
        controls
        playsInline
        src={value}
      >
        <track kind="captions" />
      </video>
    )
  }
  return (
    <p className="text-sm text-slate-500">
      Видео:{' '}
      <a href={value} className="text-[#E41C2A] underline" target="_blank" rel="noreferrer">
        открыть ссылку
      </a>
    </p>
  )
}

export function NewsArticleLayouts({ post, className = '' }) {
  const layout = post.layoutType || 'stack'
  const body = (
    <div
      className={`news-prose news-body-html prose prose-slate max-w-none prose-headings:tracking-tight prose-a:text-[#E41C2A] ${className}`}
      dangerouslySetInnerHTML={{ __html: post.body || '' }}
    />
  )

  const cover = post.coverImageUrl ? (
    <img
      src={post.coverImageUrl}
      alt=""
      className="max-h-[420px] w-full rounded-xl object-cover shadow-sm ring-1 ring-black/5"
    />
  ) : null

  const video = post.videoUrl ? <VideoBlock url={post.videoUrl} /> : null

  if (layout === 'split-left') {
    return (
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div>{body}</div>
        <div className="flex flex-col gap-4">
          {cover}
          {video}
        </div>
      </div>
    )
  }

  if (layout === 'split-right') {
    return (
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="order-2 flex flex-col gap-4 md:order-1">
          {cover}
          {video}
        </div>
        <div className="order-1 md:order-2">{body}</div>
      </div>
    )
  }

  if (layout === 'video') {
    return (
      <div className="space-y-8">
        <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5">
          {video || cover || (
            <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-400">
              Нет видео или обложки
            </div>
          )}
        </div>
        {body}
      </div>
    )
  }

  /* stack */
  return (
    <div className="space-y-8">
      {cover && <div>{cover}</div>}
      {body}
      {post.videoUrl && <div>{video}</div>}
    </div>
  )
}

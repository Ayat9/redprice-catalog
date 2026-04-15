/**
 * Рендер полной новости с учётом layout_type (как на публичной странице, так и в превью админки).
 */
function VideoBlock({ url }) {
  if (!url?.trim()) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5">
        <iframe
          title="Видео"
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt[1]}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith('blob:') || url.startsWith('/uploads/')) {
    return (
      <video
        className="w-full rounded-xl shadow-sm ring-1 ring-black/5"
        controls
        playsInline
        src={url}
      >
        <track kind="captions" />
      </video>
    )
  }
  return (
    <p className="text-sm text-slate-500">
      Видео:{' '}
      <a href={url} className="text-[#E41C2A] underline" target="_blank" rel="noreferrer">
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

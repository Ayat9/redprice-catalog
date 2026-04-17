/**
 * Рендер полной новости с учётом layout_type (как на публичной странице, так и в превью админки).
 */
import { VideoUrlEmbed } from '@/components/shared/VideoUrlEmbed'

export function NewsArticleLayouts({ post, className = '' }) {
  const layout = post.layoutType || 'stack'
  const videoUrl = post.videoUrl ?? post.video_url
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

  const video = videoUrl ? <VideoUrlEmbed url={videoUrl} /> : null

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
      {videoUrl && <div>{video}</div>}
    </div>
  )
}

import { extractYouTubeVideoId } from '@/lib/youtubeEmbed'

/**
 * Встраивание по URL: YouTube, RTMP-подсказка, прямой файл или ссылка.
 * @param {{ url?: string | null, className?: string }} props
 */
export function VideoUrlEmbed({ url, className = '' }) {
  const value = String(url || '').trim()
  if (!value) return null
  if (/^rtmp:\/\//i.test(value)) {
    return (
      <p className={`text-sm text-slate-500 ${className}`}>
        Указан RTMP-адрес публикации. Для отображения на сайте вставьте ссылку просмотра YouTube (например,{' '}
        <span className="font-mono text-xs">https://www.youtube.com/watch?v=…</span> или{' '}
        <span className="font-mono text-xs">https://www.youtube.com/live/…</span>).
      </p>
    )
  }
  const ytId = extractYouTubeVideoId(value)
  if (ytId) {
    return (
      <div
        className={`aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5 ${className}`}
      >
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
        className={`w-full rounded-xl shadow-sm ring-1 ring-black/5 ${className}`}
        controls
        playsInline
        src={value}
      >
        <track kind="captions" />
      </video>
    )
  }
  return (
    <p className={`text-sm text-slate-500 ${className}`}>
      Видео:{' '}
      <a href={value} className="text-[#E41C2A] underline" target="_blank" rel="noreferrer">
        открыть ссылку
      </a>
    </p>
  )
}

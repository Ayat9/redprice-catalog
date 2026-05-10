import { extractYouTubeVideoId } from '@/lib/youtubeEmbed'

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'

/**
 * Встраивание по URL: YouTube, RTMP-подсказка, прямой файл или ссылка.
 * layout="fill" — для встраивания внутри уже заданного aspect-video (Safari/mobile: иначе iframe часто имеет высоту 0).
 *
 * @param {{ url?: string | null, className?: string, hideFallbackHint?: boolean, layout?: 'card' | 'fill' }} props
 */
export function VideoUrlEmbed({ url, className = '', hideFallbackHint = false, layout = 'card' }) {
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
  const ytSrc = ytId ? `https://www.youtube.com/embed/${ytId}` : null

  if (ytSrc) {
    if (layout === 'fill') {
      return (
        <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
          <iframe
            title="Видео"
            className="absolute inset-0 h-full w-full border-0"
            src={ytSrc}
            allow={IFRAME_ALLOW}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )
    }
    return (
      <div
        className={`aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <iframe
          title="Видео"
          className="h-full min-h-[200px] w-full border-0 sm:min-h-0"
          src={ytSrc}
          allow={IFRAME_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(value) || value.startsWith('blob:') || value.startsWith('/uploads/')) {
    if (layout === 'fill') {
      return (
        <video
          className={`absolute inset-0 h-full w-full bg-black object-contain ${className}`}
          controls
          playsInline
          preload="metadata"
          src={value}
        >
          <track kind="captions" />
        </video>
      )
    }
    return (
      <video
        className={`max-h-[80vh] w-full rounded-xl shadow-sm ring-1 ring-black/5 ${className}`}
        controls
        playsInline
        preload="metadata"
        src={value}
      >
        <track kind="captions" />
      </video>
    )
  }

  if (/^https?:\/\//i.test(value)) {
    if (layout === 'fill') {
      return (
        <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
          <iframe
            title="Видео"
            className="absolute inset-0 h-full w-full border-0"
            src={value}
            allow={IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {!hideFallbackHint ? (
            <p className="pointer-events-none absolute bottom-1 left-0 right-0 z-10 px-2 text-center text-[10px] leading-tight text-white/80 drop-shadow">
              <span className="pointer-events-auto">
                Не загружается?{' '}
                <a href={value} className="text-red-300 underline" target="_blank" rel="noreferrer">
                  открыть
                </a>
              </span>
            </p>
          ) : null}
        </div>
      )
    }
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="aspect-video w-full min-h-[200px] overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5 sm:min-h-0">
          <iframe
            title="Видео"
            className="h-full min-h-[200px] w-full border-0 sm:min-h-0"
            src={value}
            allow={IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {!hideFallbackHint ? (
          <p className="text-xs text-slate-500">
            Если сайт камеры запрещает встраивание, откройте поток в новой вкладке:{' '}
            <a href={value} className="text-[#E41C2A] underline" target="_blank" rel="noreferrer">
              открыть ссылку
            </a>
          </p>
        ) : null}
      </div>
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

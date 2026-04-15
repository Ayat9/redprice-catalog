import { Radio } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Карточка камеры. LIVE — когда есть поток; иначе STANDBY.
 * @param {{ id: string, name: string, channel: string, zone?: string }} camera
 * @param {string} archiveDateIso — YYYY-MM-DD (контекст архива)
 * @param {boolean} live — признак живого потока с API
 * @param {() => void} [onOpenDetail] — открыть полноэкранный просмотр
 * @param {import('react').ReactNode} [videoOverlay] — кнопки поверх превью (внутри aspect-video)
 */
export default function VideoStream({
  camera,
  archiveDateIso,
  live = false,
  onOpenDetail,
  videoOverlay,
  /** @deprecated используйте camera */
  slotIndex,
}) {
  const title = camera?.name ?? `Камера ${slotIndex ?? '—'}`
  const channel = camera?.channel ?? `CH-${slotIndex ?? '?'}`
  const id = camera?.id ?? `slot-${slotIndex}`

  return (
    <Card
      className="gap-0 py-0 cursor-pointer overflow-hidden border-border/80 shadow-md transition-shadow hover:shadow-lg"
      onClick={() => onOpenDetail?.()}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.()}
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
    >
      <CardContent className="relative p-0">
        <div className="relative aspect-video w-full bg-gradient-to-br from-muted/80 to-muted">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-background/10" />

          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span onClick={(e) => e.stopPropagation()}>
                  <Badge
                    className={
                      live
                        ? 'border-0 bg-emerald-600 text-white shadow-md'
                        : 'border border-border bg-background/90 text-muted-foreground'
                    }
                  >
                    <span className="mr-1.5 flex items-center gap-1">
                      {live ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                          </span>
                          LIVE
                        </>
                      ) : (
                        <>
                          <Radio className="size-3 opacity-70" />
                          STANDBY
                        </>
                      )}
                    </span>
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                {live
                  ? 'Идёт приём видеопотока с регистратора.'
                  : 'LIVE после подключения канала. Клик по карточке — детальный просмотр.'}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative flex h-full min-h-[160px] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Подключение к API регистратора…
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground/80">{channel}</p>
          </div>
          {videoOverlay ? (
            <div className="absolute bottom-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
              {videoOverlay}
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1 border-t border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
        </div>
        {archiveDateIso && (
          <p className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
            Архив: {archiveDateIso}
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

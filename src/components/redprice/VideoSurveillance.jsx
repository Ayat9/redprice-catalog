import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Maximize2, Video } from 'lucide-react'
import { fetchCamerasForDay } from './api/videoApi'
import VideoStream from './VideoStream'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 9
const VIEW_MODES = [
  { id: 'tiles', label: 'Плитка' },
  { id: 'wide', label: 'Крупно' },
  { id: 'list', label: 'Список' },
]

function todayIsoLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatRuDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('ru-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function VideoSurveillance() {
  const [dateIso, setDateIso] = useState(todayIsoLocal)
  const [page, setPage] = useState(0)
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [viewMode, setViewMode] = useState('tiles')

  const load = useCallback(() => {
    setLoading(true)
    fetchCamerasForDay(dateIso).then((list) => {
      setCameras(list)
      setLoading(false)
      setPage((p) => Math.min(p, Math.max(0, Math.ceil(list.length / PAGE_SIZE) - 1)))
    })
  }, [dateIso])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(cameras.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages - 1)
  const slice = useMemo(() => {
    const start = pageClamped * PAGE_SIZE
    return cameras.slice(start, start + PAGE_SIZE)
  }, [cameras, pageClamped])

  useEffect(() => {
    setPage(0)
  }, [dateIso])

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-50 p-2">
            <Video className="size-6 text-black" strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">Видеонаблюдение</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
              До 9 камер в сетке; всего {cameras.length || 20} каналов. Выберите день для архива и
              откройте камеру для детального просмотра.
            </p>
          </div>
        </div>

        <Card className="w-full max-w-md border border-gray-200 bg-white shadow-sm lg:w-auto">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4" />
              День просмотра
            </CardTitle>
            <CardDescription>Архив / контекст записей (подключите API регистратора)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
                className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
              />
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setDateIso(todayIsoLocal())}>
                  Сегодня
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const d = new Date(dateIso + 'T12:00:00')
                    d.setDate(d.getDate() - 1)
                    setDateIso(d.toISOString().slice(0, 10))
                  }}
                >
                  Вчера
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Выбрано: <span className="font-medium text-foreground">{formatRuDate(dateIso)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Страница{' '}
          <span className="font-medium text-black">
            {pageClamped + 1} / {totalPages}
          </span>
          <span className="mx-2 text-slate-300">·</span>
          Камеры {pageClamped * PAGE_SIZE + 1}–
          {Math.min((pageClamped + 1) * PAGE_SIZE, cameras.length)} из {cameras.length}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                className={`min-w-[88px] rounded-xl px-4 py-2 text-sm font-medium leading-none transition ${
                  viewMode === m.id
                    ? 'bg-[#E41C2A] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pageClamped <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Назад
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pageClamped >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Вперёд
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            viewMode === 'list'
              ? 'grid-cols-1'
              : viewMode === 'wide'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {slice.map((cam) => (
            <div key={cam.id} className="group">
              <VideoStream
                camera={cam}
                archiveDateIso={dateIso}
                onOpenDetail={() => setDetail(cam)}
                videoOverlay={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-xl bg-white/95 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDetail(cam)
                    }}
                  >
                    <Maximize2 className="mr-1.5 size-3.5" />
                    Детально
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="border-b border-gray-200 bg-white px-6 py-4 text-left">
            <DialogTitle className="pr-8 text-black">{detail?.name ?? 'Камера'}</DialogTitle>
            <p className="text-sm text-slate-500">
              <span>Канал {detail?.channel}</span>
              <span className="mx-2 text-border">·</span>
              <span>День: {formatRuDate(dateIso)}</span>
              <span className="ml-2 font-mono text-xs">{detail?.id}</span>
            </p>
          </DialogHeader>
          <div className="bg-white p-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-slate-50/50 shadow-inner">
              <div className="relative aspect-video w-full">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    Поток и архив за выбранный день подключатся к API регистратора.
                  </p>
                  <p className="font-mono text-xs text-slate-400">
                    {detail?.name} · {detail?.channel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

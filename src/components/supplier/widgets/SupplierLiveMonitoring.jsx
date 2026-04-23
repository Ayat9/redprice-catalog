import { useEffect, useState } from 'react'
import { AlertTriangle, Camera } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoUrlEmbed } from '@/components/shared/VideoUrlEmbed'
import { fetchSupplierCameras } from '../api/supplierApi'

/**
 * Live Monitoring: список камер, назначенных текущему поставщику (по supplierProfileId).
 * Камеры с isAvailable=false показываются с баннером «временно недоступно».
 */
export function SupplierLiveMonitoring({ session }) {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSupplierCameras({ supplierProfileId: session.supplierProfileId })
      .then((out) => {
        if (cancelled) return
        if (!out.ok) setErr(out.error || 'Не удалось загрузить камеры')
        else setCameras(out.cameras)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [session.supplierProfileId])

  if (loading) return <p className="text-sm text-slate-500">Загрузка камер…</p>
  if (err) return <p className="text-sm text-red-600">{err}</p>
  if (!cameras.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4" />
            Live Monitoring
          </CardTitle>
          <CardDescription>
            Для вашего бренда ещё не назначена ни одна камера. Обратитесь к администратору.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cameras.map((cam) => (
        <Card key={cam.id}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="truncate">{cam.label}</span>
              {!cam.isAvailable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                  <AlertTriangle className="size-3" />
                  недоступна
                </span>
              )}
            </CardTitle>
            {cam.storeId && (
              <CardDescription className="font-mono text-[11px]">store: {cam.storeId}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {cam.isAvailable ? (
              <VideoUrlEmbed url={cam.streamUrl} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                Камера временно недоступна. Повторите попытку позже.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

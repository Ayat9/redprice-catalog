import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchSupplierMarketing } from '../api/supplierApi'

/**
 * График проходимости (7 дней) + статус электронных ценников по бренду.
 */
export function SupplierMarketing({ session }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSupplierMarketing({ supplierId: session.supplierId })
      .then((out) => {
        if (cancelled) return
        if (!out.ok) setErr(out.error || 'Ошибка загрузки')
        else setData(out)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [session.supplierId])

  if (loading) return <p className="text-sm text-slate-500">Загрузка маркетинга…</p>
  if (err) return <p className="text-sm text-red-600">{err}</p>
  if (!data) return null

  const max = Math.max(1, ...data.footfall.map((d) => d.footfall))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Проходимость (7 дней)</CardTitle>
          <CardDescription>Посетители мимо полок вашего бренда · демо-данные</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-52 items-end gap-2">
            {data.footfall.map((d) => {
              const h = (d.footfall / max) * 100
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-sky-500 to-sky-300"
                    style={{ height: `${h}%` }}
                    title={`${d.day}: ${d.footfall}`}
                  />
                  <span className="text-xs text-slate-500">{d.day}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Электронные ценники (ESL)</CardTitle>
          <CardDescription>Состояние синхронизации по бренду</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <EslBadge label="Всего" value={data.eslStatus.total} tone="slate" />
          <EslBadge label="Обновлены" value={data.eslStatus.synced} tone="emerald" />
          <EslBadge label="В очереди" value={data.eslStatus.pending} tone="amber" />
          <EslBadge label="Ошибки" value={data.eslStatus.failed} tone="red" />
        </CardContent>
      </Card>
    </div>
  )
}

function EslBadge({ label, value, tone }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-800 ring-slate-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-800 ring-red-200',
  }[tone]
  return (
    <div className={`rounded-xl px-3 py-2 text-sm ring-1 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { LineChart, TrendingDown, TrendingUp, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchSupplierSales, fetchRotationReport } from '../api/supplierApi'

function formatMoney(n) {
  return `${Math.round(Number(n) || 0).toLocaleString('ru-KZ')} ₸`
}

/**
 * Real-time Sales + статус «неликвида» (ротация) — данные строго по своему supplierId.
 */
export function SupplierSales({ session }) {
  const [data, setData] = useState({ skus: [], totals: { revenue: 0, units: 0, sku: 0 } })
  const [rotation, setRotation] = useState({ thresholdDays: 30, stagnant: [] })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    Promise.all([
      fetchSupplierSales({ supplierId: session.supplierId }),
      fetchRotationReport({ supplierId: session.supplierId }),
    ])
      .then(([sales, rot]) => {
        if (cancelled) return
        if (!sales.ok) setErr(sales.error || 'Ошибка загрузки продаж')
        else setData({ skus: sales.skus, totals: sales.totals })
        if (rot.ok) setRotation(rot)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [session.supplierId])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Выручка" value={formatMoney(data.totals.revenue)} icon={<LineChart className="size-5 text-emerald-600" />} />
        <Metric title="Продано единиц" value={data.totals.units.toLocaleString('ru-KZ')} icon={<TrendingUp className="size-5 text-sky-600" />} />
        <Metric title="SKU в ротации" value={`${data.totals.sku - rotation.stagnant.length} / ${data.totals.sku}`} icon={<Package className="size-5 text-slate-700" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>SKU по бренду</span>
            <span className="text-xs font-normal text-slate-500">
              Неликвид · ≥ {rotation.thresholdDays} дней без продаж
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Загрузка…</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Наименование</th>
                    <th className="px-3 py-2 text-right">Цена</th>
                    <th className="px-3 py-2 text-right">Остаток</th>
                    <th className="px-3 py-2 text-right">Продано</th>
                    <th className="px-3 py-2 text-right">Выручка</th>
                    <th className="px-3 py-2 text-center">Дней без продаж</th>
                  </tr>
                </thead>
                <tbody>
                  {data.skus.map((r) => {
                    const stagnant = r.daysSinceLastSale >= rotation.thresholdDays
                    return (
                      <tr key={r.sku} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(r.price)}</td>
                        <td className="px-3 py-2 text-right">{r.stock}</td>
                        <td className="px-3 py-2 text-right">{r.unitsSold}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(r.revenue)}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              stagnant
                                ? 'inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200'
                                : 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200'
                            }
                          >
                            {stagnant ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                            {r.daysSinceLastSale}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ title, value, icon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">{icon}</div>
      </CardContent>
    </Card>
  )
}

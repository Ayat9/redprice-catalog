import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Camera, FileSignature, TrendingUp } from 'lucide-react'
import { fetchSupplierCameras, fetchSupplierDocuments, fetchSupplierSales } from '../api/supplierApi'

function formatMoney(n) {
  return `${Math.round(Number(n) || 0).toLocaleString('ru-KZ')} ₸`
}

/**
 * Плитка «Обзор»: быстрые KPI + переходы. Никаких чужих данных — всё по supplierId/profileId.
 */
export function SupplierOverview({ session, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ revenue: 0, units: 0, sku: 0 })
  const [cameras, setCameras] = useState(0)
  const [pendingDocs, setPendingDocs] = useState(0)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchSupplierSales({ supplierId: session.supplierId }),
      fetchSupplierCameras({ supplierProfileId: session.supplierProfileId }),
      fetchSupplierDocuments({ supplierProfileId: session.supplierProfileId }),
    ])
      .then(([sales, cams, docs]) => {
        if (cancelled) return
        if (sales.ok) setTotals(sales.totals)
        else setErr(sales.error || 'Ошибка загрузки')
        if (cams.ok) setCameras(cams.cameras.length)
        if (docs.ok) setPendingDocs(docs.documents.filter((d) => d.status !== 'SIGNED').length)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [session.supplierId, session.supplierProfileId])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Выручка по бренду"
        value={loading ? '—' : formatMoney(totals.revenue)}
        hint={`${totals.units} ед. · ${totals.sku} SKU`}
        icon={<TrendingUp className="size-5 text-emerald-600" />}
        onClick={() => onNavigate?.('sales')}
      />
      <KpiCard
        title="Активные камеры"
        value={loading ? '—' : cameras}
        hint="Привязано к вашему бренду"
        icon={<Camera className="size-5 text-sky-600" />}
        onClick={() => onNavigate?.('video')}
      />
      <KpiCard
        title="На подпись"
        value={loading ? '—' : pendingDocs}
        hint="Ожидают вашей подписи"
        icon={<FileSignature className="size-5 text-[#E41C2A]" />}
        onClick={() => onNavigate?.('legal')}
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-amber-600" />
            Статус модулей
          </CardTitle>
          <CardDescription className="text-xs">
            Видимость настраивает администратор
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <ModuleFlag label="Продажи" on={session.permissions.canViewSales} />
          <ModuleFlag label="Видео" on={session.permissions.canViewVideo} />
          <ModuleFlag label="Маркетинг" on={session.permissions.canViewFootfall} />
          <ModuleFlag label="Документы" on={session.permissions.canSignDocuments} />
        </CardContent>
      </Card>
      {err && <p className="md:col-span-2 text-sm text-red-600 xl:col-span-4">{err}</p>}
    </div>
  )
}

function KpiCard({ title, value, hint, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition hover:-translate-y-0.5"
    >
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">{icon}</div>
        </CardContent>
      </Card>
    </button>
  )
}

function ModuleFlag({ label, on }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          on
            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200'
            : 'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200'
        }
      >
        {on ? 'включён' : 'скрыт'}
      </span>
    </div>
  )
}

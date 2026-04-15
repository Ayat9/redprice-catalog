import { useEffect, useState } from 'react'
import { BarChart3, Percent, TrendingUp, Users } from 'lucide-react'
import { fetchInvestorMetrics } from './api/investorApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

function fmtMoney(n) {
  if (!n) return '0 ₸'
  return `${n.toLocaleString('ru-KZ')} ₸`
}

function fmtPct(n) {
  return `${Number(n).toFixed(1)} %`
}

function fmtInt(n) {
  return n.toLocaleString('ru-KZ')
}

function statusForMetric(key, data) {
  if (!data) return { label: 'Загрузка…', variant: 'secondary', className: '' }
  const v = data[key]
  const num = typeof v === 'number' ? v : 0
  if (num > 0) {
    return {
      label: 'OK',
      variant: 'default',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-50',
    }
  }
  return {
    label: 'Нет данных',
    variant: 'secondary',
    className: 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-50',
  }
}

export default function FinancialCards() {
  const [period, setPeriod] = useState('day')
  const [refreshTick, setRefreshTick] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onRefresh = () => setRefreshTick((t) => t + 1)
    window.addEventListener('investor-dashboard-refresh', onRefresh)
    return () => window.removeEventListener('investor-dashboard-refresh', onRefresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchInvestorMetrics(period)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Ошибка')
          setData(null)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [period, refreshTick])

  const periods = [
    { id: 'day', label: 'День' },
    { id: 'month', label: 'Месяц' },
    { id: 'year', label: 'Год' },
  ]

  const metrics = data
    ? [
        {
          key: 'revenue',
          title: 'Выручка',
          value: fmtMoney(data.revenue),
          icon: BarChart3,
          hint: 'Суммарно по сети',
        },
        {
          key: 'marginPct',
          title: 'Наценка',
          value: fmtPct(data.marginPct),
          icon: Percent,
          hint: 'Средняя по категориям',
        },
        {
          key: 'grossProfit',
          title: 'Валовая прибыль',
          value: fmtMoney(data.grossProfit),
          icon: TrendingUp,
          hint: 'После закупок',
        },
        {
          key: 'footfall',
          title: 'Проходимость',
          value: fmtInt(data.footfall),
          icon: Users,
          hint: 'Визиты в зал',
        },
      ]
    : []

  const summaryBadge = () => {
    if (loading) return <Badge variant="secondary">Загрузка…</Badge>
    if (error)
      return (
        <Badge variant="destructive" className="font-medium">
          Ошибка загрузки
        </Badge>
      )
    const hasAny =
      data &&
      (data.revenue > 0 || data.marginPct > 0 || data.grossProfit > 0 || data.footfall > 0)
    if (hasAny) {
      return (
        <Badge className="border-emerald-200 bg-emerald-50 font-medium text-emerald-900 hover:bg-emerald-50">
          Данные получены
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="border-amber-200 bg-amber-50 font-medium text-amber-950 hover:bg-amber-50"
      >
        Нет показателей
      </Badge>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">Финансы</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            KPI по выбранному периоду (данные с API)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summaryBadge()}
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50/80 p-1">
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-xl px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors ${
                  period === p.id
                    ? 'bg-white text-black shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border border-gray-200 bg-white shadow-sm">
              <CardHeader className="space-y-2 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        {!loading &&
          metrics.map((c) => {
            const Icon = c.icon
            const st = statusForMetric(c.key, data)
            return (
              <Card
                key={c.title}
                className="overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardDescription className="text-xs font-medium uppercase tracking-wide">
                      {c.title}
                    </CardDescription>
                    <CardTitle className="font-mono text-2xl tabular-nums text-foreground">
                      {error ? '—' : c.value}
                    </CardTitle>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2">
                    <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                  <Badge variant={st.variant} className={st.className}>
                    {st.label}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
      </div>

      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Сводная таблица</CardTitle>
          <CardDescription>Показатель, значение и статус синхронизации</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%]">Показатель</TableHead>
                  <TableHead className="w-[35%]">Значение</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.map((row) => {
                    const st = statusForMetric(row.key, data)
                    return (
                      <TableRow key={row.title}>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell className="font-mono tabular-nums text-muted-foreground">
                          {row.value}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={st.variant} className={st.className}>
                            {st.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            График динамики можно подключить после расширения API.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

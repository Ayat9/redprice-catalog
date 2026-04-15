import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Footprints, Store } from 'lucide-react'
import { fetchFootfallFunnel } from './api/investorApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  street: {
    label: 'Уличный трафик',
    color: '#2563eb',
  },
  store: {
    label: 'В зале',
    color: '#059669',
  },
}

export default function FootfallMarketing() {
  const [period, setPeriod] = useState('month')
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetchFootfallFunnel(period).then(setRows)
  }, [period])

  const barData = useMemo(() => {
    const street = rows[0]?.value ?? 0
    const store = rows[1]?.value ?? 0
    return [{ name: 'Сводка', street, store }]
  }, [rows])

  const conversion =
    rows.length === 2 && rows[0].value > 0
      ? ((rows[1].value / rows[0].value) * 100).toFixed(1)
      : '0'

  const periods = [
    { id: 'day', label: 'День' },
    { id: 'month', label: 'Месяц' },
    { id: 'year', label: 'Год' },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">Трафик и маркетинг</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Улица (синий) и визиты в зал (изумрудный), данные с API
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-slate-50/80 p-1">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors ${
                period === p.id
                  ? 'bg-white text-black shadow-sm ring-1 ring-slate-100'
                  : 'text-slate-500 hover:text-black'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-50 p-2">
                <Footprints className="size-5 text-blue-600" strokeWidth={1.5} aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base tracking-tight text-black">Сравнение потоков</CardTitle>
                <CardDescription className="text-slate-500">
                  Столбчатая диаграмма по текущему периоду
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="aspect-[4/3] max-h-[320px] w-full">
              <BarChart data={barData} accessibilityLayer margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar
                  dataKey="street"
                  fill="var(--color-street)"
                  radius={[6, 6, 0, 0]}
                  name="street"
                  maxBarSize={48}
                />
                <Bar
                  dataKey="store"
                  fill="var(--color-store)"
                  radius={[6, 6, 0, 0]}
                  name="store"
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-[#2563eb]" />
                Уличный трафик
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-[#059669]" />
                В зале
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-50 p-2">
                <Store className="size-5 text-emerald-600" strokeWidth={1.5} aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base tracking-tight text-black">Показатели</CardTitle>
                <CardDescription className="text-slate-500">Численность и конверсия</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {rows.map((row) => (
              <div key={row.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-500">{row.name}</span>
                  <span className="font-mono tabular-nums font-medium text-black">
                    {row.value.toLocaleString('ru-KZ')}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                    style={{
                      width: rows.some((r) => r.value > 0)
                        ? `${Math.min(100, (row.value / Math.max(...rows.map((r) => r.value), 1)) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-gray-200 bg-slate-50/80 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Конверсия визита
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-black">
                {conversion}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { FileBarChart, Inbox, Landmark } from 'lucide-react'
import { fetchQuarterlyReports, fetchDividendTimeline } from './api/investorApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

export default function ReportsDividends() {
  const [reports, setReports] = useState([])
  const [dividends, setDividends] = useState([])

  useEffect(() => {
    Promise.all([fetchQuarterlyReports(), fetchDividendTimeline()]).then(([r, d]) => {
      setReports(r)
      setDividends(d)
    })
  }, [])

  return (
    <div className="space-y-10">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-50 p-2">
          <FileBarChart className="size-5 text-black" strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">Отчёты и дивиденды</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Квартальная сводка и график выплат
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base tracking-tight text-black">Квартальные отчёты</CardTitle>
          <CardDescription className="text-slate-500">Данные подставляются из API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-black">Квартал</TableHead>
                  <TableHead className="text-black">Выручка</TableHead>
                  <TableHead className="text-black">Маржа</TableHead>
                  <TableHead className="text-right text-black">Дивиденды</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-36">
                      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                          <Inbox className="size-6" strokeWidth={1.5} aria-hidden />
                        </div>
                        <p className="text-sm font-medium text-black">Нет данных из API</p>
                        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                          Квартальные показатели появятся после синхронизации с корпоративной системой.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((row) => (
                    <TableRow key={row.quarter} className="border-gray-200">
                      <TableCell className="font-medium text-black">{row.quarter}</TableCell>
                      <TableCell className="font-mono tabular-nums text-slate-600">
                        {row.revenue ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-slate-600">
                        {row.marginPct ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-black">
                        {row.dividend ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-50 p-2">
              <Landmark className="size-5 text-black" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base tracking-tight text-black">Выплаты дивидендов</CardTitle>
              <CardDescription className="text-slate-500">Хронология событий</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {dividends.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-8 sm:flex-row sm:items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <Inbox className="size-6" strokeWidth={1.5} aria-hidden />
              </div>
              <div>
                <p className="text-[15px] font-medium text-black">Нет записей о выплатах</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                  Данные появятся после подключения API и загрузки хронологии дивидендов.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                {dividends.map((d) => (
                  <Badge
                    key={d.id}
                    variant="outline"
                    className="h-9 rounded-xl border-gray-200 px-4 font-normal text-black"
                  >
                    {d.label}
                  </Badge>
                ))}
              </div>
              <Separator className="bg-slate-100" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {dividends.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
                  >
                    <p className="text-xs font-medium text-slate-500">{d.label}</p>
                    <p className="mt-2 font-mono text-xs text-slate-500">{d.date}</p>
                    <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-black">
                      {d.amount}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

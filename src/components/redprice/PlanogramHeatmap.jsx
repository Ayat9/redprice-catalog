import { useEffect, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { fetchPlanogramShelves } from './api/investorApi'
import { profitabilityToFill } from './lib/planogramColors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const GRID_COLS = 4
const GRID_ROWS = 3

export default function PlanogramHeatmap() {
  const [shelves, setShelves] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchPlanogramShelves().then(setShelves)
  }, [])

  const cw = 100 / GRID_COLS
  const ch = 100 / GRID_ROWS

  return (
    <div className="space-y-10">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-50 p-2">
          <LayoutGrid className="size-5 text-black" strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">
            Планограмма торгового зала
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Heatmap profitability (0–100). Наведите на стеллаж — подсказка; клик — детали.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base tracking-tight text-black">Схема зала</CardTitle>
          <CardDescription className="text-slate-500">Интерактивная сетка стеллажей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-slate-50/50 p-5 lg:p-8">
            <svg
              viewBox="0 0 100 100"
              className="h-auto w-full max-h-[min(420px,50vh)]"
              role="img"
              aria-label="Планограмма"
            >
              <rect width="100" height="100" fill="#ffffff" rx="4" />
              {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={(i * 100) / GRID_COLS}
                  y1={0}
                  x2={(i * 100) / GRID_COLS}
                  y2={100}
                  stroke="#e2e8f0"
                  strokeWidth="0.35"
                />
              ))}
              {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={(i * 100) / GRID_ROWS}
                  x2={100}
                  y2={(i * 100) / GRID_ROWS}
                  stroke="#e2e8f0"
                  strokeWidth="0.35"
                />
              ))}

              {shelves.map((s) => {
                const col = Number(s.col) || 0
                const row = Number(s.row) || 0
                const cs = Math.max(1, Number(s.colSpan) || 1)
                const rs = Math.max(1, Number(s.rowSpan) || 1)
                const x = col * cw
                const y = row * ch
                const w = cs * cw
                const h = rs * ch
                const fill = profitabilityToFill(s.profitability)
                return (
                  <Tooltip key={s.id}>
                    <TooltipTrigger asChild>
                      <g
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelected(s)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelected(s)}
                        role="button"
                        tabIndex={0}
                      >
                        <rect
                          x={x + 0.4}
                          y={y + 0.4}
                          width={w - 0.8}
                          height={h - 0.8}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth="0.6"
                          rx="0.8"
                          className="transition-opacity hover:opacity-90"
                        />
                        <text
                          x={x + w / 2}
                          y={y + h / 2 - 1.2}
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize={Math.min(w, h) * 0.12}
                          fontWeight="600"
                          style={{ pointerEvents: 'none' }}
                        >
                          {s.id}
                        </text>
                        <text
                          x={x + w / 2}
                          y={y + h / 2 + 2.5}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize={Math.min(w, h) * 0.08}
                          style={{ pointerEvents: 'none' }}
                        >
                          {String(s.profitability)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs border-gray-200 bg-white">
                      <p className="font-semibold text-black">{s.name || `Стеллаж ${s.id}`}</p>
                      <p className="text-xs text-slate-500">
                        Profitability:{' '}
                        <span className="font-mono text-black">{s.profitability}</span> · клик для
                        подробностей
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </svg>
          </div>

          {shelves.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              Нет данных планограммы. Ожидается ответ API со списком стеллажей.
            </p>
          )}

          <Separator />

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span className="font-medium text-black">Шкала profitability</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-sm" style={{ background: profitabilityToFill(0) }} />0
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-sm" style={{ background: profitabilityToFill(50) }} />
              50
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-sm" style={{ background: profitabilityToFill(100) }} />
              100
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black">Стеллаж {selected?.id}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selected?.name || 'Без названия'} — показатель доходности зоны.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Profitability (0–100)</span>
              <span className="font-mono text-lg font-semibold tabular-nums text-black">
                {selected ? Number(selected.profitability) || 0 : '—'}
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
              title="Уровень на шкале"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, Number(selected?.profitability) || 0))}%`,
                  background: selected ? profitabilityToFill(selected.profitability) : 'transparent',
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => setSelected(null)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

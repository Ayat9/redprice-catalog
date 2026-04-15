import { Building2, LineChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const iconThin = { strokeWidth: 1.5 }

function MetricsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <Skeleton className="h-3 w-24 rounded-xl" />
          <Skeleton className="h-8 w-full max-w-[8rem] rounded-xl" />
          <Skeleton className="h-3 w-16 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function InvestorHero() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Card className="border border-gray-200 bg-white shadow-sm lg:col-span-2">
        <CardHeader className="space-y-1 px-8 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gray-50">
                <LineChart className="size-5 text-black" {...iconThin} aria-hidden />
              </div>
              <div>
                <CardDescription className="text-[13px] text-gray-500">Ключевые показатели</CardDescription>
                <CardTitle className="text-lg tracking-[-0.02em] text-black">Сводка по сети</CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <p className="text-[15px] leading-[1.65] text-gray-600">
            После подключения API здесь появятся оборот, маржа и динамика по торговым точкам. Пока
            интеграции в процессе — ниже показан превью-макет загрузки.
          </p>
          <MetricsSkeleton />
          <div className="flex items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-white px-5 py-5 text-[15px] leading-relaxed text-gray-600">
            <LineChart
              className="mt-0.5 size-5 shrink-0 text-gray-400"
              {...iconThin}
              aria-hidden
            />
            <div>
              <p className="font-medium tracking-tight text-black">Данные появятся автоматически</p>
              <p className="mt-1.5 text-gray-500">
                Пустые значения в отчётах — ожидаемое состояние до синхронизации с корпоративным API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm lg:col-span-2">
        <CardHeader className="px-8 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gray-50">
              <Building2 className="size-5 text-black" {...iconThin} aria-hidden />
            </div>
            <div>
              <CardDescription className="text-[13px] text-gray-500">Профиль</CardDescription>
              <CardTitle className="text-lg tracking-[-0.02em] text-black">О компании</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="text-[15px] leading-[1.65] text-gray-600">
            RedPrice — сеть дискаунтеров с упором на эффективную закупку и прозрачные процессы для
            инвесторов. Показатели по вкладкам синхронизируются с корпоративным API; статус канала
            отображается в шапке дашборда.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

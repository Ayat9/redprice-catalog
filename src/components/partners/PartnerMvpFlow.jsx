import { BarChart3, Database, Monitor, Store } from 'lucide-react'

const steps = [
  { title: 'ESL-ценники', subtitle: 'Цена обновляется на полке', icon: Store },
  { title: 'Сервер и база', subtitle: 'Данные синхронизируются в системе', icon: Database },
  { title: 'LED-экран', subtitle: 'Автоматически формируется промо', icon: Monitor },
  { title: 'Аналитика', subtitle: 'Продажи и ABC по SKU в кабинете', icon: BarChart3 },
]

export default function PartnerMvpFlow() {
  return (
    <section className="mvp-card w-full rounded-[28px] bg-white p-7 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.28)] md:p-[42px]">
      <h2 className="text-center text-5xl font-bold tracking-tight text-[#0F172A]">Как это работает</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
        Простой flow без визуального шума: от ценника на полке до LED-промо и аналитики.
      </p>
      <div className="mvp-steps mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <article key={step.title} className="relative rounded-2xl bg-slate-50 p-6 text-center">
              <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#E30613] shadow-sm">
                <Icon className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">{step.title}</p>
              <p className="mt-1 text-sm text-slate-500">{step.subtitle}</p>
              {idx < steps.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block">
                  →
                </span>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

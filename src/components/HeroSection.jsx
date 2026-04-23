/**
 * Главный экран (/) в стиле современного SaaS: крупный H1, серое описание
 * и блок статистики. Лёгкий фон с градиентом и grid-паттерном.
 */
export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* приглушённый grid-паттерн (~8% opacity) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"
      />
      {/* мягкий цветной градиент */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(228,28,42,0.08),transparent_70%)]"
      />
      {/* акцентный «blob» */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-red-600/10 blur-3xl"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
          Redprice — умная розничная платформа
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
          Управляйте магазином, полками и поставщиками{' '}
          <span className="bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-transparent">
            в одном окне
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Redprice объединяет электронные ценники, видеонаблюдение, аналитику продаж и личные
          кабинеты для инвесторов и поставщиков. Меньше рутины — больше решений на данных.
        </p>

        <dl className="mx-auto mt-12 flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-4 px-4 sm:gap-6 sm:px-6">
          {[
            { k: 'ESL-ценников', v: '10 000+' },
            { k: 'Поставщиков', v: '120+' },
            { k: 'Онлайн-камер', v: '24/7' },
          ].map((i) => (
            <div
              key={i.k}
              className="flex min-w-[220px] flex-1 basis-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/40 p-6 text-center backdrop-blur-sm sm:basis-0"
            >
              <dd className="text-3xl font-semibold tracking-tight text-slate-900">{i.v}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {i.k}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

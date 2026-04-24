import { motion } from 'framer-motion'

export default function PartnerShowcase() {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.45)] sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
      >
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Как это выглядит вживую</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Два реальных промо-сценария: брендированный стеллаж на полке и LED-экран, усиливающий
          продажи этого же товара.
        </p>
      </motion.div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <motion.article
          className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5"
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          whileHover={{ y: -6 }}
        >
          <h3 className="text-lg font-semibold text-slate-900">Брендированный стеллаж поставщика</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
            <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              NEON FOODS | functional drinks
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-12 rounded border border-slate-200 bg-slate-50" />
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {['790 тг', '1 090 тг', '1 490 тг'].map((price) => (
                <div
                  key={price}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs text-slate-600"
                >
                  ESL: {price}
                </div>
              ))}
            </div>
          </div>
        </motion.article>

        <motion.article
          className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white"
          initial={{ opacity: 0, x: 18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          whileHover={{ y: -6 }}
        >
          <h3 className="text-lg font-semibold">LED-продвижение</h3>
          <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Super promo</p>
            <p className="mt-1 text-base font-semibold">NEON PROTEIN BAR, 60г</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-sm text-slate-500 line-through">1 590 тг</p>
              <p className="text-4xl font-bold text-[#E30613]">990 тг</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Ваш товар одновременно стоит на полке и рекламируется на экране
          </p>
        </motion.article>
      </div>
    </section>
  )
}

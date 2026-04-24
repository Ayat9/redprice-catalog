import { motion } from 'framer-motion'
import { flowSteps } from './partnersData'

export default function PartnershipFlowMap() {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.45)] sm:p-8">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
      >
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Как это работает</h2>
        <p className="mt-2 text-slate-600">Сценарий запуска партнёрства от заявки до роста продаж.</p>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
          {flowSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="relative flex min-h-[160px] rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E30613] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div className="mt-4 flex items-start gap-3">
                  <div className="rounded-xl border border-red-100 bg-red-50 p-2 text-[#E30613]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              </motion.article>
            )
          })}
      </div>
    </section>
  )
}

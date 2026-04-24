import { motion } from 'framer-motion'
import { benefits } from './partnersData'

export default function PartnerBenefits() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
      >
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900">Что даёт партнёрство</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
          Формат сотрудничества собран как retail + SaaS модель: выкладка, промо и аналитика в
          одном контуре роста.
        </p>
      </motion.div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {benefits.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{
                y: -8,
                boxShadow: '0 30px 45px -34px rgba(15,23,42,0.45)',
              }}
              className="group rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-3 transition"
            >
              <div className="mb-2 inline-flex rounded-lg border border-red-100 bg-red-50 p-1.5 text-[#E30613] transition group-hover:border-red-200 group-hover:bg-red-100">
                <Icon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold leading-snug text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

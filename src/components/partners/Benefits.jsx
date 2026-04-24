import { benefits } from './partnersData'
import { motion } from 'framer-motion'

export default function Benefits() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Что даёт партнёрство
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((item, idx) => (
          <motion.article
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.38, delay: idx * 0.05 }}
            whileHover={{ y: -8, scale: 1.05, boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)' }}
          >
            <div className="mb-3 h-8 w-8 rounded-lg bg-red-50 text-[#E30613] flex items-center justify-center">
              <span className="text-sm font-bold">+</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-700">{item}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

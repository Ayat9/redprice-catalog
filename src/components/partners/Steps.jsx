import { steps } from './partnersData'
import { motion } from 'framer-motion'

export default function Steps() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Как это работает</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <motion.li
            key={step}
            className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            whileHover={{ y: -6, scale: 1.03, boxShadow: '0 16px 30px rgba(15, 23, 42, 0.1)' }}
          >
            {index < steps.length - 1 && (
              <span className="pointer-events-none absolute right-[-14px] top-1/2 hidden h-[2px] w-[28px] -translate-y-1/2 bg-red-200 xl:block" />
            )}
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-[#E30613]">
              {index + 1}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">{step}</p>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  )
}

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { pricingPlans } from './partnersData'

export default function Pricing() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Форматы партнёрства</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan, idx) => (
          <motion.article
            key={plan.name}
            className={[
              'relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-lg transition',
              'hover:shadow-xl',
              plan.featured ? 'border-[#E30613] ring-1 ring-red-100 lg:-translate-y-2' : 'border-slate-200',
            ].join(' ')}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.42, delay: idx * 0.07 }}
            whileHover={{ y: -10, scale: 1.04, boxShadow: '0 24px 46px rgba(15, 23, 42, 0.18)' }}
          >
            {plan.featured && (
              <motion.span
                className="absolute -top-3 right-4 rounded-full bg-[#E30613] px-3 py-1 text-xs font-semibold text-white"
                initial={{ opacity: 0, y: -8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Рекомендуемый
              </motion.span>
            )}
            <h3 className="text-xl font-bold tracking-tight text-slate-900">{plan.name}</h3>
            <motion.ul
              className="mt-4 space-y-2 text-sm text-slate-700"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              {plan.points.map((point, pointIdx) => (
                <li key={point} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#E30613]"
                    style={{ opacity: 1 - pointIdx * 0.05 }}
                  />
                  <span>{point}</span>
                </li>
              ))}
            </motion.ul>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="btn-primary mt-6 w-full"
              >
                Подключиться
              </Button>
            </motion.div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

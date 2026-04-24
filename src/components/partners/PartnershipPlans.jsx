import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { plans } from './partnersData'

export default function PartnershipPlans({ onJoinOpen, onPlanConditionsOpen }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55 }}
      >
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Форматы партнёрства</h2>
      </motion.div>

      <div className="mx-auto mt-4 grid max-w-6xl items-stretch gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.article
            key={plan.name}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{
              y: -10,
              scale: 1.02,
              boxShadow: '0 36px 55px -36px rgba(15,23,42,0.5)',
            }}
            className={[
              'relative flex h-full min-h-[300px] flex-col rounded-2xl border p-4 transition',
              plan.featured
                ? 'border-[#E30613]/50 bg-gradient-to-b from-red-50/40 to-white shadow-[0_28px_70px_-45px_rgba(227,6,19,0.55)]'
                : 'border-slate-200/80 bg-gradient-to-b from-white to-slate-50',
            ].join(' ')}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E30613] px-3 py-1 text-xs font-medium text-white">
                Рекомендуем
              </div>
            )}
            <h3 className="text-4xl font-semibold text-slate-900">{plan.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.description}</p>
            <motion.ul
              className="mt-3 space-y-1.5 text-sm text-slate-700"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.08 },
                },
              }}
            >
              {plan.benefits.map((benefit) => (
                <motion.li
                  key={benefit}
                  className="flex items-start gap-2.5"
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                >
                  <CheckCircle2 className="mt-0.5 size-4 text-[#E30613]" />
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-auto space-y-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onPlanConditionsOpen(plan)}
                className="h-9 w-full rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Скачать условия
              </Button>
              <Button
                type="button"
                onClick={onJoinOpen}
                className="h-9 w-full rounded-lg bg-[#E30613] text-white hover:bg-[#c10511]"
              >
                Подключиться
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { FileDown, X } from 'lucide-react'
import { plans } from './partnersData'

export default function PartnerConditionsModal({ open, onClose, selectedPlan }) {
  const items = selectedPlan ? [selectedPlan] : plans

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-2xl font-semibold text-slate-900">Скачать условия</h3>
            <p className="mt-1 text-sm text-slate-600">
              Выберите формат партнёрства и откройте условия в PDF.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {items.map((plan) => (
                <article
                  key={plan.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#E30613]/50"
                >
                  <h4 className="text-base font-semibold text-slate-900">{plan.name}</h4>
                  <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  <a
                    href={plan.conditionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:ring-[#E30613]/60"
                  >
                    <FileDown className="size-4" />
                    Скачать условия
                  </a>
                </article>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

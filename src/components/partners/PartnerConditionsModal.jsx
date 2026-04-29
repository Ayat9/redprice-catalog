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
            className="relative w-[calc(100%-32px)] max-w-[760px] rounded-[24px] border border-slate-200 bg-white px-[18px] py-[22px] shadow-2xl sm:px-8 sm:py-7"
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
            <h3 className="mb-2 text-2xl font-semibold text-slate-900">Скачать условия</h3>
            <p className="mb-5 text-sm leading-[1.5] text-slate-600">
              Выберите формат партнёрства и откройте условия в PDF.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              {items.map((plan) => (
                <article
                  key={plan.name}
                  className="flex min-h-[170px] flex-col justify-between rounded-[18px] border border-slate-200 bg-slate-50/80 p-[22px] transition hover:border-[#E30613]/50"
                >
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{plan.name}</h4>
                    <p className="mt-2 text-sm leading-[1.45] text-slate-600">{plan.description}</p>
                  </div>
                  <a
                    href={plan.conditionLink}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="mt-[18px] inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:ring-[#E30613]/60"
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

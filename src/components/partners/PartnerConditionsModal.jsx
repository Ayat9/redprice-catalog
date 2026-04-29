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
            className="container-modal relative bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
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
            <div className="modal-content">
              <h3 className="mb-2 text-2xl font-semibold text-slate-900">Скачать условия</h3>
              <p className="mb-5 text-sm leading-[1.5] text-slate-600">
                Выберите формат партнёрства и откройте условия в PDF.
              </p>

              <div className="cards grid gap-5 md:grid-cols-2">
                {items.map((plan) => (
                  <article
                    key={plan.name}
                    className="card flex min-h-[170px] flex-col justify-between bg-white shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)] hover:ring-[#E30613]/25"
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
                      className="btn-secondary download-btn w-full"
                    >
                      <FileDown className="size-4" />
                      Скачать условия
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { plans } from './partnersData'

export default function PartnerJoinModal({ open, onClose }) {
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
            className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
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
            <h3 className="text-2xl font-semibold text-slate-900">Подключиться</h3>
            <p className="mt-1 text-sm text-slate-600">
              Оставьте заявку, и команда Redprice свяжется с вами в ближайшее время.
            </p>
            <form className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Имя / компания"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#E30613]/60 focus:ring-4 focus:ring-[#E30613]/10 sm:col-span-2"
              />
              <input
                type="tel"
                placeholder="Телефон"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#E30613]/60 focus:ring-4 focus:ring-[#E30613]/10"
              />
              <input
                type="email"
                placeholder="Email"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#E30613]/60 focus:ring-4 focus:ring-[#E30613]/10"
              />
              <select className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#E30613]/60 focus:ring-4 focus:ring-[#E30613]/10 sm:col-span-2">
                <option value="">Тип партнёрства</option>
                {plans.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                placeholder="Комментарий"
                className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#E30613]/60 focus:ring-4 focus:ring-[#E30613]/10 sm:col-span-2"
              />
              <button
                type="button"
                className="h-11 rounded-xl bg-[#E30613] px-6 font-medium text-white transition hover:bg-[#c10511] sm:col-span-2"
              >
                Отправить заявку
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

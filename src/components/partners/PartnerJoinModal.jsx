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
              <h3 className="mb-2 text-2xl font-semibold text-slate-900">Подключиться</h3>
              <p className="mb-5 text-sm leading-[1.5] text-slate-600">
                Оставьте заявку, и команда Redprice свяжется с вами в ближайшее время.
              </p>
              <form className="form">
                <input
                  type="text"
                  placeholder="Имя / компания"
                  className="border-0 bg-slate-50 text-sm leading-[1.4] outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
                />
                <input
                  type="tel"
                  placeholder="Телефон"
                  className="border-0 bg-slate-50 text-sm leading-[1.4] outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border-0 bg-slate-50 text-sm leading-[1.4] outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
                />
                <select className="border-0 bg-slate-50 text-sm leading-[1.4] text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-4 focus:ring-[#E30613]/10">
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
                  className="border-0 bg-slate-50 text-sm leading-[1.4] outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
                />
                <button
                  type="button"
                  className="btn-primary submit-btn"
                >
                  Отправить заявку
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

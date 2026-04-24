import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PartnerLoginCard() {
  return (
    <motion.div
      className="px-4 lg:sticky lg:top-24 lg:px-0"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <aside className="w-full max-w-[460px] rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.12)] xl:ml-auto xl:w-[420px]">
        <div className="flex items-center gap-2 text-[#E30613]">
          <ShieldCheck className="size-4" />
          <span className="text-xs font-medium uppercase tracking-[0.12em]">Partner Access</span>
        </div>
        <h3 className="mt-3 text-4xl font-semibold leading-none text-slate-900">Вход для партнёров</h3>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Доступ к кабинету аналитики и отчётности по продажам.
        </p>
        <form className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="h-[52px] w-full rounded-[14px] border border-transparent bg-[#F3F6FB] px-4 text-sm text-slate-700 outline-none transition focus:border-[#E30613]/30 focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
          />
          <input
            type="password"
            placeholder="Пароль"
            className="h-[52px] w-full rounded-[14px] border border-transparent bg-[#F3F6FB] px-4 text-sm text-slate-700 outline-none transition focus:border-[#E30613]/30 focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
          />
          <Button
            type="button"
            className="h-[54px] w-full rounded-[14px] bg-[#E30613] text-base font-semibold text-white shadow-[0_16px_34px_-18px_rgba(227,6,19,0.85)] hover:bg-[#c10511]"
          >
            Войти
          </Button>
        </form>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#E30613]"
        >
          Нет доступа? Оставить запрос
          <ArrowRight className="size-3.5" />
        </button>
      </aside>
    </motion.div>
  )
}

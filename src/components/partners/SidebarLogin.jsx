import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function SidebarLogin() {
  return (
    <motion.aside
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg xl:fixed xl:right-6 xl:top-24 xl:z-30 xl:w-[320px]"
      initial={{ opacity: 0, x: 36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <h3 className="text-lg font-semibold text-slate-900">Вход для партнёров</h3>
      <form className="mt-4 space-y-3">
        <input
          type="email"
          placeholder="email"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />
        <input
          type="password"
          placeholder="пароль"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />
        <Button type="button" className="btn-primary w-full">
          Войти
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="btn-primary mt-3 w-full"
        onClick={() => {
          document.getElementById('partners-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        Стать партнёром
      </Button>
    </motion.aside>
  )
}

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function Login() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Вход в личный кабинет
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Получайте аналитику, отслеживайте продажи и управляйте размещением вашей продукции в
            сети Redprice.
          </p>
        </div>

        <motion.form
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
          whileHover={{ y: -4, boxShadow: '0 16px 34px rgba(15, 23, 42, 0.1)' }}
        >
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Почта"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
            <input
              type="password"
              placeholder="Пароль"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button type="button" className="mt-4 w-full bg-[#E30613] hover:bg-[#c60510]">
              Войти
            </Button>
          </motion.div>
          <p className="mt-3 text-center text-sm text-slate-600">
            Нет аккаунта?{' '}
            <a href="#partners-hero" className="font-medium text-[#E30613] hover:underline">
              Зарегистрироваться
            </a>
          </p>
        </motion.form>
      </div>
    </motion.section>
  )
}

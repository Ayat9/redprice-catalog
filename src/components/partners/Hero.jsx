import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { heroStats } from './partnersData'

export default function Hero() {
  return (
    <section
      id="partners-hero"
      className="grid gap-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-8 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Станьте партнёром Redprice и займите своё место в сети из 50 магазинов
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Мы даём продажи, аналитику и маркетинг. Вы — товар и масштаб.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button className="bg-[#E30613] px-6 hover:bg-[#c60510]">Стать партнёром</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="border-[#E30613] bg-white px-6 text-[#E30613] hover:bg-red-50"
            >
            Скачать условия
            </Button>
          </motion.div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <motion.div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.02, boxShadow: '0 14px 34px rgba(15, 23, 42, 0.12)' }}
            >
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="grid gap-4"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <motion.div
          className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5"
          whileHover={{ y: -4, scale: 1.01, boxShadow: '0 20px 38px rgba(15, 23, 42, 0.12)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Витрина поставщика
          </p>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Бренд: Балбубек</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-12 rounded-md border border-slate-200 bg-[linear-gradient(145deg,#fff,#f8fafc)]"
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white"
          whileHover={{ y: -4, scale: 1.01, boxShadow: '0 22px 40px rgba(2, 6, 23, 0.28)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            LED Экран
          </p>
          <div className="mt-3 rounded-xl bg-white p-4 text-slate-900">
            <p className="text-sm font-medium">Сок «Балбубек», 1л</p>
            <p className="mt-1 text-xs text-slate-500 line-through">1 290 тг</p>
            <p className="text-2xl font-bold text-[#E30613]">890 тг</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

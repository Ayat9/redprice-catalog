import { motion } from 'framer-motion'

export default function VisualBlock() {
  return (
    <motion.section
      className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 lg:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <motion.div
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        whileHover={{ y: -6, scale: 1.02, boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Стеллаж бренда</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-lg font-semibold text-slate-900">Балбубек</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded border border-slate-200 bg-white" />
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-slate-200 bg-slate-900 p-5"
        whileHover={{ y: -6, scale: 1.02, boxShadow: '0 22px 40px rgba(2, 6, 23, 0.3)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">LED экран с акцией</p>
        <div className="mt-4 rounded-xl bg-white p-5">
          <p className="text-sm font-medium text-slate-800">Печенье Балбубек, 450г</p>
          <p className="mt-1 text-xs text-slate-500 line-through">2 190 тг</p>
          <p className="text-3xl font-bold text-[#E30613]">1 590 тг</p>
        </div>
        <p className="mt-4 text-sm text-slate-200">
          Ваш бренд продаётся и рекламируется одновременно
        </p>
      </motion.div>
    </motion.section>
  )
}

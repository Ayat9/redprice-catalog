import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Займите свою категорию в Redprice до того, как её займут другие
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
        Подключайтесь сейчас и получите приоритет на полке, маркетинговую поддержку и прозрачную
        аналитику продаж.
      </p>
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
        <Button className="mt-6 h-11 bg-[#E30613] px-7 text-base hover:bg-[#c60510]">
          Оставить заявку
        </Button>
      </motion.div>
    </motion.section>
  )
}

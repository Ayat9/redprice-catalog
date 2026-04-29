import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function PartnerCTA({ onJoinOpen }) {
  return (
    <motion.section
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-8 text-center text-white sm:px-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight">
        Займите свою категорию в Redprice до того, как её займут другие
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
        Ранние партнёры получают лучшие условия, приоритетное размещение и доступ к росту сети.
      </p>
      <Button
        type="button"
        onClick={onJoinOpen}
        className="btn-primary mt-4"
      >
        Подключиться
      </Button>
    </motion.section>
  )
}

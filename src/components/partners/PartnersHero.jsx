import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function PartnersHero({ onJoinOpen, onConditionsOpen }) {
  return (
    <motion.div
      className="hero-card mx-auto w-full rounded-[40px] border border-slate-200 bg-white/90 px-6 py-16 text-center shadow-sm lg:px-16 lg:py-20"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[980px] flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#E30613] shadow-sm backdrop-blur">
          <Sparkles className="size-3.5" />
          AI RETAIL ENGINE
        </div>
        <h1 className="hero-title mx-auto mb-6 mt-7 max-w-5xl text-center text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl [text-align:center]">
          Станьте партнёром Redprice в AI-магазине нового формата
        </h1>
        <p className="hero-subtitle mx-auto mb-12 w-full max-w-[760px] text-center text-pretty text-lg leading-[1.7] text-[#4B5563] [text-align:center] md:text-xl">
          Мы объединяем продажи, ESL-ценники, LED-промо и AI-аналитику в единую retail-сеть.
          Вы даёте товар — Redprice даёт продажи, прозрачность и развитие.
        </p>
        <div className="hero-actions flex w-full flex-col items-center justify-center gap-4 md:flex-row md:flex-wrap">
          <Button
            type="button"
            onClick={onJoinOpen}
            className="btn-primary w-full max-w-md md:w-auto"
          >
            Подключиться
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConditionsOpen}
            className="btn-secondary w-full max-w-md md:w-auto"
          >
            Скачать условия
          </Button>
          <Link
            to="/partner-login"
            className="btn-ghost w-full max-w-md md:w-auto"
          >
            Войти партнёром
          </Link>
        </div>

      </div>
    </motion.div>
  )
}

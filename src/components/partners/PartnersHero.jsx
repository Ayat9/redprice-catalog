import { motion } from 'framer-motion'
import { ChevronDown, LogIn, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function PartnersHero({ onJoinOpen, onConditionsOpen }) {
  return (
    <motion.div
      className="hero-card mx-auto flex min-h-[460px] w-full items-center justify-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm md:px-12 md:py-20"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <div className="w-full max-w-[820px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-[#E30613]">
          <Sparkles className="size-3.5" />
          Партнёрская программа Redprice
        </div>
        <h1 className="hero-title mb-4 mt-6 text-center text-[40px] font-bold leading-[1.08] tracking-[-0.02em] text-[#0F172A] md:text-[clamp(56px,5vw,76px)]">
          Станьте партнёром Redprice и займите своё место в сети
        </h1>
        <p className="hero-subtitle mx-auto mb-8 max-w-[760px] text-center text-pretty text-lg leading-[1.6] text-[#4B5563]">
          Мы даём продажи, аналитику, продвижение и понятную модель роста. Вы даёте товар и
          усиливаете своё присутствие в сети.
        </p>
        <div className="hero-actions flex w-full flex-col items-center justify-center gap-3 md:flex-row md:flex-wrap md:gap-4">
          <Button
            type="button"
            onClick={onJoinOpen}
            className="inline-flex h-12 w-full max-w-md items-center justify-center rounded-lg bg-[#FF0000] px-6 text-base font-semibold text-white transition-all duration-200 hover:brightness-90 md:w-auto"
          >
            Подключиться
          </Button>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={onConditionsOpen}
              className="inline-flex h-12 w-full min-w-[220px] items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-6 text-base font-semibold text-[#0F172A] transition-all duration-200 hover:bg-gray-50 md:w-auto md:min-w-0"
            >
              Скачать условия
              <ChevronDown className="size-4 shrink-0" />
            </Button>
          </div>
          <Link
            to="/partner-login"
            className="inline-flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-lg px-3 text-base font-semibold text-[#0F172A] transition-all duration-200 hover:bg-gray-50 md:w-auto"
          >
            Войти партнёром
            <LogIn className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

import Header from '@/components/Header'
import { useState } from 'react'
import { useSeo } from '@/hooks/useSeo'
import PartnersHero from '@/components/partners/PartnersHero'
import PartnerJoinModal from '@/components/partners/PartnerJoinModal'
import PartnerConditionsModal from '@/components/partners/PartnerConditionsModal'
import { heroStats } from '@/components/partners/partnersData'
import { BarChart3, Building2, ChartColumnIncreasing } from 'lucide-react'
import PartnerMvpFlow from '@/components/partners/PartnerMvpFlow'
import Footer from '@/components/Footer'

export default function PartnersPage() {
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isConditionsOpen, setIsConditionsOpen] = useState(false)
  const [selectedConditionsPlan, setSelectedConditionsPlan] = useState(null)

  const openJoinModal = () => setIsJoinOpen(true)
  const openConditionsModal = () => {
    setSelectedConditionsPlan(null)
    setIsConditionsOpen(true)
  }
  const openConditionsForPlan = (plan) => {
    setSelectedConditionsPlan(plan)
    setIsConditionsOpen(true)
  }

  useSeo({
    title: 'Партнёры Redprice — сеть магазинов',
    description:
      'Страница для партнёров Redprice: форматы сотрудничества, аналитика, маркетинг и рост вместе с сетью.',
  })

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A] antialiased">
      <Header showCart={false} />

      <main className="partners-page overflow-x-hidden bg-[#F8FAFC] pb-24 pt-10 leading-relaxed md:pt-12">
        <section className="hero-section">
          <div className="page-container mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8">
            <PartnersHero onJoinOpen={openJoinModal} onConditionsOpen={openConditionsModal} />
          </div>
        </section>

        <section className="metrics-section mt-[120px]">
          <div className="page-container mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8">
            <div className="metrics-grid grid w-full grid-cols-1 gap-6 md:grid-cols-3">
              {heroStats.map((stat, idx) => {
                const Icon = [Building2, ChartColumnIncreasing, BarChart3][idx]
                return (
                <article
                  key={stat.label}
                  className="metric-card flex min-h-[130px] w-full flex-col rounded-2xl bg-white p-8 shadow-sm"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#E30613]">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 text-4xl font-bold leading-none tracking-[-0.02em] text-[#0F172A]">{stat.value}</p>
                  <p className="mt-2 text-base leading-[1.6] text-[#4B5563]">{stat.label}</p>
                </article>
              )})}
            </div>
          </div>
        </section>

        <section className="benefits-section mt-[120px]">
          <div className="page-container mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8">
            <div className="benefits-card w-full rounded-[28px] bg-white p-7 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.28)] md:p-[42px]">
              <h2 className="text-center text-5xl font-bold tracking-tight text-[#0F172A]">Что получает партнёр</h2>
              <div className="benefits-grid mt-8 grid grid-cols-1 gap-[14px] md:grid-cols-3 md:gap-6">
                {[
                  'Брендированный стеллаж',
                  'LED-продвижение товара',
                  'Аналитика продаж и ABC по SKU',
                ].map((item) => (
                  <article
                    key={item}
                    className="rounded-2xl bg-[#F9FAFB] px-6 py-6 text-lg font-medium leading-[1.6] text-[#0F172A]"
                  >
                    {item}
                  </article>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-red-50 px-6 py-4 text-center text-base font-semibold text-slate-700">
                Старт: от 1 магазина → масштабирование до 50
              </div>
            </div>
          </div>
        </section>

        <section className="mvp-section mt-[120px]">
          <div className="page-container mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8">
            <PartnerMvpFlow />
          </div>
        </section>
      </main>
      <PartnerJoinModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <PartnerConditionsModal
        open={isConditionsOpen}
        selectedPlan={selectedConditionsPlan}
        onClose={() => {
          setIsConditionsOpen(false)
          setSelectedConditionsPlan(null)
        }}
      />
      <Footer />
    </div>
  )
}

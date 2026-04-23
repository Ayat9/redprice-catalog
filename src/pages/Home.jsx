import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import { useSeo } from '../hooks/useSeo'

export default function Home() {
  useSeo({
    title: 'Redprice.kz — умная розничная платформа',
    description:
      'Redprice объединяет электронные ценники, видеонаблюдение и аналитику продаж в одном личном кабинете.',
  })

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
      <Header showCart={false} />
      <main className="flex-1">
        <HeroSection />
      </main>
    </div>
  )
}

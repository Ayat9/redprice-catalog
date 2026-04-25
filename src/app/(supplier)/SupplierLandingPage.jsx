import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'

/**
 * Промежуточная landing-страница партнёров:
 * информационный блок + быстрый доступ в кабинет поставщика.
 */
export default function SupplierLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
      <Header showCart={false} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 px-6 py-10 sm:px-10 lg:px-16">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm sm:p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#E41C2A]">
              Партнерская программа
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Раздел для поставщиков и партнеров
            </h1>
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
              <p className="text-base leading-relaxed text-slate-600">
                Здесь будут новости и условия партнерской программы
              </p>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E41C2A]">
              Partner Access
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Вход в кабинет</h2>
            <p className="mt-2 text-sm text-slate-500">
              Для работы с заказами и аналитикой авторизуйтесь в партнерской админке.
            </p>

            <Button asChild className="mt-5 w-full bg-[#E41C2A] hover:bg-[#c91822]">
              <Link to="/supplier/login">Войти в кабинет</Link>
            </Button>
          </aside>
        </div>
      </main>
    </div>
  )
}

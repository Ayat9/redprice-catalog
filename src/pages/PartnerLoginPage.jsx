import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import { loginSupplier } from '@/components/supplier/api/supplierApi'
import { useSession } from '@/context/SessionContext'

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const { setSupplierSession } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  useSeo({
    title: 'Вход для партнёров Redprice',
    description: 'Страница входа партнёров Redprice: доступ к кабинету аналитики и отчётности.',
  })

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const out = await loginSupplier(email, password)
    setLoading(false)
    if (!out.ok) {
      setError(out.error || 'Ошибка входа')
      return
    }
    setSupplierSession(out.session)
    if (remember) {
      localStorage.setItem('redprice_partner_last_email', email)
    } else {
      localStorage.removeItem('redprice_partner_last_email')
    }
    const from = location.state?.from
    navigate(from && typeof from === 'string' ? from : '/supplier', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-bold text-[#E30613]" to="/">
            Redprice.kz
          </Link>
          <Link to="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            На главную
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-[440px] rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white p-10 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="inline-flex items-center gap-2 text-[#E30613]">
            <ShieldCheck className="size-4" />
            <span className="text-xs font-bold uppercase tracking-[0.13em]">Partner Access</span>
          </div>

          <h1 className="mt-3 text-4xl font-semibold leading-none text-slate-900">Вход для партнёров</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Доступ к кабинету аналитики и отчётности по продажам.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="Email"
              className="h-[52px] w-full box-border rounded-[14px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-slate-700 outline-none transition focus:border-[#E30613]/40 focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Пароль"
              className="h-[52px] w-full box-border rounded-[14px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-slate-700 outline-none transition focus:border-[#E30613]/40 focus:bg-white focus:ring-4 focus:ring-[#E30613]/10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Запомнить меня</span>
              </label>
              <button type="button" className="font-medium text-slate-500 transition hover:text-[#E30613]">
                Забыли пароль?
              </button>
            </div>
            {error && <p className="text-sm text-[#E30613]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[54px] w-full items-center justify-center gap-1 rounded-[14px] bg-[#E30613] text-base font-bold text-white shadow-[0_10px_24px_rgba(227,6,19,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c10511]"
            >
              {loading ? 'Проверка...' : 'Войти'}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <button
            type="button"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#E30613]"
          >
            Нет доступа? Оставить запрос
            <ArrowRight className="size-3.5" />
          </button>
        </section>
      </main>
    </div>
  )
}

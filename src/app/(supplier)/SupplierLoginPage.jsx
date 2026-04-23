import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { loginSupplier } from '../../components/supplier/api/supplierApi'
import { useSession } from '@/context/SessionContext'

/**
 * Страница входа поставщика. После успешной авторизации редиректит на /supplier.
 */
export default function SupplierLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { setSupplierSession } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    const out = await loginSupplier(email, password)
    setLoading(false)
    if (!out.ok) {
      setErr(out.error || 'Ошибка входа')
      return
    }
    setSupplierSession(out.session)
    const from = location.state?.from
    navigate(from && typeof from === 'string' ? from : '/supplier', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-[#eef2f7] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-xl">
        <div className="mb-5 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E41C2A]">
            Supplier Access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Кабинет поставщика</h1>
          <p className="text-sm text-slate-500">Вход по учётной записи, выданной администратором</p>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button
            type="submit"
            className="w-full bg-[#E41C2A] hover:bg-[#c91822]"
            disabled={loading}
          >
            {loading ? 'Проверка…' : 'Войти'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Нет доступа?{' '}
          <Link to="/" className="text-[#E41C2A] underline">
            Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  )
}

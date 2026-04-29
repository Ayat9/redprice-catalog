import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'
import LoginCard from '@/components/auth/LoginCard'
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
    <LoginCard
      badge="PARTNER ACCESS"
      title="Вход для партнёров"
      subtitle="Доступ к кабинету аналитики и отчётности по продажам."
      footer={
        <div className="login-card-links">
          <Link to="/" className="login-card-link">← На главную</Link>
        </div>
      }
    >
      <form className="login-form" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Пароль"
          className="login-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="login-meta-row">
          <label className="login-checkbox-label">
            <input
              type="checkbox"
              className="login-checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Запомнить меня</span>
          </label>
          <button type="button" className="login-card-link-button">
            Забыли пароль?
          </button>
        </div>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={loading} className="login-submit">
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </LoginCard>
  )
}

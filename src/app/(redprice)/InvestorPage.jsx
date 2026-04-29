import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InvestorDashboardLayout } from './layout'
import VideoSurveillance from '../../components/redprice/VideoSurveillance'
import FinancialCards from '../../components/redprice/FinancialCards'
import FootfallMarketing from '../../components/redprice/FootfallMarketing'
import PlanogramHeatmap from '../../components/redprice/PlanogramHeatmap'
import ReportsDividends from '../../components/redprice/ReportsDividends'
import InvestorHero from '../../components/redprice/InvestorHero'
import LoginCard from '../../components/auth/LoginCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  changeInvestorPassword,
  clearInvestorSession,
  fetchInvestorAccessContext,
  loginInvestor,
  readInvestorSession,
} from '../../components/redprice/api/investorApi'

export default function InvestorPage() {
  const [session, setSession] = useState(() => readInvestorSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [access, setAccess] = useState(null)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [supportText, setSupportText] = useState('')
  const [supportReply, setSupportReply] = useState('')
  const [supportLoading, setSupportLoading] = useState(false)

  useEffect(() => {
    if (!session?.investorId) return
    fetchInvestorAccessContext(session.investorId).then((out) => {
      if (!out?.ok) return
      setAccess(out)
      const first = out.stores[0]?.id || ''
      setSelectedStoreId((prev) => prev || first)
    })
  }, [session])

  const visibleSectionIds = useMemo(() => {
    const base = ['overview']
    if (!selectedStoreId || !access) return base
    const byRole = Array.isArray(access?.role?.permissions?.sections)
      ? access.role.permissions.sections
      : null
    const modules = access.modulesByStore?.[selectedStoreId] || []
    const byStore = modules.filter((m) => m.visible).map((m) => m.id)
    const allowed = byRole ? byStore.filter((id) => byRole.includes(id)) : byStore
    return [
      'overview',
      ...allowed,
    ]
  }, [access, selectedStoreId])

  useEffect(() => {
    if (!visibleSectionIds.includes(activeSection)) {
      setActiveSection(visibleSectionIds[0] || 'overview')
    }
  }, [activeSection, visibleSectionIds])

  const selectedStore = useMemo(
    () => access?.stores?.find((s) => s.id === selectedStoreId) ?? null,
    [access, selectedStoreId]
  )

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case 'overview':
        return <InvestorHero />
      case 'video':
        return <VideoSurveillance storeVideoUrl={selectedStore?.videoUrl} />
      case 'finance':
        return <FinancialCards />
      case 'traffic':
        return <FootfallMarketing />
      case 'planogram':
        return <PlanogramHeatmap />
      case 'reports':
        return <ReportsDividends />
      default:
        return <InvestorHero />
    }
  }, [activeSection, selectedStore?.videoUrl])

  async function onLogin(e) {
    e.preventDefault()
    setLoginError('')
    const out = await loginInvestor(email, password)
    if (!out.ok) {
      setLoginError(out.error || 'Ошибка входа')
      return
    }
    setSession(out.session)
  }

  function onLogout() {
    clearInvestorSession()
    setSession(null)
    setAccess(null)
    setSelectedStoreId('')
    setActiveSection('overview')
    setPassword('')
  }

  async function onChangePassword(e) {
    e.preventDefault()
    setPasswordMessage('')
    const out = await changeInvestorPassword({
      oldPassword,
      newPassword,
      session,
    })
    if (!out.ok) {
      setPasswordMessage(out.error || 'Не удалось сменить пароль')
      return
    }
    setPasswordMessage('Пароль успешно обновлён')
    setOldPassword('')
    setNewPassword('')
  }

  async function onAskSupport(e) {
    e.preventDefault()
    setSupportReply('')
    setSupportLoading(true)
    try {
      const res = await fetch('/api/investor-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: supportText,
          email: access?.investor?.email || session?.email || '',
          name: access?.investor?.name || session?.name || '',
          role: access?.role?.name || 'Investor',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setSupportReply(data?.error || 'Не удалось отправить обращение')
      } else {
        setSupportReply(data.reply || 'Ответ от поддержки отсутствует')
      }
    } catch (_) {
      setSupportReply('Ошибка сети. Повторите позже.')
    } finally {
      setSupportLoading(false)
    }
  }

  if (!session) {
    return (
      <LoginCard
        badge="INVESTOR ACCESS"
        title="REDPRICE GROUP"
        subtitle="Вход для инвестора"
        footer={
          <div className="login-card-links">
            <button type="button" className="login-card-link-button">
              Забыли пароль?
            </button>
            <Link to="/" className="login-card-link">← На главную</Link>
          </div>
        }
      >
        <form className="login-form" onSubmit={onLogin}>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            className="login-input"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {loginError && <p className="login-error">{loginError}</p>}
          <button type="submit" className="login-submit">
            Войти
          </button>
        </form>
      </LoginCard>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <InvestorDashboardLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        availableSectionIds={visibleSectionIds}
        investorName={access?.investor?.name || session.name || 'ИП'}
        investorEmail={access?.investor?.email || session?.email || ''}
        investorRoleLabel={access?.role?.name || (session?.isAdmin ? 'Admin' : 'Investor')}
        onLogout={onLogout}
        onOpenPasswordReset={() => {
          setPasswordMessage('')
          setPasswordModalOpen(true)
        }}
        onOpenSupport={() => {
          setSupportReply('')
          setSupportModalOpen(true)
        }}
      >
        {access?.stores?.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <span className="text-slate-500">Магазин:</span>
            <select
              className="rounded-md border border-slate-200 px-2 py-1"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
            >
              {access.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedStore && <span className="text-slate-400">{selectedStore.address || selectedStore.id}</span>}
          </div>
        )}
        {sectionContent}
      </InvestorDashboardLayout>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogDescription>Обновите пароль для текущей учётной записи инвестора.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={onChangePassword}>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
              placeholder="Текущий пароль"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
              placeholder="Новый пароль (минимум 6 символов)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            {passwordMessage && <p className="text-sm text-slate-600">{passwordMessage}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#E41C2A] px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-[#c91822]"
            >
              Сохранить пароль
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={supportModalOpen} onOpenChange={setSupportModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Техподдержка</DialogTitle>
            <DialogDescription>Напишите вопрос — ИИ автоответчик вернёт быстрый ответ.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={onAskSupport}>
            <textarea
              className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
              placeholder="Опишите проблему: доступ, API, отчёты, видео, ошибки входа..."
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={supportLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {supportLoading ? 'Отправка...' : 'Отправить в поддержку'}
            </button>
            {supportReply && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap">
                {supportReply}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

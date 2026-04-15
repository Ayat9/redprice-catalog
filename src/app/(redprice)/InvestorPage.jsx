import { useEffect, useMemo, useState } from 'react'
import { InvestorDashboardLayout } from './layout'
import VideoSurveillance from '../../components/redprice/VideoSurveillance'
import FinancialCards from '../../components/redprice/FinancialCards'
import FootfallMarketing from '../../components/redprice/FootfallMarketing'
import PlanogramHeatmap from '../../components/redprice/PlanogramHeatmap'
import ReportsDividends from '../../components/redprice/ReportsDividends'
import InvestorHero from '../../components/redprice/InvestorHero'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  clearInvestorSession,
  fetchInvestorAccessContext,
  loginInvestor,
  readInvestorSession,
} from '../../components/redprice/api/investorApi'

const CONTENT = {
  overview: <InvestorHero />,
  video: <VideoSurveillance />,
  finance: <FinancialCards />,
  traffic: <FootfallMarketing />,
  planogram: <PlanogramHeatmap />,
  reports: <ReportsDividends />,
}

export default function InvestorPage() {
  const [session, setSession] = useState(() => readInvestorSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [access, setAccess] = useState(null)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [activeSection, setActiveSection] = useState('overview')

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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-[#eef2f7] p-6 md:p-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-xl backdrop-blur">
          <div className="mb-5 space-y-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E41C2A]">Investor Access</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">REDPRICE GROUP</h1>
            <p className="text-sm text-slate-500">Вход для инвестора</p>
          </div>
          <form className="mt-6 space-y-3" onSubmit={onLogin}>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#E41C2A] px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-[#c91822]"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <InvestorDashboardLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        availableSectionIds={visibleSectionIds}
        investorName={access?.investor?.name || session.name || 'ИП'}
        onLogout={onLogout}
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
        {CONTENT[activeSection]}
      </InvestorDashboardLayout>
    </TooltipProvider>
  )
}

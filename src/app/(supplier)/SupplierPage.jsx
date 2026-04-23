import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupplierDashboardLayout } from '../../components/supplier/SupplierDashboardLayout'
import { SUPPLIER_SECTIONS } from '../../components/supplier/supplierNavConfig'
import { SupplierOverview } from '../../components/supplier/widgets/SupplierOverview'
import { SupplierSales } from '../../components/supplier/widgets/SupplierSales'
import { SupplierLiveMonitoring } from '../../components/supplier/widgets/SupplierLiveMonitoring'
import { SupplierMarketing } from '../../components/supplier/widgets/SupplierMarketing'
import { SupplierLegalCenter } from '../../components/supplier/widgets/SupplierLegalCenter'
import { fetchSupplierContext } from '../../components/supplier/api/supplierApi'
import { useSession } from '@/context/SessionContext'

/**
 * Основная страница кабинета поставщика. Требует сессию SUPPLIER (см. ProtectedRoute).
 */
export default function SupplierPage() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const [ctx, setCtx] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!session?.supplierProfileId) return
    fetchSupplierContext(session).then((out) => {
      if (!out.ok) setErr(out.error || 'Не удалось загрузить профиль')
      else setCtx(out)
    })
  }, [session])

  const visibleSectionIds = useMemo(() => {
    if (!session) return []
    return SUPPLIER_SECTIONS.filter(
      (s) => !s.perm || session.permissions?.[s.perm] !== false
    ).map((s) => s.id)
  }, [session])

  useEffect(() => {
    if (!visibleSectionIds.includes(activeSection)) {
      setActiveSection(visibleSectionIds[0] || 'overview')
    }
  }, [activeSection, visibleSectionIds])

  const onLogout = useCallback(() => {
    logout()
    navigate('/supplier/login', { replace: true })
  }, [logout, navigate])

  if (!session) return null

  let content
  switch (activeSection) {
    case 'sales':
      content = <SupplierSales session={session} />
      break
    case 'video':
      content = <SupplierLiveMonitoring session={session} />
      break
    case 'marketing':
      content = <SupplierMarketing session={session} />
      break
    case 'legal':
      content = <SupplierLegalCenter session={session} />
      break
    default:
      content = <SupplierOverview session={session} onNavigate={setActiveSection} />
  }

  return (
    <SupplierDashboardLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      visibleSectionIds={visibleSectionIds}
      supplierName={ctx?.profile?.displayName || session.name}
      supplierEmail={session.email}
      brandLabel={ctx?.supplier?.name || 'Supplier'}
      onLogout={onLogout}
    >
      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {err}
        </div>
      )}
      {content}
    </SupplierDashboardLayout>
  )
}

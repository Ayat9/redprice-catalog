import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/context/SessionContext'

/**
 * Защищённый роут с фильтром по ролям.
 * @param {{ roles?: string[], redirectTo?: string, children: React.ReactNode }} props
 *
 * Пример:
 *   <ProtectedRoute roles={['SUPPLIER']}><SupplierPage /></ProtectedRoute>
 */
export function ProtectedRoute({ roles, redirectTo = '/supplier/login', children }) {
  const { session } = useSession()
  const location = useLocation()
  if (!session?.role) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }
  if (Array.isArray(roles) && roles.length && !roles.includes(session.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

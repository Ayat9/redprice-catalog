import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearSupplierSession,
  readSupplierSession,
  writeSupplierSession,
} from '../components/supplier/api/supplierApi'

/**
 * Общий контекст активной сессии пользователя.
 *
 * Хранит нормализованный объект:
 *   { role: 'SUPPLIER' | 'INVESTOR' | 'ADMIN' | null, ... }
 *
 * Источники:
 *   - SUPPLIER: supplierApi (sessionStorage)
 *   - Админ/инвестор уже имеют собственные контексты — их сюда дублировать
 *     не нужно, достаточно единой точки чтения «кто залогинен» из главной.
 */
const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readSupplierSession())

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'redprice_supplier_session_v1') {
        setSession(readSupplierSession())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setSupplierSession = useCallback((next) => {
    if (!next) {
      clearSupplierSession()
      setSession(null)
      return
    }
    writeSupplierSession(next)
    setSession(next)
  }, [])

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      setSupplierSession,
      logout: () => setSupplierSession(null),
    }),
    [session, setSupplierSession]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

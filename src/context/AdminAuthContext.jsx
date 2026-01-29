import React, { createContext, useContext, useState, useEffect } from 'react'

const SESSION_KEY = 'redprice_admin_auth'
const PASSWORD_STORAGE_KEY = 'redprice_admin_password'
const ADMIN_PASSWORD = 'admin123'
const RESET_KEY = 'redprice-reset-2024'

const AdminAuthContext = createContext(null)

function getStoredPassword() {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY)
  } catch (_) {}
  return null
}

function getEffectivePassword() {
  return getStoredPassword() || ADMIN_PASSWORD
}

export function AdminAuthProvider({ children }) {
  const [isLoggedIn, setLoggedInState] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch (_) {}
    return false
  })

  useEffect(() => {
    try {
      if (isLoggedIn) sessionStorage.setItem(SESSION_KEY, '1')
      else sessionStorage.removeItem(SESSION_KEY)
    } catch (_) {}
  }, [isLoggedIn])

  const login = (password) => {
    if (password === getEffectivePassword()) {
      setLoggedInState(true)
      return true
    }
    return false
  }

  const logout = () => setLoggedInState(false)

  const resetPassword = (resetKey) => {
    if (resetKey !== RESET_KEY) return { success: false }
    try {
      localStorage.removeItem(PASSWORD_STORAGE_KEY)
    } catch (_) {}
    return { success: true, defaultPassword: ADMIN_PASSWORD }
  }

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, login, logout, resetPassword }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}

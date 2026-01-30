import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SESSION_KEY = 'redprice_admin_auth'
const USERS_STORAGE_KEY = 'redprice_admin_users'
const RESET_TOKENS_KEY = 'redprice_admin_reset_tokens'

export const DEPARTMENTS = [
  { id: 'procurement', name: 'Отдел закупа' },
  { id: 'data_entry', name: 'Отдел внесения данных' }
]

export const ROLES = [
  { id: 'admin', name: 'Администратор', description: 'Полный доступ, управление учётными записями' },
  { id: 'editor', name: 'Редактор', description: 'Редактирование товаров, категорий, поставщиков' },
  { id: 'reader', name: 'Читатель', description: 'Только просмотр без редактирования' },
  { id: 'viewer', name: 'Просмотр', description: 'Ограниченный просмотр' }
]

const DEFAULT_USERS = [
  { id: 'admin-1', email: 'admin@redprice.kz', password: 'admin123', name: 'Администратор', departmentId: 'procurement', roleId: 'admin' }
]

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return [...DEFAULT_USERS]
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (_) {}
}

function loadResetTokens() {
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return {}
}

function saveResetTokens(tokens) {
  try {
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens))
  } catch (_) {}
}

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && parsed.roleId) return parsed
      sessionStorage.removeItem(SESSION_KEY)
    } catch (_) {}
    return null
  })

  useEffect(() => {
    saveUsers(users)
  }, [users])

  useEffect(() => {
    try {
      if (currentUser) sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser))
      else sessionStorage.removeItem(SESSION_KEY)
    } catch (_) {}
  }, [currentUser])

  const login = useCallback((email, password) => {
    const emailNorm = (email || '').trim().toLowerCase()
    const user = users.find((u) => (u.email || '').toLowerCase() === emailNorm)
    if (!user || user.password !== password) return false
    setCurrentUser({
      id: user.id,
      email: user.email,
      name: user.name,
      departmentId: user.departmentId,
      roleId: user.roleId
    })
    return true
  }, [users])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const isLoggedIn = !!currentUser
  const canEdit = currentUser && (currentUser.roleId === 'admin' || currentUser.roleId === 'editor')
  const canManageUsers = currentUser && currentUser.roleId === 'admin'

  const requestPasswordReset = useCallback((email) => {
    const emailNorm = (email || '').trim().toLowerCase()
    const user = users.find((u) => (u.email || '').toLowerCase() === emailNorm)
    if (!user) return { success: false, message: 'Пользователь с таким email не найден.' }
    const token = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
    const tokens = loadResetTokens()
    tokens[emailNorm] = { token, expiresAt: Date.now() + 60 * 60 * 1000 }
    saveResetTokens(tokens)
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/admin/set-password` : ''
    const resetLink = `${baseUrl}?email=${encodeURIComponent(emailNorm)}&token=${encodeURIComponent(token)}`
    return { success: true, message: 'На указанный email отправлена ссылка для сброса пароля. Перейдите по ссылке из письма.', resetLink }
  }, [users])

  const setPasswordWithToken = useCallback((email, token, newPassword) => {
    const emailNorm = (email || '').trim().toLowerCase()
    const tokens = loadResetTokens()
    const stored = tokens[emailNorm]
    if (!stored || stored.token !== token || (stored.expiresAt && stored.expiresAt < Date.now())) {
      delete tokens[emailNorm]
      saveResetTokens(tokens)
      return { success: false, message: 'Ссылка недействительна или истекла.' }
    }
    const userIndex = users.findIndex((u) => (u.email || '').toLowerCase() === emailNorm)
    if (userIndex < 0) {
      delete tokens[emailNorm]
      saveResetTokens(tokens)
      return { success: false, message: 'Пользователь не найден.' }
    }
    const next = [...users]
    next[userIndex] = { ...next[userIndex], password: newPassword }
    setUsers(next)
    delete tokens[emailNorm]
    saveResetTokens(tokens)
    return { success: true, message: 'Пароль успешно изменён. Войдите с новым паролем.' }
  }, [users])

  const getUsers = useCallback(() => users, [users])

  const addUser = useCallback((user) => {
    const emailNorm = (user.email || '').trim().toLowerCase()
    if (users.some((u) => (u.email || '').toLowerCase() === emailNorm))
      return { success: false, message: 'Пользователь с таким email уже существует.' }
    const id = `user_${Date.now()}`
    setUsers((prev) => [...prev, { ...user, id, email: user.email.trim(), password: user.password || 'changeme', departmentId: user.departmentId || 'procurement', roleId: user.roleId || 'reader' }])
    return { success: true }
  }, [users])

  const updateUser = useCallback((id, updates) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u
        const { password, ...rest } = updates
        const next = { ...u, ...rest }
        if (password && password.trim()) next.password = password.trim()
        return next
      })
    )
    if (currentUser && currentUser.id === id && (updates.name || updates.departmentId || updates.roleId)) {
      setCurrentUser((c) => ({ ...c, ...updates }))
    }
    return { success: true }
  }, [currentUser])

  const deleteUser = useCallback((id) => {
    if (currentUser && currentUser.id === id) return { success: false, message: 'Нельзя удалить свою учётную запись.' }
    setUsers((prev) => prev.filter((u) => u.id !== id))
    return { success: true }
  }, [currentUser])

  const value = {
    isLoggedIn,
    currentUser,
    login,
    logout,
    canEdit,
    canManageUsers,
    requestPasswordReset,
    setPasswordWithToken,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    DEPARTMENTS,
    ROLES
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}

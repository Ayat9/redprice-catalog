import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import './Admin.css'

export default function AdminSetPassword() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const { setPasswordWithToken } = useAdminAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!email || !token) setResult({ success: false, message: 'Неверная ссылка. Запросите сброс пароля заново и перейдите по ссылке из письма.' })
  }, [email, token])

  const handleSubmit = (e) => {
    e.preventDefault()
    setResult(null)
    if (!password.trim()) {
      setResult({ success: false, message: 'Введите новый пароль.' })
      return
    }
    if (password !== confirm) {
      setResult({ success: false, message: 'Пароли не совпадают.' })
      return
    }
    setSubmitting(true)
    const res = setPasswordWithToken(email, token, password)
    setSubmitting(false)
    setResult(res)
    if (res.success) {
      setPassword('')
      setConfirm('')
    }
  }

  if (!email || !token) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="admin-login-card">
            <h1>Сброс пароля</h1>
            <p className="admin-login-error">{result?.message || 'Неверная ссылка.'}</p>
            <Link to="/admin" className="admin-back admin-login-back">← Вход в админ-панель</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-login">
        <div className="admin-login-card">
          <h1>Новый пароль</h1>
          <p className="admin-reset-hint">Введите новый пароль для {email}</p>
          {result?.success ? (
            <p className="admin-login-success">{result.message}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
                className="admin-input admin-login-input"
                autoComplete="new-password"
                disabled={submitting}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Повторите пароль"
                className="admin-input admin-login-input"
                autoComplete="new-password"
                disabled={submitting}
              />
              {result?.success === false && <p className="admin-login-error">{result.message}</p>}
              <button type="submit" className="btn-save admin-login-btn" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить пароль'}
              </button>
            </form>
          )}
          <Link to="/admin" className="admin-back admin-login-back">← Вход в админ-панель</Link>
        </div>
      </div>
    </div>
  )
}

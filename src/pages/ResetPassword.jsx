import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './ResetPassword.css'

function ResetPassword() {
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!code.trim()) {
      setError('Введите код подтверждения')
      setLoading(false)
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    const result = resetPassword(code.trim(), newPassword)

    if (result.success) {
      alert('Пароль успешно изменен! Теперь вы можете войти с новым паролем.')
      navigate('/login')
    } else {
      setError(result.error || 'Ошибка сброса пароля')
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1>Сброс пароля</h1>
          <p>Введите код подтверждения и новый пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="code">Код подтверждения</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              placeholder="000000"
              maxLength="6"
              disabled={loading}
              className="code-input"
            />
            <small className="form-hint">
              Введите 6-значный код, отправленный на ваш email или телефон
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Новый пароль</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              placeholder="Минимум 6 символов"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Повторите пароль"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? 'Сброс...' : 'Сбросить пароль'}
          </button>
        </form>

        <div className="reset-password-footer">
          <Link to="/forgot-password" className="link">
            Запросить новый код
          </Link>
          <span> | </span>
          <Link to="/login" className="link">
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

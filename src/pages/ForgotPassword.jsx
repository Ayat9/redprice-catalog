import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './ForgotPassword.css'

function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const { sendResetCode } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!emailOrPhone.trim()) {
      setError('Введите email или телефон')
      setLoading(false)
      return
    }

    const result = await sendResetCode(emailOrPhone.trim())

    if (result.success) {
      setSuccess(true)
      setCode(result.code) // Для демо показываем код
    } else {
      setError(result.error || 'Ошибка отправки кода')
    }
    setLoading(false)
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Восстановление пароля</h1>
          <p>Введите email или телефон, указанные в настройках</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="emailOrPhone">Email или телефон</label>
              <input
                id="emailOrPhone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                autoFocus
                placeholder="email@example.com или +77001234567"
                disabled={loading}
              />
              <small className="form-hint">
                Укажите email или телефон, которые вы указали в настройках админ-панели
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Код отправлен!</h2>
            <p>
              Код восстановления отправлен на {emailOrPhone.includes('@') ? 'email' : 'телефон'}
            </p>
            {code && (
              <div className="demo-code">
                <p><strong>Для демо:</strong> Код восстановления:</p>
                <div className="code-display">{code}</div>
                <small>В реальном приложении код будет отправлен на {emailOrPhone.includes('@') ? 'email' : 'SMS'}</small>
              </div>
            )}
            <Link to="/reset-password" className="btn btn-primary">
              Ввести код
            </Link>
          </div>
        )}

        <div className="forgot-password-footer">
          <Link to="/login" className="back-to-login">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Проверяем наличие токена в localStorage
    const token = localStorage.getItem('adminToken')
    return !!token
  })

  const login = (username, password) => {
    // Получаем сохраненные учетные данные или используем дефолтные
    const savedCredentials = localStorage.getItem('adminCredentials')
    let credentials = {
      username: 'admin',
      password: 'admin123'
    }

    if (savedCredentials) {
      try {
        credentials = JSON.parse(savedCredentials)
      } catch (e) {
        console.error('Error parsing credentials:', e)
      }
    }

    // Проверяем логин и пароль
    if (username === credentials.username && password === credentials.password) {
      const token = btoa(`${username}:${Date.now()}`) // Простой токен
      localStorage.setItem('adminToken', token)
      setIsAuthenticated(true)
      return { success: true }
    } else {
      return { success: false, error: 'Неверный логин или пароль' }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
  }

  const updateCredentials = (username, password, email = null, phone = null) => {
    const credentials = { username, password }
    if (email) credentials.email = email
    if (phone) credentials.phone = phone
    localStorage.setItem('adminCredentials', JSON.stringify(credentials))
    return { success: true }
  }

  const generateResetCode = (emailOrPhone) => {
    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 минут

    // Сохраняем код
    localStorage.setItem('resetCode', JSON.stringify({
      code,
      emailOrPhone,
      expiresAt
    }))

    return code
  }

  const verifyResetCode = (code) => {
    const saved = localStorage.getItem('resetCode')
    if (!saved) {
      return { success: false, error: 'Код не найден. Запросите новый код.' }
    }

    try {
      const { code: savedCode, expiresAt } = JSON.parse(saved)
      
      if (Date.now() > expiresAt) {
        localStorage.removeItem('resetCode')
        return { success: false, error: 'Код истек. Запросите новый код.' }
      }

      if (code === savedCode) {
        return { success: true }
      } else {
        return { success: false, error: 'Неверный код' }
      }
    } catch (e) {
      return { success: false, error: 'Ошибка проверки кода' }
    }
  }

  const resetPassword = (code, newPassword) => {
    const verifyResult = verifyResetCode(code)
    if (!verifyResult.success) {
      return verifyResult
    }

    // Получаем текущие учетные данные
    const savedCredentials = localStorage.getItem('adminCredentials')
    let credentials = { username: 'admin' }

    if (savedCredentials) {
      try {
        credentials = JSON.parse(savedCredentials)
      } catch (e) {
        console.error('Error parsing credentials:', e)
      }
    }

    // Обновляем пароль
    updateCredentials(credentials.username, newPassword, credentials.email, credentials.phone)
    
    // Удаляем код
    localStorage.removeItem('resetCode')

    return { success: true }
  }

  const sendResetCode = async (emailOrPhone) => {
    // Получаем сохраненные учетные данные
    const savedCredentials = localStorage.getItem('adminCredentials')
    let credentials = {
      email: null,
      phone: null
    }

    if (savedCredentials) {
      try {
        const creds = JSON.parse(savedCredentials)
        credentials.email = creds.email
        credentials.phone = creds.phone
      } catch (e) {
        console.error('Error parsing credentials:', e)
      }
    }

    // Проверяем, совпадает ли email или телефон
    const isEmail = emailOrPhone.includes('@')
    const isPhone = /^\+?[0-9]{10,15}$/.test(emailOrPhone.replace(/[\s-()]/g, ''))

    if (isEmail && credentials.email && credentials.email.toLowerCase() === emailOrPhone.toLowerCase()) {
      const code = generateResetCode(emailOrPhone)
      // Здесь можно добавить реальную отправку email через API
      // Для демо показываем код в консоли
      console.log('Код восстановления (для демо):', code)
      return { success: true, code, method: 'email' }
    } else if (isPhone && credentials.phone && credentials.phone.replace(/[\s-()]/g, '') === emailOrPhone.replace(/[\s-()]/g, '')) {
      const code = generateResetCode(emailOrPhone)
      // Здесь можно добавить реальную отправку SMS через API
      // Для демо показываем код в консоли
      console.log('Код восстановления (для демо):', code)
      return { success: true, code, method: 'phone' }
    } else {
      return { success: false, error: 'Email или телефон не найден в системе. Убедитесь, что вы указали правильный адрес или номер.' }
    }
  }

  const value = {
    isAuthenticated,
    login,
    logout,
    updateCredentials,
    sendResetCode,
    verifyResetCode,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

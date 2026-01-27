import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import './AdminSettings.css'

function AdminSettings() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const [settings, setSettings] = useState({
    whatsappApiProvider: 'twilio', // twilio, messagebird, green-api, custom
    apiKey: '',
    apiSecret: '',
    apiUrl: '',
    fromNumber: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('whatsappApiSettings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('whatsappApiSettings', JSON.stringify(settings))
    alert('Настройки сохранены!')
  }

  const handleTest = async () => {
    if (!settings.apiKey || !settings.fromNumber) {
      alert('Заполните обязательные поля')
      return
    }

    try {
      const result = await sendWhatsAppMessage(
        settings,
        settings.fromNumber,
        'Тестовое сообщение',
        'Это тестовое сообщение для проверки API'
      )
      
      if (result.success) {
        alert('Тестовое сообщение отправлено успешно!')
      } else {
        alert(`Ошибка: ${result.error}`)
      }
    } catch (error) {
      alert(`Ошибка отправки: ${error.message}`)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="admin-settings">
          <div className="admin-page-header">
            <div>
              <h1>Настройки WhatsApp API</h1>
              <p className="page-subtitle">Настройка интеграции с WhatsApp</p>
            </div>
          </div>

      <div className="settings-form">
        <div className="form-group">
          <label>Провайдер API *</label>
          <select
            value={settings.whatsappApiProvider}
            onChange={(e) => setSettings({ ...settings, whatsappApiProvider: e.target.value })}
          >
            <option value="twilio">Twilio</option>
            <option value="messagebird">MessageBird</option>
            <option value="green-api">Green API</option>
            <option value="custom">Свой API</option>
          </select>
        </div>

        {settings.whatsappApiProvider === 'twilio' && (
          <>
            <div className="form-group">
              <label>Account SID *</label>
              <input
                type="text"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label>Auth Token *</label>
              <input
                type="password"
                value={settings.apiSecret}
                onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                placeholder="Ваш Auth Token"
              />
            </div>
            <div className="form-group">
              <label>Номер отправителя (WhatsApp) *</label>
              <input
                type="text"
                value={settings.fromNumber}
                onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
                placeholder="whatsapp:+14155238886"
              />
            </div>
          </>
        )}

        {settings.whatsappApiProvider === 'messagebird' && (
          <>
            <div className="form-group">
              <label>API Key *</label>
              <input
                type="text"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Ваш MessageBird API Key"
              />
            </div>
            <div className="form-group">
              <label>Номер отправителя *</label>
              <input
                type="text"
                value={settings.fromNumber}
                onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
                placeholder="+77001234567"
              />
            </div>
          </>
        )}

        {settings.whatsappApiProvider === 'green-api' && (
          <>
            <div className="form-group">
              <label>ID Instance *</label>
              <input
                type="text"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Ваш ID Instance"
              />
            </div>
            <div className="form-group">
              <label>API Token Instance *</label>
              <input
                type="password"
                value={settings.apiSecret}
                onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                placeholder="Ваш API Token"
              />
            </div>
            <div className="form-group">
              <label>Номер получателя (для теста)</label>
              <input
                type="text"
                value={settings.fromNumber}
                onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
                placeholder="77001234567"
              />
            </div>
          </>
        )}

        {settings.whatsappApiProvider === 'custom' && (
          <>
            <div className="form-group">
              <label>API URL *</label>
              <input
                type="url"
                value={settings.apiUrl}
                onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                placeholder="https://api.example.com/send"
              />
            </div>
            <div className="form-group">
              <label>API Key *</label>
              <input
                type="text"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Ваш API Key"
              />
            </div>
            <div className="form-group">
              <label>API Secret (если требуется)</label>
              <input
                type="password"
                value={settings.apiSecret}
                onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                placeholder="Ваш API Secret"
              />
            </div>
          </>
        )}

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить настройки
          </button>
          <button className="btn btn-secondary" onClick={handleTest}>
            Отправить тестовое сообщение
          </button>
        </div>

        <div className="settings-info">
          <h3>Инструкция по настройке:</h3>
          <ul>
            <li><strong>Twilio:</strong> Зарегистрируйтесь на twilio.com, получите Account SID и Auth Token</li>
            <li><strong>MessageBird:</strong> Зарегистрируйтесь на messagebird.com, получите API Key</li>
            <li><strong>Green API:</strong> Зарегистрируйтесь на green-api.com, получите ID и Token</li>
            <li><strong>Свой API:</strong> Укажите URL вашего API endpoint для отправки сообщений</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings

// Функция для отправки сообщения через API
export async function sendWhatsAppMessage(settings, toNumber, subject, message) {
  const provider = settings.whatsappApiProvider

  try {
    if (provider === 'twilio') {
      return await sendViaTwilio(settings, toNumber, message)
    } else if (provider === 'messagebird') {
      return await sendViaMessageBird(settings, toNumber, message)
    } else if (provider === 'green-api') {
      return await sendViaGreenAPI(settings, toNumber, message)
    } else if (provider === 'custom') {
      return await sendViaCustomAPI(settings, toNumber, message)
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendViaTwilio(settings, toNumber, message) {
  const accountSid = settings.apiKey
  const authToken = settings.apiSecret
  const from = settings.fromNumber

  // Форматируем номер для Twilio
  const to = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber.replace(/[^0-9+]/g, '')}`

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        Body: message
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, messageId: data.sid }
    } else {
      return { success: false, error: data.message || 'Ошибка отправки' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendViaMessageBird(settings, toNumber, message) {
  const apiKey = settings.apiKey
  const from = settings.fromNumber

  try {
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originator: from,
        recipients: [toNumber.replace(/[^0-9+]/g, '')],
        body: message,
        type: 'text'
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, messageId: data.id }
    } else {
      return { success: false, error: data.errors?.[0]?.description || 'Ошибка отправки' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendViaGreenAPI(settings, toNumber, message) {
  const idInstance = settings.apiKey
  const apiTokenInstance = settings.apiSecret
  const chatId = `${toNumber.replace(/[^0-9]/g, '')}@c.us`

  try {
    const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message
      })
    })

    const data = await response.json()
    
    if (response.ok && data.idMessage) {
      return { success: true, messageId: data.idMessage }
    } else {
      return { success: false, error: data.error || 'Ошибка отправки' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendViaCustomAPI(settings, toNumber, message) {
  const apiUrl = settings.apiUrl
  const apiKey = settings.apiKey
  const apiSecret = settings.apiSecret

  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const body = {
      to: toNumber,
      message: message
    }

    if (apiSecret) {
      body.secret = apiSecret
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, data: data }
    } else {
      return { success: false, error: data.error || 'Ошибка отправки' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

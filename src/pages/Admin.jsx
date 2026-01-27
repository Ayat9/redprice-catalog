import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSuppliers } from '../context/SuppliersContext'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

function Admin() {
  const { suppliers, deleteSupplier } = useSuppliers()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      deleteSupplier(id)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="admin-page-header">
          <div>
            <h1>Главная панель</h1>
            <p className="page-subtitle">Управление поставщиками и товарами</p>
          </div>
          <button 
            className="btn btn-primary btn-add"
            onClick={() => {
              setEditingSupplier(null)
              setShowAddForm(true)
            }}
          >
            <span className="btn-icon">+</span>
            Добавить поставщика
          </button>
        </div>

      {showSettings && (
        <AdminCredentialsForm
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showAddForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={() => {
            setShowAddForm(false)
            setEditingSupplier(null)
          }}
        />
      )}

      {/* Статистика */}
      <div className="admin-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{suppliers.length}</div>
            <div className="stat-label">Поставщиков</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">
              {suppliers.reduce((total, s) => total + (s.products?.length || 0), 0)}
            </div>
            <div className="stat-label">Всего товаров</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {suppliers.length > 0 
                ? Math.round(suppliers.reduce((total, s) => total + (s.products?.length || 0), 0) / suppliers.length)
                : 0}
            </div>
            <div className="stat-label">Среднее товаров</div>
          </div>
        </div>
      </div>

      <div className="suppliers-list">
        <div className="suppliers-list-header">
          <h2>Список поставщиков</h2>
          <div className="suppliers-count-badge">{suppliers.length}</div>
        </div>
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Нет поставщиков</h3>
            <p>Добавьте первого поставщика, чтобы начать работу</p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => {
                setEditingSupplier(null)
                setShowAddForm(true)
              }}
            >
              + Добавить поставщика
            </button>
          </div>
        ) : (
          <div className="suppliers-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Адрес</th>
                  <th>Телефон</th>
                  <th>Товаров</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="supplier-id">#{supplier.id}</td>
                    <td className="supplier-name">
                      <strong>{supplier.name}</strong>
                    </td>
                    <td className="supplier-address">📍 {supplier.address}</td>
                    <td className="supplier-phone">📞 {supplier.phone}</td>
                    <td>
                      <span className="products-badge">
                        {supplier.products?.length || 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => {
                            setEditingSupplier(supplier)
                            setShowAddForm(true)
                          }}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <a
                          href={`/supplier/${supplier.id}`}
                          className="btn btn-view"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Просмотр"
                        >
                          👁️
                        </a>
                        <Link
                          to={`/admin/supplier/${supplier.id}/products`}
                          className="btn btn-products"
                          title="Товары"
                        >
                          📦
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(supplier.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function SupplierForm({ supplier, onClose }) {
  const { addSupplier, updateSupplier } = useSuppliers()
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    address: supplier?.address || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    website: supplier?.website || '',
    logo: supplier?.logo || '',
    whatsapp: supplier?.whatsapp || '',
    requisites: supplier?.requisites || '',
    kaspiPayMerchantId: supplier?.kaspiPayMerchantId || '',
    kaspiPayPhone: supplier?.kaspiPayPhone || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (supplier) {
      updateSupplier(supplier.id, {
        ...formData,
        products: supplier.products || []
      })
    } else {
      addSupplier({
        ...formData,
        products: []
      })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{supplier ? 'Редактировать поставщика' : 'Добавить поставщика'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="supplier-form">
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Адрес *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Телефон *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Сайт</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Логотип (URL)</label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>WhatsApp номер *</label>
            <input
              type="text"
              required
              placeholder="+77001234567"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Формат: +77001234567 (с кодом страны)
            </small>
          </div>
          <div className="form-group">
            <label>Реквизиты</label>
            <textarea
              rows="4"
              value={formData.requisites}
              onChange={(e) => setFormData({ ...formData, requisites: e.target.value })}
              placeholder="БИН, ИИК, БИК банка, расчетный счет и т.д."
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Банковские реквизиты для оплаты
            </small>
          </div>
          <div className="form-group">
            <label>Kaspi Pay Merchant ID</label>
            <input
              type="text"
              value={formData.kaspiPayMerchantId}
              onChange={(e) => setFormData({ ...formData, kaspiPayMerchantId: e.target.value })}
              placeholder="Merchant ID из Kaspi Pay"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              ID мерчанта из личного кабинета Kaspi Pay
            </small>
          </div>
          <div className="form-group">
            <label>Kaspi Pay телефон</label>
            <input
              type="text"
              value={formData.kaspiPayPhone}
              onChange={(e) => setFormData({ ...formData, kaspiPayPhone: e.target.value })}
              placeholder="+77001234567"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Номер телефона, привязанный к Kaspi Pay
            </small>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {supplier ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminCredentialsForm({ onClose }) {
  const { updateCredentials } = useAuth()
  const savedCredentials = localStorage.getItem('adminCredentials')
  let defaultEmail = ''
  let defaultPhone = ''
  
  if (savedCredentials) {
    try {
      const creds = JSON.parse(savedCredentials)
      defaultEmail = creds.email || ''
      defaultPhone = creds.phone || ''
    } catch (e) {
      console.error('Error parsing credentials:', e)
    }
  }

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: defaultEmail,
    phone: defaultPhone
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.username || !formData.password) {
      setError('Заполните все поля')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    const result = updateCredentials(
      formData.username, 
      formData.password,
      formData.email || null,
      formData.phone || null
    )
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        // Выходим из системы, чтобы войти с новыми данными
        window.location.reload()
      }, 1500)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Изменить учетные данные</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="supplier-form">
          {error && (
            <div className="error-message" style={{ marginBottom: '15px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ 
              background: '#efe', 
              color: '#3c3', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid #cfc'
            }}>
              Учетные данные изменены! Вы будете перенаправлены...
            </div>
          )}
          <div className="form-group">
            <label>Новый логин *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Введите новый логин"
            />
          </div>
          <div className="form-group">
            <label>Новый пароль *</label>
            <input
              type="password"
              required
              minLength="6"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Минимум 6 символов"
            />
          </div>
          <div className="form-group">
            <label>Подтвердите пароль *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Повторите пароль"
            />
          </div>
          <div className="form-group">
            <label>Email для восстановления</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Укажите email для восстановления пароля
            </small>
          </div>
          <div className="form-group">
            <label>Телефон для восстановления</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+77001234567"
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Укажите телефон для восстановления пароля
            </small>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Admin

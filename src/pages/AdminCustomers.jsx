import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../context/CustomersContext'
import AdminSidebar from '../components/AdminSidebar'
import { useAuth } from '../context/AuthContext'
import './AdminCustomers.css'

function AdminCustomers() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { customers, deleteCustomer } = useCustomers()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      deleteCustomer(id)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="admin-customers">
          <div className="admin-page-header">
            <div>
              <h1>Управление клиентами</h1>
              <p className="page-subtitle">Добавление и редактирование клиентов</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingCustomer(null)
                setShowAddForm(true)
              }}
            >
              + Добавить клиента
            </button>
          </div>

      {showAddForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowAddForm(false)
            setEditingCustomer(null)
          }}
        />
      )}

      <div className="customers-list">
        <h2>Список клиентов ({customers.length})</h2>
        {customers.length === 0 ? (
          <p className="no-customers">Нет клиентов. Добавьте первого клиента.</p>
        ) : (
          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Адрес</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => {
                            setEditingCustomer(customer)
                            setShowAddForm(true)
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(customer.id)}
                        >
                          Удалить
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
    </div>
  )
}

function CustomerForm({ customer, onClose }) {
  const { addCustomer, updateCustomer } = useCustomers()
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (customer) {
      updateCustomer(customer.id, formData)
    } else {
      addCustomer(formData)
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{customer ? 'Редактировать клиента' : 'Добавить клиента'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Имя клиента"
            />
          </div>
          <div className="form-group">
            <label>Телефон *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+77001234567"
            />
          </div>
          <div className="form-group">
            <label>Адрес *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Адрес доставки"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {customer ? 'Сохранить' : 'Добавить'}
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

export default AdminCustomers

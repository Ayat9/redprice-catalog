import { Link, useLocation } from 'react-router-dom'
import './AdminSidebar.css'

function AdminSidebar({ onLogout }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const menuItems = [
    { path: '/admin', icon: '🏠', label: 'Главная' },
    { path: '/admin/customers', icon: '👥', label: 'Клиенты' },
    { path: '/admin/categories', icon: '📁', label: 'Категории' },
    { path: '/admin/analytics', icon: '📊', label: 'Аналитика' },
    { path: '/admin/settings', icon: '⚙️', label: 'Настройки API' }
  ]

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">NextAdmin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={onLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Выйти</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar

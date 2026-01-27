import { useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import './AdminLayout.css'

function AdminLayout({ children, onLogout }) {
  const location = useLocation()
  
  // Определяем название страницы на основе пути
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Главная панель'
    if (path === '/admin/customers') return 'Управление клиентами'
    if (path === '/admin/categories') return 'Управление категориями'
    if (path === '/admin/analytics') return 'Аналитика и ABC анализ'
    if (path === '/admin/settings') return 'Настройки API'
    if (path.includes('/admin/supplier/') && path.includes('/products')) return 'Товары поставщика'
    return 'Админ-панель'
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={onLogout} />
      <div className="admin-content">
        {children}
      </div>
    </div>
  )
}

export default AdminLayout

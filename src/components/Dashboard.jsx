import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSuppliers } from '../context/SuppliersContext'
import { useOrders } from '../context/OrdersContext'
import { 
  analyzeByCategories, 
  analyzeBySuppliers, 
  getTopProducts, 
  getOverallStats,
  calculateProfitability
} from '../utils/analytics'
import './Dashboard.css'

function Dashboard() {
  const { suppliers } = useSuppliers()
  const { getAllOrders } = useOrders()
  const orders = getAllOrders()

  const stats = useMemo(() => getOverallStats(orders), [orders])
  const categoryAnalysis = useMemo(() => analyzeByCategories(orders), [orders])
  const supplierAnalysis = useMemo(() => analyzeBySuppliers(orders), [orders])
  const topProducts = useMemo(() => getTopProducts(orders, 10), [orders])

  // Рентабельные товары (прибыльность > 20%)
  const profitableProducts = useMemo(() => {
    const allProducts = []
    suppliers.forEach(supplier => {
      if (supplier.products) {
        supplier.products.forEach(product => {
          const profitability = calculateProfitability({ ...product, supplierId: supplier.id }, orders)
          if (profitability.profitability > 20 && profitability.revenue > 0) {
            allProducts.push({
              ...product,
              supplierId: supplier.id,
              supplierName: supplier.name,
              ...profitability
            })
          }
        })
      }
    })
    return allProducts.sort((a, b) => b.profitability - a.profitability).slice(0, 10)
  }, [suppliers, orders])

  // План продаж (на основе средних показателей)
  const salesPlan = useMemo(() => {
    const avgDailyRevenue = stats.totalRevenue > 0 && orders.length > 0
      ? stats.totalRevenue / (orders.length || 1)
      : 0
    
    const daysInMonth = 30
    const monthlyPlan = avgDailyRevenue * daysInMonth
    
    return {
      daily: avgDailyRevenue,
      monthly: monthlyPlan,
      target: monthlyPlan * 1.2 // План на 20% выше среднего
    }
  }, [stats, orders])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Дашборд аналитики</h1>
        <Link to="/admin/analytics" className="btn btn-primary">
          Подробная аналитика →
        </Link>
      </div>

      {/* Основная статистика */}
      <div className="dashboard-stats">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.totalRevenue).toLocaleString()} ₸</div>
            <div className="stat-label">Общая выручка</div>
          </div>
        </div>
        <div className="stat-card stat-orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Всего заказов</div>
          </div>
        </div>
        <div className="stat-card stat-quantity">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalQuantity}</div>
            <div className="stat-label">Товаров продано</div>
          </div>
        </div>
        <div className="stat-card stat-avg">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.avgOrderValue).toLocaleString()} ₸</div>
            <div className="stat-label">Средний чек</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* План продаж */}
        <div className="dashboard-card">
          <h2>🎯 План продаж</h2>
          <div className="sales-plan">
            <div className="plan-item">
              <span className="plan-label">Средний день:</span>
              <span className="plan-value">{Math.round(salesPlan.daily).toLocaleString()} ₸</span>
            </div>
            <div className="plan-item">
              <span className="plan-label">План на месяц:</span>
              <span className="plan-value">{Math.round(salesPlan.monthly).toLocaleString()} ₸</span>
            </div>
            <div className="plan-item plan-target">
              <span className="plan-label">Цель (120%):</span>
              <span className="plan-value">{Math.round(salesPlan.target).toLocaleString()} ₸</span>
            </div>
            <div className="plan-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min((salesPlan.monthly / salesPlan.target) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round((salesPlan.monthly / salesPlan.target) * 100)}% от цели
              </span>
            </div>
          </div>
        </div>

        {/* Топ поставщиков */}
        <div className="dashboard-card">
          <h2>🏆 Топ поставщиков (ABC)</h2>
          <div className="top-list">
            {supplierAnalysis.slice(0, 5).map((supplier, index) => (
              <div key={supplier.supplierId} className={`top-item abc-${supplier.category}`}>
                <div className="top-rank">{index + 1}</div>
                <div className="top-info">
                  <div className="top-name">{supplier.supplierName}</div>
                  <div className="top-details">
                    <span className={`abc-badge abc-${supplier.category}`}>{supplier.category}</span>
                    <span className="top-revenue">{Math.round(supplier.revenue).toLocaleString()} ₸</span>
                  </div>
                </div>
              </div>
            ))}
            {supplierAnalysis.length === 0 && (
              <p className="no-data">Нет данных о продажах</p>
            )}
          </div>
        </div>

        {/* Топ категорий */}
        <div className="dashboard-card">
          <h2>📁 Топ категорий (ABC)</h2>
          <div className="top-list">
            {categoryAnalysis.slice(0, 5).map((category, index) => (
              <div key={category.category} className={`top-item abc-${category.category}`}>
                <div className="top-rank">{index + 1}</div>
                <div className="top-info">
                  <div className="top-name">{category.category}</div>
                  <div className="top-details">
                    <span className={`abc-badge abc-${category.category}`}>{category.category}</span>
                    <span className="top-revenue">{Math.round(category.revenue).toLocaleString()} ₸</span>
                  </div>
                </div>
              </div>
            ))}
            {categoryAnalysis.length === 0 && (
              <p className="no-data">Нет данных о продажах</p>
            )}
          </div>
        </div>

        {/* Лидирующие товары */}
        <div className="dashboard-card dashboard-card-wide">
          <h2>🔥 Лидирующие товары по продажам</h2>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Поставщик</th>
                  <th>Категория</th>
                  <th>Выручка</th>
                  <th>Количество</th>
                  <th>Заказов</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td><strong>{product.productName}</strong></td>
                    <td>{product.supplierName}</td>
                    <td>{product.category || '—'}</td>
                    <td className="revenue-cell">{Math.round(product.revenue).toLocaleString()} ₸</td>
                    <td>{product.quantity}</td>
                    <td>{product.orders}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">Нет данных о продажах</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Рентабельные товары */}
        <div className="dashboard-card dashboard-card-wide">
          <h2>💎 Рентабельные товары</h2>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Поставщик</th>
                  <th>Рентабельность</th>
                  <th>Выручка</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {profitableProducts.map((product, index) => (
                  <tr key={index}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.supplierName}</td>
                    <td>
                      <span className={`profitability-badge profitability-${product.profitability > 30 ? 'high' : 'medium'}`}>
                        {Math.round(product.profitability)}%
                      </span>
                    </td>
                    <td className="revenue-cell">{Math.round(product.revenue).toLocaleString()} ₸</td>
                    <td>{product.quantity}</td>
                  </tr>
                ))}
                {profitableProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-data">Нет рентабельных товаров</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

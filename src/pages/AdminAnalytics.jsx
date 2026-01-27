import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../context/OrdersContext'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { 
  analyzeByCategories, 
  analyzeBySuppliers, 
  getTopProducts,
  getOverallStats
} from '../utils/analytics'
import './AdminAnalytics.css'

function AdminAnalytics() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { getAllOrders } = useOrders()
  const orders = getAllOrders()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const stats = useMemo(() => getOverallStats(orders), [orders])
  const categoryAnalysis = useMemo(() => analyzeByCategories(orders), [orders])
  const supplierAnalysis = useMemo(() => analyzeBySuppliers(orders), [orders])
  const topProducts = useMemo(() => getTopProducts(orders, 20), [orders])

  const categoryA = categoryAnalysis.filter(c => c.category === 'A')
  const categoryB = categoryAnalysis.filter(c => c.category === 'B')
  const categoryC = categoryAnalysis.filter(c => c.category === 'C')

  const supplierA = supplierAnalysis.filter(s => s.category === 'A')
  const supplierB = supplierAnalysis.filter(s => s.category === 'B')
  const supplierC = supplierAnalysis.filter(s => s.category === 'C')

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="admin-analytics">
          <div className="admin-page-header">
            <div>
              <h1>📊 Аналитика и ABC анализ</h1>
              <p className="page-subtitle">Детальная аналитика продаж и ABC анализ</p>
            </div>
          </div>

      {/* Общая статистика */}
      <div className="analytics-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.totalRevenue).toLocaleString()} ₸</div>
            <div className="stat-label">Общая выручка</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Всего заказов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalQuantity}</div>
            <div className="stat-label">Товаров продано</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.avgOrderValue).toLocaleString()} ₸</div>
            <div className="stat-label">Средний чек</div>
          </div>
        </div>
      </div>

      {/* ABC анализ по категориям */}
      <div className="analytics-section">
        <h2>📁 ABC анализ по категориям</h2>
        <div className="abc-explanation">
          <div className="abc-legend">
            <span className="abc-badge abc-A">Группа A (80% выручки)</span>
            <span className="abc-badge abc-B">Группа B (15% выручки)</span>
            <span className="abc-badge abc-C">Группа C (5% выручки)</span>
          </div>
        </div>

        <div className="abc-groups">
          <div className="abc-group abc-group-a">
            <h3>Группа A - Приоритетные категории</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Выручка</th>
                    <th>Количество</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryA.map((cat, index) => (
                    <tr key={index}>
                      <td><strong>{cat.category}</strong></td>
                      <td className="revenue-cell">{Math.round(cat.revenue).toLocaleString()} ₸</td>
                      <td>{cat.quantity}</td>
                      <td>{cat.percentage.toFixed(1)}%</td>
                      <td>{cat.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {categoryA.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="abc-group abc-group-b">
            <h3>Группа B - Средние категории</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Выручка</th>
                    <th>Количество</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryB.map((cat, index) => (
                    <tr key={index}>
                      <td><strong>{cat.category}</strong></td>
                      <td className="revenue-cell">{Math.round(cat.revenue).toLocaleString()} ₸</td>
                      <td>{cat.quantity}</td>
                      <td>{cat.percentage.toFixed(1)}%</td>
                      <td>{cat.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {categoryB.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="abc-group abc-group-c">
            <h3>Группа C - Низкоприоритетные категории</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Выручка</th>
                    <th>Количество</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryC.map((cat, index) => (
                    <tr key={index}>
                      <td><strong>{cat.category}</strong></td>
                      <td className="revenue-cell">{Math.round(cat.revenue).toLocaleString()} ₸</td>
                      <td>{cat.quantity}</td>
                      <td>{cat.percentage.toFixed(1)}%</td>
                      <td>{cat.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {categoryC.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ABC анализ по поставщикам */}
      <div className="analytics-section">
        <h2>🏢 ABC анализ по поставщикам</h2>
        <div className="abc-groups">
          <div className="abc-group abc-group-a">
            <h3>Группа A - Ключевые поставщики</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th>Выручка</th>
                    <th>Заказов</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierA.map((supplier, index) => (
                    <tr key={index}>
                      <td><strong>{supplier.supplierName}</strong></td>
                      <td className="revenue-cell">{Math.round(supplier.revenue).toLocaleString()} ₸</td>
                      <td>{supplier.orders}</td>
                      <td>{supplier.percentage.toFixed(1)}%</td>
                      <td>{supplier.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {supplierA.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="abc-group abc-group-b">
            <h3>Группа B - Средние поставщики</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th>Выручка</th>
                    <th>Заказов</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierB.map((supplier, index) => (
                    <tr key={index}>
                      <td><strong>{supplier.supplierName}</strong></td>
                      <td className="revenue-cell">{Math.round(supplier.revenue).toLocaleString()} ₸</td>
                      <td>{supplier.orders}</td>
                      <td>{supplier.percentage.toFixed(1)}%</td>
                      <td>{supplier.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {supplierB.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="abc-group abc-group-c">
            <h3>Группа C - Низкоприоритетные поставщики</h3>
            <div className="abc-table">
              <table>
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th>Выручка</th>
                    <th>Заказов</th>
                    <th>% от общей</th>
                    <th>Накопленный %</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierC.map((supplier, index) => (
                    <tr key={index}>
                      <td><strong>{supplier.supplierName}</strong></td>
                      <td className="revenue-cell">{Math.round(supplier.revenue).toLocaleString()} ₸</td>
                      <td>{supplier.orders}</td>
                      <td>{supplier.percentage.toFixed(1)}%</td>
                      <td>{supplier.cumulativePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {supplierC.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Топ товаров */}
      <div className="analytics-section">
        <h2>🔥 Топ товаров по продажам</h2>
        <div className="top-products-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
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
                  <td className="rank-cell">{index + 1}</td>
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
                  <td colSpan="7" className="no-data">Нет данных о продажах</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics

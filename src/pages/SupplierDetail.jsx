import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSuppliers } from '../context/SuppliersContext'
import ProductCard from '../components/ProductCard'
import ViewModeToggle, { VIEW_MODES } from '../components/ViewModeToggle'
import './SupplierDetail.css'

function SupplierDetail() {
  const { id } = useParams()
  const { suppliers } = useSuppliers()
  const supplier = suppliers.find(s => s.id === parseInt(id))
  const [nameFilter, setNameFilter] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, price-asc, price-desc
  const [viewSettings, setViewSettings] = useState(() => {
    const savedMode = localStorage.getItem('productViewMode') || VIEW_MODES.MEDIUM_GRID
    const savedShowImages = localStorage.getItem('productShowImages')
    return { 
      viewMode: savedMode, 
      showImages: savedShowImages !== null ? savedShowImages === 'true' : true 
    }
  })

  if (!supplier) {
    return (
      <div className="supplier-detail">
        <div className="not-found">
          <h2>Поставщик не найден</h2>
          <Link to="/" className="back-link">Вернуться к каталогу</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-detail">
      <Link to="/" className="back-link">← Назад к каталогу</Link>

      <div className="supplier-info">
        <div className="supplier-info-header">
          {supplier.logo ? (
            <img src={supplier.logo} alt={supplier.name} className="supplier-logo" />
          ) : (
            <div className="supplier-logo-placeholder">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="supplier-info-text">
            <h1 className="supplier-name">{supplier.name}</h1>
            <p className="supplier-address">📍 {supplier.address}</p>
          </div>
        </div>

        <div className="supplier-contacts">
          <h3>Контакты</h3>
          <div className="contacts-grid">
            {supplier.phone && (
              <div className="contact-item">
                <span className="contact-label">Телефон:</span>
                <a href={`tel:${supplier.phone}`} className="contact-value">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.email && (
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <a href={`mailto:${supplier.email}`} className="contact-value">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.website && (
              <div className="contact-item">
                <span className="contact-label">Сайт:</span>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-value"
                >
                  {supplier.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="supplier-products">
        <div className="products-header-section">
          <h2 className="products-title">Товары ({supplier.products?.length || 0})</h2>
          
          <ViewModeToggle onViewChange={setViewSettings} />
          
          <div className="products-filters">
            <div className="filter-group">
              <label>Поиск по названию:</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Название товара..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Цена от:</label>
              <input
                type="number"
                className="filter-input"
                placeholder="0"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Цена до:</label>
              <input
                type="number"
                className="filter-input"
                placeholder="∞"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Сортировка:</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">По названию (А-Я)</option>
                <option value="price-asc">По цене (возрастание)</option>
                <option value="price-desc">По цене (убывание)</option>
              </select>
            </div>
            
            <button
              className="btn btn-secondary btn-reset"
              onClick={() => {
                setNameFilter('')
                setPriceMin('')
                setPriceMax('')
                setSortBy('name')
              }}
            >
              Сбросить
            </button>
          </div>
        </div>

        {(() => {
          if (!supplier.products || supplier.products.length === 0) {
            return <p className="no-products">Товары не добавлены</p>
          }

          // Фильтрация и сортировка
          let filteredProducts = [...supplier.products]

          // Фильтр по названию
          if (nameFilter.trim()) {
            const query = nameFilter.toLowerCase()
            filteredProducts = filteredProducts.filter(product =>
              product.name.toLowerCase().includes(query) ||
              (product.description && product.description.toLowerCase().includes(query))
            )
          }

          // Фильтр по цене
          if (priceMin) {
            filteredProducts = filteredProducts.filter(product => product.price >= parseFloat(priceMin))
          }
          if (priceMax) {
            filteredProducts = filteredProducts.filter(product => product.price <= parseFloat(priceMax))
          }

          // Сортировка
          filteredProducts.sort((a, b) => {
            if (sortBy === 'name') {
              return a.name.localeCompare(b.name, 'ru')
            } else if (sortBy === 'price-asc') {
              return a.price - b.price
            } else if (sortBy === 'price-desc') {
              return b.price - a.price
            }
            return 0
          })

          if (filteredProducts.length === 0) {
            return <p className="no-products">Товары не найдены по заданным фильтрам</p>
          }

          const gridClass = `products-grid products-grid-${viewSettings.viewMode}`
          
          return (
            <>
              <p className="filtered-count">Найдено товаров: {filteredProducts.length}</p>
              <div className={gridClass}>
                {filteredProducts.map((product, index) => (
                  <ProductCard 
                    key={index} 
                    product={product} 
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                    showAddToCart={true}
                    viewMode={viewSettings.viewMode}
                    showImages={viewSettings.showImages}
                  />
                ))}
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default SupplierDetail

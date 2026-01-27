import { useState, useMemo } from 'react'
import SupplierCard from '../components/SupplierCard'
import { useSuppliers } from '../context/SuppliersContext'
import Dashboard from '../components/Dashboard'
import './Home.css'

function Home() {
  const { suppliers } = useSuppliers()
  const [searchQuery, setSearchQuery] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, products-count

  const filteredSuppliers = useMemo(() => {
    let filtered = [...suppliers]

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(supplier => {
        const nameMatch = supplier.name.toLowerCase().includes(query)
        const addressMatch = supplier.address?.toLowerCase().includes(query)
        const productMatch = supplier.products?.some(product =>
          product.name.toLowerCase().includes(query)
        )
        return nameMatch || addressMatch || productMatch
      })
    }

    // Фильтр по названию поставщика
    if (nameFilter.trim()) {
      const query = nameFilter.toLowerCase()
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(query)
      )
    }

    // Сортировка
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ru')
      } else if (sortBy === 'products-count') {
        const aCount = a.products?.length || 0
        const bCount = b.products?.length || 0
        return bCount - aCount
      }
      return 0
    })

    return filtered
  }, [searchQuery, nameFilter, sortBy, suppliers])

  return (
    <div className="home">
      <Dashboard />
      
      <div className="home-header">
        <h2>Каталог Поставщиков</h2>
        <p className="home-subtitle">
          Найдите поставщиков и их товары с ценами и условиями поставки
        </p>
      </div>

      <div className="search-filters-container">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по поставщикам, товарам или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Фильтр по названию:</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Название поставщика..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
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
              <option value="products-count">По количеству товаров</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-reset"
            onClick={() => {
              setSearchQuery('')
              setNameFilter('')
              setSortBy('name')
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="suppliers-grid">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map(supplier => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))
        ) : (
          <div className="no-results">
            <p>Поставщики не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

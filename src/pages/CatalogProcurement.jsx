import React, { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { useSeo } from '../hooks/useSeo'
import Sidebar from '../components/Sidebar'
import ProductCard from '../components/ProductCard'
import Cart from '../components/Cart'
import { useProducts } from '../context/ProductsContext'
import { useSuppliers } from '../context/SuppliersContext'
import { useCategories } from '../context/CategoriesContext'
import { useOrders } from '../context/OrdersContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useStats } from '../context/StatsContext'
import { getVariantPrice } from '../utils/priceMode'
import { PRICE_MODES } from '../utils/priceMode'

export default function CatalogProcurement() {
  useSeo({ title: 'Отдел закупок — заказ у поставщиков', description: 'Redprice.kz — каталог по поставщикам для отдела закупок. Оформление заказов, накладные, WhatsApp.' })

  const location = useLocation()
  const { isLoggedIn, login, logout, currentUser } = useAdminAuth()
  const { products } = useProducts('procurement')
  const { suppliers } = useSuppliers()
  const { categories } = useCategories('procurement')
  const { orders, addOrder } = useOrders()
  const { trackVisit, trackConversion } = useStats()
  const [loginEmail, setLoginEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeSupplier, setActiveSupplier] = useState(null)
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [cartBlockMessage, setCartBlockMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState('medium')

  const isProcurement = currentUser && currentUser.departmentId === 'procurement'

  useEffect(() => {
    if (location.pathname === '/zakup') trackVisit('/zakup')
  }, [location.pathname, trackVisit])

  const setSupplier = (id) => {
    setActiveSupplier(id)
    setActiveCategoryId(null)
    setSidebarOpen(false)
  }

  const supplierCategories = useMemo(() => {
    if (!activeSupplier) return []
    const categoryIds = [...new Set(products.filter((p) => p.supplierId === activeSupplier).map((p) => p.categoryId).filter(Boolean))]
    return categoryIds.map((id) => categories.find((c) => c.id === id)).filter(Boolean).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
  }, [activeSupplier, products, categories])

  const filteredProducts = useMemo(() => {
    if (!activeSupplier) return []
    let list = products.filter((p) => p.supplierId === activeSupplier)
    if (activeCategoryId) list = list.filter((p) => p.categoryId === activeCategoryId)
    return list
  }, [activeSupplier, activeCategoryId, products])

  const priceMode = PRICE_MODES.supplier
  const { cartCount, cartTotal, cartItems, cartSupplierId, cartSupplierName, cartSupplierPhone } = useMemo(() => {
    let count = 0
    let total = 0
    const items = cart.map(({ product, variant, packQty }) => {
      const unitPrice = getVariantPrice(variant, priceMode)
      const itemTotal = unitPrice * packQty * variant.packQty
      count += packQty * variant.packQty
      total += itemTotal
      return { product, variant, packQty, total: itemTotal, unitPrice }
    })
    const sid = cart[0]?.product?.supplierId
    const supplier = sid ? suppliers.find((s) => s.id === sid) : null
    return {
      cartCount: count,
      cartTotal: total,
      cartItems: items,
      cartSupplierId: sid,
      cartSupplierName: supplier?.name ?? null,
      cartSupplierPhone: supplier?.phone ?? null
    }
  }, [cart, suppliers, priceMode])

  const addToCart = (product, variant, packQty) => {
    setCartBlockMessage('')
    if (cart.length > 0 && cart[0].product.supplierId !== product.supplierId) {
      setCartBlockMessage('В корзине товары другого поставщика. Оформите заказ или очистите корзину.')
      setCartOpen(true)
      return
    }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant.id === variant.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], packQty: next[idx].packQty + packQty }
        return next
      }
      return [...prev, { product, variant, packQty }]
    })
  }

  const decreaseFromCart = (product, variant) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant.id === variant.id)
      if (idx < 0) return prev
      const next = [...prev]
      if (next[idx].packQty <= 1) {
        next.splice(idx, 1)
        return next
      }
      next[idx] = { ...next[idx], packQty: next[idx].packQty - 1 }
      return next
    })
  }

  const getCartQty = (product, variant) => {
    const item = cart.find((i) => i.product.id === product.id && i.variant.id === variant.id)
    return item ? item.packQty : 0
  }

  const updateCartQty = (product, variant, packQty) => {
    if (packQty <= 0) {
      setCart((prev) => prev.filter((i) => !(i.product.id === product.id && i.variant.id === variant.id)))
      return
    }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant.id === variant.id)
      if (idx < 0) return [...prev, { product, variant, packQty }]
      const next = [...prev]
      next[idx] = { ...next[idx], packQty }
      return next
    })
  }

  const clearCart = () => {
    setCart([])
    setCartBlockMessage('')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setLoginError('')
    if (login(loginEmail, password)) {
      setLoginEmail('')
      setPassword('')
    } else setLoginError('Неверный email или пароль. Доступ только для отдела закупок.')
  }

  if (!isLoggedIn) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="logo">Redprice.kz</Link>
            <Link to="/" className="header-menu-link" style={{ color: '#fff', marginLeft: 'auto', padding: '8px 12px' }}>← Каталог</Link>
          </div>
        </header>
        <div className="admin-login" style={{ minHeight: '60vh', padding: 24 }}>
          <div className="admin-login-card">
            <h1>Отдел закупок</h1>
            <p>Войдите под учётной записью отдела закупок для оформления заказов поставщикам</p>
            <form onSubmit={handleLogin}>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" className="admin-input admin-login-input" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="admin-input admin-login-input" />
              {loginError && <p className="admin-login-error">{loginError}</p>}
              <button type="submit" className="btn-save admin-login-btn">Войти</button>
            </form>
            <Link to="/" className="admin-back admin-login-back">← На главную</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isProcurement) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="logo">Redprice.kz</Link>
            <Link to="/" className="header-menu-link" style={{ color: '#fff', marginLeft: 'auto', padding: '8px 12px' }}>← Каталог</Link>
          </div>
        </header>
        <div className="admin-login" style={{ minHeight: '60vh', padding: 24 }}>
          <div className="admin-login-card">
            <h1>Доступ ограничен</h1>
            <p className="admin-login-error">Раздел «Отдел закупок» доступен только сотрудникам отдела закупок для оформления заказов поставщикам.</p>
            <button type="button" className="btn-save admin-login-btn" onClick={logout}>Выйти</button>
            <Link to="/" className="admin-back admin-login-back">← На главную</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        showCart
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
      />
      <div className="main">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Закрыть список поставщиков' : 'Открыть список поставщиков'}
        >
          {sidebarOpen ? 'Скрыть поставщиков' : 'Поставщики'}
          <span className="sidebar-toggle-icon">{sidebarOpen ? '▲' : '▼'}</span>
        </button>
        <div className={`sidebar-wrap ${sidebarOpen ? 'sidebar-wrap-open' : ''}`}>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <Sidebar
            activeSupplier={activeSupplier}
            onSelectSupplier={setSupplier}
            supplierCategories={supplierCategories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={(id) => { setActiveCategoryId(id); setSidebarOpen(false); }}
          />
        </div>
        <main className="content" id="catalog">
          {!activeSupplier ? (
            <div className="catalog-placeholder">
              <p className="catalog-placeholder-desktop">Выберите поставщика слева, затем категорию и товары для оформления заказа</p>
              <p className="catalog-placeholder-mobile">Нажмите «Поставщики» выше и выберите поставщика, затем категорию</p>
            </div>
          ) : (
            <>
              <div className="catalog-view-bar">
                <span className="catalog-view-label">Вид:</span>
                <div className="catalog-view-btns" role="group" aria-label="Вид отображения товаров">
                  <button type="button" className={`catalog-view-btn ${viewMode === 'large' ? 'active' : ''}`} onClick={() => setViewMode('large')} title="Крупные карточки" aria-pressed={viewMode === 'large'}>
                    <span className="catalog-view-icon catalog-view-icon-large" aria-hidden>▦</span>
                    <span className="catalog-view-text">Крупные</span>
                  </button>
                  <button type="button" className={`catalog-view-btn ${viewMode === 'medium' ? 'active' : ''}`} onClick={() => setViewMode('medium')} title="Средние карточки" aria-pressed={viewMode === 'medium'}>
                    <span className="catalog-view-icon catalog-view-icon-medium" aria-hidden>▤</span>
                    <span className="catalog-view-text">Средние</span>
                  </button>
                  <button type="button" className={`catalog-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Списком" aria-pressed={viewMode === 'list'}>
                    <span className="catalog-view-icon catalog-view-icon-list" aria-hidden>≡</span>
                    <span className="catalog-view-text">Списком</span>
                  </button>
                </div>
              </div>
              <div className={`products-grid products-grid--${viewMode}`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={viewMode}
                    priceMode={priceMode}
                    onAddToCart={addToCart}
                    onDecreaseFromCart={decreaseFromCart}
                    getCartQty={getCartQty}
                    showCartActions
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <p className="catalog-empty">У этого поставщика пока нет товаров</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <Cart
        items={cartItems}
        total={cartTotal}
        supplierId={cartSupplierId}
        supplierName={cartSupplierName}
        supplierPhone={cartSupplierPhone}
        blockMessage={cartBlockMessage}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onClearCart={clearCart}
        onSaveOrder={(order) => {
          trackConversion({ section: 'procurement', total: order.total, path: '/zakup', supplierName: order.supplierName })
          addOrder(order)
        }}
        onUpdateQuantity={updateCartQty}
        orders={orders}
      />
    </div>
  )
}

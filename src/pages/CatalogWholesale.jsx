import React, { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import SidebarCategories from '../components/SidebarCategories'
import ProductCard from '../components/ProductCard'
import Cart from '../components/Cart'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useOrders } from '../context/OrdersContext'
import { useStats } from '../context/StatsContext'
import { useSeo } from '../hooks/useSeo'
import { getVariantPrice } from '../utils/priceMode'
import { PRICE_MODES } from '../utils/priceMode'

const TITLE = 'Оптовые закупки'
const DESCRIPTION = 'Оптовые закупки Redprice.kz — товары по оптовым ценам (коробками). Выберите категорию, добавьте товары в корзину и оформите заявку.'

export default function CatalogWholesale() {
  useSeo({ title: TITLE, description: DESCRIPTION })

  const location = useLocation()
  const { products } = useProducts('wholesale')
  const { categories } = useCategories('wholesale')
  const { orders, addOrder } = useOrders()
  const { trackVisit, trackConversion } = useStats()
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState('medium')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const categoriesWithProducts = useMemo(() => {
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))]
    return categoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
  }, [products, categories])

  const filteredProducts = useMemo(() => {
    if (activeCategoryId) return products.filter((p) => p.categoryId === activeCategoryId)
    return products
  }, [activeCategoryId, products])

  useEffect(() => {
    trackVisit(location.pathname || '/opt')
  }, [location.pathname, trackVisit])

  const priceMode = PRICE_MODES.wholesale
  const { cartCount, cartTotal, cartItems } = useMemo(() => {
    let count = 0
    let total = 0
    const items = cart.map(({ product, variant, packQty }) => {
      const unitPrice = getVariantPrice(variant, priceMode)
      const itemTotal = unitPrice * packQty * variant.packQty
      count += packQty * variant.packQty
      total += itemTotal
      return { product, variant, packQty, total: itemTotal, unitPrice }
    })
    return { cartCount: count, cartTotal: total, cartItems: items }
  }, [cart, priceMode])

  const addToCart = (product, variant, packQty, pm) => {
    const mode = pm || priceMode
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant.id === variant.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], packQty: next[idx].packQty + packQty }
        return next
      }
      return [...prev, { product, variant, packQty, priceMode: mode }]
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
      if (idx < 0) return [...prev, { product, variant, packQty, priceMode }]
      const next = [...prev]
      next[idx] = { ...next[idx], packQty }
      return next
    })
  }

  const clearCart = () => setCart([])

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
          aria-label={sidebarOpen ? 'Закрыть категории' : 'Открыть категории'}
        >
          {sidebarOpen ? 'Скрыть категории' : 'Категории'}
          <span className="sidebar-toggle-icon">{sidebarOpen ? '▲' : '▼'}</span>
        </button>
        <div className={`sidebar-wrap ${sidebarOpen ? 'sidebar-wrap-open' : ''}`}>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <SidebarCategories
            categories={categoriesWithProducts}
            activeCategoryId={activeCategoryId}
            onSelectCategory={(id) => { setActiveCategoryId(id); setSidebarOpen(false); }}
          />
        </div>
        <main className="content" id="catalog" role="main">
          <h1 className="visually-hidden">{TITLE} — Redprice.kz</h1>
          <div className="catalog-intro">
            <p className="catalog-intro-text">Оптовые закупки — товары по оптовым ценам (коробками). Выберите категорию, добавьте товары в корзину и оформите заявку.</p>
          </div>
          {categoriesWithProducts.length === 0 ? (
            <div className="catalog-placeholder">
              <p>В каталоге пока нет категорий с товарами</p>
            </div>
          ) : !activeCategoryId && filteredProducts.length === 0 ? (
            <div className="catalog-placeholder">
              <p className="catalog-placeholder-desktop">Выберите категорию слева</p>
              <p className="catalog-placeholder-mobile">Нажмите «Категории» выше и выберите категорию</p>
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
                    showCartActions
                    onAddToCart={addToCart}
                    onDecreaseFromCart={decreaseFromCart}
                    getCartQty={getCartQty}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <p className="catalog-empty">В этой категории пока нет товаров</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <Cart
        items={cartItems}
        total={cartTotal}
        supplierId={null}
        supplierName={null}
        supplierPhone={null}
        blockMessage=""
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onClearCart={clearCart}
        onSaveOrder={(order) => {
          trackConversion({ section: 'wholesale', total: order.total, path: '/opt' })
          addOrder(order)
        }}
        onUpdateQuantity={updateCartQty}
        orders={orders}
        isWholesale
      />
    </div>
  )
}

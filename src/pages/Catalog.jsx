import React, { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

const CATALOG_TITLE = 'Интернет-магазин — товары по категориям'
const CATALOG_DESCRIPTION = 'Redprice.kz — интернет-магазин. Розничные цены. Контейнеры, ведра, тазики, органайзеры, горшки, подносы. Казахстан.'

export default function Catalog() {
  useSeo({ title: CATALOG_TITLE, description: CATALOG_DESCRIPTION })

  const location = useLocation()
  const { products } = useProducts('platform')
  const { categories } = useCategories('platform')
  const { orders, addOrder } = useOrders()
  const { trackVisit, trackConversion, trackSearch } = useStats()
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState('medium')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const categoriesWithProducts = useMemo(() => {
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))]
    return categoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
  }, [products, categories])

  const filteredProducts = useMemo(() => {
    let list = activeCategoryId ? products.filter((p) => p.categoryId === activeCategoryId) : products
    const q = (searchQuery || '').trim().toLowerCase()
    if (q) list = list.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.type || '').toLowerCase().includes(q))
    return list
  }, [activeCategoryId, products, searchQuery])

  const productsByCategory = useMemo(() => {
    const map = {}
    categoriesWithProducts.forEach((cat) => {
      if (cat?.id) map[cat.id] = products.filter((p) => p.categoryId === cat.id)
    })
    return map
  }, [categoriesWithProducts, products])

  const PRODUCTS_PER_SECTION = 6
  const isHomeView = !activeCategoryId

  useEffect(() => {
    trackVisit(location.pathname || '/')
  }, [location.pathname, trackVisit])

  const priceMode = PRICE_MODES.retail
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

  useEffect(() => {
    if (products.length === 0) return
    const itemListElement = document.getElementById('products-jsonld')
    if (itemListElement) itemListElement.remove()
    const script = document.createElement('script')
    script.id = 'products-jsonld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Каталог товаров Redprice.kz',
      description: CATALOG_DESCRIPTION,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 100).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.type ? `Тип: ${p.type}` : undefined
        }
      }))
    })
    document.head.appendChild(script)
    return () => {
      const el = document.getElementById('products-jsonld')
      if (el) el.remove()
    }
  }, [products])

  return (
    <div className={`app platform-app ${isHomeView ? 'platform-home' : ''}`}>
      <Header
        showCart
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
      />
      <div className={isHomeView ? 'platform-main' : 'main'}>
        {!isHomeView && (
          <>
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
          </>
        )}
        <main className={isHomeView ? 'platform-content' : 'content'} id="catalog" role="main">
          <h1 className="visually-hidden">{CATALOG_TITLE} — Redprice.kz</h1>

          {isHomeView ? (
            <>
              <section className="platform-hero">
                <h2 className="platform-hero-text">Интернет-магазин Redprice</h2>
                <p className="platform-hero-sub">Товары для дома и всей семьи по выгодным ценам. Доставка по Казахстану.</p>
                <form className="platform-search" onSubmit={(e) => { e.preventDefault(); if ((searchQuery || '').trim()) trackSearch((searchQuery || '').trim(), location.pathname); }}>
                  <div className="platform-search-wrap">
                    <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по названию или типу товара" className="platform-search-input" aria-label="Поиск товара" />
                  </div>
                  <button type="submit" className="platform-search-btn">Искать</button>
                </form>
              </section>

              <section className="shop-trust" aria-label="Преимущества">
                <div className="shop-trust-inner">
                  <div className="shop-trust-item">
                    <span className="shop-trust-icon" aria-hidden>🚚</span>
                    <span>Доставка по Казахстану</span>
                  </div>
                  <div className="shop-trust-item">
                    <span className="shop-trust-icon" aria-hidden>💳</span>
                    <span>Оплата при получении</span>
                  </div>
                  <div className="shop-trust-item">
                    <span className="shop-trust-icon" aria-hidden>✓</span>
                    <span>Гарантия качества</span>
                  </div>
                </div>
              </section>

              {categoriesWithProducts.length > 0 && (
                <section className="platform-categories" aria-label="Категории">
                  <div className="platform-categories-inner">
                    <button type="button" className={`platform-cat-tile ${!activeCategoryId ? 'active' : ''}`} onClick={() => setActiveCategoryId(null)}>Все категории</button>
                    {categoriesWithProducts.map((c) => (
                      <button type="button" key={c.id} className="platform-cat-tile" onClick={() => setActiveCategoryId(c.id)}>{c.name}</button>
                    ))}
                  </div>
                </section>
              )}

              {(searchQuery || '').trim() ? (
                <section className="platform-section">
                  <h2 className="platform-section-title">Результаты поиска</h2>
                  {filteredProducts.length === 0 ? (
                    <p className="catalog-empty">По запросу «{searchQuery}» ничего не найдено</p>
                  ) : (
                    <div className="products-grid products-grid--medium">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} view="medium" priceMode={priceMode} showCartActions onAddToCart={addToCart} onDecreaseFromCart={decreaseFromCart} getCartQty={getCartQty} />
                      ))}
                    </div>
                  )}
                </section>
              ) : categoriesWithProducts.length === 0 ? (
                <div className="catalog-placeholder">
                  <p>В каталоге пока нет категорий с товарами</p>
                </div>
              ) : (
                categoriesWithProducts.map((cat) => {
                  const list = productsByCategory[cat.id] || []
                  const showList = list.slice(0, PRODUCTS_PER_SECTION)
                  if (list.length === 0) return null
                  return (
                    <section key={cat.id} className="platform-section">
                      <div className="platform-section-head">
                        <h2 className="platform-section-title">{cat.name}</h2>
                        <button type="button" className="platform-section-link" onClick={() => setActiveCategoryId(cat.id)}>Показать все</button>
                      </div>
                      <div className="products-grid products-grid--medium platform-section-grid">
                        {showList.map((product) => (
                          <ProductCard key={product.id} product={product} view="medium" priceMode={priceMode} showCartActions onAddToCart={addToCart} onDecreaseFromCart={decreaseFromCart} getCartQty={getCartQty} />
                        ))}
                      </div>
                    </section>
                  )
                })
              )}
              {isHomeView && (
                <footer className="shop-footer">
                  <div className="shop-footer-inner">
                    <div className="shop-footer-col shop-footer-brand">
                      <strong className="shop-footer-logo">Redprice.kz</strong>
                      <p>Товары для дома и всей семьи по выгодным ценам. Работаем по всему Казахстану.</p>
                    </div>
                    <div className="shop-footer-col shop-footer-info">
                      <strong>Доставка и оплата</strong>
                      <p>Доставка по регионам. Оплата наличными или картой при получении.</p>
                    </div>
                    <div className="shop-footer-col shop-footer-links">
                      <strong>Разделы</strong>
                      <Link to="/">Главная</Link>
                      <Link to="/opt">Оптовые закупки</Link>
                      <Link to="/admin">Вход для партнёров</Link>
                    </div>
                  </div>
                  <div className="shop-footer-bottom">
                    <p className="shop-footer-copy">© {new Date().getFullYear()} Redprice. Казахстан.</p>
                  </div>
                </footer>
              )}
            </>
          ) : (
            <>
              <nav className="platform-breadcrumb" aria-label="Навигация">
                <button type="button" className="platform-breadcrumb-link" onClick={() => setActiveCategoryId(null)}>Главная</button>
                {activeCategoryId && (
                  <>
                    <span className="platform-breadcrumb-sep">›</span>
                    <span className="platform-breadcrumb-current">{categories.find((c) => c.id === activeCategoryId)?.name || activeCategoryId}</span>
                  </>
                )}
              </nav>
              <div className="catalog-view-bar">
                <span className="catalog-view-label">Вид:</span>
                <div className="catalog-view-btns" role="group" aria-label="Вид отображения товаров">
                  <button type="button" className={`catalog-view-btn ${viewMode === 'large' ? 'active' : ''}`} onClick={() => setViewMode('large')} title="Крупные карточки" aria-pressed={viewMode === 'large'}><span className="catalog-view-icon catalog-view-icon-large" aria-hidden>▦</span><span className="catalog-view-text">Крупные</span></button>
                  <button type="button" className={`catalog-view-btn ${viewMode === 'medium' ? 'active' : ''}`} onClick={() => setViewMode('medium')} title="Средние карточки" aria-pressed={viewMode === 'medium'}><span className="catalog-view-icon catalog-view-icon-medium" aria-hidden>▤</span><span className="catalog-view-text">Средние</span></button>
                  <button type="button" className={`catalog-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Списком" aria-pressed={viewMode === 'list'}><span className="catalog-view-icon catalog-view-icon-list" aria-hidden>≡</span><span className="catalog-view-text">Списком</span></button>
                </div>
              </div>
              <div className={`products-grid products-grid--${viewMode}`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view={viewMode} priceMode={priceMode} showCartActions onAddToCart={addToCart} onDecreaseFromCart={decreaseFromCart} getCartQty={getCartQty} />
                ))}
                {filteredProducts.length === 0 && <p className="catalog-empty">В этой категории пока нет товаров</p>}
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
          trackConversion({ section: 'platform', total: order.total, path: '/' })
          addOrder(order)
        }}
        onUpdateQuantity={updateCartQty}
        orders={orders}
        isRetail
      />
    </div>
  )
}

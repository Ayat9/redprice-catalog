import React, { useState, useMemo } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import { products } from './data/products'
import './App.css'

function App() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products
    return products.filter((p) => p.categoryId === activeCategory)
  }, [activeCategory])

  const { cartCount, cartTotal, cartItems } = useMemo(() => {
    let count = 0
    let total = 0
    const items = cart.map(({ product, variant, packQty }) => {
      const itemTotal = variant.price * packQty * variant.packQty
      count += packQty * variant.packQty
      total += itemTotal
      return { product, variant, packQty, total: itemTotal }
    })
    return { cartCount: count, cartTotal: total, cartItems: items }
  }, [cart])

  const addToCart = (product, variant, packQty) => {
    setCart((prev) => [...prev, { product, variant, packQty }])
  }

  return (
    <div className="app">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
      />
      <div className="main">
        <Sidebar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
        <main className="content" id="catalog">
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </main>
      </div>
      <Cart
        items={cartItems}
        total={cartTotal}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  )
}

export default App

import React, { createContext, useContext, useState, useEffect } from 'react'
import { products as initialProducts } from '../data/products'

const STORAGE_KEY = 'redprice_products'
const SUPPLIERS_KEY = 'redprice_suppliers'

function getFirstSupplierId() {
  try {
    const s = localStorage.getItem(SUPPLIERS_KEY)
    if (s) { const list = JSON.parse(s); return list[0]?.id }
  } catch (_) {}
  return 's1'
}

const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const [products, setProductsState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const list = JSON.parse(saved)
        const firstId = getFirstSupplierId()
        return list.map((p) => ({ ...p, imageUrl: p.imageUrl || '', supplierId: p.supplierId || firstId, type: p.type || '' }))
      }
    } catch (_) {}
    return initialProducts.map((p) => ({ ...p, imageUrl: p.imageUrl || '', type: p.type || '' }))
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch (_) {}
  }, [products])

  const setProducts = (next) => {
    setProductsState(typeof next === 'function' ? next(products) : next)
  }

  return (
    <ProductsContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider')
  return ctx
}

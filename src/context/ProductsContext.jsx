import React, { createContext, useContext, useState, useEffect } from 'react'
import { products as initialProducts } from '../data/products'

const STORAGE_KEY = 'redprice_products'
const SUPPLIERS_KEY = 'redprice_suppliers'
const SECTIONS = ['platform', 'wholesale']

function getFirstSupplierId() {
  try {
    const s = localStorage.getItem(SUPPLIERS_KEY)
    if (s) {
      const list = JSON.parse(s)
      return list[0]?.id
    }
    return null
  } catch (_) {}
  return 's1'
}

function normalizeProduct(p, firstSupplierId) {
  return {
    ...p,
    imageUrl: p.imageUrl || '',
    type: p.type || '',
    supplierId: p.supplierId || firstSupplierId || 's1',
    article: p.article ?? '',
    barcode: p.barcode ?? '',
  }
}

function mergeUniqueById(existing, incoming) {
  const ids = new Set((existing || []).map((p) => p.id))
  const out = [...(existing || [])]
  for (const p of incoming || []) {
    if (p && p.id && !ids.has(p.id)) {
      out.push(p)
      ids.add(p.id)
    }
  }
  return out
}

function loadProducts() {
  const firstId = getFirstSupplierId()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (Array.isArray(data)) {
        return {
          platform: data.map((p) => normalizeProduct(p, firstId)),
          wholesale: [],
        }
      }
      let platform = (data.platform || []).map((p) => normalizeProduct(p, firstId))
      const wholesale = (data.wholesale || []).map((p) => normalizeProduct(p, firstId))
      const legacyProc = (data.procurement || []).map((p) => normalizeProduct(p, firstId))
      if (legacyProc.length) {
        platform = mergeUniqueById(platform, legacyProc)
      }
      return { platform, wholesale }
    }
  } catch (_) {}
  const defaultList = initialProducts.map((p) => normalizeProduct(p, firstId))
  return {
    platform: defaultList,
    wholesale: [],
  }
}

const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const [state, setState] = useState(loadProducts)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (_) {}
  }, [state])

  const setProductsForSection = (section, next) => {
    if (!SECTIONS.includes(section)) return
    setState((prev) => ({
      ...prev,
      [section]: typeof next === 'function' ? next(prev[section] || []) : next,
    }))
  }

  const getProducts = (section) => state[section] || []

  return (
    <ProductsContext.Provider value={{ state, getProducts, setProductsForSection }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts(section = 'platform') {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider')
  const products = ctx.getProducts(section)
  const setProducts = (next) => ctx.setProductsForSection(section, next)
  return { products, setProducts }
}

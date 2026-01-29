import React, { createContext, useContext, useState, useEffect } from 'react'
import { categories as initialCategories } from '../data/categories'

const STORAGE_KEY = 'redprice_categories'

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const [categories, setCategoriesState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return initialCategories
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
    } catch (_) {}
  }, [categories])

  const setCategories = (next) => {
    setCategoriesState(typeof next === 'function' ? next(categories) : next)
  }

  return (
    <CategoriesContext.Provider value={{ categories, setCategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider')
  return ctx
}

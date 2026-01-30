import React, { createContext, useContext, useState, useEffect } from 'react'
import { categories as initialCategories } from '../data/categories'

const STORAGE_KEY = 'redprice_categories'
const SECTIONS = ['platform', 'wholesale', 'procurement']

function loadCategories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (Array.isArray(data)) return { platform: data, wholesale: [], procurement: [] }
      return {
        platform: data.platform || [],
        wholesale: data.wholesale || [],
        procurement: data.procurement || []
      }
    }
  } catch (_) {}
  return {
    platform: initialCategories,
    wholesale: [],
    procurement: []
  }
}

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const [state, setState] = useState(loadCategories)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (_) {}
  }, [state])

  const setCategoriesForSection = (section, next) => {
    if (!SECTIONS.includes(section)) return
    setState((prev) => ({
      ...prev,
      [section]: typeof next === 'function' ? next(prev[section] || []) : next
    }))
  }

  const getCategories = (section) => state[section] || []

  return (
    <CategoriesContext.Provider value={{ state, getCategories, setCategoriesForSection }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories(section = 'platform') {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider')
  const categories = ctx.getCategories(section)
  const setCategories = (next) => ctx.setCategoriesForSection(section, next)
  return { categories, setCategories }
}

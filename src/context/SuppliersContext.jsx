import React, { createContext, useContext, useState, useEffect } from 'react'
import { suppliers as initialSuppliers } from '../data/suppliers'

const STORAGE_KEY = 'redprice_suppliers'

const SuppliersContext = createContext(null)

export function SuppliersProvider({ children }) {
  const [suppliers, setSuppliersState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return initialSuppliers
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers))
    } catch (_) {}
  }, [suppliers])

  const setSuppliers = (next) => {
    setSuppliersState(typeof next === 'function' ? next(suppliers) : next)
  }

  return (
    <SuppliersContext.Provider value={{ suppliers, setSuppliers }}>
      {children}
    </SuppliersContext.Provider>
  )
}

export function useSuppliers() {
  const ctx = useContext(SuppliersContext)
  if (!ctx) throw new Error('useSuppliers must be used inside SuppliersProvider')
  return ctx
}

import { createContext, useContext, useState, useEffect } from 'react'
import { suppliersData as initialData } from '../data/suppliers'

const SuppliersContext = createContext()

export const useSuppliers = () => {
  const context = useContext(SuppliersContext)
  if (!context) {
    throw new Error('useSuppliers must be used within SuppliersProvider')
  }
  return context
}

export const SuppliersProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState(() => {
    // Загружаем данные из localStorage или используем начальные данные
    const saved = localStorage.getItem('suppliersData')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return initialData
      }
    }
    return initialData
  })

  // Сохраняем данные в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('suppliersData', JSON.stringify(suppliers))
  }, [suppliers])

  const addSupplier = (supplier) => {
    const newSupplier = {
      ...supplier,
      id: Math.max(...suppliers.map(s => s.id), 0) + 1,
      products: supplier.products || []
    }
    setSuppliers([...suppliers, newSupplier])
  }

  const updateSupplier = (id, updatedSupplier) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...updatedSupplier, id } : s))
  }

  const deleteSupplier = (id) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  const addProduct = (supplierId, product) => {
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          products: [...(s.products || []), product]
        }
      }
      return s
    }))
  }

  const updateProduct = (supplierId, productIndex, updatedProduct) => {
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        const newProducts = [...(s.products || [])]
        newProducts[productIndex] = updatedProduct
        return {
          ...s,
          products: newProducts
        }
      }
      return s
    }))
  }

  const deleteProduct = (supplierId, productIndex) => {
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          products: (s.products || []).filter((_, index) => index !== productIndex)
        }
      }
      return s
    }))
  }

  const value = {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProduct,
    updateProduct,
    deleteProduct
  }

  return (
    <SuppliersContext.Provider value={value}>
      {children}
    </SuppliersContext.Provider>
  )
}

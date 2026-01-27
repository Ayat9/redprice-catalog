import { createContext, useContext, useState, useEffect } from 'react'

const CategoriesContext = createContext()

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider')
  }
  return context
}

const DEFAULT_CATEGORIES = [
  'Трубы',
  'Фитинги',
  'Краны',
  'Смесители',
  'Радиаторы',
  'Котлы',
  'Насосы',
  'Фильтры',
  'Изоляция',
  'Инструменты',
  'Крепеж',
  'Сантехника',
  'Электрика',
  'Другое'
]

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('productCategories')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return DEFAULT_CATEGORIES
      }
    }
    return DEFAULT_CATEGORIES
  })

  useEffect(() => {
    localStorage.setItem('productCategories', JSON.stringify(categories))
  }, [categories])

  const addCategory = (category) => {
    if (category && !categories.includes(category)) {
      setCategories([...categories, category])
    }
  }

  const updateCategory = (oldCategory, newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories(categories.map(cat => cat === oldCategory ? newCategory : cat))
    }
  }

  const deleteCategory = (category) => {
    setCategories(categories.filter(cat => cat !== category))
  }

  const reorderCategories = (newOrder) => {
    setCategories(newOrder)
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

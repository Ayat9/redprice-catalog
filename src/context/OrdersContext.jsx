import React, { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'redprice_orders'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const [orders, setOrdersState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch (_) {}
  }, [orders])

  const addOrder = (order) => {
    const withId = { ...order, id: order.id || `ord_${Date.now()}`, createdAt: order.createdAt || new Date().toISOString() }
    setOrdersState((prev) => [withId, ...prev])
  }

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  )
}

const defaultOrdersValue = { orders: [], addOrder: () => {} }

export function useOrders() {
  const ctx = useContext(OrdersContext)
  return ctx || defaultOrdersValue
}

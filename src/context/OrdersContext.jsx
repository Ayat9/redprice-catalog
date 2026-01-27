import { createContext, useContext, useState, useEffect } from 'react'

const OrdersContext = createContext()

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ordersData')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('ordersData', JSON.stringify(orders))
  }, [orders])

  const addOrder = (orderData) => {
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...orderData
    }
    setOrders([...orders, newOrder])
    return newOrder
  }

  const getOrdersBySupplier = (supplierId) => {
    return orders.filter(order => order.supplierId === supplierId)
  }

  const getOrdersByCategory = (category) => {
    return orders.filter(order => 
      order.items?.some(item => item.category === category)
    )
  }

  const getAllOrders = () => {
    return orders
  }

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        getOrdersBySupplier,
        getOrdersByCategory,
        getAllOrders
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

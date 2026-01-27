import { createContext, useContext, useState, useEffect } from 'react'

const CustomersContext = createContext()

export const useCustomers = () => {
  const context = useContext(CustomersContext)
  if (!context) {
    throw new Error('useCustomers must be used within CustomersProvider')
  }
  return context
}

export const CustomersProvider = ({ children }) => {
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customersData')
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
    localStorage.setItem('customersData', JSON.stringify(customers))
  }, [customers])

  const addCustomer = (customer) => {
    const newCustomer = {
      ...customer,
      id: Math.max(...customers.map(c => c.id || 0), 0) + 1
    }
    setCustomers([...customers, newCustomer])
  }

  const updateCustomer = (id, updatedCustomer) => {
    setCustomers(customers.map(c => c.id === id ? { ...updatedCustomer, id } : c))
  }

  const deleteCustomer = (id) => {
    setCustomers(customers.filter(c => c.id !== id))
  }

  const value = {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  }

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  )
}

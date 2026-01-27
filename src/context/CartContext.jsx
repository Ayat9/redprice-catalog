import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart')
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
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (supplierId, supplierName, product, quantityBoxes = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.supplierId === supplierId && item.productName === product.name
      )

      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart]
        updatedCart[existingItemIndex].quantityBoxes += quantityBoxes
        return updatedCart
      }

      return [...prevCart, {
        supplierId,
        supplierName,
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        quantityPerBox: product.quantityPerBox,
        quantityBoxes,
        variants: product.variants
      }]
    })
  }

  const updateCartItem = (index, quantityBoxes) => {
    if (quantityBoxes <= 0) {
      removeFromCart(index)
      return
    }
    setCart(prevCart => {
      const updatedCart = [...prevCart]
      updatedCart[index].quantityBoxes = quantityBoxes
      return updatedCart
    })
  }

  const removeFromCart = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.productPrice * item.quantityBoxes)
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantityBoxes, 0)
  }

  const groupCartBySupplier = () => {
    const grouped = {}
    cart.forEach(item => {
      if (!grouped[item.supplierId]) {
        grouped[item.supplierId] = {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          items: []
        }
      }
      grouped[item.supplierId].items.push(item)
    })
    return Object.values(grouped)
  }

  const value = {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    groupCartBySupplier
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

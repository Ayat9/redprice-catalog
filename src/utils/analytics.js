// Утилиты для аналитики и АБС анализа

// АБС анализ - разделение на группы A, B, C
export function performABCAnalysis(items, valueKey = 'revenue') {
  // Сортируем по убыванию значения
  const sorted = [...items].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
  
  // Вычисляем общую сумму
  const total = sorted.reduce((sum, item) => sum + (item[valueKey] || 0), 0)
  
  let cumulative = 0
  const result = sorted.map((item, index) => {
    cumulative += item[valueKey] || 0
    const percentage = (cumulative / total) * 100
    
    let category = 'C'
    if (percentage <= 80) {
      category = 'A'
    } else if (percentage <= 95) {
      category = 'B'
    }
    
    return {
      ...item,
      category,
      percentage: ((item[valueKey] || 0) / total) * 100,
      cumulativePercentage: percentage
    }
  })
  
  return result
}

// Анализ по категориям
export function analyzeByCategories(orders) {
  const categoryStats = {}
  
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        const category = item.category || 'Без категории'
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            revenue: 0,
            quantity: 0,
            orders: 0,
            items: []
          }
        }
        
        const itemRevenue = (item.price || 0) * (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        categoryStats[category].revenue += itemRevenue
        categoryStats[category].quantity += (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        categoryStats[category].orders += 1
        categoryStats[category].items.push(item)
      })
    }
  })
  
  const categories = Object.values(categoryStats)
  return performABCAnalysis(categories, 'revenue')
}

// Анализ по поставщикам
export function analyzeBySuppliers(orders) {
  const supplierStats = {}
  
  orders.forEach(order => {
    const supplierId = order.supplierId
    const supplierName = order.supplierName || 'Неизвестный поставщик'
    
    if (!supplierStats[supplierId]) {
      supplierStats[supplierId] = {
        supplierId,
        supplierName,
        revenue: 0,
        quantity: 0,
        orders: 0,
        items: []
      }
    }
    
    let orderRevenue = 0
    if (order.items) {
      order.items.forEach(item => {
        const itemRevenue = (item.price || 0) * (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        orderRevenue += itemRevenue
        supplierStats[supplierId].quantity += (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        supplierStats[supplierId].items.push(item)
      })
    }
    
    supplierStats[supplierId].revenue += orderRevenue
    supplierStats[supplierId].orders += 1
  })
  
  const suppliers = Object.values(supplierStats)
  return performABCAnalysis(suppliers, 'revenue')
}

// Топ товаров по продажам
export function getTopProducts(orders, limit = 10) {
  const productStats = {}
  
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        const key = `${item.productName}_${item.supplierId}`
        if (!productStats[key]) {
          productStats[key] = {
            productName: item.productName,
            supplierId: item.supplierId,
            supplierName: item.supplierName,
            category: item.category,
            revenue: 0,
            quantity: 0,
            orders: 0,
            price: item.price || 0
          }
        }
        
        const quantity = (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        productStats[key].revenue += (item.price || 0) * quantity
        productStats[key].quantity += quantity
        productStats[key].orders += 1
      })
    }
  })
  
  const products = Object.values(productStats)
  return products
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// Расчет рентабельности (упрощенный)
export function calculateProfitability(product, orders) {
  // Находим заказы с этим товаром
  const productOrders = orders.filter(order => 
    order.items?.some(item => 
      item.productName === product.name && 
      (product.supplierId === undefined || item.supplierId === product.supplierId)
    )
  )
  
  let totalRevenue = 0
  let totalQuantity = 0
  
  productOrders.forEach(order => {
    order.items?.forEach(item => {
      if (item.productName === product.name && 
          (product.supplierId === undefined || item.supplierId === product.supplierId)) {
        const quantity = (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
        totalRevenue += (item.price || 0) * quantity
        totalQuantity += quantity
      }
    })
  })
  
  // Упрощенный расчет рентабельности
  // Предполагаем, что себестоимость составляет 70% от цены продажи
  const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : product.price
  const costPrice = product.price * 0.7 // Себестоимость
  const profitPerUnit = avgPrice - costPrice
  const profitability = avgPrice > 0 ? (profitPerUnit / avgPrice) * 100 : 0
  
  return {
    revenue: totalRevenue,
    quantity: totalQuantity,
    orders: productOrders.length,
    profitability: Math.max(0, Math.round(profitability)),
    avgPrice
  }
}

// Общая статистика
export function getOverallStats(orders) {
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.items) {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price || 0) * (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
      }, 0)
    }
    return sum
  }, 0)
  
  const totalQuantity = orders.reduce((sum, order) => {
    if (order.items) {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.quantityBoxes || 0) * (item.quantityPerBox || 1)
      }, 0)
    }
    return sum
  }, 0)
  
  return {
    totalOrders: orders.length,
    totalRevenue,
    totalQuantity,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
  }
}

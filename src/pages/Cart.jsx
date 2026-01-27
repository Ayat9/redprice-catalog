import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSuppliers } from '../context/SuppliersContext'
import { useCustomers } from '../context/CustomersContext'
import { useOrders } from '../context/OrdersContext'
import { sendWhatsAppMessage } from './AdminSettings'
import './Cart.css'

function Cart() {
  const { cart, updateCartItem, removeFromCart, clearCart, getCartTotal, groupCartBySupplier } = useCart()
  const { suppliers } = useSuppliers()
  const navigate = useNavigate()
  const [showOrderForm, setShowOrderForm] = useState(false)

  const groupedCart = groupCartBySupplier()

  if (cart.length === 0) {
    return (
      <div className="cart">
        <div className="cart-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары в корзину для оформления заказа</p>
          <Link to="/" className="btn btn-primary">
            Перейти к каталогу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <h1>Корзина</h1>
        <button className="btn btn-secondary" onClick={clearCart}>
          Очистить корзину
        </button>
      </div>

      <div className="cart-content">
        {groupedCart.map((group, groupIndex) => {
          const supplier = suppliers.find(s => s.id === group.supplierId)
          const groupTotal = group.items.reduce((sum, item) => 
            sum + (item.productPrice * item.quantityBoxes), 0
          )

          return (
            <div key={groupIndex} className="cart-supplier-group">
              <div className="supplier-group-header">
                <h2>{group.supplierName}</h2>
                {supplier?.whatsapp && (
                  <span className="whatsapp-badge">WhatsApp: {supplier.whatsapp}</span>
                )}
              </div>

              <div className="cart-items">
                {group.items.map((item, itemIndex) => {
                  const globalIndex = cart.findIndex(cartItem => 
                    cartItem.supplierId === item.supplierId && 
                    cartItem.productName === item.productName
                  )

                  return (
                    <div key={itemIndex} className="cart-item">
                      <div className="cart-item-info">
                        <h3>{item.productName}</h3>
                        {item.productDescription && (
                          <p className="cart-item-description">{item.productDescription}</p>
                        )}
                        <div className="cart-item-details">
                          <span>Цена за коробку: {item.productPrice} ₸</span>
                          {item.quantityPerBox && (
                            <span>В коробке: {item.quantityPerBox} шт</span>
                          )}
                        </div>
                      </div>
                      <div className="cart-item-controls">
                        <div className="quantity-control">
                          <label>Количество коробок:</label>
                          <div className="quantity-input-group">
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartItem(globalIndex, item.quantityBoxes - 1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantityBoxes}
                              onChange={(e) => updateCartItem(globalIndex, parseInt(e.target.value) || 1)}
                              className="quantity-input"
                            />
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartItem(globalIndex, item.quantityBoxes + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="cart-item-total">
                          <strong>Итого: {item.productPrice * item.quantityBoxes} ₸</strong>
                        </div>
                        <button
                          className="btn btn-delete-small"
                          onClick={() => removeFromCart(globalIndex)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="supplier-group-total">
                <strong>Итого по поставщику: {groupTotal} ₸</strong>
              </div>
            </div>
          )
        })}

        <div className="cart-summary">
          <div className="cart-total">
            <h2>Общая сумма: {getCartTotal()} ₸</h2>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setShowOrderForm(true)}
          >
            Оформить заказ
          </button>
        </div>
      </div>

      {showOrderForm && (
        <OrderForm
          groupedCart={groupedCart}
          suppliers={suppliers}
          total={getCartTotal()}
          onClose={() => setShowOrderForm(false)}
          onSuccess={() => {
            clearCart()
            setShowOrderForm(false)
            navigate('/')
          }}
        />
      )}
    </div>
  )
}

function OrderForm({ groupedCart, suppliers, total, onClose, onSuccess }) {
  const { customers } = useCustomers()
  const { addOrder } = useOrders()
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: ''
  })
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [paymentSuppliers, setPaymentSuppliers] = useState([])

  // Обновляем форму при выборе клиента
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId)
    if (customerId) {
      const customer = customers.find(c => c.id === parseInt(customerId))
      if (customer) {
        setFormData({
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          notes: formData.notes
        })
      }
    } else {
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        notes: formData.notes
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Проверяем наличие настроек API
    const savedSettings = localStorage.getItem('whatsappApiSettings')
    let apiSettings = null
    
    if (savedSettings) {
      try {
        apiSettings = JSON.parse(savedSettings)
      } catch (e) {
        console.error('Error loading API settings:', e)
      }
    }

    const useApi = apiSettings && apiSettings.apiKey && apiSettings.whatsappApiProvider

    // Проверяем поставщиков без WhatsApp
    const suppliersWithoutWhatsApp = groupedCart
      .filter(group => {
        const supplier = suppliers.find(s => s.id === group.supplierId)
        return !supplier?.whatsapp
      })
      .map(group => group.supplierName)

    if (suppliersWithoutWhatsApp.length > 0) {
      const confirmMessage = `У следующих поставщиков не указан номер WhatsApp:\n${suppliersWithoutWhatsApp.join('\n')}\n\nПродолжить оформление заказа для остальных поставщиков?`
      if (!window.confirm(confirmMessage)) {
        return // Отменяем, если пользователь не хочет продолжать
      }
    }

    // Формируем заказы для каждого поставщика
    const sendPromises = groupedCart.map(async (group) => {
      const supplier = suppliers.find(s => s.id === group.supplierId)
      if (!supplier?.whatsapp) {
        // Пропускаем поставщиков без WhatsApp, но не прерываем процесс
        return { success: false, supplier: group.supplierName, skipped: true }
      }

      let message = `*ЗАКАЗ*\n\n`
      message += `*Клиент:*\n`
      message += `Имя: ${formData.customerName}\n`
      message += `Телефон: ${formData.customerPhone}\n`
      message += `Адрес: ${formData.customerAddress}\n\n`
      message += `*Товары:*\n\n`

      group.items.forEach((item, index) => {
        message += `${index + 1}. ${item.productName}\n`
        if (item.productDescription) {
          message += `   Описание: ${item.productDescription}\n`
        }
        message += `   Количество коробок: ${item.quantityBoxes}\n`
        if (item.quantityPerBox) {
          message += `   В коробке: ${item.quantityPerBox} шт\n`
          message += `   Всего штук: ${item.quantityBoxes * item.quantityPerBox}\n`
        }
        message += `   Цена за коробку: ${item.productPrice} ₸\n`
        message += `   Сумма: ${item.productPrice * item.quantityBoxes} ₸\n\n`
      })

      message += `*Общая сумма: ${group.items.reduce((sum, item) => sum + (item.productPrice * item.quantityBoxes), 0)} ₸*\n\n`
      
      if (formData.notes) {
        message += `*Примечания:*\n${formData.notes}`
      }

      // Отправляем через API или открываем WhatsApp
      if (useApi) {
        try {
          const result = await sendWhatsAppMessage(
            apiSettings,
            supplier.whatsapp,
            'Заказ',
            message
          )
          
          if (result.success) {
            return { success: true, supplier: group.supplierName }
          } else {
            // Если API не сработал, открываем WhatsApp как fallback
            const whatsappNumber = supplier.whatsapp.replace(/[^0-9]/g, '')
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, '_blank')
            return { success: true, supplier: group.supplierName, fallback: true }
          }
        } catch (error) {
          // Fallback на обычный WhatsApp
          const whatsappNumber = supplier.whatsapp.replace(/[^0-9]/g, '')
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
          window.open(whatsappUrl, '_blank')
          return { success: true, supplier: group.supplierName, fallback: true }
        }
      } else {
        // Открываем WhatsApp в новой вкладке
        const whatsappNumber = supplier.whatsapp.replace(/[^0-9]/g, '')
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
        return { success: true, supplier: group.supplierName }
      }
    })

    // Ждем отправки всех сообщений
    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    const skippedCount = results.filter(r => r.skipped).length
    
    // Сохраняем заказы в историю для аналитики
    groupedCart.forEach(group => {
      const supplier = suppliers.find(s => s.id === group.supplierId)
      if (supplier) {
        const orderItems = group.items.map(item => {
          // Получаем категорию товара из данных поставщика
          const product = supplier.products?.find(p => p.name === item.productName)
          return {
            productName: item.productName,
            productDescription: item.productDescription,
            price: item.productPrice,
            quantityBoxes: item.quantityBoxes,
            quantityPerBox: item.quantityPerBox,
            category: product?.category || null,
            brand: product?.brand || null,
            model: product?.model || null,
            supplierId: group.supplierId,
            supplierName: group.supplierName
          }
        })
        
        addOrder({
          supplierId: group.supplierId,
          supplierName: group.supplierName,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          items: orderItems,
          total: group.items.reduce((sum, item) => sum + (item.productPrice * item.quantityBoxes), 0),
          notes: formData.notes
        })
      }
    })
    
    // Собираем поставщиков с Kaspi Pay для показа QR кодов
    const suppliersWithPayment = groupedCart
      .map(group => {
        const supplier = suppliers.find(s => s.id === group.supplierId)
        const groupTotal = group.items.reduce((sum, item) => 
          sum + (item.productPrice * item.quantityBoxes), 0
        )
        
        if (supplier && (supplier.kaspiPayMerchantId || supplier.requisites)) {
          return {
            supplier,
            total: groupTotal,
            orderId: `ORDER-${supplier.id}-${Date.now()}`
          }
        }
        return null
      })
      .filter(Boolean)

    // Формируем сообщение о результате
    let resultMessage = ''
    if (skippedCount > 0) {
      resultMessage = `Заказы отправлены для ${successCount} поставщиков. ${skippedCount} поставщиков пропущено (нет WhatsApp).`
    } else if (useApi && successCount === results.length) {
      resultMessage = 'Заказы успешно отправлены через WhatsApp API!'
    } else if (useApi) {
      resultMessage = 'Заказы отправлены. Некоторые сообщения могли быть отправлены через WhatsApp Web.'
    } else {
      resultMessage = 'Заказы отправлены в WhatsApp.'
    }

    if (suppliersWithPayment.length > 0) {
      setPaymentSuppliers(suppliersWithPayment)
      setOrderSubmitted(true)
      
      // Показываем уведомление
      if (resultMessage) {
        alert(resultMessage + ' Теперь вы можете оплатить заказ.')
      } else {
        alert('Заказы отправлены! Теперь вы можете оплатить заказ.')
      }
    } else {
      // Если есть успешные заказы, очищаем корзину
      if (successCount > 0) {
        alert(resultMessage || 'Заказы отправлены!')
        onSuccess()
      } else {
        // Если нет успешных заказов, не очищаем корзину
        alert('Не удалось отправить заказы. Проверьте настройки WhatsApp у поставщиков.')
      }
    }
  }

  if (orderSubmitted && paymentSuppliers.length > 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content order-form-modal payment-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Оплата заказа</h2>
            <button className="close-btn" onClick={() => {
              setOrderSubmitted(false)
              setPaymentSuppliers([])
              onSuccess()
            }}>×</button>
          </div>
          <div className="payment-content">
            <div className="payment-notification">
              <div className="notification-icon">✓</div>
              <h3>Заказ успешно оформлен!</h3>
              <p>Выберите способ оплаты для каждого поставщика</p>
            </div>

            {paymentSuppliers.map((payment, index) => (
              <div key={index} className="payment-supplier-block">
                <h4>{payment.supplier.name}</h4>
                <p className="payment-amount">К оплате: {payment.total} ₸</p>
                
                {payment.supplier.kaspiPayMerchantId && payment.supplier.kaspiPayPhone && (
                  <div className="kaspi-pay-info">
                    <h5>Оплата через Kaspi Pay</h5>
                    <p>Merchant ID: {payment.supplier.kaspiPayMerchantId}</p>
                    <p>Телефон: {payment.supplier.kaspiPayPhone}</p>
                    <p className="kaspi-note">Оплатите через приложение Kaspi по указанным данным</p>
                  </div>
                )}

                {payment.supplier.requisites && (
                  <div className="requisites-block">
                    <h5>Банковские реквизиты:</h5>
                    <div className="requisites-content">
                      {payment.supplier.requisites.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="payment-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setOrderSubmitted(false)
                  setPaymentSuppliers([])
                  onSuccess()
                }}
              >
                Оплата завершена
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Оформление заказа</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label>Выберите клиента</label>
            <select
              className="customer-select"
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
            >
              <option value="">-- Новый клиент --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
            <small className="form-hint">
              Выберите существующего клиента или заполните данные вручную
            </small>
          </div>
          <div className="form-group">
            <label>Ваше имя *</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Ваш телефон *</label>
            <input
              type="tel"
              required
              placeholder="+77001234567"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Адрес доставки *</label>
            <input
              type="text"
              required
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Примечания к заказу</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация..."
            />
          </div>
          <div className="order-summary">
            <h3>Сумма заказа: {total} ₸</h3>
            <p className="order-info">
              {(() => {
                const savedSettings = localStorage.getItem('whatsappApiSettings')
                const hasApi = savedSettings && JSON.parse(savedSettings).apiKey
                return hasApi 
                  ? 'Заказ будет отправлен через WhatsApp API прямо с сайта.'
                  : 'После нажатия "Отправить заказ" откроется WhatsApp для каждого поставщика с готовым сообщением заказа. Настройте API в админ-панели для отправки прямо с сайта.'
              })()}
            </p>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Отправить заказ
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Cart

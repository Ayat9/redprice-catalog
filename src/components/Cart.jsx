import React from 'react'

function buildWhatsAppUrl(phone, text) {
  const digits = (phone || '').replace(/\D/g, '')
  let num = digits
  if (num.startsWith('8') && num.length === 11) num = '7' + num.slice(1)
  else if (num.length === 10) num = '7' + num
  if (!num || num.length < 10) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildInvoicePrintHtml({ items, total, supplierName, invoiceTitle, orderType }) {
  const dateStr = new Date().toLocaleDateString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const rows = items.map((item, i) => {
    const name = item.product.name
    const variant = item.variant.name || `упак ${item.variant.packQty}шт`
    const qty = item.packQty * item.variant.packQty
    const unitPrice = item.unitPrice ?? item.variant.price
    const price = Number(unitPrice).toLocaleString('ru-KZ')
    const sum = item.total.toLocaleString('ru-KZ')
    return `<tr><td>${i + 1}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(variant)}</td><td>${qty}</td><td>${price}</td><td>${sum}</td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Накладная</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, "Helvetica Neue", sans-serif; margin: 20px; color: #1a1a1a; font-size: 14px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .meta { margin-bottom: 16px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    td:nth-child(1) { width: 32px; text-align: center; }
    td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
    .total { margin-top: 16px; font-size: 16px; font-weight: bold; }
    @media print { body { margin: 15px; } }
  </style>
</head>
<body>
  <h1>${invoiceTitle ? escapeHtml(invoiceTitle) : 'Накладная / Заказ'}</h1>
  <div class="meta">Дата: ${dateStr}${supplierName ? `<br>Поставщик: ${escapeHtml(supplierName)}` : ''}${orderType === 'wholesale' ? '<br>Оптовый заказ' : ''}</div>
  <table>
    <thead>
      <tr><th>№</th><th>Наименование</th><th>Вариант</th><th>Кол-во</th><th>Цена, ₸</th><th>Сумма, ₸</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">Итого: ${total.toLocaleString('ru-KZ')} ₸</div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`
}

function openInvoiceAsPdf({ items, total, supplierName, invoiceTitle, orderType }) {
  const html = buildInvoicePrintHtml({ items, total, supplierName, invoiceTitle, orderType })
  const win = window.open('', '_blank')
  if (!win) {
    alert('Разрешите всплывающие окна для формирования PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
}

function buildInvoicePrintHtmlFromOrder(order) {
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const rows = (order.items || []).map((item, i) => {
    const name = item.productName || ''
    const variant = item.variantName || `упак ${item.unitPerPack || 0}шт`
    const qty = (item.packQty || 0) * (item.unitPerPack || 0)
    const price = Number(item.unitPrice || 0).toLocaleString('ru-KZ')
    const sum = Number(item.total || 0).toLocaleString('ru-KZ')
    return `<tr><td>${i + 1}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(variant)}</td><td>${qty}</td><td>${price}</td><td>${sum}</td></tr>`
  }).join('')
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Накладная</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, "Helvetica Neue", sans-serif; margin: 20px; color: #1a1a1a; font-size: 14px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .meta { margin-bottom: 16px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    td:nth-child(1) { width: 32px; text-align: center; }
    td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
    .total { margin-top: 16px; font-size: 16px; font-weight: bold; }
    @media print { body { margin: 15px; } }
  </style>
</head>
<body>
  <h1>${order.orderType === 'retail' ? 'Заказ интернет-магазина' : order.orderType === 'wholesale' ? 'Заявка оптового клиента' : 'Накладная / Заказ'}</h1>
  <div class="meta">Дата: ${dateStr}${order.orderType === 'retail' ? `<br>Клиент: ${escapeHtml(order.customerName || '')}<br>Телефон: ${escapeHtml(order.customerPhone || '')}<br>${order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка: ' + escapeHtml(order.deliveryAddress || '')}` : ''}${order.supplierName ? `<br>Поставщик: ${escapeHtml(order.supplierName)}` : ''}${order.orderType === 'wholesale' ? '<br>Оптовый заказ' : ''}</div>
  <table>
    <thead>
      <tr><th>№</th><th>Наименование</th><th>Вариант</th><th>Кол-во</th><th>Цена, ₸</th><th>Сумма, ₸</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">Итого: ${Number(order.total || 0).toLocaleString('ru-KZ')} ₸</div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`
}

function openOrderInvoiceAsPdf(order) {
  const html = buildInvoicePrintHtmlFromOrder(order)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

const KASPI_PAY_URL = 'https://pay.kaspi.kz/pay/vaxwszii'
const FREE_DELIVERY_THRESHOLD = 20000

export default function Cart({ items, total, supplierId, supplierName, supplierPhone, blockMessage, isOpen, onClose, onClearCart, onSaveOrder, onUpdateQuantity, orders = [], isWholesale = false, isRetail = false, kaspiPayUrl = KASPI_PAY_URL }) {
  const [cartTab, setCartTab] = React.useState('cart')
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [deliveryType, setDeliveryType] = React.useState('delivery')
  const [deliveryAddress, setDeliveryAddress] = React.useState('')

  const buildOrderFromCart = () => ({
    id: `ord_${Date.now()}`,
    createdAt: new Date().toISOString(),
    supplierId: supplierId || '',
    supplierName: supplierName || '',
    supplierPhone: supplierPhone || '',
    items: items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      variantId: i.variant.id,
      variantName: i.variant.name || `упак ${i.variant.packQty}шт`,
      packQty: i.packQty,
      unitPrice: i.unitPrice ?? i.variant.price,
      unitPerPack: i.variant.packQty,
      total: i.total
    })),
    total,
    ...(isRetail && {
      orderType: 'retail',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : ''
    })
  })

  const handleRetailCheckout = () => {
    if (items.length === 0) return
    const name = customerName.trim()
    const phone = customerPhone.trim()
    if (!name) {
      alert('Укажите имя.')
      return
    }
    if (!phone) {
      alert('Укажите номер телефона.')
      return
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      alert('Укажите адрес доставки или выберите самовывоз.')
      return
    }
    try {
      const order = buildOrderFromCart()
      if (onSaveOrder) onSaveOrder(order)
      onClose()
      if (onClearCart) onClearCart()
      window.location.href = kaspiPayUrl
    } catch (e) {
      console.error(e)
      alert('Ошибка при оформлении заказа.')
    }
  }

  const handleCreateInvoice = () => {
    if (items.length === 0) return
    try {
      const order = buildOrderFromCart()
      if (onSaveOrder) onSaveOrder({ ...order, orderType: isWholesale ? 'wholesale' : 'platform' })
      openInvoiceAsPdf({
        items,
        total,
        supplierName: isWholesale ? null : supplierName,
        invoiceTitle: isWholesale ? 'Заявка оптового клиента' : null,
        orderType: isWholesale ? 'wholesale' : null
      })
      if (!isWholesale) {
        const lines = [
          '📋 *Накладная / Заказ*',
          supplierName ? `Поставщик: ${supplierName}` : '',
          '',
          ...items.map((item, i) => {
            const name = item.product.name
            const variant = item.variant.name || `упак ${item.variant.packQty}шт`
            const qty = item.packQty * item.variant.packQty
            const sum = item.total.toLocaleString('ru-KZ')
            return `${i + 1}. ${name} — ${variant}: ${qty} шт. = ${sum} ₸`
          }),
          '',
          `*Итого: ${total.toLocaleString('ru-KZ')} ₸*`
        ]
        const text = lines.filter(Boolean).join('\n')
        const url = buildWhatsAppUrl(supplierPhone, text)
        if (url) window.open(url, '_blank')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка при формировании накладной.')
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('cart-open')
      return () => document.body.classList.remove('cart-open')
    }
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Корзина</h3>
          <button type="button" className="cart-close" onClick={onClose}>×</button>
        </div>
        <div className="cart-tabs">
          <button type="button" className={`cart-tab ${cartTab === 'cart' ? 'active' : ''}`} onClick={() => setCartTab('cart')}>Корзина</button>
          <button type="button" className={`cart-tab ${cartTab === 'history' ? 'active' : ''}`} onClick={() => setCartTab('history')}>История заказов</button>
        </div>

        {cartTab === 'cart' && (
          <>
            {isRetail ? (
              <div className="cart-supplier cart-supplier-retail">
                Заказ в интернет-магазине Redprice.kz
              </div>
            ) : isWholesale ? (
              <div className="cart-supplier cart-supplier-wholesale">
                Оптовый заказ — заявка для компании Redprice.kz
              </div>
            ) : supplierName ? (
              <div className="cart-supplier">
                Заказ поставщику: <strong>{supplierName}</strong>
              </div>
            ) : null}
            {blockMessage && (
              <div className="cart-block-message">{blockMessage}</div>
            )}
            <ul className="cart-list">
              {items.length === 0 ? (
                <li className="cart-empty">Корзина пуста</li>
              ) : (
                items.map((item, i) => (
                  <li key={i} className="cart-item cart-item-editable">
                    <span className="cart-item-name">{item.product.name} — {item.variant.name || `упак ${item.variant.packQty}шт`}</span>
                    <div className="cart-item-qty-edit">
                      <button type="button" className="cart-qty-btn cart-qty-minus" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product, item.variant, Math.max(0, item.packQty - 1))} title="Уменьшить">−</button>
                      <input type="number" min="0" value={item.packQty} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0) onUpdateQuantity && onUpdateQuantity(item.product, item.variant, v) }} className="cart-qty-input" />
                      <button type="button" className="cart-qty-btn cart-qty-plus" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product, item.variant, item.packQty + 1)} title="Увеличить">+</button>
                    </div>
                    <span className="cart-item-price">{item.total.toLocaleString('ru-KZ')} ₸</span>
                  </li>
                ))
              )}
            </ul>

            {isRetail && items.length > 0 && (
              <div className="cart-checkout-form">
                <p className="cart-checkout-note">При заказе от {FREE_DELIVERY_THRESHOLD.toLocaleString('ru-KZ')} ₸ доставка бесплатная.</p>
                <div className="cart-form-group">
                  <label htmlFor="cart-customer-name">Имя <span className="cart-required">*</span></label>
                  <input id="cart-customer-name" type="text" className="cart-form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Как к вам обращаться" required />
                </div>
                <div className="cart-form-group">
                  <label htmlFor="cart-customer-phone">Телефон <span className="cart-required">*</span></label>
                  <input id="cart-customer-phone" type="tel" className="cart-form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+7 (xxx) xxx-xx-xx" required />
                </div>
                <div className="cart-form-group">
                  <span className="cart-form-label">Получение заказа</span>
                  <div className="cart-radio-group">
                    <label className="cart-radio-label">
                      <input type="radio" name="deliveryType" checked={deliveryType === 'delivery'} onChange={() => setDeliveryType('delivery')} />
                      <span>Доставка</span>
                    </label>
                    <label className="cart-radio-label">
                      <input type="radio" name="deliveryType" checked={deliveryType === 'pickup'} onChange={() => setDeliveryType('pickup')} />
                      <span>Самовывоз</span>
                    </label>
                  </div>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="cart-form-group">
                    <label htmlFor="cart-delivery-address">Адрес доставки <span className="cart-required">*</span></label>
                    <input id="cart-delivery-address" type="text" className="cart-form-input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Город, улица, дом, квартира" required={deliveryType === 'delivery'} />
                  </div>
                )}
              </div>
            )}

            <div className="cart-footer">
              {items.length > 0 && (
                <>
                  {isRetail ? (
                    <button type="button" className="cart-invoice-btn cart-pay-btn" onClick={handleRetailCheckout} title="Сохранить заказ и перейти к оплате в Kaspi">
                      Перейти к оплате
                    </button>
                  ) : (
                    <button type="button" className="cart-invoice-btn" onClick={handleCreateInvoice} title={isWholesale ? 'Сохранить заявку и открыть накладную для печати' : supplierPhone ? 'Сохранить в историю, открыть PDF и WhatsApp' : 'У поставщика не указан телефон'}>
                      {isWholesale ? 'Оформить заявку' : 'Сформировать накладную'}
                    </button>
                  )}
                  <button type="button" className="cart-clear-btn" onClick={onClearCart}>
                    Очистить корзину
                  </button>
                </>
              )}
              <strong>Итого: {total.toLocaleString('ru-KZ')} ₸</strong>
            </div>
          </>
        )}

        {cartTab === 'history' && (
          <div className="cart-history">
            {orders.length === 0 ? (
              <p className="cart-empty">История заказов пуста</p>
            ) : (
              <ul className="cart-order-list">
                {orders.map((order) => (
                  <li key={order.id} className="cart-order-item">
                    <div className="cart-order-meta">
                      <span className="cart-order-date">{new Date(order.createdAt).toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="cart-order-supplier">{order.orderType === 'retail' ? (order.customerName ? `${order.customerName}, ${order.deliveryType === 'pickup' ? 'самовывоз' : 'доставка'}` : 'Интернет-магазин') : order.orderType === 'wholesale' ? 'Оптовый заказ' : (order.supplierName || '—')}</span>
                      <span className="cart-order-total">{Number(order.total || 0).toLocaleString('ru-KZ')} ₸</span>
                    </div>
                    <button type="button" className="cart-order-invoice-btn" onClick={() => openOrderInvoiceAsPdf(order)} title="Скачать накладную (печать в PDF)">
                      Скачать накладную
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

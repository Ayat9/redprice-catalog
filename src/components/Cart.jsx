export default function Cart({ items, total, isOpen, onClose }) {
  if (!isOpen) return null
  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Корзина</h3>
          <button type="button" className="cart-close" onClick={onClose}>×</button>
        </div>
        <ul className="cart-list">
          {items.length === 0 ? (
            <li className="cart-empty">Корзина пуста</li>
          ) : (
            items.map((item, i) => (
              <li key={i} className="cart-item">
                <span className="cart-item-name">{item.product.name} — {item.variant.name || `упак ${item.variant.packQty}шт`}</span>
                <span className="cart-item-qty">{item.packQty} упак × {item.variant.packQty}шт</span>
                <span className="cart-item-price">{item.total.toLocaleString('ru-KZ')}₸</span>
              </li>
            ))
          )}
        </ul>
        <div className="cart-footer">
          <strong>Итого: {total.toLocaleString('ru-KZ')}₸</strong>
        </div>
      </div>
    </div>
  )
}

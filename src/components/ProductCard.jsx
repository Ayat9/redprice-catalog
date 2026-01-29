import React, { useState } from 'react'

export default function ProductCard({ product, view = 'medium', onAddToCart, onDecreaseFromCart, getCartQty }) {
  const [imageOpen, setImageOpen] = useState(false)

  return (
    <article className={`product-card product-card--${view}`}>
      {product.imageUrl && (
        <>
          <button type="button" className="product-card-image-wrap" onClick={() => setImageOpen(true)} title="Увеличить фото">
            <img src={product.imageUrl} alt={product.name} className="product-card-image" />
          </button>
          {imageOpen && (
            <div className="product-image-overlay" onClick={() => setImageOpen(false)}>
              <button type="button" className="product-image-overlay-close" onClick={() => setImageOpen(false)} aria-label="Закрыть">×</button>
              <img src={product.imageUrl} alt={product.name} className="product-image-expanded" onClick={(e) => e.stopPropagation()} />
            </div>
          )}
        </>
      )}
      <h4 className="product-name">{product.name}</h4>
      {product.type && <p className="product-type">Тип: {product.type}</p>}
      <div className="product-variants">
        {product.variants.map((v) => (
          <VariantRow
            key={v.id}
            product={product}
            variant={v}
            onAddToCart={onAddToCart}
            onDecreaseFromCart={onDecreaseFromCart}
            cartQty={getCartQty ? getCartQty(product, v) : 0}
          />
        ))}
      </div>
    </article>
  )
}

function VariantRow({ product, variant, onAddToCart, onDecreaseFromCart, cartQty }) {
  const nameLabel = variant.name || 'Вариант'
  const total = variant.price * cartQty * variant.packQty

  return (
    <div className="variant-row">
      <span className="variant-label variant-label-name">Название: <strong>{nameLabel}</strong></span>
      <span className="variant-label variant-label-meta">Цена: <strong>{variant.price.toLocaleString('ru-KZ')} ₸</strong> за упак · В упаковке: <strong>{variant.packQty} шт</strong></span>
      <div className="variant-actions">
        <button
          type="button"
          className="btn-qty btn-qty-minus"
          onClick={() => onDecreaseFromCart && onDecreaseFromCart(product, variant)}
          disabled={cartQty === 0}
          title="Убрать из корзины"
        >
          −
        </button>
        <span className="variant-qty">В корзине: {cartQty} упак</span>
        <button
          type="button"
          className="btn-qty btn-qty-plus"
          onClick={() => onAddToCart(product, variant, 1)}
          title="Добавить в корзину"
        >
          +
        </button>
      </div>
      {cartQty > 0 && <span className="variant-total">Сумма: {total.toLocaleString('ru-KZ')} ₸</span>}
    </div>
  )
}

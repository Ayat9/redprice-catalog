import React, { useState } from 'react'
import { getVariantPrice } from '../utils/priceMode'

export default function ProductCard({ product, view = 'medium', onAddToCart, onDecreaseFromCart, getCartQty, showCartActions = true, priceMode }) {
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
            priceMode={priceMode}
            onAddToCart={onAddToCart}
            onDecreaseFromCart={onDecreaseFromCart}
            cartQty={getCartQty ? getCartQty(product, v) : 0}
            showCartActions={showCartActions}
          />
        ))}
      </div>
    </article>
  )
}

function VariantRow({ product, variant, priceMode, onAddToCart, onDecreaseFromCart, cartQty, showCartActions = true }) {
  const nameLabel = variant.name || 'Вариант'
  const unitPrice = getVariantPrice(variant, priceMode)
  const total = unitPrice * cartQty * variant.packQty

  return (
    <div className="variant-row">
      <span className="variant-label variant-label-name">Название: <strong>{nameLabel}</strong></span>
      <span className="variant-label variant-label-meta">Цена: <strong>{unitPrice.toLocaleString('ru-KZ')} ₸</strong> за упак · В упаковке: <strong>{variant.packQty} шт</strong></span>
      {showCartActions && (
        <>
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
              onClick={() => onAddToCart(product, variant, 1, priceMode)}
              title="Добавить в корзину"
            >
              +
            </button>
          </div>
          {cartQty > 0 && <span className="variant-total">Сумма: {total.toLocaleString('ru-KZ')} ₸</span>}
        </>
      )}
    </div>
  )
}

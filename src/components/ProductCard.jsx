import React from 'react'

export default function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <h4 className="product-name">{product.name}</h4>
      <div className="product-variants">
        {product.variants.map((v) => (
          <VariantRow
            key={v.id}
            product={product}
            variant={v}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </article>
  )
}

function VariantRow({ product, variant, onAddToCart }) {
  const [qty, setQty] = React.useState(0)
  const label = variant.name ? `${variant.name}, в упак ${variant.packQty}шт` : `в упак ${variant.packQty}шт`
  const total = variant.price * qty * variant.packQty

  return (
    <div className="variant-row">
      <span className="variant-label">{label}</span>
      <div className="variant-actions">
        <button type="button" className="btn-qty" onClick={() => setQty((n) => Math.max(0, n - 1))}>−</button>
        <span className="variant-qty">{qty} упак</span>
        <button type="button" className="btn-qty" onClick={() => setQty((n) => n + 1)}>+</button>
      </div>
      <span className="variant-total">{total.toLocaleString('ru-KZ')}₸</span>
      {qty > 0 && (
        <button type="button" className="btn-add" onClick={() => { onAddToCart(product, variant, qty); setQty(0) }}>
          В корзину
        </button>
      )}
    </div>
  )
}

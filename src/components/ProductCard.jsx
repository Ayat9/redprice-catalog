import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ImageViewer from './ImageViewer'
import { playAddToCartSound } from '../utils/soundUtils'
import './ProductCard.css'

function ProductCard({ product, supplierId, supplierName, showAddToCart = false, viewMode = 'medium-grid', showImages = true }) {
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  let addToCart = null
  try {
    const cart = useCart()
    addToCart = cart.addToCart
  } catch (e) {
    // Cart context not available
  }

  const handleAddToCart = () => {
    if (addToCart) {
      addToCart(supplierId, supplierName, product, 1)
      // Воспроизводим звук добавления в корзину
      playAddToCartSound()
    }
  }

  // Получаем массив изображений
  const getImages = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    // Обратная совместимость со старым форматом
    if (product.image) {
      return [product.image]
    }
    return []
  }

  const images = getImages()

  const handleImageClick = (index = 0) => {
    if (images.length > 0) {
      setCurrentImageIndex(index)
      setShowImageViewer(true)
    }
  }

  const isListMode = viewMode === 'list'
  const isLargeGrid = viewMode === 'large-grid'
  const isSmallGrid = viewMode === 'small-grid'

  return (
    <>
      <div className={`product-card product-card-${viewMode}`}>
        {showImages && (
          <div className="product-card-image" onClick={() => handleImageClick(0)}>
            {images.length > 0 ? (
              <div className="product-card-image-container">
                <img src={images[0]} alt={product.name} />
                {images.length > 1 && (
                  <div className="product-card-image-count">
                    +{images.length - 1}
                  </div>
                )}
                <div className="product-card-image-overlay">
                  <span className="zoom-icon">🔍</span>
                </div>
              </div>
            ) : (
              <div className="product-card-placeholder">
                {product.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="product-card-content">
        <h4 className="product-card-name">{product.name}</h4>
        {product.description && (
          <p className="product-card-description">{product.description}</p>
        )}
        <div className="product-card-details">
          <div className="product-card-price">
            <span className="price-label">Цена:</span>
            <span className="price-value">{product.price} ₸</span>
          </div>
          {product.quantityPerBox && (
            <div className="product-card-quantity">
              <span className="quantity-label">В упаковке:</span>
              <span className="quantity-value">{product.quantityPerBox} шт</span>
            </div>
          )}
        </div>
        {product.variants && product.variants.length > 0 && (
          <div className="product-card-variants">
            <div className="variants-label">Варианты:</div>
            <div className="variants-list">
              {product.variants.map((variant, index) => (
                <div key={index} className="variant-item">
                  {Object.entries(variant).map(([key, value]) => {
                    if (key === 'quantityPerBox') return null
                    return (
                      <span key={key} className="variant-value">
                        {key === 'volume' || key === 'size' || key === 'type' || key === 'color' 
                          ? `${key === 'volume' ? 'Объём' : key === 'size' ? 'Размер' : key === 'type' ? 'Тип' : 'Цвет'}: ${value}`
                          : `${key}: ${value}`}
                        {variant.quantityPerBox && ` (${variant.quantityPerBox} шт/уп)`}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        {showAddToCart && (
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Добавить в корзину
          </button>
        )}
      </div>
      </div>
      {showImageViewer && images.length > 0 && (
        <ImageViewer
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  )
}

export default ProductCard

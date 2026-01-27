import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSuppliers } from '../context/SuppliersContext'
import { useCategories } from '../context/CategoriesContext'
import { parsePDFCatalog } from '../utils/pdfParser'
import { fileToBase64, validateImageFile, compressImage } from '../utils/imageUtils'
import './SupplierProducts.css'

function SupplierProducts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { suppliers, deleteProduct, addProduct } = useSuppliers()
  const supplier = suppliers.find(s => s.id === parseInt(id))

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showPdfUpload, setShowPdfUpload] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!supplier) {
    return (
      <div className="supplier-products">
        <p>Поставщик не найден</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
          Назад
        </button>
      </div>
    )
  }

  const handleDelete = (productIndex) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteProduct(supplier.id, productIndex)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="supplier-products">
          <div className="products-header">
        <div className="products-header-left">
          <button
            className="btn btn-back"
            onClick={() => navigate('/admin')}
            title="Назад к админ-панели"
          >
            ← Назад
          </button>
          <div className="products-header-info">
            <h1>Товары поставщика: {supplier.name}</h1>
            <p className="supplier-info">📍 {supplier.address}</p>
          </div>
        </div>
        <div className="products-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPdfUpload(true)}
          >
            📄 Загрузить PDF каталог
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProduct(null)
              setShowAddForm(true)
            }}
          >
            + Добавить товар
          </button>
        </div>
      </div>

      {showPdfUpload && (
        <PdfUploadForm
          supplierId={supplier.id}
          onClose={() => setShowPdfUpload(false)}
          onSuccess={() => setShowPdfUpload(false)}
        />
      )}

      {showAddForm && (
        <ProductForm
          supplierId={supplier.id}
          product={editingProduct ? (() => {
            const { index, ...productData } = editingProduct
            return productData
          })() : null}
          productIndex={editingProduct !== null && editingProduct.index !== undefined ? editingProduct.index : null}
          onClose={() => {
            setShowAddForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      <div className="products-list">
        {supplier.products && supplier.products.length > 0 ? (
          <>
            <div className="products-stats-bar">
              <div className="stat-badge">
                <span className="stat-icon">📦</span>
                <span className="stat-text">Всего товаров: <strong>{supplier.products.length}</strong></span>
              </div>
              <div className="stat-badge">
                <span className="stat-icon">💰</span>
                <span className="stat-text">Средняя цена: <strong>
                  {Math.round(supplier.products.reduce((sum, p) => sum + (p.price || 0), 0) / supplier.products.length).toLocaleString()} ₸
                </strong></span>
              </div>
            </div>
            <div className="products-grid">
            {supplier.products.map((product, index) => (
              <div key={index} className="product-item">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  {product.description && <p className="product-description">{product.description}</p>}
                  <div className="product-details">
                    <div className="detail-item">
                      <span className="label">💰 Цена:</span>
                      <span className="value">{product.price.toLocaleString()} ₸</span>
                    </div>
                    {product.quantityPerBox && (
                      <div className="detail-item">
                        <span className="label">📦 В упаковке:</span>
                        <span className="value">{product.quantityPerBox} шт</span>
                      </div>
                    )}
                    {product.variants && product.variants.length > 0 && (
                      <div className="detail-item">
                        <span className="label">Вариантов:</span>
                        <span className="value">{product.variants.length}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    className="btn btn-edit"
                    onClick={() => {
                      setEditingProduct({ ...product, index })
                      setShowAddForm(true)
                    }}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDelete(index)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <div className="no-products">
            <div className="empty-state-icon">📦</div>
            <h3>Нет товаров</h3>
            <p>Добавьте первый товар для этого поставщика</p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => {
                setEditingProduct(null)
                setShowAddForm(true)
              }}
            >
              + Добавить товар
            </button>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  )
}

// Список категорий товаров
const PRODUCT_CATEGORIES = [
  'Трубы',
  'Фитинги',
  'Краны',
  'Смесители',
  'Радиаторы',
  'Котлы',
  'Насосы',
  'Фильтры',
  'Изоляция',
  'Инструменты',
  'Крепеж',
  'Сантехника',
  'Электрика',
  'Другое'
]

function ProductForm({ supplierId, product, productIndex, onClose }) {
  const { addProduct, updateProduct } = useSuppliers()
  const { categories } = useCategories()
  
  // Парсим существующее название при редактировании
  const parseProductName = (name) => {
    if (!name) return { category: '', brand: '', model: '' }
    
    // Пытаемся найти категорию в начале названия
    const category = categories.find(cat => 
      name.toLowerCase().startsWith(cat.toLowerCase())
    ) || ''
    
    // Убираем категорию из названия для дальнейшего парсинга
    let remaining = category ? name.substring(category.length).trim() : name
    
    // Пытаемся разделить на бренд и модель (обычно через пробел)
    const parts = remaining.split(/\s+/)
    if (parts.length >= 2) {
      return {
        category: category || '',
        brand: parts[0] || '',
        model: parts.slice(1).join(' ') || ''
      }
    }
    
    return {
      category: category || '',
      brand: remaining || '',
      model: ''
    }
  }

  // Функция для форматирования текста с заглавной буквы
  const capitalizeFirstLetter = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const initialData = product ? parseProductName(product.name) : { category: '', brand: '', model: '' }
  
  const [formData, setFormData] = useState({
    category: product?.category ? capitalizeFirstLetter(product.category) : (initialData.category ? capitalizeFirstLetter(initialData.category) : ''),
    brand: product?.brand ? capitalizeFirstLetter(product.brand) : (initialData.brand ? capitalizeFirstLetter(initialData.brand) : ''),
    model: product?.model ? capitalizeFirstLetter(product.model) : (initialData.model ? capitalizeFirstLetter(initialData.model) : ''),
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    quantityPerBox: product?.quantityPerBox || '',
    images: product?.images || (product?.image ? [product.image] : []),
    variants: product?.variants || []
  })
  const [variantInput, setVariantInput] = useState('')
  const [uploading, setUploading] = useState(false)

  // Автоматическое формирование названия
  const generateProductName = (category, brand, model) => {
    const parts = []
    if (category) parts.push(category)
    if (brand) parts.push(brand)
    if (model) parts.push(model)
    return parts.join(' ').trim() || ''
  }

  // Обновление названия при изменении категории, бренда или модели
  const updateProductName = (field, value) => {
    // Автоматически форматируем с заглавной буквы для категории, бренда и модели
    const formattedValue = (field === 'category' || field === 'brand' || field === 'model') 
      ? capitalizeFirstLetter(value) 
      : value
    
    const newData = { ...formData, [field]: formattedValue }
    const generatedName = generateProductName(
      field === 'category' ? formattedValue : newData.category,
      field === 'brand' ? formattedValue : newData.brand,
      field === 'model' ? formattedValue : newData.model
    )
    setFormData({ ...newData, name: generatedName })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const newImages = [...formData.images]

    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        const compressed = await compressImage(base64)
        newImages.push(compressed)
      } catch (error) {
        console.error('Error processing image:', error)
        alert(`Ошибка при обработке изображения ${file.name}`)
      }
    }

    setFormData({ ...formData, images: newImages })
    setUploading(false)
    e.target.value = '' // Reset input
  }

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Формируем финальное название
    const finalName = generateProductName(formData.category, formData.brand, formData.model)
    
    if (!finalName) {
      alert('Пожалуйста, заполните хотя бы одно поле: категория, бренд или модель')
      return
    }
    
    const productData = {
      name: finalName,
      category: formData.category || null,
      brand: formData.brand || null,
      model: formData.model || null,
      description: formData.description,
      price: parseFloat(formData.price),
      quantityPerBox: formData.quantityPerBox ? parseInt(formData.quantityPerBox) : null,
      images: formData.images.length > 0 ? formData.images : null,
      // Обратная совместимость
      image: formData.images.length > 0 ? formData.images[0] : null,
      variants: formData.variants.length > 0 ? formData.variants : null
    }

    if (product && productIndex !== null) {
      updateProduct(supplierId, productIndex, productData)
    } else {
      addProduct(supplierId, productData)
    }
    onClose()
  }

  const addVariant = () => {
    if (variantInput.trim()) {
      try {
        const variant = JSON.parse(variantInput)
        setFormData({
          ...formData,
          variants: [...formData.variants, variant]
        })
        setVariantInput('')
      } catch (e) {
        alert('Неверный формат JSON. Пример: {"volume": "10л", "quantityPerBox": 20}')
      }
    }
  }

  const removeVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Категория товара *</label>
            <select
              value={formData.category}
              onChange={(e) => updateProductName('category', e.target.value)}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Бренд *</label>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={(e) => {
                const formatted = capitalizeFirstLetter(e.target.value)
                updateProductName('brand', formatted)
              }}
              placeholder="Например: Rehau, Valfex"
            />
          </div>
          
          <div className="form-group">
            <label>Модель *</label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => {
                const formatted = capitalizeFirstLetter(e.target.value)
                updateProductName('model', formatted)
              }}
              placeholder="Например: RAUTITAN, 20x2.0"
            />
          </div>
          
          <div className="form-group">
            <label>Сформированное название</label>
            <input
              type="text"
              value={formData.name}
              readOnly
              className="readonly-input"
              style={{ 
                background: '#f5f5f5', 
                cursor: 'not-allowed',
                color: '#666'
              }}
            />
            <small className="form-hint">
              Название формируется автоматически из категории, бренда и модели
            </small>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Цена (₸) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>В упаковке (шт)</label>
              <input
                type="number"
                min="1"
                value={formData.quantityPerBox}
                onChange={(e) => setFormData({ ...formData, quantityPerBox: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Изображения товара</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="file-input"
            />
            {uploading && <p className="upload-status">Загрузка изображений...</p>}
            {formData.images.length > 0 && (
              <div className="product-images-preview">
                {formData.images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt={`Предпросмотр ${index + 1}`} />
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <small className="form-hint">
              Загрузите одно или несколько изображений товара. Максимальный размер файла: 5MB. 
              Поддерживаемые форматы: JPG, PNG, GIF, WebP.
            </small>
          </div>
          <div className="form-group">
            <label>Варианты товара (JSON формат)</label>
            <div className="variant-input-group">
              <input
                type="text"
                placeholder='{"volume": "10л", "quantityPerBox": 20}'
                value={variantInput}
                onChange={(e) => setVariantInput(e.target.value)}
              />
              <button type="button" className="btn btn-secondary" onClick={addVariant}>
                Добавить вариант
              </button>
            </div>
            {formData.variants.length > 0 && (
              <div className="variants-list">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="variant-item">
                    <span>{JSON.stringify(variant)}</span>
                    <button
                      type="button"
                      className="btn btn-delete-small"
                      onClick={() => removeVariant(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {product ? 'Сохранить' : 'Добавить'}
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

function PdfUploadForm({ supplierId, onClose, onSuccess }) {
  const { addProduct } = useSuppliers()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [extractedProducts, setExtractedProducts] = useState([])
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // upload, review

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Пожалуйста, выберите PDF файл')
    }
  }

  const handleParse = async () => {
    if (!file) {
      setError('Выберите PDF файл')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await parsePDFCatalog(file)
      
      if (result.success && result.products.length > 0) {
        setExtractedProducts(result.products)
        setStep('review')
      } else {
        setError(result.error || 'Не удалось извлечь товары из PDF. Попробуйте загрузить файл вручную.')
      }
    } catch (err) {
      setError('Ошибка при обработке PDF: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProducts = () => {
    extractedProducts.forEach(product => {
      if (product.name && product.price) {
        addProduct(supplierId, {
          name: product.name,
          description: product.description || '',
          price: product.price,
          quantityPerBox: product.quantityPerBox || null,
          images: product.images && product.images.length > 0 ? product.images : null,
          // Обратная совместимость
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          variants: product.variants || null
        })
      }
    })
    alert(`Добавлено товаров: ${extractedProducts.filter(p => p.name && p.price).length}`)
    onSuccess()
  }

  const handleEditProduct = (index, field, value) => {
    const updated = [...extractedProducts]
    updated[index] = { ...updated[index], [field]: value }
    setExtractedProducts(updated)
  }

  const handleRemoveProduct = (index) => {
    setExtractedProducts(extractedProducts.filter((_, i) => i !== index))
  }

  if (step === 'review') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content pdf-review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Проверьте извлеченные товары</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="pdf-review-content">
            <p className="review-info">
              Найдено товаров: {extractedProducts.length}. Проверьте и отредактируйте данные перед сохранением.
            </p>
            
            <div className="extracted-products-list">
              {extractedProducts.map((product, index) => (
                <div key={index} className="extracted-product-item">
                  <div className="product-edit-fields">
                    <div className="edit-field">
                      <label>Название *</label>
                      <input
                        type="text"
                        value={product.name || ''}
                        onChange={(e) => handleEditProduct(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="edit-field-row">
                      <div className="edit-field">
                        <label>Цена (₸) *</label>
                        <input
                          type="number"
                          value={product.price || ''}
                          onChange={(e) => handleEditProduct(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="edit-field">
                        <label>В упаковке (шт)</label>
                        <input
                          type="number"
                          value={product.quantityPerBox || ''}
                          onChange={(e) => handleEditProduct(index, 'quantityPerBox', parseInt(e.target.value) || null)}
                        />
                      </div>
                    </div>
                    <div className="edit-field">
                      <label>Описание</label>
                      <textarea
                        value={product.description || ''}
                        onChange={(e) => handleEditProduct(index, 'description', e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-delete-small"
                    onClick={() => handleRemoveProduct(index)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            {extractedProducts.length === 0 && (
              <p className="no-products-extracted">
                Товары не найдены в PDF. Попробуйте загрузить другой файл или добавьте товары вручную.
              </p>
            )}

            <div className="pdf-review-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setStep('upload')
                  setExtractedProducts([])
                }}
              >
                Назад
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveProducts}
                disabled={extractedProducts.filter(p => p.name && p.price).length === 0}
              >
                Сохранить товары ({extractedProducts.filter(p => p.name && p.price).length})
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Загрузить PDF каталог</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="pdf-upload-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '15px' }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Выберите PDF файл каталога</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            {file && (
              <p className="file-name">Выбран файл: {file.name}</p>
            )}
            <small className="form-hint">
              Загрузите PDF каталог товаров. Система попытается автоматически извлечь названия, цены и другую информацию.
            </small>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleParse}
              disabled={!file || loading}
            >
              {loading ? 'Обработка...' : 'Обработать PDF'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              Отмена
            </button>
          </div>

          <div className="pdf-upload-info">
            <h4>Как это работает:</h4>
            <ul>
              <li>Загрузите PDF каталог товаров поставщика</li>
              <li>Система автоматически извлечет названия товаров и цены</li>
              <li>Проверьте и отредактируйте извлеченные данные</li>
              <li>Сохраните товары в каталог</li>
            </ul>
            <p className="info-note">
              <strong>Примечание:</strong> Автоматическое извлечение работает лучше с структурированными PDF. 
              Если данные извлечены некорректно, вы можете отредактировать их перед сохранением.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierProducts

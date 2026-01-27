import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../context/CategoriesContext'
import AdminSidebar from '../components/AdminSidebar'
import { useAuth } from '../context/AuthContext'
import './AdminCategories.css'

function AdminCategories() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Функция для форматирования текста с заглавной буквы
  const capitalizeFirstLetter = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const handleAdd = () => {
    const trimmedName = newCategoryName.trim()
    const formattedName = capitalizeFirstLetter(trimmedName)
    
    if (trimmedName && !categories.includes(formattedName)) {
      addCategory(formattedName)
      setNewCategoryName('')
      setShowAddForm(false)
    } else if (categories.includes(formattedName)) {
      alert('Такая категория уже существует')
    }
  }

  const handleEdit = (oldName) => {
    setEditingCategory(oldName)
    setEditCategoryName(oldName)
  }

  const handleSaveEdit = () => {
    const trimmedName = editCategoryName.trim()
    const formattedName = capitalizeFirstLetter(trimmedName)
    
    if (trimmedName && formattedName !== editingCategory) {
      if (!categories.includes(formattedName)) {
        updateCategory(editingCategory, formattedName)
        setEditingCategory(null)
        setEditCategoryName('')
      } else {
        alert('Такая категория уже существует')
      }
    } else {
      setEditingCategory(null)
      setEditCategoryName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditCategoryName('')
  }

  const handleDelete = (category) => {
    if (window.confirm(`Вы уверены, что хотите удалить категорию "${category}"?`)) {
      deleteCategory(category)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <div className="admin-content">
        <div className="admin-categories">
          <div className="admin-page-header">
            <div>
              <h1>Управление категориями товаров</h1>
              <p className="page-subtitle">Добавление и редактирование категорий</p>
            </div>
          </div>

          <div className="categories-content">
        <div className="categories-list-section">
          <div className="section-header">
            <h2>Список категорий ({categories.length})</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Отмена' : '+ Добавить категорию'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-category-form">
              <input
                type="text"
                className="category-input"
                placeholder="Название категории"
                value={newCategoryName}
                onChange={(e) => {
                  const formatted = capitalizeFirstLetter(e.target.value)
                  setNewCategoryName(formatted)
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleAdd}>
                Добавить
              </button>
            </div>
          )}

          <div className="categories-list">
            {categories.length === 0 ? (
              <p className="no-categories">Нет категорий. Добавьте первую категорию.</p>
            ) : (
              categories.map((category, index) => (
                <div key={index} className="category-item">
                  {editingCategory === category ? (
                    <div className="category-edit-form">
                      <input
                        type="text"
                        className="category-input"
                        value={editCategoryName}
                        onChange={(e) => {
                          const formatted = capitalizeFirstLetter(e.target.value)
                          setEditCategoryName(formatted)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-small" onClick={handleSaveEdit}>
                        Сохранить
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={handleCancelEdit}>
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="category-name">{category}</span>
                      <div className="category-actions">
                        <button
                          className="btn btn-edit btn-small"
                          onClick={() => handleEdit(category)}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn btn-delete btn-small"
                          onClick={() => handleDelete(category)}
                        >
                          Удалить
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="categories-info">
          <h3>Информация</h3>
          <p>
            Категории товаров используются для структурирования каталога. 
            При добавлении товара вы сможете выбрать категорию из этого списка.
          </p>
          <p>
            <strong>Всего категорий:</strong> {categories.length}
          </p>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCategories

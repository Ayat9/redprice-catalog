import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useSuppliers } from '../context/SuppliersContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import './Admin.css'

const VIEWS = { products: 'products', suppliers: 'suppliers', categories: 'categories', newProduct: 'newProduct', newCategory: 'newCategory', newSupplier: 'newSupplier', users: 'users', newUser: 'newUser' }

export default function Admin() {
  const { isLoggedIn, login, logout, currentUser, canEdit, canManageUsers, requestPasswordReset, getUsers, addUser, updateUser, deleteUser, DEPARTMENTS, ROLES } = useAdminAuth()
  const { products, setProducts } = useProducts()
  const { categories, setCategories } = useCategories()
  const { suppliers, setSuppliers } = useSuppliers()
  const [view, setView] = useState(VIEWS.products)
  const [loginEmail, setLoginEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetResult, setResetResult] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState(null)
  const [newUserForm, setNewUserForm] = useState({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' })
  const [userFilter, setUserFilter] = useState({ search: '' })
  const [userSort, setUserSort] = useState({ field: 'name', dir: 'asc' })

  useEffect(() => {
    if (!canEdit && (view === VIEWS.newProduct || view === VIEWS.newSupplier || view === VIEWS.newCategory)) setView(VIEWS.products)
  }, [canEdit, view])
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [productForm, setProductForm] = useState(null)
  const [categoryForm, setCategoryForm] = useState(null)
  const [supplierForm, setSupplierForm] = useState(null)
  const [newProductForm, setNewProductForm] = useState(null)
  const [newCategoryForm, setNewCategoryForm] = useState({ id: '', name: '' })
  const [newSupplierForm, setNewSupplierForm] = useState({ id: '', name: '', phone: '', address: '' })
  const [showInlineNewCategory, setShowInlineNewCategory] = useState(false)
  const [showInlineNewSupplier, setShowInlineNewSupplier] = useState(false)
  const [showInlineNewCategoryModal, setShowInlineNewCategoryModal] = useState(false)
  const [showInlineNewSupplierModal, setShowInlineNewSupplierModal] = useState(false)
  const [inlineCategoryForm, setInlineCategoryForm] = useState({ name: '' })
  const [inlineSupplierForm, setInlineSupplierForm] = useState({ name: '', phone: '', address: '' })
  const [productFilter, setProductFilter] = useState({ search: '', supplierId: '', categoryId: '' })
  const [productSort, setProductSort] = useState({ field: 'name', dir: 'asc' })
  const [categoryFilter, setCategoryFilter] = useState({ search: '' })
  const [categorySort, setCategorySort] = useState({ field: 'name', dir: 'asc' })
  const [supplierFilter, setSupplierFilter] = useState({ search: '' })
  const [supplierSort, setSupplierSort] = useState({ field: 'name', dir: 'asc' })

  // ——— Редактирование товара ———
  const openEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      id: product.id,
      name: product.name,
      type: product.type || '',
      imageUrl: product.imageUrl || '',
      supplierId: product.supplierId || suppliers[0]?.id,
      categoryId: product.categoryId,
      variants: product.variants.map((v) => ({ ...v }))
    })
  }

  const closeEditProduct = () => {
    setEditingProduct(null)
    setProductForm(null)
    setShowInlineNewCategoryModal(false)
    setShowInlineNewSupplierModal(false)
  }

  const saveProduct = () => {
    if (!productForm) return
    setProducts((prev) =>
      prev.map((p) => (p.id === productForm.id ? { ...p, ...productForm } : p))
    )
    closeEditProduct()
  }

  const updateProductForm = (field, value) => {
    setProductForm((f) => (f ? { ...f, [field]: value } : f))
  }

  const updateProductVariant = (index, field, value) => {
    setProductForm((f) => {
      if (!f) return f
      const v = [...f.variants]
      v[index] = { ...v[index], [field]: field === 'packQty' || field === 'price' ? Number(value) || 0 : value }
      return { ...f, variants: v }
    })
  }

  const addProductVariant = () => {
    setProductForm((f) => f ? { ...f, variants: [...f.variants, { id: `v${Date.now()}`, name: '', packQty: 1, price: 0 }] } : f)
  }

  const removeProductVariant = (index) => {
    setProductForm((f) => f && f.variants.length > 1 ? { ...f, variants: f.variants.filter((_, i) => i !== index) } : f)
  }

  // ——— Редактирование категории ———
  const openEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({ id: cat.id, name: cat.name })
  }

  const closeEditCategory = () => {
    setEditingCategory(null)
    setCategoryForm(null)
  }

  const saveCategory = () => {
    if (!categoryForm) return
    const prevId = editingCategory?.id
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === prevId ? { ...c, ...categoryForm } : c))
      if (prevId !== categoryForm.id) {
        const idx = next.findIndex((c) => c.id === prevId)
        if (idx >= 0) next[idx] = { id: categoryForm.id, name: categoryForm.name }
      }
      return next
    })
    setProducts((prev) => prev.map((p) => (p.categoryId === prevId ? { ...p, categoryId: categoryForm.id } : p)))
    closeEditCategory()
  }

  // ——— Создание товара ———
  const initNewProduct = () => {
    setView(VIEWS.newProduct)
    setNewProductForm({
      name: '',
      type: '',
      imageUrl: '',
      supplierId: suppliers[0]?.id || '',
      categoryId: categories[0]?.id || '',
      variants: [{ id: `v${Date.now()}`, name: '', packQty: 1, price: 0 }]
    })
  }

  const addNewProductVariant = () => {
    setNewProductForm((f) => f ? { ...f, variants: [...f.variants, { id: `v${Date.now()}`, name: '', packQty: 1, price: 0 }] } : f)
  }

  const removeNewProductVariant = (index) => {
    setNewProductForm((f) => f && f.variants.length > 1 ? { ...f, variants: f.variants.filter((_, i) => i !== index) } : f)
  }

  const updateNewProduct = (field, value) => {
    setNewProductForm((f) => (f ? { ...f, [field]: value } : f))
  }

  const updateNewProductVariant = (index, field, value) => {
    setNewProductForm((f) => {
      if (!f) return f
      const v = [...f.variants]
      v[index] = { ...v[index], [field]: field === 'packQty' || field === 'price' ? Number(value) || 0 : value }
      return { ...f, variants: v }
    })
  }

  const createProduct = () => {
    if (!newProductForm || !newProductForm.name.trim()) return
    const id = `p${Date.now()}`
    setProducts((prev) => [...prev, { ...newProductForm, id }])
    setView(VIEWS.products)
    setNewProductForm(null)
  }

  // ——— Создание категории ———
  const initNewCategory = () => {
    setView(VIEWS.newCategory)
    setNewCategoryForm({ id: '', name: '' })
  }

  const createCategory = () => {
    const id = (newCategoryForm.id || newCategoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')).trim()
    const name = newCategoryForm.name.trim()
    if (!name) return
    if (categories.some((c) => c.id === id)) return
    setCategories((prev) => [...prev, { id: id || `cat${Date.now()}`, name }])
    setView(VIEWS.categories)
    setNewCategoryForm({ id: '', name: '' })
  }

  const deleteCategory = (cat) => {
    if (!window.confirm(`Удалить категорию «${cat.name}»? Товары этой категории останутся без категории.`)) return
    setCategories((prev) => prev.filter((c) => c.id !== cat.id))
  }

  // ——— Поставщики ———
  const openEditSupplier = (s) => {
    setEditingSupplier(s)
    setSupplierForm({ id: s.id, name: s.name || '', phone: s.phone || '', address: s.address || '' })
  }
  const closeEditSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm(null)
  }
  const saveSupplier = () => {
    if (!supplierForm) return
    const prevId = editingSupplier?.id
    setSuppliers((prev) => prev.map((sp) => (sp.id === prevId ? { ...sp, ...supplierForm } : sp)))
    setProducts((prev) => prev.map((p) => (p.supplierId === prevId ? { ...p, supplierId: supplierForm.id } : p)))
    closeEditSupplier()
  }
  const initNewSupplier = () => {
    setView(VIEWS.newSupplier)
    setNewSupplierForm({ id: '', name: '', phone: '', address: '' })
  }
  const createSupplier = () => {
    const id = (newSupplierForm.id || newSupplierForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')).trim()
    const name = newSupplierForm.name.trim()
    if (!name) return
    if (suppliers.some((s) => s.id === id)) return
    setSuppliers((prev) => [...prev, { id: id || `s${Date.now()}`, name, phone: newSupplierForm.phone?.trim() || '', address: newSupplierForm.address?.trim() || '' }])
    setView(VIEWS.suppliers)
    setNewSupplierForm({ id: '', name: '', phone: '', address: '' })
  }

  // ——— Создание категории/поставщика прямо в форме товара ———
  const createCategoryInline = (onSelectId) => {
    const name = inlineCategoryForm.name.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
    const finalId = categories.some((c) => c.id === id) ? `${id}-${Date.now()}` : id
    setCategories((prev) => [...prev, { id: finalId, name }])
    onSelectId(finalId)
    setInlineCategoryForm({ name: '' })
    setShowInlineNewCategory(false)
    setShowInlineNewCategoryModal(false)
  }
  const createSupplierInline = (onSelectId) => {
    const name = inlineSupplierForm.name.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
    const finalId = suppliers.some((s) => s.id === id) ? `s-${Date.now()}` : id
    setSuppliers((prev) => [...prev, { id: finalId, name, phone: inlineSupplierForm.phone?.trim() || '', address: inlineSupplierForm.address?.trim() || '' }])
    onSelectId(finalId)
    setInlineSupplierForm({ name: '', phone: '', address: '' })
    setShowInlineNewSupplier(false)
    setShowInlineNewSupplierModal(false)
  }
  const deleteSupplier = (s) => {
    if (!window.confirm(`Удалить поставщика «${s.name}»? Товары будут привязаны к первому поставщику.`)) return
    const firstId = suppliers.find((sp) => sp.id !== s.id)?.id
    if (firstId) setProducts((prev) => prev.map((p) => (p.supplierId === s.id ? { ...p, supplierId: firstId } : p)))
    setSuppliers((prev) => prev.filter((sp) => sp.id !== s.id))
  }

  const deleteProduct = (product) => {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return
    setProducts((prev) => prev.filter((p) => p.id !== product.id))
  }

  // ——— Фильтрация и сортировка ———
  const filteredProducts = React.useMemo(() => {
    let list = [...products]
    if (productFilter.search) {
      const q = productFilter.search.toLowerCase()
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || suppliers.find((s) => s.id === p.supplierId)?.name?.toLowerCase().includes(q) || categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase().includes(q))
    }
    if (productFilter.supplierId) list = list.filter((p) => p.supplierId === productFilter.supplierId)
    if (productFilter.categoryId) list = list.filter((p) => p.categoryId === productFilter.categoryId)
    list.sort((a, b) => {
      let va = a[productSort.field], vb = b[productSort.field]
      if (productSort.field === 'name') { va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase() }
      if (productSort.field === 'supplierId') { va = suppliers.find((s) => s.id === va)?.name ?? ''; vb = suppliers.find((s) => s.id === vb)?.name ?? '' }
      if (productSort.field === 'categoryId') { va = categories.find((c) => c.id === va)?.name ?? ''; vb = categories.find((c) => c.id === vb)?.name ?? '' }
      const cmp = String(va).localeCompare(String(vb), 'ru')
      return productSort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [products, productFilter, productSort, suppliers, categories])

  const filteredCategories = React.useMemo(() => {
    let list = [...categories]
    if (categoryFilter.search) {
      const q = categoryFilter.search.toLowerCase()
      list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const va = (a[categorySort.field] || '').toString().toLowerCase()
      const vb = (b[categorySort.field] || '').toString().toLowerCase()
      const cmp = va.localeCompare(vb, 'ru')
      return categorySort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [categories, categoryFilter, categorySort])

  const filteredSuppliers = React.useMemo(() => {
    let list = [...suppliers]
    if (supplierFilter.search) {
      const q = supplierFilter.search.toLowerCase()
      list = list.filter((s) => (s.name || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const va = (a[supplierSort.field] || '').toString().toLowerCase()
      const vb = (b[supplierSort.field] || '').toString().toLowerCase()
      const cmp = va.localeCompare(vb, 'ru')
      return supplierSort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [suppliers, supplierFilter, supplierSort])

  const users = getUsers()
  const filteredUsers = React.useMemo(() => {
    let list = [...users]
    if (userFilter.search) {
      const q = userFilter.search.toLowerCase()
      list = list.filter((u) => (u.email || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q) || DEPARTMENTS.find((d) => d.id === u.departmentId)?.name?.toLowerCase().includes(q) || ROLES.find((r) => r.id === u.roleId)?.name?.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const va = (a[userSort.field] || '').toString().toLowerCase()
      const vb = (b[userSort.field] || '').toString().toLowerCase()
      const cmp = va.localeCompare(vb, 'ru')
      return userSort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [users, userFilter, userSort, DEPARTMENTS, ROLES])

  const openEditUser = (user) => {
    setEditingUser(user)
    setUserForm({ ...user, password: '' })
  }
  const closeEditUser = () => {
    setEditingUser(null)
    setUserForm(null)
  }
  const saveUser = () => {
    if (!userForm) return
    updateUser(userForm.id, userForm)
    closeEditUser()
  }
  const handleDeleteUser = (user) => {
    if (!window.confirm(`Удалить учётную запись ${user.email}?`)) return
    const res = deleteUser(user.id)
    if (!res.success) alert(res.message)
  }
  const initNewUser = () => {
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' })
    setView(VIEWS.newUser)
  }
  const createUser = () => {
    const res = addUser(newUserForm)
    if (!res.success) {
      alert(res.message)
      return
    }
    setView(VIEWS.users)
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' })
  }

  const handleImageFile = (file, setImageUrl) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setLoginError('')
    if (login(loginEmail, password)) {
      setLoginEmail('')
      setPassword('')
    } else setLoginError('Неверный email или пароль')
  }

  const handleReset = (e) => {
    e.preventDefault()
    setResetResult(null)
    const result = requestPasswordReset(resetEmail.trim())
    setResetResult(result)
    if (result.success) setResetEmail('')
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="admin-login-card">
            <h1>Вход в админ-панель</h1>
            <p>Введите email и пароль</p>
            {!showReset ? (
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email"
                  className="admin-input admin-login-input"
                  autoFocus
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  className="admin-input admin-login-input"
                />
                {loginError && <p className="admin-login-error">{loginError}</p>}
                <button type="submit" className="btn-save admin-login-btn">Войти</button>
              </form>
            ) : (
              <div className="admin-reset-block">
                <p className="admin-reset-title">Сброс пароля</p>
                <p className="admin-reset-hint">Введите email учётной записи. На него будет отправлена ссылка для сброса пароля (сброс возможен только через почту).</p>
                <form onSubmit={handleReset}>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email"
                    className="admin-input admin-login-input"
                    autoFocus
                    required
                  />
                  {resetResult?.success === false && <p className="admin-login-error">{resetResult.message}</p>}
                  {resetResult?.success && (
                    <p className="admin-login-success">{resetResult.message}
                      {resetResult.resetLink && (
                        <span className="admin-reset-link-wrap"> Ссылка для перехода: <a href={resetResult.resetLink} className="admin-reset-link">{resetResult.resetLink}</a></span>
                      )}
                    </p>
                  )}
                  <div className="admin-reset-actions">
                    <button type="button" className="btn-cancel" onClick={() => { setShowReset(false); setResetEmail(''); setResetResult(null) }}>Отмена</button>
                    <button type="submit" className="btn-save">Отправить ссылку на email</button>
                  </div>
                </form>
              </div>
            )}
            {!showReset && <button type="button" className="admin-forgot-link" onClick={() => setShowReset(true)}>Забыли пароль?</button>}
            <Link to="/" className="admin-back admin-login-back">← На главную</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-top">
          <Link to="/" className="admin-back">← Каталог</Link>
          <span className="admin-user-info">{currentUser?.name || currentUser?.email} ({ROLES.find((r) => r.id === currentUser?.roleId)?.name || currentUser?.roleId})</span>
          <button type="button" className="admin-logout" onClick={logout}>Выйти</button>
        </div>
        <h1>Админ-панель</h1>
        <p>Управление каталогом, категориями и товарами</p>
      </header>

      <div className="admin-layout">
        <nav className="admin-sidebar">
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Товары</div>
            <button type="button" className={`admin-nav-item ${view === VIEWS.products ? 'active' : ''}`} onClick={() => setView(VIEWS.products)}>Список товаров</button>
            {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.newProduct ? 'active' : ''}`} onClick={initNewProduct}>+ Новый товар</button>}
          </div>
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Поставщики</div>
            <button type="button" className={`admin-nav-item ${view === VIEWS.suppliers ? 'active' : ''}`} onClick={() => setView(VIEWS.suppliers)}>Список поставщиков</button>
            {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.newSupplier ? 'active' : ''}`} onClick={initNewSupplier}>+ Новый поставщик</button>}
          </div>
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Категории</div>
            <button type="button" className={`admin-nav-item ${view === VIEWS.categories ? 'active' : ''}`} onClick={() => setView(VIEWS.categories)}>Список категорий</button>
            {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.newCategory ? 'active' : ''}`} onClick={initNewCategory}>+ Новая категория</button>}
          </div>
          {canManageUsers && (
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Учётные записи</div>
              <button type="button" className={`admin-nav-item ${view === VIEWS.users ? 'active' : ''}`} onClick={() => setView(VIEWS.users)}>Список сотрудников</button>
              <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.newUser ? 'active' : ''}`} onClick={initNewUser}>+ Новый сотрудник</button>
            </div>
          )}
        </nav>

        <div className="admin-content">
          {view === VIEWS.products && (
            <div className="admin-section">
              <h2 className="admin-section-title">Редактирование товаров</h2>
              <div className="admin-filters">
                <input type="text" placeholder="Поиск по названию, поставщику, категории" value={productFilter.search} onChange={(e) => setProductFilter((f) => ({ ...f, search: e.target.value }))} className="admin-input admin-filter-input" />
                <select value={productFilter.supplierId} onChange={(e) => setProductFilter((f) => ({ ...f, supplierId: e.target.value }))} className="admin-input admin-filter-select">
                  <option value="">Все поставщики</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={productFilter.categoryId} onChange={(e) => setProductFilter((f) => ({ ...f, categoryId: e.target.value }))} className="admin-input admin-filter-select">
                  <option value="">Все категории</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="admin-sort">
                  <span className="admin-sort-label">Сортировка:</span>
                  <select value={`${productSort.field}-${productSort.dir}`} onChange={(e) => { const v = e.target.value; const [field, dir] = v.split('-'); setProductSort({ field, dir }); }} className="admin-input admin-filter-select">
                    <option value="name-asc">Название А–Я</option>
                    <option value="name-desc">Название Я–А</option>
                    <option value="supplierId-asc">Поставщик А–Я</option>
                    <option value="supplierId-desc">Поставщик Я–А</option>
                    <option value="categoryId-asc">Категория А–Я</option>
                    <option value="categoryId-desc">Категория Я–А</option>
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Фото</th>
                      <th>Название</th>
                      <th>Тип</th>
                      <th>Поставщик</th>
                      <th>Категория</th>
                      <th>Варианты</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="admin-thumb" /> : <span className="admin-no-photo">—</span>}
                        </td>
                        <td>{p.name}</td>
                        <td>{p.type || '—'}</td>
                        <td>{suppliers.find((s) => s.id === p.supplierId)?.name ?? p.supplierId ?? '—'}</td>
                        <td>{categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId}</td>
                        <td>{p.variants?.length ?? 0}</td>
                        <td>
                          {canEdit && (
                            <>
                              <button type="button" className="btn-edit" onClick={() => openEditProduct(p)}>Редактировать</button>
                              <button type="button" className="btn-delete" onClick={() => deleteProduct(p)}>Удалить</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === VIEWS.suppliers && (
            <div className="admin-section">
              <h2 className="admin-section-title">Редактирование поставщиков</h2>
              <div className="admin-filters">
                <input type="text" placeholder="Поиск по названию, телефону, адресу" value={supplierFilter.search} onChange={(e) => setSupplierFilter((f) => ({ ...f, search: e.target.value }))} className="admin-input admin-filter-input" />
                <div className="admin-sort">
                  <span className="admin-sort-label">Сортировка:</span>
                  <select value={`${supplierSort.field}-${supplierSort.dir}`} onChange={(e) => { const v = e.target.value; const [field, dir] = v.split('-'); setSupplierSort({ field, dir }); }} className="admin-input admin-filter-select">
                    <option value="name-asc">Название А–Я</option>
                    <option value="name-desc">Название Я–А</option>
                    <option value="phone-asc">Телефон А–Я</option>
                    <option value="phone-desc">Телефон Я–А</option>
                    <option value="address-asc">Адрес А–Я</option>
                    <option value="address-desc">Адрес Я–А</option>
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Наименование компании</th>
                      <th>Сотовый телефон</th>
                      <th>Адрес компании</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong> <code className="admin-code admin-code-sm">{s.id}</code></td>
                        <td>{s.phone || '—'}</td>
                        <td>{s.address || '—'}</td>
                        <td>
                          {canEdit && (
                            <>
                              <button type="button" className="btn-edit" onClick={() => openEditSupplier(s)}>Изменить</button>
                              <button type="button" className="btn-delete" onClick={() => deleteSupplier(s)}>Удалить</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === VIEWS.categories && (
            <div className="admin-section">
              <h2 className="admin-section-title">Редактирование категорий</h2>
              <div className="admin-filters">
                <input type="text" placeholder="Поиск по названию или ID" value={categoryFilter.search} onChange={(e) => setCategoryFilter((f) => ({ ...f, search: e.target.value }))} className="admin-input admin-filter-input" />
                <div className="admin-sort">
                  <span className="admin-sort-label">Сортировка:</span>
                  <select value={`${categorySort.field}-${categorySort.dir}`} onChange={(e) => { const v = e.target.value; const [field, dir] = v.split('-'); setCategorySort({ field, dir }); }} className="admin-input admin-filter-select">
                    <option value="name-asc">Название А–Я</option>
                    <option value="name-desc">Название Я–А</option>
                    <option value="id-asc">ID А–Я</option>
                    <option value="id-desc">ID Я–А</option>
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c) => (
                      <tr key={c.id}>
                        <td><code className="admin-code">{c.id}</code></td>
                        <td>{c.name}</td>
                        <td>
                          {canEdit && (
                            <>
                              <button type="button" className="btn-edit" onClick={() => openEditCategory(c)}>Изменить</button>
                              <button type="button" className="btn-delete" onClick={() => deleteCategory(c)}>Удалить</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === VIEWS.newProduct && newProductForm && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Создание товара</h2>
              <div className="admin-form-card">
                <label>Название <input type="text" value={newProductForm.name} onChange={(e) => updateNewProduct('name', e.target.value)} className="admin-input" /></label>
                <label>Тип <input type="text" value={newProductForm.type || ''} onChange={(e) => updateNewProduct('type', e.target.value)} className="admin-input" placeholder="Например: Контейнер, Органайзер" /></label>
                <div className="admin-photo-block">
                  <label className="admin-photo-label">Фото товара</label>
                  <p className="admin-photo-hint">Рекомендуемое разрешение: 800×800 px (квадрат) или 1200×800 px. Форматы: JPG, PNG, WebP.</p>
                  <div className="admin-photo-actions">
                    <label className="admin-file-label">
                      <input type="file" accept="image/*" className="admin-file-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, (url) => updateNewProduct('imageUrl', url)); e.target.value = ''; }} />
                      Загрузить файл
                    </label>
                    <span className="admin-photo-or">или ссылка</span>
                    <input type="text" value={newProductForm.imageUrl} onChange={(e) => updateNewProduct('imageUrl', e.target.value)} placeholder="https://..." className="admin-input admin-input-url" />
                  </div>
                  {newProductForm.imageUrl && <img src={newProductForm.imageUrl} alt="" className="admin-preview" onError={(e) => { e.target.style.display = 'none' }} />}
                </div>
                <div className="admin-select-with-add">
                  <label>Поставщик
                    <select value={newProductForm.supplierId} onChange={(e) => updateNewProduct('supplierId', e.target.value)} className="admin-input">
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn-inline-add" onClick={() => setShowInlineNewSupplier(!showInlineNewSupplier)}>{showInlineNewSupplier ? 'Скрыть' : '+ Добавить поставщика'}</button>
                  {showInlineNewSupplier && (
                    <div className="admin-inline-form">
                      <input type="text" value={inlineSupplierForm.name} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, name: e.target.value }))} placeholder="Наименование компании" className="admin-input" />
                      <input type="text" value={inlineSupplierForm.phone} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Сотовый телефон" className="admin-input" />
                      <input type="text" value={inlineSupplierForm.address} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, address: e.target.value }))} placeholder="Адрес компании" className="admin-input" />
                      <button type="button" className="btn-save btn-inline-save" onClick={() => createSupplierInline((id) => updateNewProduct('supplierId', id))}>Создать и выбрать</button>
                    </div>
                  )}
                </div>
                <div className="admin-select-with-add">
                  <label>Категория
                    <select value={newProductForm.categoryId} onChange={(e) => updateNewProduct('categoryId', e.target.value)} className="admin-input">
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn-inline-add" onClick={() => setShowInlineNewCategory(!showInlineNewCategory)}>{showInlineNewCategory ? 'Скрыть' : '+ Добавить категорию'}</button>
                  {showInlineNewCategory && (
                    <div className="admin-inline-form">
                      <input type="text" value={inlineCategoryForm.name} onChange={(e) => setInlineCategoryForm((f) => ({ ...f, name: e.target.value }))} placeholder="Название категории" className="admin-input" />
                      <button type="button" className="btn-save btn-inline-save" onClick={() => createCategoryInline((id) => updateNewProduct('categoryId', id))}>Создать и выбрать</button>
                    </div>
                  )}
                </div>
                <div className="admin-variants-block">
                  <div className="admin-variants-head">
                    <span>Варианты</span>
                    <button type="button" className="btn-add-variant" onClick={addNewProductVariant}>+ Вариант</button>
                  </div>
                  <div className="admin-variant-header">
                    <span className="admin-variant-label-name">Название</span>
                    <span className="admin-variant-label-qty">Кол-во в упак (шт)</span>
                    <span className="admin-variant-label-price">Цена (₸)</span>
                    <span className="admin-variant-label-action" />
                  </div>
                  {newProductForm.variants.map((v, i) => (
                    <div key={v.id} className="admin-variant-row">
                      <input type="text" value={v.name ?? ''} onChange={(e) => updateNewProductVariant(i, 'name', e.target.value)} placeholder="Название варианта" className="admin-input admin-input-sm" />
                      <input type="number" min="1" value={v.packQty} onChange={(e) => updateNewProductVariant(i, 'packQty', e.target.value)} placeholder="шт" className="admin-input admin-input-num" title="Количество в упаковке" />
                      <input type="number" min="0" value={v.price} onChange={(e) => updateNewProductVariant(i, 'price', e.target.value)} placeholder="₸" className="admin-input admin-input-num" title="Цена за упаковку" />
                      <button type="button" className="btn-remove-variant" onClick={() => removeNewProductVariant(i)} title="Удалить вариант">Удалить</button>
                    </div>
                  ))}
                </div>
                <div className="admin-form-actions">
                  <button type="button" className="btn-cancel" onClick={() => { setView(VIEWS.products); setNewProductForm(null) }}>Отмена</button>
                  <button type="button" className="btn-save" onClick={createProduct}>Создать товар</button>
                </div>
              </div>
            </div>
          )}

          {view === VIEWS.newCategory && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Новая категория</h2>
              <div className="admin-form-card">
                <label>ID (латиница, без пробелов) <input type="text" value={newCategoryForm.id} onChange={(e) => setNewCategoryForm((f) => ({ ...f, id: e.target.value }))} placeholder="naprimer-tak" className="admin-input" /></label>
                <label>Название <input type="text" value={newCategoryForm.name} onChange={(e) => setNewCategoryForm((f) => ({ ...f, name: e.target.value }))} placeholder="Например так" className="admin-input" /></label>
                <div className="admin-form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setView(VIEWS.categories)}>Отмена</button>
                  <button type="button" className="btn-save" onClick={createCategory}>Создать категорию</button>
                </div>
              </div>
            </div>
          )}

          {view === VIEWS.newSupplier && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Новый поставщик</h2>
              <div className="admin-form-card">
                <label>ID (латиница, без пробелов) <input type="text" value={newSupplierForm.id} onChange={(e) => setNewSupplierForm((f) => ({ ...f, id: e.target.value }))} placeholder="postavshik-1" className="admin-input" /></label>
                <label>Наименование компании <input type="text" value={newSupplierForm.name} onChange={(e) => setNewSupplierForm((f) => ({ ...f, name: e.target.value }))} placeholder="ООО Поставщик" className="admin-input" /></label>
                <label>Сотовый телефон <input type="text" value={newSupplierForm.phone} onChange={(e) => setNewSupplierForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+7 (777) 000-00-00" className="admin-input" /></label>
                <label>Адрес компании <input type="text" value={newSupplierForm.address} onChange={(e) => setNewSupplierForm((f) => ({ ...f, address: e.target.value }))} placeholder="г. Город, ул. Улица, д. 1" className="admin-input" /></label>
                <div className="admin-form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setView(VIEWS.suppliers)}>Отмена</button>
                  <button type="button" className="btn-save" onClick={createSupplier}>Создать поставщика</button>
                </div>
              </div>
            </div>
          )}

          {canManageUsers && view === VIEWS.users && (
            <div className="admin-section">
              <h2 className="admin-section-title">Учётные записи сотрудников</h2>
              <div className="admin-filters">
                <input type="text" placeholder="Поиск по email, имени, отделу, роли" value={userFilter.search} onChange={(e) => setUserFilter((f) => ({ ...f, search: e.target.value }))} className="admin-input admin-filter-input" />
                <div className="admin-sort">
                  <span className="admin-sort-label">Сортировка:</span>
                  <select value={`${userSort.field}-${userSort.dir}`} onChange={(e) => { const v = e.target.value; const [field, dir] = v.split('-'); setUserSort({ field, dir }); }} className="admin-input admin-filter-select">
                    <option value="name-asc">Имя А–Я</option>
                    <option value="name-desc">Имя Я–А</option>
                    <option value="email-asc">Email А–Я</option>
                    <option value="email-desc">Email Я–А</option>
                    <option value="departmentId-asc">Отдел А–Я</option>
                    <option value="departmentId-desc">Отдел Я–А</option>
                    <option value="roleId-asc">Роль А–Я</option>
                    <option value="roleId-desc">Роль Я–А</option>
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Имя</th>
                      <th>Отдел</th>
                      <th>Роль</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.name || '—'}</td>
                        <td>{DEPARTMENTS.find((d) => d.id === u.departmentId)?.name || u.departmentId || '—'}</td>
                        <td>{ROLES.find((r) => r.id === u.roleId)?.name || u.roleId || '—'}</td>
                        <td>
                          <button type="button" className="btn-edit" onClick={() => openEditUser(u)}>Изменить</button>
                          <button type="button" className="btn-delete" onClick={() => handleDeleteUser(u)} disabled={currentUser?.id === u.id} title={currentUser?.id === u.id ? 'Нельзя удалить себя' : 'Удалить'}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {canManageUsers && view === VIEWS.newUser && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Новый сотрудник</h2>
              <div className="admin-form-card">
                <label>Email <input type="email" value={newUserForm.email} onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="admin-input" required /></label>
                <label>Имя <input type="text" value={newUserForm.name} onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))} placeholder="Иван Иванов" className="admin-input" /></label>
                <label>Пароль (при первом входе можно сменить через «Забыли пароль?») <input type="password" value={newUserForm.password} onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="Минимум 6 символов" className="admin-input" /></label>
                <label>Отдел
                  <select value={newUserForm.departmentId} onChange={(e) => setNewUserForm((f) => ({ ...f, departmentId: e.target.value }))} className="admin-input">
                    {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label>Роль
                  <select value={newUserForm.roleId} onChange={(e) => setNewUserForm((f) => ({ ...f, roleId: e.target.value }))} className="admin-input">
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.description}</option>)}
                  </select>
                </label>
                <div className="admin-form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setView(VIEWS.users)}>Отмена</button>
                  <button type="button" className="btn-save" onClick={createUser}>Создать сотрудника</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модалка редактирования товара */}
      {productForm && (
        <div className="admin-modal-overlay" onClick={closeEditProduct}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Редактировать товар</h2>
              <button type="button" className="admin-modal-close" onClick={closeEditProduct}>×</button>
            </div>
            <div className="admin-modal-body">
              <label>Название <input type="text" value={productForm.name} onChange={(e) => updateProductForm('name', e.target.value)} className="admin-input" /></label>
              <label>Тип <input type="text" value={productForm.type || ''} onChange={(e) => updateProductForm('type', e.target.value)} className="admin-input" placeholder="Например: Контейнер, Органайзер" /></label>
              <div className="admin-photo-block">
                <label className="admin-photo-label">Фото товара</label>
                <p className="admin-photo-hint">Рекомендуемое разрешение: 800×800 px (квадрат) или 1200×800 px. Форматы: JPG, PNG, WebP.</p>
                <div className="admin-photo-actions">
                  <label className="admin-file-label">
                    <input type="file" accept="image/*" className="admin-file-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, (url) => updateProductForm('imageUrl', url)); e.target.value = ''; }} />
                    Загрузить файл
                  </label>
                  <span className="admin-photo-or">или ссылка</span>
                  <input type="text" value={productForm.imageUrl} onChange={(e) => updateProductForm('imageUrl', e.target.value)} placeholder="https://..." className="admin-input admin-input-url" />
                </div>
                {productForm.imageUrl && <img src={productForm.imageUrl} alt="" className="admin-preview" onError={(e) => { e.target.style.display = 'none' }} />}
              </div>
              <div className="admin-select-with-add">
                <label>Поставщик
                  <select value={productForm.supplierId} onChange={(e) => updateProductForm('supplierId', e.target.value)} className="admin-input">
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <button type="button" className="btn-inline-add" onClick={() => setShowInlineNewSupplierModal(!showInlineNewSupplierModal)}>{showInlineNewSupplierModal ? 'Скрыть' : '+ Добавить поставщика'}</button>
                {showInlineNewSupplierModal && (
                  <div className="admin-inline-form">
                    <input type="text" value={inlineSupplierForm.name} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, name: e.target.value }))} placeholder="Наименование компании" className="admin-input" />
                    <input type="text" value={inlineSupplierForm.phone} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Сотовый телефон" className="admin-input" />
                    <input type="text" value={inlineSupplierForm.address} onChange={(e) => setInlineSupplierForm((f) => ({ ...f, address: e.target.value }))} placeholder="Адрес компании" className="admin-input" />
                    <button type="button" className="btn-save btn-inline-save" onClick={() => createSupplierInline((id) => updateProductForm('supplierId', id))}>Создать и выбрать</button>
                  </div>
                )}
              </div>
              <div className="admin-select-with-add">
                <label>Категория
                  <select value={productForm.categoryId} onChange={(e) => updateProductForm('categoryId', e.target.value)} className="admin-input">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <button type="button" className="btn-inline-add" onClick={() => setShowInlineNewCategoryModal(!showInlineNewCategoryModal)}>{showInlineNewCategoryModal ? 'Скрыть' : '+ Добавить категорию'}</button>
                {showInlineNewCategoryModal && (
                  <div className="admin-inline-form">
                    <input type="text" value={inlineCategoryForm.name} onChange={(e) => setInlineCategoryForm((f) => ({ ...f, name: e.target.value }))} placeholder="Название категории" className="admin-input" />
                    <button type="button" className="btn-save btn-inline-save" onClick={() => createCategoryInline((id) => updateProductForm('categoryId', id))}>Создать и выбрать</button>
                  </div>
                )}
              </div>
              <div className="admin-variants-block">
                <div className="admin-variants-head">
                  <span>Варианты</span>
                  <button type="button" className="btn-add-variant" onClick={addProductVariant}>+ Вариант</button>
                </div>
                <div className="admin-variant-header">
                  <span className="admin-variant-label-name">Название</span>
                  <span className="admin-variant-label-qty">Кол-во в упак (шт)</span>
                  <span className="admin-variant-label-price">Цена (₸)</span>
                  <span className="admin-variant-label-action" />
                </div>
                {productForm.variants.map((v, i) => (
                  <div key={v.id} className="admin-variant-row">
                    <input type="text" value={v.name ?? ''} onChange={(e) => updateProductVariant(i, 'name', e.target.value)} placeholder="Название варианта" className="admin-input admin-input-sm" />
                    <input type="number" min="1" value={v.packQty} onChange={(e) => updateProductVariant(i, 'packQty', e.target.value)} className="admin-input admin-input-num" title="Количество в упаковке" />
                    <input type="number" min="0" value={v.price} onChange={(e) => updateProductVariant(i, 'price', e.target.value)} className="admin-input admin-input-num" title="Цена за упаковку" />
                    <button type="button" className="btn-remove-variant" onClick={() => removeProductVariant(i)} title="Удалить вариант">Удалить</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-cancel" onClick={closeEditProduct}>Отмена</button>
              <button type="button" className="btn-save" onClick={saveProduct}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования категории */}
      {categoryForm && (
        <div className="admin-modal-overlay" onClick={closeEditCategory}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Редактировать категорию</h2>
              <button type="button" className="admin-modal-close" onClick={closeEditCategory}>×</button>
            </div>
            <div className="admin-modal-body">
              <label>ID <input type="text" value={categoryForm.id} onChange={(e) => setCategoryForm((f) => f ? { ...f, id: e.target.value } : f)} className="admin-input" /></label>
              <label>Название <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm((f) => f ? { ...f, name: e.target.value } : f)} className="admin-input" /></label>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-cancel" onClick={closeEditCategory}>Отмена</button>
              <button type="button" className="btn-save" onClick={saveCategory}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования поставщика */}
      {supplierForm && (
        <div className="admin-modal-overlay" onClick={closeEditSupplier}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Редактировать поставщика</h2>
              <button type="button" className="admin-modal-close" onClick={closeEditSupplier}>×</button>
            </div>
            <div className="admin-modal-body">
              <label>ID <input type="text" value={supplierForm.id} onChange={(e) => setSupplierForm((f) => f ? { ...f, id: e.target.value } : f)} className="admin-input" /></label>
              <label>Наименование компании <input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm((f) => f ? { ...f, name: e.target.value } : f)} className="admin-input" /></label>
              <label>Сотовый телефон <input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => f ? { ...f, phone: e.target.value } : f)} className="admin-input" placeholder="+7 (777) 000-00-00" /></label>
              <label>Адрес компании <input type="text" value={supplierForm.address} onChange={(e) => setSupplierForm((f) => f ? { ...f, address: e.target.value } : f)} className="admin-input" placeholder="г. Город, ул. Улица" /></label>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-cancel" onClick={closeEditSupplier}>Отмена</button>
              <button type="button" className="btn-save" onClick={saveSupplier}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования пользователя */}
      {userForm && canManageUsers && (
        <div className="admin-modal-overlay" onClick={closeEditUser}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Редактировать сотрудника</h2>
              <button type="button" className="admin-modal-close" onClick={closeEditUser}>×</button>
            </div>
            <div className="admin-modal-body">
              <label>Email <input type="email" value={userForm.email} onChange={(e) => setUserForm((f) => f ? { ...f, email: e.target.value } : f)} className="admin-input" /></label>
              <label>Имя <input type="text" value={userForm.name} onChange={(e) => setUserForm((f) => f ? { ...f, name: e.target.value } : f)} className="admin-input" /></label>
              <label>Новый пароль (оставьте пустым, чтобы не менять) <input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => f ? { ...f, password: e.target.value } : f)} className="admin-input" placeholder="Оставьте пустым" /></label>
              <label>Отдел
                <select value={userForm.departmentId} onChange={(e) => setUserForm((f) => f ? { ...f, departmentId: e.target.value } : f)} className="admin-input">
                  {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label>Роль
                <select value={userForm.roleId} onChange={(e) => setUserForm((f) => f ? { ...f, roleId: e.target.value } : f)} className="admin-input">
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-cancel" onClick={closeEditUser}>Отмена</button>
              <button type="button" className="btn-save" onClick={saveUser}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useSuppliers } from '../context/SuppliersContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useStats } from '../context/StatsContext'
import { useOrders } from '../context/OrdersContext'
import { ensureBarcode, generateEAN13 } from '../utils/barcode'
import { downloadBackup, restoreBackupFromData } from '../utils/backup'
import { downloadProductTemplate, parseProductCsv, ensureProductBarcodes } from '../utils/productImport'
import './Admin.css'

const VIEWS = { dashboard: 'dashboard', products: 'products', suppliers: 'suppliers', categories: 'categories', newProduct: 'newProduct', newCategory: 'newCategory', newSupplier: 'newSupplier', users: 'users', newUser: 'newUser', statistics: 'statistics', settingsPlatform: 'settingsPlatform', settingsWholesale: 'settingsWholesale', settingsProcurement: 'settingsProcurement', backup: 'backup' }

const ADMIN_SECTIONS = [
  { id: 'platform', name: 'Интернет магазин' },
  { id: 'wholesale', name: 'Оптовые закупки' },
  { id: 'procurement', name: 'Отдел закупок' }
]

export default function Admin() {
  const { isLoggedIn, login, logout, currentUser, canEdit, canManageUsers, requestPasswordReset, getUsers, addUser, updateUser, deleteUser, DEPARTMENTS, ROLES } = useAdminAuth()
  const [adminSection, setAdminSection] = useState('platform')
  const { products, setProducts } = useProducts(adminSection)
  const { categories, setCategories } = useCategories(adminSection)
  const { suppliers, setSuppliers } = useSuppliers()
  const { stats, setSettings, getSettings } = useStats()
  const { orders } = useOrders()
  const [view, setView] = useState(VIEWS.dashboard)
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

  useEffect(() => {
    setProductFilter({ search: '', supplierId: '', categoryId: '' })
    if (adminSection !== 'procurement' && (view === VIEWS.suppliers || view === VIEWS.newSupplier)) setView(VIEWS.products)
  }, [adminSection])
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [productForm, setProductForm] = useState(null)
  const [categoryForm, setCategoryForm] = useState(null)
  const [supplierForm, setSupplierForm] = useState(null)
  const [newProductForm, setNewProductForm] = useState(null)
  const [newCategoryForm, setNewCategoryForm] = useState({ id: '', name: '', parentId: '' })
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
  const [sidebarOpen, setSidebarOpen] = useState({
    products: true,
    suppliers: true,
    categories: true,
    users: true,
    settings: true,
    statistics: true,
    data: true
  })
  const toggleSidebarGroup = (key) => setSidebarOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  const [contentPanelsOpen, setContentPanelsOpen] = useState({
    productsList: true,
    newProduct: false,
    productsImport: false,
    suppliersList: true,
    newSupplier: false,
    categoriesList: true,
    newCategory: false,
    usersList: true,
    newUser: false
  })
  const [importResult, setImportResult] = useState(null)
  const [draggingCategoryId, setDraggingCategoryId] = useState(null)
  const [draggingProductId, setDraggingProductId] = useState(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null)
  const toggleContentPanel = (key) => setContentPanelsOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  const moveCategoryParent = (catId, newParentId) => {
    if (catId === newParentId) return
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, parentId: newParentId || undefined } : c)))
    setDraggingCategoryId(null)
    setDragOverCategoryId(null)
  }
  const moveProductToCategory = (productId, categoryId) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, categoryId } : p)))
    setDraggingProductId(null)
  }

  // ——— Редактирование товара ———
  const openEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      id: product.id,
      name: product.name,
      type: product.type || '',
      imageUrl: product.imageUrl || '',
      article: product.article ?? '',
      barcode: product.barcode ?? '',
      supplierId: product.supplierId ?? (adminSection === 'procurement' ? suppliers[0]?.id : ''),
      categoryId: product.categoryId,
      variants: product.variants.map((v) => ({
        ...v,
        price: v.price ?? 0,
        priceRetail: v.priceRetail ?? v.price ?? 0,
        priceWholesale: v.priceWholesale ?? v.price ?? 0,
        priceSupplier: v.priceSupplier ?? v.price ?? 0
      }))
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
    const barcode = ensureBarcode(productForm.barcode, productForm.id)
    const form = { ...productForm, barcode }
    setProducts((prev) =>
      prev.map((p) => (p.id === form.id ? { ...p, ...form } : p))
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
      const numFields = ['packQty', 'price', 'priceRetail', 'priceWholesale', 'priceSupplier']
      v[index] = { ...v[index], [field]: numFields.includes(field) ? Number(value) || 0 : value }
      return { ...f, variants: v }
    })
  }

  const addProductVariant = () => {
    setProductForm((f) => f ? { ...f, variants: [...f.variants, { id: `v${Date.now()}`, name: '', packQty: 1, price: 0, priceRetail: 0, priceWholesale: 0, priceSupplier: 0 }] } : f)
  }

  const removeProductVariant = (index) => {
    setProductForm((f) => f && f.variants.length > 1 ? { ...f, variants: f.variants.filter((_, i) => i !== index) } : f)
  }

  // ——— Редактирование категории ———
  const openEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({ id: cat.id, name: cat.name, parentId: cat.parentId || '' })
  }

  const closeEditCategory = () => {
    setEditingCategory(null)
    setCategoryForm(null)
  }

  const saveCategory = () => {
    if (!categoryForm) return
    const prevId = editingCategory?.id
    const parentId = (categoryForm.parentId || '').trim() || undefined
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === prevId ? { ...c, ...categoryForm, parentId } : c))
      if (prevId !== categoryForm.id) {
        const idx = next.findIndex((c) => c.id === prevId)
        if (idx >= 0) next[idx] = { id: categoryForm.id, name: categoryForm.name, parentId }
      }
      return next
    })
    setProducts((prev) => prev.map((p) => (p.categoryId === prevId ? { ...p, categoryId: categoryForm.id } : p)))
    closeEditCategory()
  }

  // ——— Создание товара ———
  const initNewProduct = () => {
    setView(VIEWS.products)
    setContentPanelsOpen((prev) => ({ ...prev, newProduct: true, productsList: prev.productsList }))
    setNewProductForm({
      name: '',
      type: '',
      imageUrl: '',
      article: '',
      barcode: '',
      supplierId: adminSection === 'procurement' ? (suppliers[0]?.id || '') : '',
      categoryId: categories[0]?.id || '',
      variants: [{ id: `v${Date.now()}`, name: '', packQty: 1, price: 0, priceRetail: 0, priceWholesale: 0, priceSupplier: 0 }]
    })
  }

  const addNewProductVariant = () => {
    setNewProductForm((f) => f ? { ...f, variants: [...f.variants, { id: `v${Date.now()}`, name: '', packQty: 1, price: 0, priceRetail: 0, priceWholesale: 0, priceSupplier: 0 }] } : f)
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
      const numFields = ['packQty', 'price', 'priceRetail', 'priceWholesale', 'priceSupplier']
      v[index] = { ...v[index], [field]: numFields.includes(field) ? Number(value) || 0 : value }
      return { ...f, variants: v }
    })
  }

  const createProduct = () => {
    if (!newProductForm || !newProductForm.name.trim()) return
    const id = `p${Date.now()}`
    const article = (newProductForm.article || '').trim() || `ART-${Date.now()}`
    const barcode = ensureBarcode(newProductForm.barcode, id)
    setProducts((prev) => [...prev, { ...newProductForm, id, article, barcode }])
    setView(VIEWS.products)
    setNewProductForm(null)
    setContentPanelsOpen((p) => ({ ...p, newProduct: false }))
  }

  const handleProductImport = (e) => {
    const file = e.target?.files?.[0]
    e.target.value = ''
    if (!file) return
    const defaultSupplierId = suppliers[0]?.id || ''
    const defaultCategoryId = categories[0]?.id || ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result ?? ''
        const { products: imported, errors } = parseProductCsv(text, { defaultSupplierId, defaultCategoryId })
        const withBarcodes = ensureProductBarcodes(imported)
        setProducts((prev) => [...prev, ...withBarcodes])
        setImportResult({
          success: true,
          count: withBarcodes.length,
          errors: errors.length ? errors : null
        })
      } catch (err) {
        setImportResult({ success: false, error: err.message || 'Ошибка чтения файла' })
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  // ——— Создание категории ———
  const initNewCategory = () => {
    setView(VIEWS.categories)
    setContentPanelsOpen((prev) => ({ ...prev, newCategory: true, categoriesList: prev.categoriesList }))
    setNewCategoryForm({ id: '', name: '', parentId: '' })
  }

  const createCategory = () => {
    const id = (newCategoryForm.id || newCategoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')).trim()
    const name = newCategoryForm.name.trim()
    if (!name) return
    if (categories.some((c) => c.id === id)) return
    const parentId = (newCategoryForm.parentId || '').trim() || undefined
    setCategories((prev) => [...prev, { id: id || `cat${Date.now()}`, name, ...(parentId ? { parentId } : {}) }])
    setView(VIEWS.categories)
    setNewCategoryForm({ id: '', name: '', parentId: '' })
    setContentPanelsOpen((p) => ({ ...p, newCategory: false }))
  }

  /** Категории в порядке дерева (корень → подкатегории) для селектов */
  const categoriesTree = React.useMemo(() => {
    const roots = categories.filter((c) => !c.parentId)
    const withChildren = (parentId) => categories.filter((c) => (c.parentId || '') === parentId)
    const walk = (ids, depth = 0) => {
      const out = []
      ids.forEach((id) => {
        const cat = categories.find((c) => c.id === id)
        if (cat) out.push({ ...cat, _depth: depth })
        walk(withChildren(id).map((c) => c.id), depth + 1).forEach((item) => out.push(item))
      })
      return out
    }
    return walk(roots.map((c) => c.id), 0)
  }, [categories])

  const deleteCategory = (cat) => {
    if (!window.confirm(`Удалить категорию «${cat.name}»? Подкатегории станут корневыми, товары этой категории останутся без категории.`)) return
    setCategories((prev) => prev.filter((c) => c.id !== cat.id).map((c) => (c.parentId === cat.id ? { ...c, parentId: undefined } : c)))
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
    setView(VIEWS.suppliers)
    setContentPanelsOpen((prev) => ({ ...prev, newSupplier: true, suppliersList: prev.suppliersList }))
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
    setContentPanelsOpen((p) => ({ ...p, newSupplier: false }))
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
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase().includes(q) || (adminSection === 'procurement' && suppliers.find((s) => s.id === p.supplierId)?.name?.toLowerCase().includes(q)))
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
  }, [products, productFilter, productSort, suppliers, categories, adminSection])

  const filteredCategories = React.useMemo(() => {
    const roots = categories.filter((c) => !c.parentId)
    const withChildren = (parentId) => categories.filter((c) => (c.parentId || '') === parentId)
    const walk = (ids, depth = 0) => {
      const out = []
      ids.forEach((id) => {
        const cat = categories.find((c) => c.id === id)
        if (cat) out.push({ ...cat, _depth: depth })
        walk(withChildren(id).map((c) => c.id), depth + 1).forEach((item) => out.push(item))
      })
      return out
    }
    let list = walk(roots.map((c) => c.id), 0)
    if (categoryFilter.search) {
      const q = categoryFilter.search.toLowerCase()
      list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q))
    }
    return list
  }, [categories, categoryFilter.search])

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
    setView(VIEWS.users)
    setContentPanelsOpen((prev) => ({ ...prev, newUser: true, usersList: prev.usersList }))
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' })
  }
  const createUser = () => {
    const res = addUser(newUserForm)
    if (!res.success) {
      alert(res.message)
      return
    }
    setView(VIEWS.users)
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' })
    setContentPanelsOpen((p) => ({ ...p, newUser: false }))
  }

  useEffect(() => {
    if (contentPanelsOpen.newProduct && !newProductForm && canEdit) initNewProduct()
  }, [contentPanelsOpen.newProduct])
  useEffect(() => {
    if (contentPanelsOpen.newSupplier && !newSupplierForm.id && canEdit) initNewSupplier()
  }, [contentPanelsOpen.newSupplier])
  useEffect(() => {
    if (contentPanelsOpen.newCategory && !newCategoryForm.id && canEdit) initNewCategory()
  }, [contentPanelsOpen.newCategory])
  useEffect(() => {
    if (contentPanelsOpen.newUser && canManageUsers && !newUserForm.email) initNewUser()
  }, [contentPanelsOpen.newUser])

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

  const ordersList = orders || []

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar-dark" aria-label="Меню">
        <div className="admin-sidebar-brand">
          <Link to="/" className="admin-sidebar-logo">Redprice</Link>
          <span className="admin-sidebar-tagline">Админ-панель</span>
        </div>
        <button type="button" className={`admin-nav-item ${view === VIEWS.dashboard ? 'active' : ''}`} onClick={() => setView(VIEWS.dashboard)}>
          <span className="admin-nav-icon" aria-hidden>📊</span>
          <span>Дашборд</span>
        </button>
        <div className="admin-sidebar-divider" />
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.products ? 'open' : ''}`} onClick={() => toggleSidebarGroup('products')} aria-expanded={sidebarOpen.products}>
            <span className="admin-nav-icon" aria-hidden>📦</span>
            <span>Товары</span>
            <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.products ? '▼' : '▶'}</span>
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.products ? 'open' : ''}`}>
            <button type="button" className={`admin-nav-item ${view === VIEWS.products ? 'active' : ''}`} onClick={() => setView(VIEWS.products)}>Список товаров</button>
            {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.products && contentPanelsOpen.newProduct ? 'active' : ''}`} onClick={initNewProduct}>+ Новый товар</button>}
          </div>
        </div>
        {adminSection === 'procurement' && (
          <div className="admin-nav-group admin-nav-group-collapsible">
            <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.suppliers ? 'open' : ''}`} onClick={() => toggleSidebarGroup('suppliers')} aria-expanded={sidebarOpen.suppliers}>
              <span className="admin-nav-icon" aria-hidden>🚚</span>
              <span>Поставщики</span>
              <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.suppliers ? '▼' : '▶'}</span>
            </button>
            <div className={`admin-nav-group-content ${sidebarOpen.suppliers ? 'open' : ''}`}>
              <button type="button" className={`admin-nav-item ${view === VIEWS.suppliers ? 'active' : ''}`} onClick={() => setView(VIEWS.suppliers)}>Список поставщиков</button>
              {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.suppliers && contentPanelsOpen.newSupplier ? 'active' : ''}`} onClick={initNewSupplier}>+ Новый поставщик</button>}
            </div>
          </div>
        )}
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.categories ? 'open' : ''}`} onClick={() => toggleSidebarGroup('categories')} aria-expanded={sidebarOpen.categories}>
            <span className="admin-nav-icon" aria-hidden>📁</span>
            <span>Категории</span>
            <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.categories ? '▼' : '▶'}</span>
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.categories ? 'open' : ''}`}>
            <button type="button" className={`admin-nav-item ${view === VIEWS.categories ? 'active' : ''}`} onClick={() => setView(VIEWS.categories)}>Список категорий</button>
            {canEdit && <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.categories && contentPanelsOpen.newCategory ? 'active' : ''}`} onClick={initNewCategory}>+ Новая категория</button>}
          </div>
        </div>
        {canManageUsers && (
          <div className="admin-nav-group admin-nav-group-collapsible">
            <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.users ? 'open' : ''}`} onClick={() => toggleSidebarGroup('users')} aria-expanded={sidebarOpen.users}>
              <span className="admin-nav-icon" aria-hidden>👤</span>
              <span>Учётные записи</span>
              <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.users ? '▼' : '▶'}</span>
            </button>
            <div className={`admin-nav-group-content ${sidebarOpen.users ? 'open' : ''}`}>
              <button type="button" className={`admin-nav-item ${view === VIEWS.users ? 'active' : ''}`} onClick={() => setView(VIEWS.users)}>Список сотрудников</button>
              <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.users && contentPanelsOpen.newUser ? 'active' : ''}`} onClick={initNewUser}>+ Новый сотрудник</button>
            </div>
          </div>
        )}
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.settings ? 'open' : ''}`} onClick={() => toggleSidebarGroup('settings')} aria-expanded={sidebarOpen.settings}>
            <span className="admin-nav-icon" aria-hidden>⚙️</span>
            <span>Настройки разделов</span>
            <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.settings ? '▼' : '▶'}</span>
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.settings ? 'open' : ''}`}>
            <button type="button" className={`admin-nav-item ${view === VIEWS.settingsPlatform ? 'active' : ''}`} onClick={() => setView(VIEWS.settingsPlatform)}>Интернет магазин</button>
            <button type="button" className={`admin-nav-item ${view === VIEWS.settingsWholesale ? 'active' : ''}`} onClick={() => setView(VIEWS.settingsWholesale)}>Оптовые закупки</button>
            <button type="button" className={`admin-nav-item ${view === VIEWS.settingsProcurement ? 'active' : ''}`} onClick={() => setView(VIEWS.settingsProcurement)}>Отдел закупок</button>
          </div>
        </div>
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.statistics ? 'open' : ''}`} onClick={() => toggleSidebarGroup('statistics')} aria-expanded={sidebarOpen.statistics}>
            <span className="admin-nav-icon" aria-hidden>📊</span>
            <span>Статистика</span>
            <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.statistics ? '▼' : '▶'}</span>
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.statistics ? 'open' : ''}`}>
            <button type="button" className={`admin-nav-item ${view === VIEWS.statistics ? 'active' : ''}`} onClick={() => setView(VIEWS.statistics)}>Посещения, поиск, конверсия</button>
          </div>
        </div>
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.data ? 'open' : ''}`} onClick={() => toggleSidebarGroup('data')} aria-expanded={sidebarOpen.data}>
            <span className="admin-nav-icon" aria-hidden>💾</span>
            <span>Данные</span>
            <span className="admin-nav-group-chevron" aria-hidden>{sidebarOpen.data ? '▼' : '▶'}</span>
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.data ? 'open' : ''}`}>
            <button type="button" className={`admin-nav-item ${view === VIEWS.backup ? 'active' : ''}`} onClick={() => setView(VIEWS.backup)}>Резервная копия</button>
            <Link to="/admin/cennik" className="admin-nav-item">Электронные ценники</Link>
            <Link to="/admin/redis-esl" className="admin-nav-item">REDIS: Управление ценниками</Link>
          </div>
        </div>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-link">← На сайт</Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-section-pills">
              {ADMIN_SECTIONS.map((s) => (
                <button key={s.id} type="button" className={`admin-section-btn ${adminSection === s.id ? 'active' : ''}`} onClick={() => setAdminSection(s.id)}>{s.name}</button>
              ))}
            </div>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">{currentUser?.name || currentUser?.email}</span>
            <span className="admin-topbar-role">{ROLES.find((r) => r.id === currentUser?.roleId)?.name || currentUser?.roleId}</span>
            <button type="button" className="admin-logout" onClick={logout}>Выйти</button>
          </div>
        </header>

        <div className="admin-content">
          {view === VIEWS.dashboard && (
            <div className="admin-section">
              <h2 className="admin-section-title">Дашборд</h2>
              <p className="admin-section-desc">Сводка по разделу «{ADMIN_SECTIONS.find((s) => s.id === adminSection)?.name}».</p>
              <div className="admin-dashboard-grid">
                <button type="button" className="admin-dashboard-card" onClick={() => setView(VIEWS.products)}>
                  <span className="admin-dashboard-card-icon">📦</span>
                  <span className="admin-dashboard-card-value">{products.length}</span>
                  <span className="admin-dashboard-card-label">Товаров</span>
                </button>
                <button type="button" className="admin-dashboard-card" onClick={() => setView(VIEWS.categories)}>
                  <span className="admin-dashboard-card-icon">📁</span>
                  <span className="admin-dashboard-card-value">{categories.length}</span>
                  <span className="admin-dashboard-card-label">Категорий</span>
                </button>
                <button type="button" className="admin-dashboard-card" onClick={() => setView(VIEWS.statistics)}>
                  <span className="admin-dashboard-card-icon">📋</span>
                  <span className="admin-dashboard-card-value">{ordersList.length}</span>
                  <span className="admin-dashboard-card-label">Заказов</span>
                </button>
                {adminSection === 'procurement' && (
                  <button type="button" className="admin-dashboard-card" onClick={() => setView(VIEWS.suppliers)}>
                    <span className="admin-dashboard-card-icon">🚚</span>
                    <span className="admin-dashboard-card-value">{suppliers.length}</span>
                    <span className="admin-dashboard-card-label">Поставщиков</span>
                  </button>
                )}
              </div>
              <div className="admin-dashboard-actions">
                {canEdit && <button type="button" className="admin-dashboard-btn" onClick={initNewProduct}>+ Новый товар</button>}
                {canEdit && <button type="button" className="admin-dashboard-btn admin-dashboard-btn-secondary" onClick={() => setView(VIEWS.categories)}>Категории</button>}
                <button type="button" className="admin-dashboard-btn admin-dashboard-btn-secondary" onClick={() => setView(VIEWS.statistics)}>Статистика</button>
              </div>
            </div>
          )}

          {view === VIEWS.products && (
            <div className="admin-section admin-section-card">
              <div className="admin-section-head">
                <h2 className="admin-section-title">Товары</h2>
                <p className="admin-section-summary">Товаров: <strong>{products.length}</strong> · Категорий: <strong>{categories.length}</strong></p>
              </div>
              <div className="admin-collapsible-block">
                <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.productsList ? 'open' : ''}`} onClick={() => toggleContentPanel('productsList')} aria-expanded={contentPanelsOpen.productsList}>
                  <span>Список товаров</span>
                  <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.productsList ? '▼' : '▶'}</span>
                </button>
                {contentPanelsOpen.productsList && (
                  <div className="admin-collapsible-content">
                    <div className="admin-filters">
                      <input type="text" placeholder="Поиск по названию, категории" value={productFilter.search} onChange={(e) => setProductFilter((f) => ({ ...f, search: e.target.value }))} className="admin-input admin-filter-input" />
                      {adminSection === 'procurement' && (
                        <select value={productFilter.supplierId} onChange={(e) => setProductFilter((f) => ({ ...f, supplierId: e.target.value }))} className="admin-input admin-filter-select">
                          <option value="">Все поставщики</option>
                          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}
                      <select value={productFilter.categoryId} onChange={(e) => setProductFilter((f) => ({ ...f, categoryId: e.target.value }))} className="admin-input admin-filter-select">
                        <option value="">Все категории</option>
                        {categoriesTree.map((c) => <option key={c.id} value={c.id}>{'\u00A0'.repeat((c._depth || 0) * 2)}{c.name}</option>)}
                      </select>
                      <div className="admin-sort">
                        <span className="admin-sort-label">Сортировка:</span>
                        <select value={`${productSort.field}-${productSort.dir}`} onChange={(e) => { const v = e.target.value; const [field, dir] = v.split('-'); setProductSort({ field, dir }); }} className="admin-input admin-filter-select">
                          <option value="name-asc">Название А–Я</option>
                          <option value="name-desc">Название Я–А</option>
                          {adminSection === 'procurement' && (
                          <>
                            <option value="supplierId-asc">Поставщик А–Я</option>
                            <option value="supplierId-desc">Поставщик Я–А</option>
                          </>
                        )}
                        <option value="categoryId-asc">Категория А–Я</option>
                          <option value="categoryId-desc">Категория Я–А</option>
                        </select>
                      </div>
                    </div>
                    {canEdit && draggingProductId && (
                      <div className="admin-drag-drop-bar">
                        <span className="admin-drag-drop-label">Переместить в категорию:</span>
                        {categoriesTree.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="admin-drag-drop-target"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => moveProductToCategory(draggingProductId, c.id)}
                          >
                            {'\u00A0'.repeat((c._depth || 0) * 2)}{c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Артикул</th>
                            <th>Штрихкод</th>
                            <th>Тип</th>
                            {adminSection === 'procurement' && <th>Поставщик</th>}
                            <th>Категория</th>
                            <th>Варианты</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((p) => (
                            <tr
                              key={p.id}
                              draggable={canEdit}
                              className={draggingProductId === p.id ? 'admin-dragging' : ''}
                              onDragStart={(e) => { if (canEdit) { setDraggingProductId(p.id); e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; } }}
                              onDragEnd={() => setDraggingProductId(null)}
                            >
                              <td>
                                {p.imageUrl ? <img src={p.imageUrl} alt="" className="admin-thumb" /> : <span className="admin-no-photo">—</span>}
                              </td>
                              <td>{p.name}</td>
                              <td><code className="admin-code admin-code-sm">{p.article || '—'}</code></td>
                              <td><code className="admin-code admin-code-sm">{p.barcode || '—'}</code></td>
                              <td>{p.type || '—'}</td>
                              {adminSection === 'procurement' && <td>{suppliers.find((s) => s.id === p.supplierId)?.name ?? p.supplierId ?? '—'}</td>}
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
              </div>
              {canEdit && (
                <div className="admin-collapsible-block">
                  <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.newProduct ? 'open' : ''}`} onClick={() => toggleContentPanel('newProduct')} aria-expanded={contentPanelsOpen.newProduct}>
                    <span>+ Новый товар</span>
                    <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.newProduct ? '▼' : '▶'}</span>
                  </button>
                  {contentPanelsOpen.newProduct && newProductForm && (
                    <div className="admin-collapsible-content">
                      <div className="admin-form-card">
                        <label>Название <input type="text" value={newProductForm.name} onChange={(e) => updateNewProduct('name', e.target.value)} className="admin-input" /></label>
                        <label>Артикул <input type="text" value={newProductForm.article || ''} onChange={(e) => updateNewProduct('article', e.target.value)} className="admin-input" placeholder="ART-001 или будет сгенерирован" /></label>
                        <label className="admin-label-with-btn">
                          Штрихкод
                          <span className="admin-input-row">
                            <input type="text" value={newProductForm.barcode || ''} onChange={(e) => updateNewProduct('barcode', e.target.value)} className="admin-input" placeholder="Оставьте пусто — сгенерируется при сохранении" />
                            <button type="button" className="btn-edit admin-btn-sm" onClick={() => updateNewProduct('barcode', generateEAN13())}>Сгенерировать</button>
                          </span>
                        </label>
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
                        {adminSection === 'procurement' && (
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
                        )}
                        <div className="admin-select-with-add">
                          <label>Категория
                            <select value={newProductForm.categoryId} onChange={(e) => updateNewProduct('categoryId', e.target.value)} className="admin-input">
                              {categoriesTree.map((c) => <option key={c.id} value={c.id}>{'\u00A0'.repeat((c._depth || 0) * 2)}{c.name}</option>)}
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
                          <div className="admin-variant-list">
                            {newProductForm.variants.map((v, i) => (
                            <div key={v.id} className="admin-variant-row admin-variant-row--card">
                              <div className="admin-variant-row-name">
                                <label className="admin-variant-label">Название варианта</label>
                                <input type="text" value={v.name ?? ''} onChange={(e) => updateNewProductVariant(i, 'name', e.target.value)} placeholder="Название варианта" className="admin-input admin-input-full" title="Название" />
                              </div>
                              <div className="admin-variant-row-bottom">
                                <label className="admin-variant-field">
                                  <span className="admin-variant-field-label">В упак.</span>
                                  <input type="number" min="1" value={v.packQty ?? 1} onChange={(e) => updateNewProductVariant(i, 'packQty', e.target.value)} className="admin-input admin-input-num" title="В упаковке (шт)" />
                                </label>
                                <label className="admin-variant-field">
                                  <span className="admin-variant-field-label">Розница ₸</span>
                                  <input type="number" min="0" value={v.priceRetail ?? v.price ?? 0} onChange={(e) => updateNewProductVariant(i, 'priceRetail', e.target.value)} className="admin-input admin-input-num" title="Розница" />
                                </label>
                                <label className="admin-variant-field">
                                  <span className="admin-variant-field-label">Опт ₸</span>
                                  <input type="number" min="0" value={v.priceWholesale ?? v.price ?? 0} onChange={(e) => updateNewProductVariant(i, 'priceWholesale', e.target.value)} className="admin-input admin-input-num" title="Опт" />
                                </label>
                                <label className="admin-variant-field">
                                  <span className="admin-variant-field-label">Поставщик ₸</span>
                                  <input type="number" min="0" value={v.priceSupplier ?? v.price ?? 0} onChange={(e) => updateNewProductVariant(i, 'priceSupplier', e.target.value)} className="admin-input admin-input-num" title="Поставщик" />
                                </label>
                                <div className="admin-variant-row-action">
                                  <button type="button" className="btn-remove-variant" onClick={() => removeNewProductVariant(i)} title="Удалить вариант">Удалить</button>
                                </div>
                              </div>
                            </div>
                          ))}
                          </div>
                        </div>
                        <div className="admin-form-actions">
                          <button type="button" className="btn-cancel" onClick={() => { setNewProductForm(null); setContentPanelsOpen((p) => ({ ...p, newProduct: false })); }}>Отмена</button>
                          <button type="button" className="btn-save" onClick={createProduct}>Создать товар</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {adminSection === 'procurement' && canEdit && (
                <div className="admin-collapsible-block">
                  <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.productsImport ? 'open' : ''}`} onClick={() => { setContentPanelsOpen((p) => ({ ...p, productsImport: !p.productsImport })); setImportResult(null); }} aria-expanded={contentPanelsOpen.productsImport}>
                    <span>📤 Импорт из файла (Excel/CSV)</span>
                    <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.productsImport ? '▼' : '▶'}</span>
                  </button>
                  {contentPanelsOpen.productsImport && (
                    <div className="admin-collapsible-content">
                      <p className="admin-section-desc">Скачайте шаблон, заполните в Excel (или сохраните как CSV с разделителем «;»), затем загрузите файл — товары добавятся в список.</p>
                      <div className="admin-import-actions">
                        <button type="button" className="admin-btn admin-btn-primary" onClick={downloadProductTemplate}>Скачать шаблон (CSV для Excel)</button>
                        <label className="admin-file-label admin-import-upload">
                          <input type="file" accept=".csv,.txt,text/csv,application/csv" className="admin-file-input" onChange={handleProductImport} />
                          Загрузить файл
                        </label>
                      </div>
                      {importResult && (
                        <div className={`admin-import-result ${importResult.success ? 'success' : 'error'}`}>
                          {importResult.success ? (
                            <>
                              <strong>Импортировано товаров: {importResult.count}</strong>
                              {importResult.errors && importResult.errors.length > 0 && (
                                <ul className="admin-import-errors">{importResult.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                              )}
                            </>
                          ) : (
                            <span>{importResult.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === VIEWS.suppliers && (
            <div className="admin-section admin-section-card">
              <h2 className="admin-section-title">Поставщики</h2>
              <div className="admin-collapsible-block">
                <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.suppliersList ? 'open' : ''}`} onClick={() => toggleContentPanel('suppliersList')} aria-expanded={contentPanelsOpen.suppliersList}>
                  <span>Список поставщиков</span>
                  <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.suppliersList ? '▼' : '▶'}</span>
                </button>
                {contentPanelsOpen.suppliersList && (
                  <div className="admin-collapsible-content">
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
              </div>
              {canEdit && (
                <div className="admin-collapsible-block">
                  <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.newSupplier ? 'open' : ''}`} onClick={() => toggleContentPanel('newSupplier')} aria-expanded={contentPanelsOpen.newSupplier}>
                    <span>+ Новый поставщик</span>
                    <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.newSupplier ? '▼' : '▶'}</span>
                  </button>
                  {contentPanelsOpen.newSupplier && (
                    <div className="admin-collapsible-content">
                      <div className="admin-form-card">
                        <label>ID (латиница, без пробелов) <input type="text" value={newSupplierForm.id} onChange={(e) => setNewSupplierForm((f) => ({ ...f, id: e.target.value }))} placeholder="postavshik-1" className="admin-input" /></label>
                        <label>Наименование компании <input type="text" value={newSupplierForm.name} onChange={(e) => setNewSupplierForm((f) => ({ ...f, name: e.target.value }))} placeholder="ООО Поставщик" className="admin-input" /></label>
                        <label>Сотовый телефон <input type="text" value={newSupplierForm.phone} onChange={(e) => setNewSupplierForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+7 (777) 000-00-00" className="admin-input" /></label>
                        <label>Адрес компании <input type="text" value={newSupplierForm.address} onChange={(e) => setNewSupplierForm((f) => ({ ...f, address: e.target.value }))} placeholder="г. Город, ул. Улица, д. 1" className="admin-input" /></label>
                        <div className="admin-form-actions">
                          <button type="button" className="btn-cancel" onClick={() => { setNewSupplierForm({ id: '', name: '', phone: '', address: '' }); setContentPanelsOpen((p) => ({ ...p, newSupplier: false })); }}>Отмена</button>
                          <button type="button" className="btn-save" onClick={createSupplier}>Создать поставщика</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === VIEWS.categories && (
            <div className="admin-section admin-section-card">
              <h2 className="admin-section-title">Категории</h2>
              <div className="admin-collapsible-block">
                <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.categoriesList ? 'open' : ''}`} onClick={() => toggleContentPanel('categoriesList')} aria-expanded={contentPanelsOpen.categoriesList}>
                  <span>Список категорий</span>
                  <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.categoriesList ? '▼' : '▶'}</span>
                </button>
                {contentPanelsOpen.categoriesList && (
                  <div className="admin-collapsible-content">
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
                          {canEdit && draggingCategoryId && (
                            <tr
                              className="admin-drop-row admin-drop-root"
                              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('admin-drop-over'); }}
                              onDragLeave={(e) => { e.currentTarget.classList.remove('admin-drop-over'); }}
                              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('admin-drop-over'); moveCategoryParent(draggingCategoryId, null); }}
                            >
                              <td colSpan={3}>— Перетащите сюда для корня —</td>
                            </tr>
                          )}
                          {filteredCategories.map((c) => (
                            <tr
                              key={c.id}
                              draggable={canEdit}
                              className={draggingCategoryId === c.id ? 'admin-dragging' : dragOverCategoryId === c.id ? 'admin-drop-over' : ''}
                              onDragStart={(e) => { if (canEdit) { setDraggingCategoryId(c.id); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; } }}
                              onDragEnd={() => setDraggingCategoryId(null)}
                              onDragOver={(e) => { if (canEdit && draggingCategoryId && draggingCategoryId !== c.id) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCategoryId(c.id); } }}
                              onDragLeave={() => setDragOverCategoryId(null)}
                              onDrop={(e) => { e.preventDefault(); if (canEdit && draggingCategoryId && draggingCategoryId !== c.id) { moveCategoryParent(draggingCategoryId, c.id); } setDragOverCategoryId(null); }}
                            >
                              <td><code className="admin-code">{c.id}</code></td>
                              <td><span className="admin-category-name" style={{ paddingLeft: (c._depth || 0) * 16 }}>{c.name}</span></td>
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
              </div>
              {canEdit && (
                <div className="admin-collapsible-block">
                  <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.newCategory ? 'open' : ''}`} onClick={() => toggleContentPanel('newCategory')} aria-expanded={contentPanelsOpen.newCategory}>
                    <span>+ Новая категория</span>
                    <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.newCategory ? '▼' : '▶'}</span>
                  </button>
                  {contentPanelsOpen.newCategory && (
                    <div className="admin-collapsible-content">
                      <div className="admin-form-card">
                        <label>ID (латиница, без пробелов) <input type="text" value={newCategoryForm.id} onChange={(e) => setNewCategoryForm((f) => ({ ...f, id: e.target.value }))} placeholder="naprimer-tak" className="admin-input" /></label>
                        <label>Название <input type="text" value={newCategoryForm.name} onChange={(e) => setNewCategoryForm((f) => ({ ...f, name: e.target.value }))} placeholder="Например так" className="admin-input" /></label>
                        <label>Родительская категория (подкатегория)
                          <select value={newCategoryForm.parentId || ''} onChange={(e) => setNewCategoryForm((f) => ({ ...f, parentId: e.target.value }))} className="admin-input">
                            <option value="">— Без родителя —</option>
                            {categoriesTree.map((c) => (
                              <option key={c.id} value={c.id}>{'\u00A0'.repeat(c._depth * 2)}{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <div className="admin-form-actions">
                          <button type="button" className="btn-cancel" onClick={() => { setNewCategoryForm({ id: '', name: '', parentId: '' }); setContentPanelsOpen((p) => ({ ...p, newCategory: false })); }}>Отмена</button>
                          <button type="button" className="btn-save" onClick={createCategory}>Создать категорию</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {canManageUsers && view === VIEWS.users && (
            <div className="admin-section admin-section-card">
              <h2 className="admin-section-title">Сотрудники</h2>
              <div className="admin-collapsible-block">
                <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.usersList ? 'open' : ''}`} onClick={() => toggleContentPanel('usersList')} aria-expanded={contentPanelsOpen.usersList}>
                  <span>Список сотрудников</span>
                  <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.usersList ? '▼' : '▶'}</span>
                </button>
                {contentPanelsOpen.usersList && (
                  <div className="admin-collapsible-content">
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
              </div>
              <div className="admin-collapsible-block">
                <button type="button" className={`admin-collapsible-toggle ${contentPanelsOpen.newUser ? 'open' : ''}`} onClick={() => toggleContentPanel('newUser')} aria-expanded={contentPanelsOpen.newUser}>
                  <span>+ Новый сотрудник</span>
                  <span className="admin-collapsible-chevron" aria-hidden>{contentPanelsOpen.newUser ? '▼' : '▶'}</span>
                </button>
                {contentPanelsOpen.newUser && (
                  <div className="admin-collapsible-content">
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
                        <button type="button" className="btn-cancel" onClick={() => { setNewUserForm({ email: '', name: '', password: '', departmentId: 'procurement', roleId: 'reader' }); setContentPanelsOpen((p) => ({ ...p, newUser: false })); }}>Отмена</button>
                        <button type="button" className="btn-save" onClick={createUser}>Создать сотрудника</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === VIEWS.statistics && (
            <div className="admin-section">
              <h2 className="admin-section-title">Статистика сайта</h2>
              <p className="admin-section-desc">Посещения страниц, поисковые запросы и конверсии (оформленные заказы).</p>
              <div className="admin-stats-grid">
                <div className="admin-stats-card">
                  <h3>Посещения</h3>
                  <p className="admin-stats-count">{(stats.visits || []).length}</p>
                  <p className="admin-stats-hint">Всего визитов за период</p>
                  <div className="admin-stats-recent">
                    <strong>Последние:</strong>
                    {(stats.visits || []).slice(-10).reverse().map((e, i) => (
                      <div key={i} className="admin-stats-row"><span>{e.path}</span><span>{e.at ? new Date(e.at).toLocaleString('ru-KZ') : ''}</span></div>
                    ))}
                  </div>
                </div>
                <div className="admin-stats-card">
                  <h3>Поиск товара</h3>
                  <p className="admin-stats-count">{(stats.searches || []).length}</p>
                  <p className="admin-stats-hint">Всего поисковых запросов</p>
                  <div className="admin-stats-recent">
                    <strong>Последние:</strong>
                    {(stats.searches || []).slice(-10).reverse().map((e, i) => (
                      <div key={i} className="admin-stats-row"><span>«{e.q}»</span><span>{e.at ? new Date(e.at).toLocaleString('ru-KZ') : ''}</span></div>
                    ))}
                  </div>
                </div>
                <div className="admin-stats-card">
                  <h3>Конверсия (заказы)</h3>
                  <p className="admin-stats-count">{(stats.conversions || []).length}</p>
                  <p className="admin-stats-hint">Оформлено заказов</p>
                  <div className="admin-stats-recent">
                    <strong>Последние:</strong>
                    {(stats.conversions || []).slice(-10).reverse().map((e, i) => (
                      <div key={i} className="admin-stats-row"><span>{e.section || '—'} · {Number(e.total || 0).toLocaleString('ru-KZ')} ₸</span><span>{e.at ? new Date(e.at).toLocaleString('ru-KZ') : ''}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === VIEWS.backup && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Резервная копия данных</h2>
              <p className="admin-section-desc">Сохраните товары, категории, поставщиков, заказы и настройки в файл. При обновлении сайта (заливке с теста на бой) данные в браузере сохраняются сами, но для надёжности перед обновлением скачайте копию и при необходимости восстановите из файла.</p>
              <div className="admin-form-card admin-backup-card">
                <div className="admin-backup-actions">
                  <button type="button" className="admin-btn admin-btn-primary" onClick={downloadBackup}>
                    Скачать резервную копию
                  </button>
                  <p className="admin-backup-hint">Скачает JSON-файл с товарами, категориями, поставщиками, заказами, настройками и статистикой.</p>
                </div>
                <div className="admin-backup-restore">
                  <label className="admin-backup-label">Восстановить из файла</label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="admin-backup-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        try {
                          const data = JSON.parse(reader.result)
                          if (restoreBackupFromData(data)) {
                            if (window.confirm('Данные восстановлены. Перезагрузить страницу?')) window.location.reload()
                          } else alert('Не удалось восстановить данные.')
                        } catch (err) {
                          alert('Ошибка чтения файла. Убедитесь, что выбран файл резервной копии Redprice.')
                        }
                        e.target.value = ''
                      }
                      reader.readAsText(file)
                    }}
                  />
                  <p className="admin-backup-hint">Выберите ранее скачанный JSON-файл. Текущие данные будут заменены. После восстановления страница перезагрузится.</p>
                </div>
              </div>
            </div>
          )}

          {view === VIEWS.settingsPlatform && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Настройки раздела «Интернет магазин»</h2>
              <p className="admin-section-desc">Параметры интернет-магазина (главная страница).</p>
              <div className="admin-form-card">
                <label>Минимальная сумма заказа (₸) <input type="number" min="0" value={getSettings('platform').minOrderSum ?? 0} onChange={(e) => setSettings('platform', { minOrderSum: Number(e.target.value) || 0 })} className="admin-input" /></label>
                <label>Название сайта <input type="text" value={getSettings('platform').siteName ?? 'Redprice.kz'} onChange={(e) => setSettings('platform', { siteName: e.target.value })} className="admin-input" /></label>
                <label>Валюта <input type="text" value={getSettings('platform').currency ?? '₸'} onChange={(e) => setSettings('platform', { currency: e.target.value })} className="admin-input" placeholder="₸" /></label>
              </div>
            </div>
          )}

          {view === VIEWS.settingsWholesale && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Настройки раздела «Оптовые закупки»</h2>
              <p className="admin-section-desc">Параметры каталога оптовых закупок (/opt).</p>
              <div className="admin-form-card">
                <label>Минимальная сумма заказа (₸) <input type="number" min="0" value={getSettings('wholesale').minOrderSum ?? 0} onChange={(e) => setSettings('wholesale', { minOrderSum: Number(e.target.value) || 0 })} className="admin-input" /></label>
                <label>Валюта <input type="text" value={getSettings('wholesale').currency ?? '₸'} onChange={(e) => setSettings('wholesale', { currency: e.target.value })} className="admin-input" /></label>
              </div>
            </div>
          )}

          {view === VIEWS.settingsProcurement && (
            <div className="admin-section admin-form-section">
              <h2 className="admin-section-title">Настройки раздела «Отдел закупок»</h2>
              <p className="admin-section-desc">Параметры каталога для отдела закупок (/zakup).</p>
              <div className="admin-form-card">
                <label>Валюта <input type="text" value={getSettings('procurement').currency ?? '₸'} onChange={(e) => setSettings('procurement', { currency: e.target.value })} className="admin-input" /></label>
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
              <label>Артикул <input type="text" value={productForm.article || ''} onChange={(e) => updateProductForm('article', e.target.value)} className="admin-input" placeholder="ART-001" /></label>
              <label className="admin-label-with-btn">
                Штрихкод
                <span className="admin-input-row">
                  <input type="text" value={productForm.barcode || ''} onChange={(e) => updateProductForm('barcode', e.target.value)} className="admin-input" placeholder="EAN-13 или оставьте пусто" />
                  <button type="button" className="btn-edit admin-btn-sm" onClick={() => updateProductForm('barcode', generateEAN13(productForm.id))}>Сгенерировать</button>
                </span>
              </label>
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
              {adminSection === 'procurement' && (
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
              )}
              <div className="admin-select-with-add">
                <label>Категория
                  <select value={productForm.categoryId} onChange={(e) => updateProductForm('categoryId', e.target.value)} className="admin-input">
                    {categoriesTree.map((c) => <option key={c.id} value={c.id}>{'\u00A0'.repeat((c._depth || 0) * 2)}{c.name}</option>)}
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
                <div className="admin-variant-list">
                {productForm.variants.map((v, i) => (
                  <div key={v.id} className="admin-variant-row admin-variant-row--card">
                    <div className="admin-variant-row-name">
                      <label className="admin-variant-label">Название варианта</label>
                      <input type="text" value={v.name ?? ''} onChange={(e) => updateProductVariant(i, 'name', e.target.value)} placeholder="Название варианта" className="admin-input admin-input-full" title="Название" />
                    </div>
                    <div className="admin-variant-row-bottom">
                      <label className="admin-variant-field">
                        <span className="admin-variant-field-label">В упак.</span>
                        <input type="number" min="1" value={v.packQty ?? 1} onChange={(e) => updateProductVariant(i, 'packQty', e.target.value)} className="admin-input admin-input-num" title="В упаковке (шт)" />
                      </label>
                      <label className="admin-variant-field">
                        <span className="admin-variant-field-label">Розница ₸</span>
                        <input type="number" min="0" value={v.priceRetail ?? v.price ?? 0} onChange={(e) => updateProductVariant(i, 'priceRetail', e.target.value)} className="admin-input admin-input-num" title="Розница (платформа)" />
                      </label>
                      <label className="admin-variant-field">
                        <span className="admin-variant-field-label">Опт ₸</span>
                        <input type="number" min="0" value={v.priceWholesale ?? v.price ?? 0} onChange={(e) => updateProductVariant(i, 'priceWholesale', e.target.value)} className="admin-input admin-input-num" title="Опт (оптовые закупки)" />
                      </label>
                      <label className="admin-variant-field">
                        <span className="admin-variant-field-label">Поставщик ₸</span>
                        <input type="number" min="0" value={v.priceSupplier ?? v.price ?? 0} onChange={(e) => updateProductVariant(i, 'priceSupplier', e.target.value)} className="admin-input admin-input-num" title="Поставщик (отдел закупок)" />
                      </label>
                      <div className="admin-variant-row-action">
                        <button type="button" className="btn-remove-variant" onClick={() => removeProductVariant(i)} title="Удалить вариант">Удалить</button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
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
              <label>Родительская категория (подкатегория)
                <select value={categoryForm.parentId || ''} onChange={(e) => setCategoryForm((f) => f ? { ...f, parentId: e.target.value } : f)} className="admin-input">
                  <option value="">— Без родителя (корень) —</option>
                  {categoriesTree.filter((c) => c.id !== categoryForm?.id).map((c) => (
                    <option key={c.id} value={c.id}>{'\u00A0'.repeat(c._depth * 2)}{c.name}</option>
                  ))}
                </select>
              </label>
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

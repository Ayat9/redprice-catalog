import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import {
  LayoutDashboard,
  Truck,
  Users,
  Database,
  ChevronRight,
  PanelLeftClose,
  PanelRightOpen,
  Settings2,
  Newspaper,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import LoginCard from '../components/auth/LoginCard'
import ApiSettingsWorkspace from '../components/redprice/admin/ApiSettingsWorkspace'
import AdminNewsWorkspace from '../components/redprice/admin/AdminNewsWorkspace'
import PartnerConditionsWorkspace from '../components/redprice/admin/PartnerConditionsWorkspace'
import SupplierAdminWorkspace from '../components/redprice/admin/SupplierAdminWorkspace'
import './Admin.css'

const SIDEBAR_W = { expanded: 260, collapsed: 72 }
const navIc = { className: 'size-[18px] shrink-0 text-slate-500', strokeWidth: 1.5, 'aria-hidden': true }

const VIEWS = { dashboard: 'dashboard', users: 'users', newUser: 'newUser', apiPanel: 'apiPanel', newsEditor: 'newsEditor', supplierPanel: 'supplierPanel', partnerConditions: 'partnerConditions' }

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn, login, logout, currentUser, canManageUsers, requestPasswordReset, getUsers, addUser, updateUser, deleteUser, DEPARTMENTS, ROLES } = useAdminAuth()
  const [view, setView] = useState(VIEWS.dashboard)
  const [loginEmail, setLoginEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetResult, setResetResult] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState(null)
  const [newUserForm, setNewUserForm] = useState({ email: '', name: '', password: '', departmentId: 'data_entry', roleId: 'reader' })
  const [userFilter, setUserFilter] = useState({ search: '' })
  const [userSort, setUserSort] = useState({ field: 'name', dir: 'asc' })

  useEffect(() => {
    if (!isLoggedIn) return
    const p = searchParams.get('panel')
    if (p === 'api') setView(VIEWS.apiPanel)
    else if (p === 'news') setView(VIEWS.newsEditor)
    else if (p === 'suppliers') setView(VIEWS.supplierPanel)
    else if (p === 'partner-conditions') setView(VIEWS.partnerConditions)
  }, [isLoggedIn, searchParams])

  const prevViewRef = useRef(null)
  useEffect(() => {
    if (!isLoggedIn) return
    const prev = prevViewRef.current
    prevViewRef.current = view
    if (view === VIEWS.apiPanel && searchParams.get('panel') !== 'api') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.set('panel', 'api')
          return p
        },
        { replace: true }
      )
    }
    if (prev === VIEWS.apiPanel && view !== VIEWS.apiPanel && searchParams.get('panel') === 'api') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.delete('panel')
          return p
        },
        { replace: true }
      )
    }
    if (view === VIEWS.newsEditor && searchParams.get('panel') !== 'news') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.set('panel', 'news')
          return p
        },
        { replace: true }
      )
    }
    if (prev === VIEWS.newsEditor && view !== VIEWS.newsEditor && searchParams.get('panel') === 'news') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.delete('panel')
          return p
        },
        { replace: true }
      )
    }
    if (view === VIEWS.partnerConditions && searchParams.get('panel') !== 'partner-conditions') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.set('panel', 'partner-conditions')
          return p
        },
        { replace: true }
      )
    }
    if (prev === VIEWS.partnerConditions && view !== VIEWS.partnerConditions && searchParams.get('panel') === 'partner-conditions') {
      setSearchParams(
        (p0) => {
          const p = new URLSearchParams(p0)
          p.delete('panel')
          return p
        },
        { replace: true }
      )
    }
  }, [isLoggedIn, view, searchParams, setSearchParams])

  const [sidebarOpen, setSidebarOpen] = useState({
    users: false,
    data: false,
  })
  const toggleSidebarGroup = (key) => setSidebarOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const toggleGroupNav = (key) => {
    if (sidebarCollapsed) setSidebarCollapsed(false)
    toggleSidebarGroup(key)
  }

  useEffect(() => {
    const groupByView = {
      [VIEWS.users]: 'users',
      [VIEWS.newUser]: 'users',
      [VIEWS.apiPanel]: 'data',
      [VIEWS.newsEditor]: 'data',
      [VIEWS.supplierPanel]: 'data',
      [VIEWS.partnerConditions]: 'data',
    }
    const key = groupByView[view]
    if (key) setSidebarOpen((prev) => ({ ...prev, [key]: true }))
  }, [view])

  const [contentPanelsOpen, setContentPanelsOpen] = useState({
    usersList: true,
    newUser: false
  })
  const toggleContentPanel = (key) => setContentPanelsOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  // ——— Фильтрация и сортировка ———
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
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'data_entry', roleId: 'reader' })
  }
  const createUser = () => {
    const res = addUser(newUserForm)
    if (!res.success) {
      alert(res.message)
      return
    }
    setView(VIEWS.users)
    setNewUserForm({ email: '', name: '', password: '', departmentId: 'data_entry', roleId: 'reader' })
    setContentPanelsOpen((p) => ({ ...p, newUser: false }))
  }

  useEffect(() => {
    if (contentPanelsOpen.newUser && canManageUsers && !newUserForm.email) initNewUser()
  }, [contentPanelsOpen.newUser])

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
      <LoginCard
        title={showReset ? 'Сброс пароля' : 'Вход в админ-панель'}
        subtitle={showReset ? 'Введите email учётной записи.' : 'Введите email и пароль'}
        footer={
          <div className="login-card-links">
            {!showReset ? (
              <button type="button" className="login-card-link-button" onClick={() => setShowReset(true)}>
                Забыли пароль?
              </button>
            ) : (
              <button
                type="button"
                className="login-card-link-button"
                onClick={() => { setShowReset(false); setResetEmail(''); setResetResult(null) }}
              >
                ← Назад ко входу
              </button>
            )}
            <Link to="/" className="login-card-link">← На главную</Link>
          </div>
        }
      >
        {!showReset ? (
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              className="login-input"
              autoFocus
              required
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="login-input"
              autoComplete="current-password"
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="login-submit">Войти</button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleReset}>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email"
              className="login-input"
              autoFocus
              required
              autoComplete="username"
            />
            {resetResult?.success === false && <p className="login-error">{resetResult.message}</p>}
            {resetResult?.success && (
              <p className="login-success">{resetResult.message}
                {resetResult.resetLink && (
                  <span> Ссылка для перехода: <a href={resetResult.resetLink} className="login-card-link">{resetResult.resetLink}</a></span>
                )}
              </p>
            )}
            <button type="submit" className="login-submit">Отправить ссылку на email</button>
          </form>
        )}
      </LoginCard>
    )
  }

  return (
    <div className="admin-panel">
      <aside
        className={cn('admin-sidebar-light', sidebarCollapsed && 'admin-sidebar-light--collapsed')}
        style={{
          width: sidebarCollapsed ? SIDEBAR_W.collapsed : SIDEBAR_W.expanded,
          minWidth: sidebarCollapsed ? SIDEBAR_W.collapsed : SIDEBAR_W.expanded,
        }}
        aria-label="Меню"
      >
        <div className="admin-sidebar-brand">
          <Link to="/" className="admin-sidebar-logo" title="Redprice">
            {sidebarCollapsed ? 'R' : 'Redprice'}
          </Link>
          {!sidebarCollapsed && <span className="admin-sidebar-tagline">Админ-панель</span>}
        </div>
        <button
          type="button"
          className={`admin-nav-item ${view === VIEWS.dashboard ? 'active' : ''}`}
          onClick={() => setView(VIEWS.dashboard)}
          title="Дашборд"
        >
          <LayoutDashboard {...navIc} />
          {!sidebarCollapsed && <span>Дашборд</span>}
        </button>
        <div className="admin-sidebar-divider" />
        {canManageUsers && (
          <div className="admin-nav-group admin-nav-group-collapsible">
            <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.users ? 'open' : ''}`} onClick={() => toggleGroupNav('users')} aria-expanded={sidebarOpen.users} title="Учётные записи">
              <Users {...navIc} />
              {!sidebarCollapsed && <span>Учётные записи</span>}
              {!sidebarCollapsed && (
                <ChevronRight className={cn('admin-nav-group-chevron ml-auto h-4 w-4 shrink-0 transition-transform', sidebarOpen.users && 'rotate-90')} strokeWidth={1.5} aria-hidden />
              )}
            </button>
            <div className={`admin-nav-group-content ${sidebarOpen.users ? 'open' : ''}`}>
              <button type="button" className={`admin-nav-item ${view === VIEWS.users ? 'active' : ''}`} onClick={() => setView(VIEWS.users)}>Список сотрудников</button>
              <button type="button" className={`admin-nav-item admin-nav-item-sub ${view === VIEWS.users && contentPanelsOpen.newUser ? 'active' : ''}`} onClick={initNewUser}>+ Новый сотрудник</button>
            </div>
          </div>
        )}
        <div className="admin-nav-group admin-nav-group-collapsible">
          <button type="button" className={`admin-nav-group-toggle ${sidebarOpen.data ? 'open' : ''}`} onClick={() => toggleGroupNav('data')} aria-expanded={sidebarOpen.data} title="Данные">
            <Database {...navIc} />
            {!sidebarCollapsed && <span>Данные</span>}
            {!sidebarCollapsed && (
              <ChevronRight className={cn('admin-nav-group-chevron ml-auto h-4 w-4 shrink-0 transition-transform', sidebarOpen.data && 'rotate-90')} strokeWidth={1.5} aria-hidden />
            )}
          </button>
          <div className={`admin-nav-group-content ${sidebarOpen.data ? 'open' : ''}`}>
            <Link to="/admin/cennik" className="admin-nav-item">Электронные ценники</Link>
            <button
              type="button"
              className={`admin-nav-item ${view === VIEWS.apiPanel ? 'active' : ''}`}
              title="Панель API"
              onClick={() => setView(VIEWS.apiPanel)}
            >
              <Settings2 {...navIc} />
              {!sidebarCollapsed && <span>Панель API</span>}
            </button>
            <button
              type="button"
              className={`admin-nav-item ${view === VIEWS.newsEditor ? 'active' : ''}`}
              title="Редактор новостей"
              onClick={() => setView(VIEWS.newsEditor)}
            >
              <Newspaper {...navIc} />
              {!sidebarCollapsed && <span>Новости (CMS)</span>}
            </button>
            <button
              type="button"
              className={`admin-nav-item ${view === VIEWS.supplierPanel ? 'active' : ''}`}
              title="Поставщики"
              onClick={() => setView(VIEWS.supplierPanel)}
            >
              <Truck {...navIc} />
              {!sidebarCollapsed && <span>Поставщики</span>}
            </button>
            <button
              type="button"
              className={`admin-nav-item ${view === VIEWS.partnerConditions ? 'active' : ''}`}
              title="Условия PDF"
              onClick={() => setView(VIEWS.partnerConditions)}
            >
              <FileText {...navIc} />
              {!sidebarCollapsed && <span>Условия PDF</span>}
            </button>
          </div>
        </div>
        <div className="admin-sidebar-toolbar">
          <button
            type="button"
            className="admin-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {sidebarCollapsed ? <PanelRightOpen className="size-4" strokeWidth={1.5} aria-hidden /> : <PanelLeftClose className="size-4" strokeWidth={1.5} aria-hidden />}
          </button>
        </div>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-link">{sidebarCollapsed ? '←' : '← На сайт'}</Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-macos-header">
          <div className="admin-macos-header-row">
            <div className="admin-macos-header-user">
              <span className="admin-topbar-user">{currentUser?.name || currentUser?.email}</span>
              <span className="admin-topbar-role">{ROLES.find((r) => r.id === currentUser?.roleId)?.name || currentUser?.roleId}</span>
            </div>
            <button type="button" className="admin-logout" onClick={logout}>Выйти</button>
          </div>
        </header>

        <div className={cn('admin-content', view === VIEWS.apiPanel && 'admin-content--flush')}>
          {view === VIEWS.apiPanel && (
            <div className="admin-api-panel-root">
              <ApiSettingsWorkspace />
            </div>
          )}

          {view === VIEWS.newsEditor && <AdminNewsWorkspace />}

          {view === VIEWS.supplierPanel && <SupplierAdminWorkspace />}

          {view === VIEWS.partnerConditions && <PartnerConditionsWorkspace />}

          {view === VIEWS.dashboard && (
            <div className="admin-section">
              <h2 className="admin-section-title">Дашборд</h2>
              <p className="admin-section-desc">Сводка по каталогу.</p>
              <div className="admin-dashboard-grid">
                <button type="button" className="admin-dashboard-card" onClick={() => setView(VIEWS.supplierPanel)}>
                  <Truck className="admin-dashboard-card-lucide text-slate-400" strokeWidth={1.5} aria-hidden />
                  <span className="admin-dashboard-card-label">Поставщики</span>
                </button>
              </div>
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
                        <button type="button" className="btn-cancel" onClick={() => { setNewUserForm({ email: '', name: '', password: '', departmentId: 'data_entry', roleId: 'reader' }); setContentPanelsOpen((p) => ({ ...p, newUser: false })); }}>Отмена</button>
                        <button type="button" className="btn-save" onClick={createUser}>Создать сотрудника</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

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

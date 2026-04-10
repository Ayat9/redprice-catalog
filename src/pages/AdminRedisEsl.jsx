import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import './Admin.css'

export default function AdminRedisEsl() {
  const { isLoggedIn, canEdit } = useAdminAuth()
  const [items, setItems] = useState([])
  const [backend, setBackend] = useState('')
  const [mac, setMac] = useState('')
  const [productId, setProductId] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [binding, setBinding] = useState(false)
  const [message, setMessage] = useState({ ok: null, text: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/esl/nomenclature')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Ошибка загрузки номенклатуры')
      const next = Array.isArray(data.items) ? data.items : []
      setItems(next)
      setBackend(typeof data.backend === 'string' ? data.backend : '')
    } catch (e) {
      setMessage({ ok: false, text: e?.message || 'Ошибка загрузки' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    load()
  }, [isLoggedIn, load])

  useEffect(() => {
    if (!items.length) return
    if (!items.some((x) => String(x.id) === String(productId))) {
      setProductId(String(items[0].id))
    }
  }, [items, productId])

  const onSync = () => {
    setSyncing(true)
    setMessage({ ok: null, text: '' })
    fetch('/api/v1/esl/sync-1c', { method: 'POST' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.message || 'Ошибка синхронизации')
        setMessage({ ok: true, text: j.message || 'Готово' })
        return load()
      })
      .catch((e) => setMessage({ ok: false, text: e?.message || 'Ошибка' }))
      .finally(() => setSyncing(false))
  }

  const onBind = (e) => {
    e.preventDefault()
    if (!canEdit) {
      setMessage({ ok: false, text: 'Недостаточно прав' })
      return
    }
    setBinding(true)
    setMessage({ ok: null, text: '' })
    fetch('/api/v1/esl/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, productId }),
    })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.message || 'Ошибка привязки')
        setMessage({ ok: true, text: `Привязано: ${j.mac} → товар ${j.productId}` })
        setMac('')
      })
      .catch((err) => setMessage({ ok: false, text: err?.message || 'Ошибка' }))
      .finally(() => setBinding(false))
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <Link to="/" className="admin-back">← На главную</Link>
          <h1 className="admin-header-title">REDIS: Управление ценниками</h1>
          <p className="admin-header-desc">Войдите в админ-панель для доступа.</p>
        </header>
        <div className="admin-container">
          <Link to="/admin" className="btn-save" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
            Перейти в админ-панель
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar-dark" aria-label="Меню">
        <div className="admin-sidebar-brand">
          <Link to="/" className="admin-sidebar-logo">Redprice</Link>
          <span className="admin-sidebar-tagline">Админ-панель</span>
        </div>
        <div className="admin-nav-group">
          <div className="admin-nav-group-content open">
            <Link to="/admin" className="admin-nav-item">← Обзор админки</Link>
            <Link to="/admin/cennik" className="admin-nav-item">Электронные ценники</Link>
            <span className="admin-nav-item active">REDIS: Управление ценниками</span>
          </div>
        </div>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-link">← На сайт</Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1 className="admin-section-title" style={{ margin: 0 }}>REDIS: Управление ценниками</h1>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-section admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">Номенклатура (1С / Redis)</h2>
              <p className="admin-section-summary">
                Бэкенд: <strong>{backend || '—'}</strong>
                {backend === 'memory' && (
                  <span> · задайте <code>REDIS_URL</code> для продакшена</span>
                )}
              </p>
            </div>
            <div className="admin-toolbar" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn-save" disabled={syncing || !canEdit} onClick={onSync}>
                {syncing ? 'Синхронизация…' : 'Синхронизация с 1С'}
              </button>
              <span className="admin-section-desc" style={{ margin: 0 }}>Имитация загрузки из 1С в Redis (заглушка).</span>
            </div>

            {message.text && (
              <p className={message.ok === false ? 'admin-login-error' : 'admin-login-success'} style={{ marginBottom: 16 }}>
                {message.text}
              </p>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Артикул</th>
                    <th>Цена</th>
                    <th>Скидка %</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}>Загрузка…</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={5}>Нет данных. Нажмите «Синхронизация с 1С».</td></tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.article}</td>
                        <td>{row.price}</td>
                        <td>{row.discount ?? '0'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-section admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">Привязка ESP32</h2>
              <p className="admin-section-desc">Ключ в Redis: <code>device:{'{mac}'}</code> → ID товара</p>
            </div>
            <form className="admin-inline-form" onSubmit={onBind}>
              <label className="admin-variant-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="admin-sort-label">MAC-адрес</span>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="aa:bb:cc:dd:ee:ff или aabbccddeeff"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="admin-variant-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="admin-sort-label">Товар</span>
                <select
                  className="admin-input admin-filter-select"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {items.map((row) => (
                    <option key={row.id} value={row.id}>{row.name} ({row.id})</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-save" disabled={binding || !canEdit || !items.length}>
                {binding ? 'Сохранение…' : 'Привязать ценник'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

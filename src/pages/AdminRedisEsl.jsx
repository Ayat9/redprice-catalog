import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAdminAuth } from '../context/AdminAuthContext'
import './Admin.css'

const STORE_ID = 'rp-1'
const SOCKET_ENABLED = !import.meta.env.DEV
const socket = SOCKET_ENABLED ? io('/', { autoConnect: false, transports: ['websocket', 'polling'] }) : null

function emptyCatalogForm() {
  return {
    id: '',
    name: '',
    full_name: '',
    sku: '',
    cost_price: '',
    sale_price: '',
    unit: '',
    characteristicsText: '',
    image_url: '',
    device_mac: '',
    is_active: true,
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

async function j(url, options) {
  const r = await fetch(url, options)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.message || data.error || 'Ошибка API')
  return data
}

export default function AdminRedisEsl() {
  const { isLoggedIn, canEdit } = useAdminAuth()
  const [backend, setBackend] = useState('')
  const [dashboard, setDashboard] = useState({ total: 0, online: 0, offline: 0, needsUpdate: 0, wifiLoad: 0 })
  const [queueLength, setQueueLength] = useState(0)
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nightMode, setNightMode] = useState({ enabled: false, time: '02:00' })
  const [bind, setBind] = useState({ mac: '', productId: '' })
  const [message, setMessage] = useState('')
  const [catalogRows, setCatalogRows] = useState([])
  const [catalogQ, setCatalogQ] = useState('')
  const [syncPayload, setSyncPayload] = useState('')
  const [activeSection, setActiveSection] = useState('catalog')
  const [catalogForm, setCatalogForm] = useState(emptyCatalogForm())
  const [catalogSaving, setCatalogSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, p, n] = await Promise.all([
        j(`/api/v1/esl/admin/dashboard?storeId=${STORE_ID}`),
        j(`/api/v1/esl/admin/products?storeId=${STORE_ID}&discrepancyOnly=${discrepancyOnly ? '1' : '0'}&q=${encodeURIComponent(q)}`),
        j('/api/v1/esl/admin/night-mode'),
      ])
      const catalog = await j(`/api/v1/esl/admin/catalog?q=${encodeURIComponent(catalogQ)}`)
      setBackend(d.backend || '')
      setDashboard(d.dashboard || {})
      setQueueLength(Number(d.queue || 0))
      setRows(Array.isArray(p.rows) ? p.rows : [])
      setNightMode({ enabled: Boolean(n.enabled), time: n.time || '02:00' })
      setCatalogRows(Array.isArray(catalog.rows) ? catalog.rows : [])
      if (!bind.productId && p.rows?.[0]?.productId) setBind((x) => ({ ...x, productId: p.rows[0].productId }))
    } catch (e) {
      setMessage(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [bind.productId, discrepancyOnly, q, catalogQ])

  useEffect(() => {
    if (!isLoggedIn) return
    load()
  }, [isLoggedIn, load])

  useEffect(() => {
    if (!SOCKET_ENABLED) return undefined
    if (!isLoggedIn) return undefined
    socket?.connect()
    socket?.emit('esl:subscribe', { storeId: STORE_ID })
    const onStatus = (payload) => {
      if (payload?.storeId !== STORE_ID) return
      setDashboard(payload.dashboard || {})
      setRows((prev) =>
        prev.map((r) => {
          const m = payload.rows?.find((x) => x.mac === r.mac)
          if (!m) return r
          return { ...r, online: m.online, needsUpdate: m.needsUpdate, priceEsl: m.priceEsl, price1c: m.price1c }
        })
      )
    }
    socket?.on('esl:status', onStatus)
    return () => {
      socket?.off('esl:status', onStatus)
      socket?.disconnect()
    }
  }, [isLoggedIn])

  const productOptions = useMemo(() => {
    const m = new Map()
    rows.forEach((r) => {
      if (!m.has(r.productId)) m.set(r.productId, `${r.name} (${r.productId})`)
    })
    return [...m.entries()].map(([value, label]) => ({ value, label }))
  }, [rows])

  async function savePrice(mac, priceEsl) {
    await j('/api/v1/esl/admin/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, priceEsl }),
    })
    setMessage('Цена ESL сохранена')
    load()
  }

  async function doBind(e) {
    e.preventDefault()
    await j('/api/v1/esl/admin/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: STORE_ID, mac: bind.mac, productId: bind.productId }),
    })
    setMessage('Ценник привязан')
    setBind((x) => ({ ...x, mac: '' }))
    load()
  }

  async function ping(mac) {
    const out = await j('/api/v1/esl/admin/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac }),
    })
    setMessage(out.message || 'Ping отправлен')
  }

  async function enqueueMismatch() {
    const mismatch = rows.filter((r) => r.discrepancy)
    for (const r of mismatch) {
      // eslint-disable-next-line no-await-in-loop
      await j('/api/v1/esl/admin/discrepancy/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: STORE_ID, mac: r.mac, productId: r.productId, nextPrice: r.price1c }),
      })
    }
    setMessage(`В очередь добавлено: ${mismatch.length}`)
    load()
  }

  async function batch(action) {
    const out = await j('/api/v1/esl/admin/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: STORE_ID, action }),
    })
    setMessage(out.message || 'Готово')
  }

  async function saveNightMode() {
    await j('/api/v1/esl/admin/night-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nightMode),
    })
    setMessage('Ночной режим сохранен')
  }

  async function runNightNow() {
    const out = await j('/api/v1/esl/admin/night-mode/run', { method: 'POST' })
    setMessage(`Ночной обработчик: ${out.processed || 0} задач`)
    load()
  }

  async function saveCatalogField(id, payload) {
    await j('/api/v1/esl/admin/catalog/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    setMessage('Номенклатура обновлена')
    load()
  }

  async function runSync1C() {
    let items = []
    try {
      items = JSON.parse(syncPayload || '[]')
    } catch {
      setMessage('JSON для синхронизации некорректный')
      return
    }
    const out = await j('/api/v1/esl/admin/catalog/sync-1c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    setMessage(`Синхронизация 1С: создано ${out.created || 0}, обновлено ${out.updated || 0}`)
    load()
  }

  function loadProductToForm(row) {
    setCatalogForm({
      id: row.id,
      name: row.name || '',
      full_name: row.full_name || '',
      sku: row.sku || '',
      cost_price: row.cost_price || '',
      sale_price: row.sale_price || '',
      unit: row.unit || '',
      characteristicsText: row.characteristics ? JSON.stringify(row.characteristics, null, 2) : '',
      image_url: row.image_url || '',
      device_mac: row.device_mac || '',
      is_active: Boolean(row.is_active),
    })
    setActiveSection('catalog')
  }

  function resetCatalogForm() {
    setCatalogForm(emptyCatalogForm())
  }

  async function uploadCatalogImage(file) {
    const dataUrl = await readFileAsDataUrl(file)
    const out = await j('/api/v1/esl/admin/catalog/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: file.name }),
    })
    if (!out.ok || !out.url) throw new Error(out.error || 'Не удалось загрузить изображение')
    setCatalogForm((prev) => ({ ...prev, image_url: out.url }))
    setMessage('Фото загружено')
  }

  async function saveCatalogForm(e) {
    e.preventDefault()
    setCatalogSaving(true)
    try {
      let characteristics = null
      if (catalogForm.characteristicsText.trim()) {
        characteristics = JSON.parse(catalogForm.characteristicsText)
      }
      const payload = {
        ...catalogForm,
        characteristics,
      }
      const url = catalogForm.id ? '/api/v1/esl/admin/catalog/edit' : '/api/v1/esl/admin/catalog/create'
      await j(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setMessage(catalogForm.id ? 'Товар обновлен' : 'Товар создан')
      if (!catalogForm.id) resetCatalogForm()
      await load()
    } catch (err) {
      setMessage(err?.message || 'Ошибка сохранения товара')
    } finally {
      setCatalogSaving(false)
    }
  }

  async function removeCatalogProduct(id) {
    if (!window.confirm('Удалить товар? Действие необратимо.')) return
    await j('/api/v1/esl/admin/catalog/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMessage('Товар удален')
    if (catalogForm.id === id) resetCatalogForm()
    load()
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page p-6">
        <Link to="/admin" className="btn-save">Перейти в админ-панель</Link>
      </div>
    )
  }

  return (
    <div className="admin-page p-4 md:p-6">
      <div className="mx-auto grid max-w-[1540px] gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Price Admin Panel</p>
          <div className="grid gap-1.5">
            <NavItem label="База товаров" subtitle="Номенклатура 1С" active={activeSection === 'catalog'} onClick={() => setActiveSection('catalog')} />
            <NavItem label="ESL Дашборд" active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} />
            <NavItem label="Привязка MAC" active={activeSection === 'binding'} onClick={() => setActiveSection('binding')} />
            <NavItem label="Синхронизация 1С" active={activeSection === 'sync'} onClick={() => setActiveSection('sync')} />
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Backend: {backend || '—'}<br />
            Store: {STORE_ID}
          </div>
        </aside>

        <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {activeSection === 'catalog' && 'База товаров (номенклатура)'}
            {activeSection === 'dashboard' && 'ESL Device Dashboard'}
            {activeSection === 'binding' && 'Привязка MAC к товарам'}
            {activeSection === 'sync' && 'Синхронизация из 1С'}
          </h1>
          <div className="text-xs text-slate-500">Backend: {backend || '—'} · store: {STORE_ID}</div>
        </div>

        {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">{message}</div>}

        {activeSection !== 'catalog' && (
        <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Всего устройств" value={dashboard.total} />
          <Kpi label="Online" value={dashboard.online} tone="emerald" />
          <Kpi label="Offline" value={dashboard.offline} tone="rose" />
          <Kpi label="Требуют обновления" value={dashboard.needsUpdate} tone="amber" />
          <Kpi label="В очереди" value={queueLength} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium text-slate-700">Нагрузка Wi-Fi магазина</div>
          <div className="h-3 w-full overflow-hidden rounded bg-slate-100">
            <div className="h-full bg-[#E41C2A]" style={{ width: `${dashboard.wifiLoad || 0}%` }} />
          </div>
          <div className="mt-1 text-xs text-slate-500">{dashboard.wifiLoad || 0}%</div>
        </div>
        </>
        )}

        {activeSection !== 'catalog' && (
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Поиск: товар / поставщик / MAC / стеллаж"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={discrepancyOnly} onChange={(e) => setDiscrepancyOnly(e.target.checked)} />
                Расхождение цен
              </label>
              <button type="button" className="btn-save" onClick={load} disabled={loading}>Обновить</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-3">Фото</th>
                    <th className="py-2 pr-3">Название</th>
                    <th className="py-2 pr-3">Поставщик</th>
                    <th className="py-2 pr-3">Цена 1С</th>
                    <th className="py-2 pr-3">Цена ESL</th>
                    <th className="py-2 pr-3">MAC</th>
                    <th className="py-2 pr-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.mac} className="border-b border-slate-100">
                      <td className="py-2 pr-3">
                        <div className="h-10 w-10 overflow-hidden rounded bg-slate-100">
                          {r.photo ? <img src={r.photo} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-400">{r.productId}</div>
                      </td>
                      <td className="py-2 pr-3">{r.supplier}</td>
                      <td className="py-2 pr-3">{r.price1c}</td>
                      <td className="py-2 pr-3">
                        <EditablePrice value={r.priceEsl} onSave={(v) => savePrice(r.mac, v)} />
                        {r.discrepancy && <div className="text-xs text-amber-600">Нужно обновить</div>}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.mac}</td>
                      <td className="py-2 pr-3">
                        <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => ping(r.mac)}>Пинг</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Быстрая привязка MAC</h3>
              <form className="space-y-2" onSubmit={doBind}>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="aa:bb:cc:dd:ee:ff" value={bind.mac} onChange={(e) => setBind((x) => ({ ...x, mac: e.target.value }))} />
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={bind.productId} onChange={(e) => setBind((x) => ({ ...x, productId: e.target.value }))}>
                  {productOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button type="submit" className="btn-save w-full" disabled={!canEdit}>Привязать «на лету»</button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Групповые действия</h3>
              <div className="grid gap-2">
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => batch('refresh_rack')}>Обновить весь стеллаж</button>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => batch('restart_store')}>Перезагрузить все ESP32</button>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={enqueueMismatch}>В очередь: расхождения цен</button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Ночной режим (MQTT worker)</h3>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={nightMode.enabled} onChange={(e) => setNightMode((x) => ({ ...x, enabled: e.target.checked }))} />
                  Включен
                </label>
                <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={nightMode.time} onChange={(e) => setNightMode((x) => ({ ...x, time: e.target.value }))} />
                <button type="button" className="btn-save w-full" onClick={saveNightMode}>Сохранить расписание</button>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-full" onClick={runNightNow}>Запустить сейчас</button>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeSection === 'catalog' && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_2fr]">
          <form onSubmit={saveCatalogForm} className="order-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:order-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{catalogForm.id ? 'Редактирование товара' : 'Создание товара'}</h3>
              {catalogForm.id && (
                <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={resetCatalogForm}>
                  Новый товар
                </button>
              )}
            </div>
            <div className="grid gap-2 text-sm">
              <input className="rounded border border-slate-200 px-3 py-2" placeholder="name" value={catalogForm.name} onChange={(e) => setCatalogForm((x) => ({ ...x, name: e.target.value }))} required />
              <textarea className="min-h-[70px] rounded border border-slate-200 px-3 py-2" placeholder="full_name" value={catalogForm.full_name} onChange={(e) => setCatalogForm((x) => ({ ...x, full_name: e.target.value }))} />
              <input className="rounded border border-slate-200 px-3 py-2 font-mono" placeholder="sku" value={catalogForm.sku} onChange={(e) => setCatalogForm((x) => ({ ...x, sku: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded border border-slate-200 px-3 py-2" placeholder="cost_price" value={catalogForm.cost_price} onChange={(e) => setCatalogForm((x) => ({ ...x, cost_price: e.target.value }))} />
                <input className="rounded border border-slate-200 px-3 py-2" placeholder="sale_price" value={catalogForm.sale_price} onChange={(e) => setCatalogForm((x) => ({ ...x, sale_price: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded border border-slate-200 px-3 py-2" placeholder="unit (шт, кг...)" value={catalogForm.unit} onChange={(e) => setCatalogForm((x) => ({ ...x, unit: e.target.value }))} />
                <input className="rounded border border-slate-200 px-3 py-2 font-mono" placeholder="device_mac (AABBCCDDEEFF)" value={catalogForm.device_mac} onChange={(e) => setCatalogForm((x) => ({ ...x, device_mac: e.target.value.toUpperCase() }))} />
              </div>
              <input className="rounded border border-slate-200 px-3 py-2" placeholder="image_url" value={catalogForm.image_url} onChange={(e) => setCatalogForm((x) => ({ ...x, image_url: e.target.value }))} />
              <label className="rounded border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600">
                Загрузить фото
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif,.bmp,.tif,.tiff,.svg"
                  className="mt-1 block w-full text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      await uploadCatalogImage(file)
                    } catch (err) {
                      setMessage(err?.message || 'Ошибка загрузки фото')
                    } finally {
                      e.target.value = ''
                    }
                  }}
                />
              </label>
              <textarea className="min-h-[90px] rounded border border-slate-200 px-3 py-2 font-mono text-xs" placeholder='characteristics JSON, напр. {"color":"red","size":"M"}' value={catalogForm.characteristicsText} onChange={(e) => setCatalogForm((x) => ({ ...x, characteristicsText: e.target.value }))} />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={catalogForm.is_active} onChange={(e) => setCatalogForm((x) => ({ ...x, is_active: e.target.checked }))} />
                Активный товар
              </label>
              <button type="submit" className="btn-save" disabled={catalogSaving}>
                {catalogSaving ? 'Сохранение...' : catalogForm.id ? 'Сохранить изменения' : 'Создать товар'}
              </button>
            </div>
          </form>

          <div className="order-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:order-2">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Список товаров в базе</h3>
                <p className="text-xs text-slate-500">Всего записей: {catalogRows.length}</p>
              </div>
              <input
                className="min-w-[260px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Поиск по name / full_name / SKU / MAC"
                value={catalogQ}
                onChange={(e) => setCatalogQ(e.target.value)}
              />
              <button type="button" className="btn-save" onClick={load}>Обновить</button>
            </div>
            {catalogRows.length === 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Список пустой. Если вы только что создали товар — проверьте, что в <code className="rounded bg-white px-1">.env</code> задан{' '}
                <code className="rounded bg-white px-1">DATABASE_URL</code>, выполнены миграции Prisma и страница обновлена. Без БД товары не сохраняются в PostgreSQL.
              </div>
            )}
            <div className="max-h-[720px] overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-3">Фото</th>
                    <th className="py-2 pr-3">name</th>
                    <th className="py-2 pr-3">sku</th>
                    <th className="py-2 pr-3">sale_price</th>
                    <th className="py-2 pr-3">device_mac</th>
                    <th className="py-2 pr-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogRows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3">{r.image_url ? <img src={r.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-slate-100" />}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{r.name}</div>
                        <div className="max-w-[240px] truncate text-slate-500">{r.full_name}</div>
                      </td>
                      <td className="py-2 pr-3 font-mono">{r.sku}</td>
                      <td className="py-2 pr-3">{r.sale_price}</td>
                      <td className="py-2 pr-3 font-mono">{r.device_mac || '—'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-1">
                          <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => loadProductToForm(r)}>Редактировать</button>
                          <button type="button" className="rounded border border-red-200 px-2 py-1 text-xs text-red-700" onClick={() => removeCatalogProduct(r.id)}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeSection === 'sync' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Синхронизация номенклатуры из 1С</h3>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Синхронизация из 1С (POST массив по sku)</p>
            <textarea
              className="min-h-[96px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              placeholder='[{"sku":"ART-001","name":"Товар","sale_price":"1990","cost_price":"1200","unit":"шт","characteristics":{"color":"black"},"image_url":"https://..."}]'
              value={syncPayload}
              onChange={(e) => setSyncPayload(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button type="button" className="btn-save" onClick={runSync1C}>Применить sync 1С</button>
            </div>
          </div>
        </div>
        )}
      </div>
      </div>
    </div>
  )
}

function NavItem({ label, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${active ? 'bg-[#E41C2A] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      <span className="block font-medium">{label}</span>
      {subtitle ? <span className={`block text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</span> : null}
    </button>
  )
}

function Kpi({ label, value, tone = 'slate' }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value ?? 0}</div>
    </div>
  )
}

function EditablePrice({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  if (!editing) {
    return (
      <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => setEditing(true)}>
        {value || '—'} ₸
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <input className="w-20 rounded border border-slate-200 px-2 py-1 text-xs" value={local} onChange={(e) => setLocal(e.target.value)} />
      <button type="button" className="rounded border border-slate-200 px-1 py-1 text-xs" onClick={() => { onSave(local); setEditing(false) }}>OK</button>
      <button type="button" className="rounded border border-slate-200 px-1 py-1 text-xs" onClick={() => { setLocal(value); setEditing(false) }}>×</button>
    </div>
  )
}

function EditableText({ value, onSave, placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value || '')
  useEffect(() => setLocal(value || ''), [value])
  if (!editing) {
    return (
      <button type="button" className="rounded border border-slate-200 px-2 py-1 font-mono text-xs" onClick={() => setEditing(true)}>
        {value || '—'}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <input
        className="w-32 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
      />
      <button type="button" className="rounded border border-slate-200 px-1 py-1 text-xs" onClick={() => { onSave(local); setEditing(false) }}>OK</button>
      <button type="button" className="rounded border border-slate-200 px-1 py-1 text-xs" onClick={() => { setLocal(value || ''); setEditing(false) }}>×</button>
    </div>
  )
}

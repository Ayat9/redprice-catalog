import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAdminAuth } from '../context/AdminAuthContext'
import './Admin.css'

const STORE_ID = 'rp-1'
const SOCKET_ENABLED = !import.meta.env.DEV
const socket = SOCKET_ENABLED ? io('/', { autoConnect: false, transports: ['websocket', 'polling'] }) : null

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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, p, n] = await Promise.all([
        j(`/api/v1/esl/admin/dashboard?storeId=${STORE_ID}`),
        j(`/api/v1/esl/admin/products?storeId=${STORE_ID}&discrepancyOnly=${discrepancyOnly ? '1' : '0'}&q=${encodeURIComponent(q)}`),
        j('/api/v1/esl/admin/night-mode'),
      ])
      setBackend(d.backend || '')
      setDashboard(d.dashboard || {})
      setQueueLength(Number(d.queue || 0))
      setRows(Array.isArray(p.rows) ? p.rows : [])
      setNightMode({ enabled: Boolean(n.enabled), time: n.time || '02:00' })
      if (!bind.productId && p.rows?.[0]?.productId) setBind((x) => ({ ...x, productId: p.rows[0].productId }))
    } catch (e) {
      setMessage(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [bind.productId, discrepancyOnly, q])

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

  if (!isLoggedIn) {
    return (
      <div className="admin-page p-6">
        <Link to="/admin" className="btn-save">Перейти в админ-панель</Link>
      </div>
    )
  }

  return (
    <div className="admin-page p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">ESL Device Dashboard</h1>
          <div className="text-xs text-slate-500">Backend: {backend || '—'} · store: {STORE_ID}</div>
        </div>

        {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">{message}</div>}

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
      </div>
    </div>
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

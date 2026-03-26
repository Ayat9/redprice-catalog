import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getPrice, updatePrice } from '../../lib/store'

export default function AdminCennik() {
  const { isLoggedIn, canEdit } = useAdminAuth()

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [current, setCurrent] = useState({ name: '', price: '' })
  const [status, setStatus] = useState({ ok: null, message: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    ;(async () => {
      const cur = await getPrice()
      setName(cur.name)
      setPrice(cur.price)
      setCurrent(cur)
      setLoading(false)
    })()
  }, [isLoggedIn])

  const onSubmit = (e) => {
    e.preventDefault()
    setStatus({ ok: null, message: '' })

    setSaving(true)
    ;(async () => {
      if (!canEdit) throw new Error('Недостаточно прав для редактирования')
      const updated = await updatePrice({ name, price })
      setCurrent(updated)
      setName(updated.name)
      setPrice(updated.price)
      setStatus({ ok: true, message: 'Ценник успешно обновлён' })
    })()
      .catch((err) => {
        setStatus({ ok: false, message: err?.message || 'Ошибка обновления ценника' })
      })
      .finally(() => setSaving(false))
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white shadow border border-slate-200 p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Электронные ценники</h1>
          <p className="text-slate-600 mb-6">Войдите в админ-панель, чтобы обновлять ценник.</p>
          <Link to="/admin" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#E41C2A] text-white font-semibold w-full hover:opacity-95">
            Перейти в админ-панель
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Электронные ценники</h1>
          <p className="text-slate-600 mt-2">
            Укажите название товара и цену — и система сохранит их, чтобы ценник можно было отображать на устройствах/экранах.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white shadow border border-slate-200 p-6"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Редактирование</h2>
              <p className="text-slate-600 text-sm mt-1">Обновите данные ценника</p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Название товара</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                disabled={!canEdit || loading || saving}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E41C2A] focus:border-transparent"
                placeholder="Например: Контейнер 10 л"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-medium text-slate-700">Цена</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                disabled={!canEdit || loading || saving}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E41C2A] focus:border-transparent"
                placeholder="Например: 25000"
                min={0}
                step="1"
              />
            </label>

            <button
              type="submit"
              disabled={!canEdit || loading || saving}
              className="mt-6 w-full inline-flex items-center justify-center rounded-xl bg-[#E41C2A] text-white font-semibold py-3 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Обновить ценник
            </button>

            {status.ok === true && (
              <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {status.message}
              </p>
            )}
            {status.ok === false && (
              <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {status.message}
              </p>
            )}

            {!canEdit && (
              <p className="mt-4 text-sm text-slate-600">
                У вас есть только просмотр. Чтобы обновлять ценник, нужна роль с правами редактирования.
              </p>
            )}
          </form>

          <div className="rounded-2xl bg-white shadow border border-slate-200 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Текущий ценник</h2>
              <p className="text-slate-600 text-sm mt-1">Сохранённые данные</p>
            </div>

            <div className="rounded-2xl bg-slate-900 text-white p-5">
              <div className="text-sm text-white/70">Название</div>
              <div className="text-xl font-bold mt-1 break-words">{name || current.name || '—'}</div>

              <div className="mt-4 text-sm text-white/70">Цена</div>
              <div className="text-3xl font-extrabold mt-1">
                {(price || current.price || '0').toString()} ₸
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              Данные сохраняются через API (в dev/preview на сервере Vite) и/или в `localStorage` как fallback.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


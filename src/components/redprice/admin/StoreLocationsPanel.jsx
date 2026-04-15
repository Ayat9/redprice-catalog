import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fetchStoreLocations, saveStoreLocation } from '../api/adminApi'

const inputClass =
  'w-full min-w-0 max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-black shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60'

function connectionStatus(row) {
  const a = String(row.videoUrl ?? '').trim()
  const b = String(row.posApiKey ?? '').trim()
  const c = String(row.trafficCounterId ?? '').trim()
  if (a && b && c) return 'active'
  return 'not_configured'
}

export default function StoreLocationsPanel() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    fetchStoreLocations().then((data) => {
      setStores(data)
      setLoading(false)
    })
  }, [])

  function updateField(id, field, value) {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  async function onSave(store) {
    setSavingId(store.id)
    await saveStoreLocation(store.id, {
      videoUrl: store.videoUrl,
      posApiKey: store.posApiKey,
      trafficCounterId: store.trafficCounterId,
    })
    setSavingId(null)
  }

  return (
    <section className="space-y-12">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-black">Торговые точки</h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-500">
          Для каждой точки задайте параметры внешних API. Зелёный индикатор — все поля заполнены.
        </p>
      </header>

      {loading && (
        <div className="h-48 animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
      )}

      <div className="space-y-10">
        {!loading &&
          stores.map((store) => {
            const st = connectionStatus(store)
            return (
              <article
                key={store.id}
                className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-8 py-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-slate-50 p-2">
                      <MapPin className="size-5 text-black" strokeWidth={1.5} aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold tracking-tight text-black">
                        {store.name}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-slate-400">{store.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        st === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      aria-hidden
                    />
                    <span className="text-[13px] text-slate-600">
                      {st === 'active' ? 'Активно' : 'Не настроено'}
                    </span>
                  </div>
                </div>

                <div className="px-8 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Подключение API
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                    <label htmlFor={`${store.id}-video`} className="shrink-0 text-[15px] text-black">
                      URL видеопотока
                    </label>
                    <input
                      id={`${store.id}-video`}
                      type="url"
                      value={store.videoUrl}
                      onChange={(e) => updateField(store.id, 'videoUrl', e.target.value)}
                      placeholder="https://…"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                    <label htmlFor={`${store.id}-pos`} className="shrink-0 text-[15px] text-black">
                      API Key кассы
                    </label>
                    <input
                      id={`${store.id}-pos`}
                      type="password"
                      value={store.posApiKey}
                      onChange={(e) => updateField(store.id, 'posApiKey', e.target.value)}
                      placeholder="—"
                      autoComplete="off"
                      className={`${inputClass} font-mono text-sm`}
                    />
                  </div>
                  <div className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                    <label htmlFor={`${store.id}-traffic`} className="shrink-0 text-[15px] text-black">
                      ID счётчика проходимости
                    </label>
                    <input
                      id={`${store.id}-traffic`}
                      type="text"
                      value={store.trafficCounterId}
                      onChange={(e) => updateField(store.id, 'trafficCounterId', e.target.value)}
                      placeholder="—"
                      autoComplete="off"
                      className={`${inputClass} font-mono text-sm`}
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 px-8 py-5">
                  <button
                    type="button"
                    disabled={savingId === store.id}
                    onClick={() => onSave(store)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-[13px] font-medium text-black shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    {savingId === store.id ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </div>
              </article>
            )
          })}
      </div>
    </section>
  )
}

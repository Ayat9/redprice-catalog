import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, FileDown, FileUp, Loader2 } from 'lucide-react'

const CONDITION_TYPES = [
  {
    id: 'early',
    title: 'EARLY',
    description: 'PDF для карточки EARLY в модальном окне “Скачать условия”.',
  },
  {
    id: 'strategic',
    title: 'STRATEGIC PARTNER',
    description: 'PDF для карточки STRATEGIC PARTNER в модальном окне “Скачать условия”.',
  },
]

function formatSize(bytes) {
  if (!bytes) return 'Файл ещё не загружен'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (_) {
    return { raw: text }
  }
}

function resolveApiError(data, fallback) {
  if (data?.error && typeof data.error === 'string') return data.error
  if (data?.message && typeof data.message === 'string') return data.message
  if (data?.raw && typeof data.raw === 'string') return data.raw.slice(0, 180)
  return fallback
}

export default function PartnerConditionsWorkspace() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState('')
  const [message, setMessage] = useState('')

  const byId = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [items])

  async function loadConditions() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/partner-conditions')
      const data = await parseJsonSafe(res)
      if (!res.ok) {
        throw new Error(resolveApiError(data, `Не удалось загрузить список PDF (${res.status})`))
      }
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setMessage(err?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConditions()
  }, [])

  async function uploadCondition(planId, file) {
    if (!file) return
    setMessage('')

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage('Можно загрузить только PDF-файл.')
      return
    }

    setUploading(planId)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const res = await fetch(`/api/partner-conditions/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) {
        throw new Error(resolveApiError(data, `Не удалось загрузить PDF (${res.status})`))
      }

      // Fallback for empty/non-JSON successful responses from proxies
      if (!data || typeof data !== 'object' || !data.id) {
        await loadConditions()
        setMessage('PDF обновлён.')
        return
      }

      setItems((prev) => {
        const next = prev.filter((item) => item.id !== planId)
        return [...next, data].sort((a, b) => {
          const order = CONDITION_TYPES.map((item) => item.id)
          return order.indexOf(a.id) - order.indexOf(b.id)
        })
      })
      setMessage(`PDF для ${data.label} обновлён.`)
    } catch (err) {
      setMessage(err?.message || 'Ошибка загрузки PDF')
    } finally {
      setUploading('')
    }
  }

  return (
    <div className="admin-section admin-section-card">
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Условия PDF</h2>
          <p className="admin-section-desc">
            Загрузите PDF-файлы для кнопок “Скачать условия” на странице партнёров.
          </p>
        </div>
        <button type="button" className="btn-edit" onClick={loadConditions} disabled={loading}>
          {loading ? 'Обновление...' : 'Обновить'}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {CONDITION_TYPES.map((type) => {
          const item = byId[type.id]
          const isUploading = uploading === type.id

          return (
            <article
              key={type.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">{type.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{type.description}</p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E30613]">
                  <FileDown className="size-5" strokeWidth={1.6} aria-hidden />
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  {item?.exists ? (
                    <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={1.8} aria-hidden />
                  ) : (
                    <FileDown className="size-4 text-slate-400" strokeWidth={1.6} aria-hidden />
                  )}
                  {item?.filename || `${type.id}.pdf`}
                </div>
                <p className="mt-2">{formatSize(item?.size)}</p>
                {item?.updatedAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Обновлено: {new Date(item.updatedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className="admin-file-label">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="admin-file-input"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      uploadCondition(type.id, file)
                    }}
                  />
                  <span className="inline-flex items-center gap-2">
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.7} aria-hidden />
                    ) : (
                      <FileUp className="size-4" strokeWidth={1.7} aria-hidden />
                    )}
                    {isUploading ? 'Загрузка...' : 'Загрузить PDF'}
                  </span>
                </label>

                <a
                  href={item?.url || `/mock/conditions/${type.id}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-edit inline-flex items-center gap-2"
                >
                  <ExternalLink className="size-4" strokeWidth={1.6} aria-hidden />
                  Открыть
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

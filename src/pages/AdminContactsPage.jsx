import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContacts, saveContacts } from '@/lib/contactsApi'

const fields = [
  ['phone', 'Телефон'],
  ['whatsapp', 'WhatsApp ссылка'],
  ['email', 'Email'],
  ['address', 'Адрес'],
  ['workingHours', 'График работы'],
]

export default function AdminContactsPage() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getContacts().then(setForm)
  }, [])

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    try {
      const next = await saveContacts(form)
      setForm(next)
      setStatus('Контакты сохранены')
    } catch (err) {
      setStatus(err?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return <div className="min-h-screen bg-[#F8FAFC] p-8 text-slate-600">Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-[#0F172A] md:p-8">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Контакты сайта</h1>
            <p className="mt-1 text-sm text-slate-500">Редактирование публичной страницы /contacts.</p>
          </div>
          <Link to="/contacts" className="text-sm font-semibold text-[#E30613]">
            Открыть страницу
          </Link>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              <input
                value={form[key] || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 outline-none transition focus:border-[#E30613]/40 focus:ring-4 focus:ring-red-50"
              />
            </label>
          ))}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">HTML код карты (iframe)</span>
            <textarea
              value={form.mapEmbed || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, mapEmbed: event.target.value }))}
              rows={7}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 font-mono text-sm outline-none transition focus:border-[#E30613]/40 focus:ring-4 focus:ring-red-50"
            />
          </label>

          {status && <p className="text-sm text-slate-600">{status}</p>}

          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-xl bg-[#E30613] px-6 font-semibold text-white transition hover:bg-[#c50510] disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}

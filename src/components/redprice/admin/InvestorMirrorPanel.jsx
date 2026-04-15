import { useEffect, useState } from 'react'
import { Eye, LayoutDashboard, Save } from 'lucide-react'
import { fetchInvestorContentSettings, saveInvestorContentSettings } from '../api/adminApi'

export default function InvestorMirrorPanel() {
  const [modules, setModules] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchInvestorContentSettings().then(setModules)
  }, [])

  function toggle(id) {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)))
    setSaved(false)
  }

  async function onSave() {
    setSaving(true)
    await saveInvestorContentSettings(modules.map((m) => ({ id: m.id, visible: m.visible })))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-50 p-2">
            <Eye className="size-5 text-black" strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-black">
              Контент для инвестора
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
              Видимость блоков на странице /investor
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-medium text-black shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <Save className="size-4" strokeWidth={1.5} aria-hidden />
          {saving ? 'Сохранение…' : saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-8 py-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-black">
            <LayoutDashboard className="size-4 text-slate-600" strokeWidth={1.5} aria-hidden />
            Модули дашборда
          </div>
        </div>
        <ul className="divide-y divide-slate-100">
          {modules.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-6 px-8 py-5"
            >
              <span className="text-[15px] text-black">{m.label}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={m.visible}
                  onChange={() => toggle(m.id)}
                />
                <div className="peer h-7 w-12 rounded-full border border-slate-200 bg-slate-100 shadow-inner transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:border-emerald-300 peer-checked:bg-emerald-500 peer-checked:after:translate-x-5" />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

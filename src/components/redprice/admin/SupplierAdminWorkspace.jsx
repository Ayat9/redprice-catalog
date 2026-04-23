import { useCallback, useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, Clock, FileText, Plus, Save, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  assignDocumentToProfiles,
  createSupplierProfile,
  deleteCameraAssignment,
  deleteSupplierBrand,
  deleteSupplierProfile,
  fetchSupplierAdminBundle,
  saveDocumentTemplate,
  saveRotationSettings,
  updateSupplierProfile,
  upsertCameraAssignment,
  upsertSupplierBrand,
} from '../../supplier/api/supplierApi'

const TABS = [
  { id: 'accounts', label: 'Учётки и права', Icon: Users },
  { id: 'cameras', label: 'Камеры', Icon: Camera },
  { id: 'documents', label: 'Договоры', Icon: FileText },
  { id: 'rotation', label: 'Ротация', Icon: Clock },
]

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    )
  } catch {
    return iso
  }
}

export default function SupplierAdminWorkspace() {
  const [tab, setTab] = useState('accounts')
  const [bundle, setBundle] = useState(null)
  const [flash, setFlash] = useState('')

  const reload = useCallback(async () => {
    const out = await fetchSupplierAdminBundle()
    if (out.ok) setBundle(out)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  if (!bundle) return <p className="text-sm text-slate-500">Загрузка…</p>

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-black">Поставщики</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
          Управляйте брендами, учётными записями, камерами, договорами и порогом ротации неликвидов.
          Поставщик видит только свой товар, свои камеры и свои документы.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                active
                  ? 'inline-flex items-center gap-2 rounded-xl bg-[#E41C2A] px-4 py-2 text-sm font-medium text-white shadow-sm'
                  : 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50'
              }
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </button>
          )
        })}
      </div>

      {flash && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {flash}
        </p>
      )}

      {tab === 'accounts' && (
        <AccountsTab
          bundle={bundle}
          reload={reload}
          onFlash={setFlash}
        />
      )}
      {tab === 'cameras' && (
        <CamerasTab bundle={bundle} reload={reload} onFlash={setFlash} />
      )}
      {tab === 'documents' && (
        <DocumentsTab bundle={bundle} reload={reload} onFlash={setFlash} />
      )}
      {tab === 'rotation' && (
        <RotationTab bundle={bundle} reload={reload} onFlash={setFlash} />
      )}
    </div>
  )
}

/* ──────────────── Учётки + Бренды ──────────────── */

function AccountsTab({ bundle, reload, onFlash }) {
  const [brand, setBrand] = useState({ name: '', phone: '', address: '' })
  const [acc, setAcc] = useState({
    email: '',
    password: '',
    displayName: '',
    supplierId: bundle.suppliers[0]?.id || '',
    canViewSales: true,
    canViewVideo: true,
    canViewFootfall: true,
    canSignDocuments: true,
  })
  const [err, setErr] = useState('')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новый бренд поставщика</CardTitle>
          <CardDescription>
            Бренд = запись в Supplier. К нему далее привязываются кабинеты сотрудников поставщика.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className={inputCls}
            placeholder="Название бренда"
            value={brand.name}
            onChange={(e) => setBrand({ ...brand, name: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Телефон"
            value={brand.phone}
            onChange={(e) => setBrand({ ...brand, phone: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Адрес"
            value={brand.address}
            onChange={(e) => setBrand({ ...brand, address: e.target.value })}
          />
          <Button
            type="button"
            className="bg-[#E41C2A] hover:bg-[#c91822]"
            onClick={async () => {
              const out = await upsertSupplierBrand(brand)
              if (!out.ok) {
                setErr(out.error || 'Ошибка')
                return
              }
              setBrand({ name: '', phone: '', address: '' })
              setErr('')
              await reload()
              onFlash('Бренд добавлен')
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Добавить бренд
          </Button>
          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {bundle.suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{s.name}</p>
                  <p className="truncate font-mono text-[11px] text-slate-500">{s.id}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={async () => {
                    if (!confirm(`Удалить бренд «${s.name}»?`)) return
                    const out = await deleteSupplierBrand(s.id)
                    if (!out.ok) alert(out.error)
                    else {
                      await reload()
                      onFlash('Бренд удалён')
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новая учётка поставщика</CardTitle>
          <CardDescription>Логин, пароль и бренд + права на модули</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className={inputCls}
            placeholder="Email"
            value={acc.email}
            onChange={(e) => setAcc({ ...acc, email: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Пароль (≥ 6)"
            value={acc.password}
            onChange={(e) => setAcc({ ...acc, password: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Отображаемое имя (ФИО или должность)"
            value={acc.displayName}
            onChange={(e) => setAcc({ ...acc, displayName: e.target.value })}
          />
          <select
            className={inputCls}
            value={acc.supplierId}
            onChange={(e) => setAcc({ ...acc, supplierId: e.target.value })}
          >
            {bundle.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <PermCheckbox
              label="Продажи"
              on={acc.canViewSales}
              onChange={(v) => setAcc({ ...acc, canViewSales: v })}
            />
            <PermCheckbox
              label="Видео"
              on={acc.canViewVideo}
              onChange={(v) => setAcc({ ...acc, canViewVideo: v })}
            />
            <PermCheckbox
              label="Маркетинг"
              on={acc.canViewFootfall}
              onChange={(v) => setAcc({ ...acc, canViewFootfall: v })}
            />
            <PermCheckbox
              label="Подпись документов"
              on={acc.canSignDocuments}
              onChange={(v) => setAcc({ ...acc, canSignDocuments: v })}
            />
          </div>
          <Button
            type="button"
            className="bg-[#E41C2A] hover:bg-[#c91822]"
            onClick={async () => {
              const out = await createSupplierProfile(acc)
              if (!out.ok) alert(out.error)
              else {
                setAcc((s) => ({ ...s, email: '', password: '', displayName: '' }))
                await reload()
                onFlash('Учётка поставщика создана')
              }
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Создать учётку
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Учётки поставщиков</CardTitle>
          <CardDescription>Включение/выключение модулей и удаление</CardDescription>
        </CardHeader>
        <CardContent>
          {bundle.profiles.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет учёток.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Имя</th>
                    <th className="px-3 py-2 text-left">Бренд</th>
                    <th className="px-3 py-2 text-center">Продажи</th>
                    <th className="px-3 py-2 text-center">Видео</th>
                    <th className="px-3 py-2 text-center">Маркет.</th>
                    <th className="px-3 py-2 text-center">Подп.</th>
                    <th className="px-3 py-2 text-center">Активен</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {bundle.profiles.map((p) => {
                    const brandName =
                      bundle.suppliers.find((b) => b.id === p.supplierId)?.name || '—'
                    return (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-mono text-xs">{p.email}</td>
                        <td className="px-3 py-2">{p.displayName || '—'}</td>
                        <td className="px-3 py-2">{brandName}</td>
                        {[
                          'canViewSales',
                          'canViewVideo',
                          'canViewFootfall',
                          'canSignDocuments',
                        ].map((k) => (
                          <td key={k} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={p[k] !== false}
                              onChange={async (e) => {
                                await updateSupplierProfile(p.id, { [k]: e.target.checked })
                                await reload()
                              }}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={p.isActive !== false}
                            onChange={async (e) => {
                              await updateSupplierProfile(p.id, { isActive: e.target.checked })
                              await reload()
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm(`Удалить учётку ${p.email}?`)) return
                              await deleteSupplierProfile(p.id)
                              await reload()
                              onFlash('Учётка удалена')
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PermCheckbox({ label, on, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

/* ──────────────── Камеры ──────────────── */

function CamerasTab({ bundle, reload, onFlash }) {
  const [draft, setDraft] = useState({
    supplierProfileId: bundle.profiles[0]?.id || '',
    storeId: '',
    label: '',
    streamUrl: '',
    isAvailable: true,
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новая привязка камеры</CardTitle>
          <CardDescription>
            Укажите URL просмотра (YouTube live / HLS). RTMP ingest не отображается — только URL
            просмотра.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className={inputCls}
            value={draft.supplierProfileId}
            onChange={(e) => setDraft({ ...draft, supplierProfileId: e.target.value })}
          >
            {bundle.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.email}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Метка (Полка 12 · бренд X)"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="store-id (опционально)"
            value={draft.storeId}
            onChange={(e) => setDraft({ ...draft, storeId: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="https://www.youtube.com/live/… или HLS URL"
            value={draft.streamUrl}
            onChange={(e) => setDraft({ ...draft, streamUrl: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isAvailable}
              onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })}
            />
            Камера доступна
          </label>
          <Button
            type="button"
            className="bg-[#E41C2A] hover:bg-[#c91822]"
            onClick={async () => {
              const out = await upsertCameraAssignment(draft)
              if (!out.ok) alert(out.error)
              else {
                setDraft((s) => ({ ...s, label: '', streamUrl: '', storeId: '' }))
                await reload()
                onFlash('Камера привязана')
              }
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Привязать камеру
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Привязки</CardTitle>
          <CardDescription>{bundle.cameraAssignments.length} шт.</CardDescription>
        </CardHeader>
        <CardContent>
          {bundle.cameraAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">Ещё нет привязок.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {bundle.cameraAssignments.map((c) => {
                const prof = bundle.profiles.find((p) => p.id === c.supplierProfileId)
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{c.label}</p>
                      <p className="truncate text-xs text-slate-500">
                        {prof?.email || 'удалённый кабинет'} · {c.storeId || 'без магазина'}
                      </p>
                      <p className="truncate font-mono text-[11px] text-slate-400">{c.streamUrl}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          c.isAvailable
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200'
                            : 'rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200'
                        }
                      >
                        {c.isAvailable ? 'online' : 'offline'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm('Удалить привязку камеры?')) return
                          await deleteCameraAssignment(c.id)
                          await reload()
                          onFlash('Привязка удалена')
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ──────────────── Документы ──────────────── */

function DocumentsTab({ bundle, reload, onFlash }) {
  const [tpl, setTpl] = useState({ title: '', description: '', mimeKind: 'html', content: '' })
  const [activeTpl, setActiveTpl] = useState(null)
  const [selectedProfiles, setSelectedProfiles] = useState([])

  const signedByAssignment = useMemo(() => {
    const map = {}
    for (const s of bundle.documentSignatures || []) {
      if (!map[s.assignmentId]) map[s.assignmentId] = []
      map[s.assignmentId].push(s)
    }
    return map
  }, [bundle.documentSignatures])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новый шаблон договора</CardTitle>
          <CardDescription>HTML-текст или ссылка на PDF (mimeKind=url).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className={inputCls}
            placeholder="Название"
            value={tpl.title}
            onChange={(e) => setTpl({ ...tpl, title: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Описание"
            value={tpl.description}
            onChange={(e) => setTpl({ ...tpl, description: e.target.value })}
          />
          <select
            className={inputCls}
            value={tpl.mimeKind}
            onChange={(e) => setTpl({ ...tpl, mimeKind: e.target.value })}
          >
            <option value="html">HTML-текст</option>
            <option value="url">Ссылка (URL) на файл</option>
          </select>
          <textarea
            className={`${inputCls} min-h-[160px] font-mono text-xs`}
            placeholder={tpl.mimeKind === 'url' ? 'https://…' : '<h3>Договор…</h3>'}
            value={tpl.content}
            onChange={(e) => setTpl({ ...tpl, content: e.target.value })}
          />
          <Button
            type="button"
            className="bg-[#E41C2A] hover:bg-[#c91822]"
            onClick={async () => {
              const out = await saveDocumentTemplate(tpl)
              if (!out.ok) alert(out.error)
              else {
                setTpl({ title: '', description: '', mimeKind: 'html', content: '' })
                await reload()
                onFlash('Шаблон сохранён')
              }
            }}
          >
            <Save className="mr-1.5 size-4" />
            Сохранить шаблон
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Шаблоны и рассылка</CardTitle>
          <CardDescription>Выберите шаблон и кабинеты, которым назначить подпись.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bundle.documentTemplates.length === 0 ? (
            <p className="text-sm text-slate-500">Нет шаблонов.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {bundle.documentTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${activeTpl === t.id ? 'bg-slate-50' : ''}`}
                  onClick={() => {
                    setActiveTpl(t.id)
                    setSelectedProfiles([])
                  }}
                >
                  <p className="font-medium text-slate-900">{t.title}</p>
                  <p className="truncate text-[11px] text-slate-500">{t.description || '—'}</p>
                </button>
              ))}
            </div>
          )}

          {activeTpl && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Назначить поставщикам
              </p>
              {bundle.profiles.map((p) => {
                const on = selectedProfiles.includes(p.id)
                return (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) =>
                        setSelectedProfiles(
                          e.target.checked
                            ? [...selectedProfiles, p.id]
                            : selectedProfiles.filter((x) => x !== p.id)
                        )
                      }
                    />
                    {p.email}
                  </label>
                )
              })}
              <Button
                type="button"
                className="mt-2 bg-[#E41C2A] hover:bg-[#c91822]"
                disabled={!selectedProfiles.length}
                onClick={async () => {
                  const out = await assignDocumentToProfiles(activeTpl, selectedProfiles)
                  if (!out.ok) alert(out.error)
                  else {
                    setSelectedProfiles([])
                    await reload()
                    onFlash('Назначения созданы')
                  }
                }}
              >
                Назначить на подпись
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Статус подписей</CardTitle>
          <CardDescription>
            Каждая подпись логируется отдельно (история доступна поставщику внутри документа).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bundle.documentAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">Нет назначений.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Документ</th>
                    <th className="px-3 py-2 text-left">Поставщик</th>
                    <th className="px-3 py-2 text-center">Статус</th>
                    <th className="px-3 py-2 text-left">Последняя подпись</th>
                    <th className="px-3 py-2 text-right">Подписей</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.documentAssignments.map((a) => {
                    const tpl = bundle.documentTemplates.find((t) => t.id === a.templateId)
                    const prof = bundle.profiles.find((p) => p.id === a.supplierProfileId)
                    const history = signedByAssignment[a.id] || []
                    return (
                      <tr key={a.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{tpl?.title || '—'}</td>
                        <td className="px-3 py-2">{prof?.email || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {a.status === 'SIGNED' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 className="size-3" />
                              SIGNED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 ring-1 ring-amber-200">
                              <Clock className="size-3" />
                              {a.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {history[0] ? formatDate(history[0].signedAt) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">{history.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ──────────────── Ротация ──────────────── */

function RotationTab({ bundle, reload, onFlash }) {
  const [globalDays, setGlobalDays] = useState(bundle.settings.rotationThresholdDays || 30)
  const [overrides, setOverrides] = useState(() =>
    Object.fromEntries(bundle.suppliers.map((s) => [s.id, s.rotationThresholdDays ?? '']))
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Порог ротации (неликвид)</CardTitle>
        <CardDescription>
          Если SKU не продавался указанное число дней — помечается как неликвид. Можно задать глобально
          или отдельно для каждого бренда.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Глобальный порог, дней:</label>
          <input
            type="number"
            min="1"
            max="365"
            className={`${inputCls} max-w-[120px]`}
            value={globalDays}
            onChange={(e) => setGlobalDays(e.target.value)}
          />
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {bundle.suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">
                  Сейчас: {s.rotationThresholdDays ?? `${globalDays} (global)`}
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="по умолч."
                className={`${inputCls} max-w-[120px]`}
                value={overrides[s.id] ?? ''}
                onChange={(e) => setOverrides({ ...overrides, [s.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="bg-[#E41C2A] hover:bg-[#c91822]"
          onClick={async () => {
            const out = await saveRotationSettings({
              globalDays: Number(globalDays),
              supplierOverrides: overrides,
            })
            if (!out.ok) alert(out.error)
            else {
              await reload()
              onFlash('Порог ротации сохранён')
            }
          }}
        >
          <Save className="mr-1.5 size-4" />
          Сохранить
        </Button>
      </CardContent>
    </Card>
  )
}

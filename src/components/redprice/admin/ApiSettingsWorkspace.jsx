import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Settings,
  Video,
  DollarSign,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Save,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  fetchStoreLocations,
  saveStoreLocation,
  fetchInvestors,
  fetchInvestorRoles,
  createInvestorAccount,
  updateInvestorAccount,
  createInvestorRole,
  updateInvestorRole,
  createStoreLocation,
  deleteStoreLocation,
  assignInvestorToStore,
  fetchInvestorContentSettings,
  saveInvestorContentSettings,
} from '../api/adminApi'

const SIDEBAR_EXPANDED = 220
const SIDEBAR_COLLAPSED = 64

const SETTINGS_NAV = [
  { id: 'general', label: 'Общие настройки', Icon: Settings },
  { id: 'video', label: 'Видеонаблюдение', Icon: Video },
  { id: 'finance', label: 'Финансы и Касса', Icon: DollarSign },
  { id: 'traffic', label: 'Аналитика трафика', Icon: BarChart3 },
  { id: 'investor', label: 'Контент инвестора', Icon: LayoutDashboard },
]

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70'

const ROLE_SECTIONS = ['overview', 'video', 'finance', 'traffic', 'planogram', 'reports']

const ROLE_SECTION_LABELS = {
  overview: 'Обзор',
  video: 'Видео',
  finance: 'Финансы',
  traffic: 'Трафик',
  planogram: 'Планограмма',
  reports: 'Отчёты',
}

function connectionStatus(row) {
  const a = String(row.videoUrl ?? '').trim()
  const b = String(row.posApiKey ?? '').trim()
  const c = String(row.trafficCounterId ?? '').trim()
  if (a && b && c) return 'active'
  return 'not_configured'
}

function SettingsRow({ label, children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-2.5">
      <span className="shrink-0 text-[13px] text-slate-600">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end sm:max-w-md">{children}</div>
    </div>
  )
}

/**
 * Поле формы с лейблом сверху и ограниченной шириной контрола.
 * По умолчанию контрол имеет max-w-md (не растягивается на весь блок).
 */
function Field({ label, htmlFor, hint, className = '', children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="max-w-md">{children}</div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function MacSwitch({ checked, onChange, id }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        className="relative h-7 w-12 shrink-0 rounded-full border border-slate-200 bg-slate-100 shadow-inner transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:border-emerald-300 peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"
        aria-hidden
      />
    </label>
  )
}

export default function ApiSettingsWorkspace() {
  const [active, setActive] = useState('general')
  const [collapsed, setCollapsed] = useState(false)
  const [stores, setStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [modules, setModules] = useState([])
  const [loadingModules, setLoadingModules] = useState(true)
  const [savingModules, setSavingModules] = useState(false)
  const [modulesSaved, setModulesSaved] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [investors, setInvestors] = useState([])
  const [roles, setRoles] = useState([])
  const [newInvestor, setNewInvestor] = useState({ name: '', email: '', password: '' })
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    sections: ['overview'],
    canViewStoreSecrets: false,
    canExportReports: false,
  })
  const [newStore, setNewStore] = useState({ name: '', address: '', timezone: 'Asia/Almaty', currency: 'KZT' })
  const [busyCreateInvestor, setBusyCreateInvestor] = useState(false)
  const [busyCreateRole, setBusyCreateRole] = useState(false)
  const [busyCreateStore, setBusyCreateStore] = useState(false)
  const [assignSavingStoreId, setAssignSavingStoreId] = useState(null)
  const [deleteStoreId, setDeleteStoreId] = useState(null)
  const [assignRoleSavingInvestorId, setAssignRoleSavingInvestorId] = useState(null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    fetchStoreLocations().then((data) => {
      setStores(data)
      setSelectedStoreId((id) => id || data[0]?.id || '')
      setLoadingStores(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedStoreId) return
    setLoadingModules(true)
    fetchInvestorContentSettings(selectedStoreId).then((m) => {
      setModules(m)
      setLoadingModules(false)
    })
  }, [selectedStoreId])

  useEffect(() => {
    fetchInvestors().then(setInvestors)
  }, [])

  useEffect(() => {
    fetchInvestorRoles().then(setRoles)
  }, [])

  const updateField = useCallback((id, field, value) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }, [])

  const onSaveStore = useCallback(async (store) => {
    setSavingId(store.id)
    await saveStoreLocation(store.id, {
      name: store.name,
      address: store.address,
      timezone: store.timezone,
      currency: store.currency,
      videoUrl: store.videoUrl,
      posApiKey: store.posApiKey,
      trafficCounterId: store.trafficCounterId,
    })
    setSavingId(null)
  }, [])

  const toggleModule = useCallback((id) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)))
    setModulesSaved(false)
  }, [])

  const onSaveModules = useCallback(async () => {
    setSavingModules(true)
    await saveInvestorContentSettings(
      selectedStoreId,
      modules.map((m) => ({ id: m.id, visible: m.visible }))
    )
    setSavingModules(false)
    setModulesSaved(true)
    setTimeout(() => setModulesSaved(false), 2000)
  }, [modules, selectedStoreId])

  const onCreateInvestor = useCallback(async () => {
    setBusyCreateInvestor(true)
    const out = await createInvestorAccount({
      ...newInvestor,
      roleId: roles[0]?.id || null,
    })
    setBusyCreateInvestor(false)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось создать инвестора')
      return
    }
    setNewInvestor({ name: '', email: '', password: '' })
    const all = await fetchInvestors()
    setInvestors(all)
    setFlash('Инвестор создан')
  }, [newInvestor, roles])

  const onCreateStore = useCallback(async () => {
    setBusyCreateStore(true)
    const out = await createStoreLocation(newStore)
    setBusyCreateStore(false)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось создать магазин')
      return
    }
    setNewStore({ name: '', address: '', timezone: 'Asia/Almaty', currency: 'KZT' })
    const all = await fetchStoreLocations()
    setStores(all)
    setSelectedStoreId(out.store?.id || all[0]?.id || '')
    setFlash('Магазин создан')
  }, [newStore])

  const onAssignInvestor = useCallback(async (storeId, investorId) => {
    setAssignSavingStoreId(storeId)
    const out = await assignInvestorToStore(storeId, investorId)
    setAssignSavingStoreId(null)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось назначить инвестора')
      return
    }
    const all = await fetchStoreLocations()
    setStores(all)
    setFlash('Доступ к магазину обновлён')
  }, [])

  const onDeleteStore = useCallback(async (storeId) => {
    setDeleteStoreId(storeId)
    const out = await deleteStoreLocation(storeId)
    setDeleteStoreId(null)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось удалить магазин')
      return
    }
    const all = await fetchStoreLocations()
    setStores(all)
    setSelectedStoreId((prev) => (prev === storeId ? all[0]?.id || '' : prev))
    setFlash('Точка удалена')
  }, [])

  const onCreateRole = useCallback(async () => {
    setBusyCreateRole(true)
    const out = await createInvestorRole({
      name: newRole.name,
      description: newRole.description,
      permissions: {
        sections: newRole.sections,
        canViewStoreSecrets: newRole.canViewStoreSecrets,
        canExportReports: newRole.canExportReports,
      },
    })
    setBusyCreateRole(false)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось создать роль')
      return
    }
    setNewRole({
      name: '',
      description: '',
      sections: ['overview'],
      canViewStoreSecrets: false,
      canExportReports: false,
    })
    const all = await fetchInvestorRoles()
    setRoles(all)
    setFlash('Роль создана')
  }, [newRole])

  const toggleRoleSection = useCallback((section) => {
    setNewRole((prev) => {
      const has = prev.sections.includes(section)
      const nextSections = has
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section]
      return { ...prev, sections: nextSections.length ? nextSections : ['overview'] }
    })
  }, [])

  const onAssignRole = useCallback(async (investorId, roleId) => {
    setAssignRoleSavingInvestorId(investorId)
    const out = await updateInvestorAccount(investorId, { roleId })
    setAssignRoleSavingInvestorId(null)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось назначить роль')
      return
    }
    const all = await fetchInvestors()
    setInvestors(all)
    setFlash('Роль инвестора обновлена')
  }, [])

  const onPatchRole = useCallback(async (roleId, patch) => {
    const out = await updateInvestorRole(roleId, patch)
    if (!out.ok) {
      setFlash(out.error || 'Не удалось обновить роль')
      return
    }
    const all = await fetchInvestorRoles()
    setRoles(all)
    setFlash('Роль обновлена')
  }, [])

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) ?? null,
    [stores, selectedStoreId]
  )

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full bg-white">
      {/* Settings Sidebar — flex-сосед; SidebarInset справа с flex-1 */}
      <aside
        style={{ width: sidebarW, minWidth: sidebarW }}
        className="flex min-h-0 shrink-0 flex-col border-r border-slate-100 bg-white/80 py-4 backdrop-blur-md transition-[width] duration-200 ease-out"
        aria-label="Категории настроек"
      >
          <nav className="flex max-h-[calc(100vh-8rem)] flex-1 flex-col gap-1 overflow-y-auto px-2">
            {SETTINGS_NAV.map(({ id, label, Icon }) => {
              const isActive = active === id
              return (
                <button
                  key={id}
                  type="button"
                  title={collapsed ? label : undefined}
                  onClick={() => setActive(id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-[#FEF2F2] text-[#E41C2A] shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {/* Яркая красная полоса слева для активного пункта */}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-all',
                      isActive ? 'bg-[#E41C2A]' : 'bg-transparent'
                    )}
                  />
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      isActive ? 'text-[#E41C2A]' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {collapsed && <span className="sr-only">{label}</span>}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-slate-100/80 px-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mx-auto size-9 rounded-lg text-slate-500 hover:bg-white hover:text-black"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            >
              {collapsed ? (
                <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
              ) : (
                <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
              )}
            </Button>
          </div>
        </aside>

        {/* SidebarInset: контент не перекрывается — flex-сосед с фикс. шириной сайдбара */}
        <div className="min-w-0 flex-1 bg-slate-50/50">
          <div className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-12">
            {active === 'general' && (
              <section className="space-y-8">
                <header className="space-y-2">
                  <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
                    Общие настройки
                  </h1>
                  <p className="max-w-2xl text-[15px] leading-relaxed text-slate-500">
                    Управление торговыми точками, инвесторскими учётными записями и ролями доступа.
                  </p>
                </header>

                {flash && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                    {flash}
                  </div>
                )}

                {/* ── Активная торговая точка ── */}
                {loadingStores ? (
                  <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                ) : (
                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="px-6 pb-4 pt-6">
                      <CardTitle className="text-lg font-semibold tracking-[-0.01em] text-slate-900">
                        Активная торговая точка
                      </CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Быстрый контекст для видимости модулей инвестора.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 px-6 pb-6 pt-0">
                      <Field label="Точка" htmlFor="active-store">
                        <select
                          id="active-store"
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          className={cn(inputClass, 'cursor-pointer')}
                        >
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {selectedStore && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-600 ring-1 ring-slate-100">
                          <MapPin className="size-4 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
                          <span className="font-mono text-xs text-slate-400">{selectedStore.id}</span>
                          <span className="mx-1 text-slate-300">·</span>
                          <span
                            className={
                              connectionStatus(selectedStore) === 'active'
                                ? 'font-medium text-emerald-600'
                                : 'font-medium text-amber-600'
                            }
                          >
                            {connectionStatus(selectedStore) === 'active'
                              ? 'Все интеграции заданы'
                              : 'Требуется настройка полей'}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ── Создать магазин ── */}
                {!loadingStores && (
                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="px-6 pb-4 pt-6">
                      <CardTitle className="text-lg font-semibold tracking-[-0.01em] text-slate-900">
                        Создать магазин
                      </CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Добавьте новую торговую точку в систему.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 px-6 pb-6 pt-0">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Название магазина" htmlFor="new-store-name">
                          <input
                            id="new-store-name"
                            className={inputClass}
                            placeholder="Например, Магазин №1"
                            value={newStore.name}
                            onChange={(e) => setNewStore((p) => ({ ...p, name: e.target.value }))}
                          />
                        </Field>
                        <Field label="Адрес" htmlFor="new-store-address">
                          <input
                            id="new-store-address"
                            className={inputClass}
                            placeholder="г. Алматы, ул. …"
                            value={newStore.address}
                            onChange={(e) => setNewStore((p) => ({ ...p, address: e.target.value }))}
                          />
                        </Field>
                        <Field label="Часовой пояс" htmlFor="new-store-tz">
                          <input
                            id="new-store-tz"
                            className={inputClass}
                            placeholder="Asia/Almaty"
                            value={newStore.timezone}
                            onChange={(e) => setNewStore((p) => ({ ...p, timezone: e.target.value }))}
                          />
                        </Field>
                        <Field label="Валюта" htmlFor="new-store-currency">
                          <input
                            id="new-store-currency"
                            className={inputClass}
                            placeholder="KZT"
                            value={newStore.currency}
                            onChange={(e) => setNewStore((p) => ({ ...p, currency: e.target.value }))}
                          />
                        </Field>
                      </div>
                      <div className="flex items-center gap-2 border-t border-slate-100 pt-5">
                        <Button
                          type="button"
                          onClick={onCreateStore}
                          disabled={busyCreateStore}
                          className="h-10 rounded-lg bg-[#E41C2A] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#c91822] disabled:opacity-60"
                        >
                          {busyCreateStore ? 'Создание…' : 'Создать магазин'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          onClick={() =>
                            setNewStore({ name: '', address: '', timezone: 'Asia/Almaty', currency: 'KZT' })
                          }
                          disabled={busyCreateStore}
                        >
                          Очистить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Инвесторы и доступ ── */}
                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="px-6 pb-4 pt-6">
                    <CardTitle className="text-lg font-semibold tracking-[-0.01em] text-slate-900">
                      Инвесторы и доступ к магазинам
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Создание учётных записей инвесторов и назначение магазинов.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6 px-6 pb-6 pt-0">
                    {/* Новый инвестор */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Имя" htmlFor="inv-name">
                        <input
                          id="inv-name"
                          className={inputClass}
                          placeholder="Иван Иванов"
                          value={newInvestor.name}
                          onChange={(e) => setNewInvestor((p) => ({ ...p, name: e.target.value }))}
                        />
                      </Field>
                      <Field label="Email" htmlFor="inv-email">
                        <input
                          id="inv-email"
                          type="email"
                          className={inputClass}
                          placeholder="investor@redprice.kz"
                          value={newInvestor.email}
                          onChange={(e) => setNewInvestor((p) => ({ ...p, email: e.target.value }))}
                        />
                      </Field>
                      <Field label="Пароль" htmlFor="inv-pass">
                        <input
                          id="inv-pass"
                          type="password"
                          className={inputClass}
                          placeholder="Минимум 6 символов"
                          value={newInvestor.password}
                          onChange={(e) => setNewInvestor((p) => ({ ...p, password: e.target.value }))}
                        />
                      </Field>
                      <Field label="Роль" htmlFor="inv-role">
                        <select
                          id="inv-role"
                          className={cn(inputClass, 'cursor-pointer')}
                          value={newInvestor.roleId || roles[0]?.id || ''}
                          onChange={(e) => setNewInvestor((p) => ({ ...p, roleId: e.target.value }))}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="border-t border-slate-100 pt-5">
                      <Button
                        type="button"
                        onClick={onCreateInvestor}
                        disabled={busyCreateInvestor}
                        className="h-10 rounded-lg bg-[#E41C2A] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#c91822] disabled:opacity-60"
                      >
                        {busyCreateInvestor ? 'Создание…' : 'Создать инвестора'}
                      </Button>
                    </div>

                    {/* Список инвесторов */}
                    {investors.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-6">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                          Инвесторы ({investors.length})
                        </p>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/40">
                          {investors.map((i) => (
                            <div
                              key={i.id}
                              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 text-sm">
                                <p className="truncate font-medium text-slate-900">{i.name}</p>
                                <p className="truncate text-xs text-slate-500">{i.email}</p>
                              </div>
                              <select
                                className={cn(inputClass, 'max-w-[220px] cursor-pointer')}
                                value={i.roleId || ''}
                                onChange={(e) => onAssignRole(i.id, e.target.value)}
                                disabled={assignRoleSavingInvestorId === i.id}
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Привязка магазинов к инвесторам */}
                    {stores.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-6">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                          Привязка магазинов
                        </p>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/40">
                          {stores.map((s) => (
                            <div
                              key={s.id}
                              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 text-sm">
                                <p className="truncate font-medium text-slate-900">{s.name}</p>
                                <p className="truncate font-mono text-[11px] text-slate-400">{s.id}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className={cn(inputClass, 'max-w-[260px] cursor-pointer')}
                                  value={s.investorId || ''}
                                  onChange={(e) => onAssignInvestor(s.id, e.target.value || null)}
                                  disabled={assignSavingStoreId === s.id}
                                >
                                  <option value="">Без инвестора</option>
                                  {investors.map((i) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name} ({i.email})
                                    </option>
                                  ))}
                                </select>
                                {assignSavingStoreId === s.id && (
                                  <span className="text-xs text-slate-400">…</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Роли инвесторов ── */}
                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="px-6 pb-4 pt-6">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-[-0.01em] text-slate-900">
                      <UserCog className="size-5 text-slate-700" strokeWidth={1.5} aria-hidden />
                      Роли инвесторов
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Определите набор разделов и привилегий для каждой роли.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6 px-6 pb-6 pt-0">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Название роли" htmlFor="role-name">
                        <input
                          id="role-name"
                          className={inputClass}
                          placeholder="Например, Аналитик"
                          value={newRole.name}
                          onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
                        />
                      </Field>
                      <Field label="Описание" htmlFor="role-desc">
                        <input
                          id="role-desc"
                          className={inputClass}
                          placeholder="Краткое описание прав"
                          value={newRole.description}
                          onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
                        />
                      </Field>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-slate-700">Доступные разделы</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {ROLE_SECTIONS.map((section) => {
                          const checked = newRole.sections.includes(section)
                          return (
                            <label
                              key={section}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                                checked
                                  ? 'border-[#E41C2A]/40 bg-[#FEF2F2] text-[#E41C2A]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              <input
                                type="checkbox"
                                className="accent-[#E41C2A]"
                                checked={checked}
                                onChange={() => toggleRoleSection(section)}
                              />
                              {ROLE_SECTION_LABELS[section] || section}
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-slate-700">Привилегии</p>
                      <div className="flex flex-wrap gap-3">
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                            newRole.canViewStoreSecrets
                              ? 'border-[#E41C2A]/40 bg-[#FEF2F2] text-[#E41C2A]'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="accent-[#E41C2A]"
                            checked={newRole.canViewStoreSecrets}
                            onChange={(e) =>
                              setNewRole((p) => ({ ...p, canViewStoreSecrets: e.target.checked }))
                            }
                          />
                          Видеть API-ключи магазинов
                        </label>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                            newRole.canExportReports
                              ? 'border-[#E41C2A]/40 bg-[#FEF2F2] text-[#E41C2A]'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="accent-[#E41C2A]"
                            checked={newRole.canExportReports}
                            onChange={(e) =>
                              setNewRole((p) => ({ ...p, canExportReports: e.target.checked }))
                            }
                          />
                          Экспорт отчётов
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                      <Button
                        type="button"
                        onClick={onCreateRole}
                        disabled={busyCreateRole}
                        className="h-10 rounded-lg bg-[#E41C2A] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#c91822] disabled:opacity-60"
                      >
                        {busyCreateRole ? 'Создание…' : 'Создать роль'}
                      </Button>
                    </div>

                    {roles.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-6">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                          Существующие роли ({roles.length})
                        </p>
                        <div className="space-y-2">
                          {roles.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                                  {r.description && (
                                    <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                  onClick={() =>
                                    onPatchRole(r.id, {
                                      permissions: {
                                        canExportReports: !r.permissions?.canExportReports,
                                      },
                                    })
                                  }
                                >
                                  Экспорт:{' '}
                                  <span
                                    className={cn(
                                      'ml-1 font-semibold',
                                      r.permissions?.canExportReports
                                        ? 'text-emerald-600'
                                        : 'text-slate-400'
                                    )}
                                  >
                                    {r.permissions?.canExportReports ? 'ON' : 'OFF'}
                                  </span>
                                </Button>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {(r.permissions?.sections || []).length > 0 ? (
                                  (r.permissions?.sections || []).map((s) => (
                                    <span
                                      key={s}
                                      className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
                                    >
                                      {ROLE_SECTION_LABELS[s] || s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">Разделы не назначены</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {active === 'video' && (
              <StoresFieldPanel
                title="Видеонаблюдение"
                description="URL видеопотоков по торговым точкам."
                loading={loadingStores}
                stores={stores}
                field="videoUrl"
                label="URL видеопотока"
                placeholder="https://…"
                inputType="url"
                savingId={savingId}
                onSave={onSaveStore}
                updateField={updateField}
                allowStoreManage
                newStore={newStore}
                setNewStore={setNewStore}
                onCreateStore={onCreateStore}
                busyCreateStore={busyCreateStore}
                onDeleteStore={onDeleteStore}
                deleteStoreId={deleteStoreId}
              />
            )}

            {active === 'finance' && (
              <StoresFieldPanel
                title="Финансы и Касса"
                description="Ключ API кассы (POS) для каждой точки."
                loading={loadingStores}
                stores={stores}
                field="posApiKey"
                label="API Key кассы"
                placeholder="—"
                inputType="password"
                mono
                savingId={savingId}
                onSave={onSaveStore}
                updateField={updateField}
                allowStoreManage
                newStore={newStore}
                setNewStore={setNewStore}
                onCreateStore={onCreateStore}
                busyCreateStore={busyCreateStore}
                onDeleteStore={onDeleteStore}
                deleteStoreId={deleteStoreId}
              />
            )}

            {active === 'traffic' && (
              <StoresFieldPanel
                title="Аналитика трафика"
                description="Идентификаторы счётчиков проходимости."
                loading={loadingStores}
                stores={stores}
                field="trafficCounterId"
                label="ID счётчика проходимости"
                placeholder="—"
                inputType="text"
                mono
                savingId={savingId}
                onSave={onSaveStore}
                updateField={updateField}
                allowStoreManage
                newStore={newStore}
                setNewStore={setNewStore}
                onCreateStore={onCreateStore}
                busyCreateStore={busyCreateStore}
                onDeleteStore={onDeleteStore}
                deleteStoreId={deleteStoreId}
              />
            )}

            {active === 'investor' && (
              <section className="space-y-6">
                <header className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-black">
                    Контент инвестора
                  </h2>
                  <p className="text-[14px] leading-relaxed text-slate-500">
                    Видимость модулей на странице инвестора: Видео, Финансы, Трафик, Планограмма и
                    др.
                  </p>
                </header>
                <StoreManagePanel
                  stores={stores}
                  newStore={newStore}
                  setNewStore={setNewStore}
                  onCreateStore={onCreateStore}
                  busyCreateStore={busyCreateStore}
                  onDeleteStore={onDeleteStore}
                  deleteStoreId={deleteStoreId}
                  updateField={updateField}
                />
                {loadingModules ? (
                  <div className="h-40 animate-pulse rounded-xl border border-slate-100 bg-white" />
                ) : (
                  <Card className="relative border border-slate-100 bg-white shadow-sm">
                    <div className="absolute right-4 top-4 z-10">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-slate-200 px-3 text-[12px] font-medium text-black shadow-sm"
                        onClick={onSaveModules}
                        disabled={savingModules}
                      >
                        <Save className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
                        {savingModules ? '…' : modulesSaved ? 'Сохранено' : 'Сохранить'}
                      </Button>
                    </div>
                    <CardHeader className="pr-28">
                      <CardTitle className="text-[15px] font-medium text-black">
                        Модули дашборда
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-slate-100 px-6 pb-6 pt-0">
                      {modules.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0"
                        >
                          <span className="text-[14px] text-black">{m.label}</span>
                          <MacSwitch
                            id={`mod-${m.id}`}
                            checked={m.visible}
                            onChange={() => toggleModule(m.id)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
  )
}

function StoresFieldPanel({
  title,
  description,
  loading,
  stores,
  field,
  label,
  placeholder,
  inputType,
  mono,
  savingId,
  onSave,
  updateField,
  allowStoreManage = false,
  newStore,
  setNewStore,
  onCreateStore,
  busyCreateStore = false,
  onDeleteStore,
  deleteStoreId,
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-black">{title}</h2>
        <p className="text-[14px] leading-relaxed text-slate-500">{description}</p>
      </header>
      {allowStoreManage && (
        <Card className="border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-[15px] font-medium text-black">
              Новая торговая точка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Наименование точки"
                value={newStore?.name || ''}
                onChange={(e) => setNewStore((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Адрес"
                value={newStore?.address || ''}
                onChange={(e) => setNewStore((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-[#E41C2A] hover:bg-[#c91822]"
              onClick={onCreateStore}
              disabled={busyCreateStore}
            >
              {busyCreateStore ? 'Создание…' : 'Создать торговую точку'}
            </Button>
          </CardContent>
        </Card>
      )}
      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-slate-100 bg-white" />
      ) : (
        <div className="space-y-6">
          {stores.map((store) => {
            const st = connectionStatus(store)
            const value = store[field] ?? ''
            return (
              <Card key={store.id} className="relative border border-slate-100 bg-white shadow-sm">
                <div className="absolute right-3 top-3 z-10">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-slate-200 px-3 text-[12px] font-medium text-black shadow-sm"
                    disabled={savingId === store.id}
                    onClick={() => onSave(store)}
                  >
                    {savingId === store.id ? '…' : 'Сохранить'}
                  </Button>
                </div>
                <CardHeader className="flex flex-row items-start gap-3 pb-2 pr-24 pt-5">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <MapPin className="size-4 text-black" strokeWidth={1.5} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {allowStoreManage ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={store.name}
                          onChange={(e) => updateField(store.id, 'name', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[15px] font-medium text-black shadow-sm"
                          placeholder="Наименование точки"
                        />
                        <input
                          type="text"
                          value={store.address || ''}
                          onChange={(e) => updateField(store.id, 'address', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm"
                          placeholder="Адрес точки"
                        />
                      </div>
                    ) : (
                      <CardTitle className="text-[15px] font-medium text-black">{store.name}</CardTitle>
                    )}
                    <p className="font-mono text-[11px] text-slate-400">{store.id}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          st === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                        )}
                        aria-hidden
                      />
                      <span className="text-[12px] text-slate-500">
                        {st === 'active' ? 'Готово' : 'Не все поля'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-5 pt-0">
                  <SettingsRow label={label}>
                    <input
                      type={inputType}
                      value={value}
                      onChange={(e) => updateField(store.id, field, e.target.value)}
                      placeholder={placeholder}
                      autoComplete="off"
                      className={cn(inputClass, mono && 'font-mono text-sm')}
                    />
                  </SettingsRow>
                  {allowStoreManage && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDeleteStore(store.id)}
                        disabled={deleteStoreId === store.id}
                      >
                        {deleteStoreId === store.id ? 'Удаление…' : 'Удалить точку'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StoreManagePanel({
  stores,
  newStore,
  setNewStore,
  onCreateStore,
  busyCreateStore,
  onDeleteStore,
  deleteStoreId,
  updateField,
}) {
  return (
    <Card className="border border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-[15px] font-medium text-black">
          Управление торговыми точками
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Наименование точки"
            value={newStore?.name || ''}
            onChange={(e) => setNewStore((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Адрес"
            value={newStore?.address || ''}
            onChange={(e) => setNewStore((p) => ({ ...p, address: e.target.value }))}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-[#E41C2A] hover:bg-[#c91822]"
          onClick={onCreateStore}
          disabled={busyCreateStore}
        >
          {busyCreateStore ? 'Создание…' : 'Создать торговую точку'}
        </Button>
        <div className="space-y-2 pt-1">
          {stores.map((store) => (
            <div
              key={store.id}
              className="grid gap-2 rounded-lg border border-slate-100 px-3 py-2 sm:grid-cols-[1.1fr_1.5fr_auto]"
            >
              <input
                className={inputClass}
                value={store.name}
                onChange={(e) => updateField(store.id, 'name', e.target.value)}
              />
              <input
                className={inputClass}
                value={store.address || ''}
                placeholder="Адрес"
                onChange={(e) => updateField(store.id, 'address', e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDeleteStore(store.id)}
                disabled={deleteStoreId === store.id}
              >
                {deleteStoreId === store.id ? '…' : 'Удалить'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Menu, PanelLeftClose, PanelRightOpen, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SUPPLIER_SECTIONS } from './supplierNavConfig'
import { cn } from '@/lib/utils'

const EXPANDED_W = 252
const COLLAPSED_W = 74

function useIsDesktop() {
  const [ok, setOk] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const fn = () => setOk(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return ok
}

/**
 * Оболочка дашборда поставщика (идентичный tailadmin-стиль, что и в инвесторе).
 */
export function SupplierDashboardLayout({
  children,
  activeSection,
  onSectionChange,
  visibleSectionIds,
  supplierName = 'Поставщик',
  supplierEmail = '',
  brandLabel = 'Supplier',
  onLogout,
  onRefresh,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const isDesktop = useIsDesktop()

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    onRefresh?.()
    window.setTimeout(() => setRefreshing(false), 700)
  }, [onRefresh])

  const toggleSidebar = useCallback(() => {
    if (isDesktop) setCollapsed((c) => !c)
    else setMobileOpen((o) => !o)
  }, [isDesktop])

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  const visible = Array.isArray(visibleSectionIds) && visibleSectionIds.length
    ? SUPPLIER_SECTIONS.filter((s) => visibleSectionIds.includes(s.id))
    : SUPPLIER_SECTIONS

  const activeLabel = visible.find((s) => s.id === activeSection)?.label ?? 'Обзор'
  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W

  const SidebarNav = ({ narrow }) => (
    <>
      <div className={cn('mb-8 px-1', narrow && 'flex justify-center overflow-hidden')}>
        {!narrow ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              Redprice Partners
            </p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-white">Поставщик</p>
          </>
        ) : (
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-white ring-1 ring-white/10">
            SP
          </span>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {visible.map(({ id, label, Icon }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              type="button"
              title={narrow ? label : undefined}
              onClick={() => {
                onSectionChange(id)
                setMobileOpen(false)
              }}
              className={cn(
                'group flex w-full items-center rounded-lg text-left text-[12px] font-medium tracking-tight transition-colors',
                narrow ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3',
                active
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon
                strokeWidth={1.5}
                className={cn('size-[18px] shrink-0', active ? 'text-white' : 'text-gray-400 group-hover:text-white')}
                aria-hidden
              />
              {!narrow && <span className="truncate">{label}</span>}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          to="/"
          className={cn(
            'group flex items-center rounded-lg text-[13px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white',
            narrow ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'
          )}
        >
          <ExternalLink strokeWidth={1.5} className="size-[18px] shrink-0" aria-hidden />
          {!narrow && 'На сайт'}
        </Link>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-[15px] leading-relaxed text-gray-800 antialiased">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        style={{ width: isDesktop ? sidebarW : EXPANDED_W }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#1C2434] px-3 py-8 shadow-xl transition-[transform,width] duration-200 ease-out md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isDesktop && collapsed && 'items-stretch px-2'
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <SidebarNav narrow={isDesktop && collapsed} />
        </div>
      </aside>

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col"
        style={{ paddingLeft: isDesktop ? sidebarW : 0 }}
      >
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-5 md:px-8 md:py-7 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-0.5 size-10 shrink-0 rounded-lg border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={toggleSidebar}
                  aria-label="Боковая панель"
                >
                  <Menu className="size-[18px] md:hidden" strokeWidth={1.5} aria-hidden />
                  {collapsed ? (
                    <PanelRightOpen className="hidden size-[18px] md:inline" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <PanelLeftClose className="hidden size-[18px] md:inline" strokeWidth={1.5} aria-hidden />
                  )}
                </Button>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />
                    <h1 className="text-xl font-semibold tracking-[-0.03em] text-gray-900 sm:text-2xl">
                      Кабинет поставщика
                    </h1>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">Online</span>
                  </div>
                  <p className="text-[13px] font-medium text-gray-500">{activeLabel}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Avatar className="size-11 rounded-lg border border-gray-200 bg-white shadow-sm">
                  <AvatarFallback className="rounded-lg text-[15px] font-semibold text-gray-800">
                    {String(supplierName || 'SP')
                      .split(' ')
                      .map((x) => x[0] || '')
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'SP'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-[170px] space-y-0.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right shadow-sm">
                  <p className="truncate text-[13px] font-semibold text-gray-900">{supplierName}</p>
                  <p className="truncate text-[11px] text-gray-500">{supplierEmail}</p>
                  <p className="text-[10px] uppercase tracking-wide text-emerald-600">{brandLabel}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-lg border-gray-200 bg-white px-5 text-gray-800 shadow-sm hover:bg-gray-50"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} strokeWidth={1.5} aria-hidden />
                  Обновить
                </Button>
                {onLogout && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-lg border-gray-200 bg-white px-5 text-gray-800 shadow-sm hover:bg-gray-50"
                    onClick={onLogout}
                  >
                    Выйти
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-[#F9FAFB] px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}

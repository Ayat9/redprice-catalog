import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/news', label: 'Блог', match: (p) => p === '/news' || p.startsWith('/news/') },
  { to: '/admin', label: 'Red IS', match: (p) => p === '/admin' || p.startsWith('/admin/') },
  { to: '/partners', label: 'Партнёры', match: (p) => p === '/partners' || p === '/partner-login' },
  { to: '/contacts', label: 'Контакты', match: (p) => p === '/contacts' },
]

const linkBase =
  'whitespace-nowrap text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300'
const linkActive = 'text-slate-900'

export default function Header({
  showCart = false,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
}) {
  const location = useLocation()
  const pathname = location.pathname || ''

  return (
    <header className="site-header sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 font-sans backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="nav-inner flex h-20 w-full items-center justify-between">
          <Link
            to="/"
            className="mr-4 shrink-0 text-lg font-bold tracking-[-0.02em] text-[#E41C2A] transition-colors hover:text-[#c91822] md:mr-8"
          >
            Redprice.kz
          </Link>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Link
              to="/investor"
              className={cn(
                'inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700',
                'transition-colors hover:border-slate-300 hover:text-slate-900',
                pathname === '/investor' && 'border-slate-900 text-slate-900',
              )}
            >
              Кабинет
            </Link>
            {showCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <span>Корзина</span>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          <div className="ml-auto hidden items-center gap-5 md:flex lg:gap-7">
            <nav
              className="nav-menu hidden items-center gap-4 md:flex lg:gap-6"
              aria-label="Основное меню"
            >
              {navLinks.map(({ to, label, match }) => {
                const isActive = match(pathname)
                return (
                  <Link
                    key={to + label}
                    to={to}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(linkBase, isActive && linkActive)}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="nav-actions flex items-center">
              <Link
                to="/investor"
                className={cn(
                  linkBase,
                  pathname === '/investor' && linkActive
                )}
              >
                Кабинет
              </Link>
            </div>
            {showCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className={cn(linkBase, 'inline-flex items-center gap-2 whitespace-nowrap')}
              >
                <span>Корзина</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {cartCount} · {cartTotal.toLocaleString('ru-KZ')} ₸
                </span>
              </button>
            )}
          </div>
        </div>

        <nav
          className="nav-menu-mobile -mt-1 flex gap-2 overflow-x-auto pb-3 md:hidden"
          aria-label="Основное меню (мобильная версия)"
        >
          {navLinks.map(({ to, label, match }) => {
            const isActive = match(pathname)
            return (
              <Link
                key={`mobile-${to}-${label}`}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

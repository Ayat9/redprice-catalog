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
    <header className="site-header sticky top-0 z-40 border-b border-slate-200 bg-white/95 font-sans backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="nav-inner mx-auto flex h-auto w-full max-w-[1180px] items-center justify-between gap-[14px] px-4 py-[14px] md:h-[72px] md:px-6 md:py-0">
        <Link
          to="/"
          className="shrink-0 text-lg font-bold tracking-[-0.02em] text-[#E41C2A] transition-colors hover:text-[#c91822]"
        >
          Redprice.kz
        </Link>
        <div className="flex items-center gap-6">
          <nav
            className="nav-menu hidden items-center gap-7 md:flex"
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
    </header>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useSession } from '@/context/SessionContext'
import { cn } from '@/lib/utils'

/**
 * Ghost-button навигация: единый шрифт/цвет для всех пунктов,
 * активный пункт — мягкая заливка bg-gray-100, hover — плавная смена фона,
 * одинаковые горизонтальные отступы px-4 py-2. Логотип слева, меню справа.
 */
const navLinks = [
  { to: '/news', label: 'Блог', match: (p) => p === '/news' || p.startsWith('/news/') },
  /** Админка, REDIS-ценники и панель API — один раздел */
  { to: '/admin', label: 'Red IS', match: (p) => p === '/admin' || p.startsWith('/admin/') },
  { to: '/investor', label: 'Инвесторы', match: (p) => p === '/investor' },
]

const linkBase =
  'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300'
const linkIdle = 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
const linkActive = 'bg-gray-100 text-slate-900'

export default function Header({
  showCart = false,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  showPartnerLoginButton = false,
}) {
  const location = useLocation()
  const pathname = location.pathname || ''
  const { session } = useSession()
  const isSupplier = session?.role === 'SUPPLIER'

  return (
    <header className="site-header sticky top-0 z-40 border-b border-slate-200 bg-white/95 font-sans backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="nav-inner mx-auto flex h-auto w-full max-w-[1180px] flex-col items-center justify-between gap-[14px] px-4 py-[14px] md:h-[72px] md:flex-row md:gap-0 md:px-6 md:py-0">
        <Link
          to="/"
          className="shrink-0 text-lg font-bold tracking-[-0.02em] text-[#E41C2A] transition-colors hover:text-[#c91822]"
        >
          Redprice.kz
        </Link>
        <div className="flex items-center gap-4">
          <nav
            className="nav-menu flex flex-wrap items-center justify-center gap-3 md:gap-4"
            aria-label="Основное меню"
          >
            {navLinks.map(({ to, label, match }) => {
              const isActive = match(pathname)
              return (
                <Link
                  key={to + label}
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(linkBase, 'whitespace-nowrap', isActive ? linkActive : linkIdle)}
                >
                  {label}
                </Link>
              )
            })}
            <Link
              to={isSupplier ? '/supplier' : '/partners'}
              className={cn(
                linkBase,
                'whitespace-nowrap border-b-2 border-transparent pb-1',
                pathname.startsWith('/supplier') || pathname === '/partners' || pathname === '/partner-login'
                  ? 'text-slate-900 border-[#E30613]'
                  : 'text-slate-600 hover:text-slate-900 hover:border-slate-200'
              )}
            >
              {isSupplier ? 'Кабинет партнёра' : 'Партнёры'}
            </Link>
            <Link
              to="/contacts"
              className={cn(
                linkBase,
                'whitespace-nowrap',
                pathname === '/contacts' ? linkActive : linkIdle
              )}
            >
              Контакты
            </Link>
          </nav>
          {showPartnerLoginButton && (
            <Link
              to="/partner-login"
              className="inline-flex h-11 items-center rounded-xl bg-[#E30613] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(227,6,19,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c10511]"
            >
              Войти для партнёров →
            </Link>
          )}
          {showCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className={cn(linkBase, linkIdle, 'inline-flex items-center gap-2 whitespace-nowrap')}
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

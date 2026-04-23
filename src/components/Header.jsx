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

export default function Header({ showCart = false, cartCount = 0, cartTotal = 0, onOpenCart }) {
  const location = useLocation()
  const pathname = location.pathname || ''
  const { session } = useSession()
  const isSupplier = session?.role === 'SUPPLIER'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 font-sans backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-8 sm:px-14 lg:px-24 xl:px-32">
        <Link
          to="/"
          className="shrink-0 text-lg font-bold tracking-[-0.02em] text-[#E41C2A] transition-colors hover:text-[#c91822]"
        >
          Redprice.kz
        </Link>

        <nav
          className="flex items-center gap-3 overflow-x-auto sm:gap-5 lg:gap-[30px]"
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
            to={isSupplier ? '/supplier' : '/supplier/login'}
            className={cn(
              linkBase,
              'whitespace-nowrap',
              pathname.startsWith('/supplier') ? linkActive : linkIdle
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
        </nav>
      </div>
    </header>
  )
}

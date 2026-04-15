import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/news', label: 'Новости', match: (p) => p === '/' || p === '/news' || p.startsWith('/news/') },
  /** Админка, REDIS ценники и панель API — один раздел */
  {
    to: '/admin',
    label: 'REDIS',
    match: (p) => p === '/admin' || p.startsWith('/admin/'),
  },
  { to: '/investor', label: 'REDPRICE GROUP', match: (p) => p === '/investor' },
]

export default function Header({ showCart = false, cartCount = 0, cartTotal = 0, onOpenCart }) {
  const location = useLocation()
  const pathname = location.pathname || ''
  const search = location.search || ''

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          Redprice.kz
        </Link>
        <nav className="header-nav" aria-label="Основное меню">
          {navLinks.map(({ to, label, match }) => (
            <Link
              key={to + label}
              to={to}
              className={`header-nav-link ${match(pathname, search) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          {showCart && (
            <button type="button" className="cart-btn" onClick={onOpenCart}>
              <span className="cart-btn-text">
                Выбрано {cartCount} тов ({cartTotal.toLocaleString('ru-KZ')}₸)
              </span>
              <span className="cart-btn-action">Открыть корзину</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

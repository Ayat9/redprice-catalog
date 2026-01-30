import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header({ showCart = false, cartCount = 0, cartTotal = 0, onOpenCart }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  const pathname = location.pathname || ''

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">Redprice.kz</Link>
        <div className="header-right">
          <div className="header-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="header-menu-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              aria-expanded={menuOpen}
              aria-label="Меню"
            >
              <span className="header-menu-icon">
                <span /><span /><span />
              </span>
            </button>
            {menuOpen && (
              <div className="header-menu-box">
                <Link to="/" className={`header-menu-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Интернет магазин</Link>
                <Link to="/opt" className={`header-menu-link ${pathname === '/opt' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Оптовые закупки</Link>
                <Link to="/zakup" className={`header-menu-link ${pathname === '/zakup' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Отдел закупок</Link>
                <Link to="/admin" className={`header-menu-link ${pathname === '/admin' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Админ</Link>
              </div>
            )}
          </div>
          {showCart && (
            <button type="button" className="cart-btn" onClick={onOpenCart}>
              <span className="cart-btn-text">Выбрано {cartCount} тов ({cartTotal.toLocaleString('ru-KZ')}₸)</span>
              <span className="cart-btn-action">Открыть корзину</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

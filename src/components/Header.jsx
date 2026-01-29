import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Header({ cartCount, cartTotal, onOpenCart }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

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
                <Link to="/" className="header-menu-link" onClick={() => setMenuOpen(false)}>Каталог</Link>
                <Link to="/admin" className="header-menu-link" onClick={() => setMenuOpen(false)}>Админ</Link>
              </div>
            )}
          </div>
          <button type="button" className="cart-btn" onClick={onOpenCart}>
          <span className="cart-btn-text">Выбрано {cartCount} тов ({cartTotal.toLocaleString('ru-KZ')}₸)</span>
          <span className="cart-btn-action">Открыть корзину</span>
          </button>
        </div>
      </div>
    </header>
  )
}

import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './Header.css'

function Header() {
  let cartCount = 0
  try {
    const { getCartCount } = useCart()
    cartCount = getCartCount()
  } catch (e) {
    // Cart context not available
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Каталог Поставщиков</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Каталог</Link>
          <Link to="/admin" className="nav-link">Админ-панель</Link>
          <Link to="/cart" className="nav-link cart-link">
            Корзина
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header

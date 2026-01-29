export default function Header({ cartCount, cartTotal, onOpenCart }) {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="/" className="logo">Каталог</a>
        <nav className="nav">
          <a href="#catalog" className="nav-link">Каталог</a>
          <a href="#login" className="nav-link">Войти</a>
        </nav>
        <a href="tel:87086910243" className="phone">8 (708) 691-02-43</a>
        <button type="button" className="cart-btn" onClick={onOpenCart}>
          <span className="cart-btn-text">Выбрано {cartCount} тов ({cartTotal.toLocaleString('ru-KZ')}₸)</span>
          <span className="cart-btn-action">Открыть корзину</span>
        </button>
      </div>
    </header>
  )
}

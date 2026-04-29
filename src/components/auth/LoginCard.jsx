import { Link } from 'react-router-dom'

export default function LoginCard({
  badge,
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="login-page-shell">
      <section className="login-card">
        {badge && <p className="login-card-badge">{badge}</p>}
        <h1 className="login-card-title">{title}</h1>
        {subtitle && <p className="login-card-subtitle">{subtitle}</p>}
        <div className="login-card-body">{children}</div>
        {footer ?? (
          <div className="login-card-links">
            <Link to="/" className="login-card-link">← На главную</Link>
          </div>
        )}
      </section>
    </div>
  )
}

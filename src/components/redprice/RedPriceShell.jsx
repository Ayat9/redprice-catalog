import { Link } from 'react-router-dom'

/**
 * Оболочка админ-панели: светлый фон macOS, белый контент.
 */
export default function RedPriceShell({ children, title, subtitle, contentMaxWidth = '4xl' }) {
  const mainClass =
    contentMaxWidth === 'full'
      ? 'w-full max-w-none px-0 py-0'
      : 'mx-auto max-w-4xl px-8 py-12 lg:px-12 lg:py-16'

  return (
    <div className="min-h-screen bg-white font-sans text-black antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 px-8 py-8 backdrop-blur-md lg:px-12 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              RedPrice Group
            </p>
            {title && (
              <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-black">{title}</h1>
            )}
            {subtitle && (
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
            )}
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
            <Link
              to="/investor"
              className="rounded-xl px-4 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-black"
            >
              Инвестор
            </Link>
            <Link
              to="/admin?panel=api"
              className="rounded-xl bg-slate-50 px-4 py-2.5 text-black ring-1 ring-slate-100"
            >
              Панель API
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-black"
            >
              На сайт
            </Link>
          </nav>
        </div>
      </header>
      <main className={mainClass}>{children}</main>
    </div>
  )
}

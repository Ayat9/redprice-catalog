import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Phone, Send, Youtube } from 'lucide-react'

const socials = [
  { href: 'https://t.me/redprice', label: 'Telegram', Icon: Send },
  { href: 'https://instagram.com/redprice.kz', label: 'Instagram', Icon: Instagram },
  { href: 'https://facebook.com/redprice.kz', label: 'Facebook', Icon: Facebook },
  { href: 'https://youtube.com/@redprice', label: 'YouTube', Icon: Youtube },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="text-lg font-bold tracking-[-0.02em] text-white">
            Redprice<span className="text-[#E41C2A]">.kz</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Умная розничная платформа: электронные ценники, видеонаблюдение и аналитика в одном
            кабинете.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 transition hover:border-[#E41C2A] hover:bg-[#E41C2A] hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Разделы</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/news" className="transition hover:text-white">
                Блог
              </Link>
            </li>
            <li>
              <Link to="/admin" className="transition hover:text-white">
                Red IS
              </Link>
            </li>
            <li>
              <Link to="/investor" className="transition hover:text-white">
                Инвесторы
              </Link>
            </li>
            <li>
              <Link to="/supplier/login" className="transition hover:text-white">
                Партнёры
              </Link>
            </li>
            <li>
              <Link to="/contacts" className="transition hover:text-white">
                Контакты
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Контакты</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E41C2A]" />
              <span>Алматы, Казахстан</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#E41C2A]" />
              <a href="tel:+77000000000" className="transition hover:text-white">
                +7 (700) 000-00-00
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#E41C2A]" />
              <a href="mailto:info@red-price.kz" className="transition hover:text-white">
                info@red-price.kz
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} Redprice.kz. Все права защищены.</p>
          <p>
            Сделано в Казахстане ·{' '}
            <Link to="/contacts" className="transition hover:text-slate-300">
              Связаться с нами
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

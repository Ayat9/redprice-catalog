import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/admin/cennik', label: 'Ценник', match: '/admin/cennik' },
  { to: '/admin/redis-esl', label: 'REDIS', match: '/admin/redis-esl' },
]

export default function EslSectionTabs({ className }) {
  const { pathname } = useLocation()

  return (
    <div className={cn('inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm', className)}>
      {TABS.map((tab) => {
        const active = pathname === tab.match || pathname.startsWith(`${tab.match}/`)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

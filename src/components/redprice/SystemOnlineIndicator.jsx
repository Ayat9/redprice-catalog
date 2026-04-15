import { cn } from '@/lib/utils'

/**
 * Пульсирующий зелёный индикатор «System Online» для строк с упоминанием API.
 */
export default function SystemOnlineIndicator({
  className,
  label = 'System Online',
  showLabel = true,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium tracking-tight text-emerald-700',
        className
      )}
      title={label}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]" />
      </span>
      {showLabel && <span className="tracking-tight">{label}</span>}
    </span>
  )
}

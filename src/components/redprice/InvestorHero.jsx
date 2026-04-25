import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  DatabaseZap,
  Landmark,
  Percent,
  RefreshCw,
  Store,
  TrendingUp,
} from 'lucide-react'
import { fetchInvestorMetrics } from './api/investorApi'

const periods = [
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
]

const palette = ['#E30613', '#0F172A', '#64748B', '#CBD5E1']

function useCountUp(value, duration = 900) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let frame = 0
    const totalFrames = Math.max(1, Math.round(duration / 16))
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(value * eased))
      frame += 1
      if (progress < 1 && frame <= totalFrames + 4) requestAnimationFrame(tick)
    }

    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return current
}

function formatMoney(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн ₸`
  return `${value.toLocaleString('ru-KZ')} ₸`
}

function KpiCard({ title, value, suffix = '', formatter, caption, Icon, delay = 0 }) {
  const animated = useCountUp(value)
  const display = formatter ? formatter(animated) : `${animated.toLocaleString('ru-KZ')}${suffix}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className="rounded-[20px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#0F172A]">{display}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#FFF1F2] text-[#E30613]">
          <Icon className="size-5" strokeWidth={1.7} aria-hidden />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm leading-6 text-[#64748B]">{caption}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
          +12%
        </span>
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-9 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-8 h-72 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-12"
    >
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[#E30613]/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-[#FFF1F2] text-[#E30613] shadow-inner">
          <DatabaseZap className="size-8" strokeWidth={1.6} aria-hidden />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-[#0F172A]">
          Подключите API для получения данных
        </h2>
        <p className="mt-4 max-w-xl text-base leading-[1.6] text-[#64748B]">
          После подключения появится аналитика по продажам, прибыли и динамике.
        </p>
        <button
          type="button"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#E30613] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(227,6,19,0.24)] transition hover:-translate-y-1 hover:bg-[#C80511]"
        >
          Подключить API
        </button>
      </div>
    </motion.div>
  )
}

export default function InvestorHero() {
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchInvestorMetrics(period).then((next) => {
      if (!cancelled) {
        setData(next)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period])

  const hasData = Boolean(data && (data.revenue > 0 || data.grossProfit > 0 || data.marginPct > 0 || data.footfall > 0))

  const chartData = useMemo(() => {
    const base = data?.revenue || 0
    return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((name, i) => ({
      name,
      value: Math.round(base * (0.08 + i * 0.018)),
    }))
  }, [data])

  const categoryData = useMemo(() => {
    const base = data?.revenue || 0
    return [
      { name: 'FMCG', value: Math.round(base * 0.42) },
      { name: 'Бытовая химия', value: Math.round(base * 0.24) },
      { name: 'Напитки', value: Math.round(base * 0.2) },
      { name: 'Прочее', value: Math.round(base * 0.14) },
    ]
  }, [data])

  if (loading) return <DashboardSkeleton />

  if (!hasData) return <EmptyState />

  const kpis = [
    { title: 'Оборот', value: data.revenue, formatter: formatMoney, caption: 'Суммарно по сети', Icon: CircleDollarSign },
    { title: 'Прибыль', value: data.grossProfit, formatter: formatMoney, caption: 'После закупок', Icon: TrendingUp },
    { title: 'Маржа %', value: data.marginPct, suffix: '%', caption: 'Средняя маржинальность', Icon: Percent },
    { title: 'Кол-во магазинов', value: 4, caption: 'Активные точки', Icon: Store },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <KpiCard key={item.title} {...item} delay={index * 0.06} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">Динамика продаж</p>
              <p className="mt-1 text-sm text-[#64748B]">Продажи по выбранному периоду</p>
            </div>
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              {periods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    period === item.id ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Area type="monotone" dataKey="value" stroke="#E30613" strokeWidth={3} fill="#E30613" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          whileHover={{ y: -4 }}
          className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >
          <p className="text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">Распределение по категориям</p>
          <p className="mt-1 text-sm text-[#64748B]">Доля оборота по товарным группам</p>
          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={64} outerRadius={98} paddingAngle={3}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-3">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: palette[index] }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[#0F172A]">{Math.round((item.value / data.revenue) * 100)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22 }}
        className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">Сводка по сети</p>
            <p className="mt-1 text-sm text-[#64748B]">Топ магазинов, оборот по точкам и динамика</p>
          </div>
          <RefreshCw className="size-5 text-[#64748B]" strokeWidth={1.6} aria-hidden />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {['Redprice Almaty City', 'Redprice Aport', 'Redprice Dostyk'].map((store, index) => (
            <div key={store} className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#E30613] shadow-sm">
                  {index === 0 ? <Landmark className="size-5" /> : index === 1 ? <Building2 className="size-5" /> : <Activity className="size-5" />}
                </span>
                <div>
                  <p className="font-semibold text-[#0F172A]">{store}</p>
                  <p className="text-sm text-[#64748B]">{formatMoney(Math.round(data.revenue * (0.42 - index * 0.1)))}</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#E30613]" style={{ width: `${82 - index * 14}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-700">Рост +{12 - index * 3}%</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

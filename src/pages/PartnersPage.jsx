import Header from '@/components/Header'
import { useEffect, useState } from 'react'
import { useSeo } from '@/hooks/useSeo'
import PartnersHero from '@/components/partners/PartnersHero'
import PartnerJoinModal from '@/components/partners/PartnerJoinModal'
import PartnerConditionsModal from '@/components/partners/PartnerConditionsModal'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  BrainCircuit,
  Building2,
  ChartColumnIncreasing,
  CircleDollarSign,
  Database,
  Gauge,
  LayoutDashboard,
  MonitorPlay,
  PackageCheck,
  RefreshCw,
  ScanBarcode,
  Send,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const statIcons = [Building2, ChartColumnIncreasing, BarChart3]

const statsItems = [
  { value: '1 → 50', label: 'Масштаб сети магазинов' },
  { value: '24/7', label: 'Продажи, касса и аналитика онлайн' },
  { value: 'ABC', label: 'Аналитика по категориям и SKU' },
]

const salesData = [
  { day: 'Пн', sales: 64, forecast: 58 },
  { day: 'Вт', sales: 78, forecast: 74 },
  { day: 'Ср', sales: 72, forecast: 82 },
  { day: 'Чт', sales: 96, forecast: 92 },
  { day: 'Пт', sales: 118, forecast: 112 },
  { day: 'Сб', sales: 146, forecast: 138 },
  { day: 'Вс', sales: 132, forecast: 148 },
]

const abcData = [
  { segment: 'A', value: 68 },
  { segment: 'B', value: 24 },
  { segment: 'C', value: 8 },
]

const demandSignals = [
  { label: 'Усилить LED-промо для категории A', value: 86 },
  { label: 'Проверить слабые SKU в категории C', value: 72 },
  { label: 'Подготовить ротацию товара', value: 64 },
  { label: 'Обновить выкладку на стеллаже', value: 58 },
]

const engineStatus = ['ESL', 'LED', 'Analytics']

const partnerBenefits = [
  {
    title: 'Брендированный стеллаж',
    description: 'Выделенная зона бренда с аккуратной навигацией и фокусом на ваши SKU.',
    badge: 'Retail zone',
    icon: Store,
  },
  {
    title: 'LED-продвижение товара',
    description: 'Товар выводится на LED-экран и получает дополнительное внимание покупателей.',
    badge: 'In-store media',
    icon: MonitorPlay,
  },
  {
    title: 'AI-прогноз спроса',
    description: 'ИИ анализирует продажи и помогает Redprice заранее понимать потенциал товара.',
    badge: 'Demand AI',
    icon: BrainCircuit,
  },
  {
    title: 'ABC-анализ по SKU',
    description: 'Понятно, какие товары ускоряют оборот, какие требуют внимания, а какие лучше заменить.',
    badge: 'SKU analytics',
    icon: BarChart3,
  },
  {
    title: 'Кабинет партнёра',
    description: 'Продажи, остатки, касса и видеонаблюдение по своим товарам в режиме реального времени.',
    badge: 'Partner cabinet',
    icon: LayoutDashboard,
  },
  {
    title: 'Ротация товара',
    description: 'Слабые позиции можно заменить, чтобы полка работала эффективнее.',
    badge: 'Assortment loop',
    icon: RefreshCw,
  },
]

const aiFlowSteps = [
  { title: '1C / товарные данные', description: 'SKU, цены, остатки и матрица партнёра попадают в систему.', icon: Database },
  { title: 'AI-анализ продаж', description: 'ИИ анализирует продажи, кассу, остатки и эффективность SKU.', icon: Bot },
  { title: 'ESL-ценники', description: 'Redprice обновляет цену на полке быстро и синхронно.', icon: ScanBarcode },
  { title: 'LED-промо', description: 'Товар выводится на LED-экран и получает дополнительное внимание.', icon: MonitorPlay },
  { title: 'Продажи и касса', description: 'Покупки фиксируются в кассе и попадают в аналитику.', icon: Store },
  { title: 'Отчёт партнёру', description: 'Партнёр видит прозрачную картину по своим товарам.', icon: Send },
]

const partnerVisibility = [
  {
    title: 'Продажи по своим SKU',
    description: 'Динамика продаж по товарам партнёра без ручных запросов.',
    icon: TrendingUp,
  },
  {
    title: 'Остатки и движение товара',
    description: 'Понятная картина по остаткам, поступлениям и движению на полке.',
    icon: Boxes,
  },
  {
    title: 'Кассовые операции по своим товарам',
    description: 'Движение по кассе помогает сверять продажи и доверять данным.',
    icon: CircleDollarSign,
  },
  {
    title: 'Видео по зоне стеллажа',
    description: 'Наблюдение за своей зоной и выкладкой в реальном времени.',
    icon: MonitorPlay,
  },
]

const redpriceOperations = [
  {
    title: 'ИИ находит слабые SKU',
    description: 'Система выделяет товары, которые проседают по продажам или оборачиваемости.',
    icon: Gauge,
  },
  {
    title: 'ИИ предлагает ротацию',
    description: 'Redprice видит, какие позиции стоит заменить, переставить или согласовать.',
    icon: RefreshCw,
  },
  {
    title: 'ИИ рекомендует LED-промо',
    description: 'Алгоритм подсказывает, какие товары вывести на экран для ускорения продаж.',
    icon: MonitorPlay,
  },
  {
    title: 'ИИ подсказывает изменение цены',
    description: 'Команда видит рекомендации по цене с учётом спроса, остатков и маржи.',
    icon: CircleDollarSign,
  },
  {
    title: 'Управляющий Redprice применяет решение',
    description: 'Redprice меняет выкладку, запускает промо, обновляет ESL или согласует ротацию.',
    icon: Sparkles,
  },
]

function PageSection({ children, className = '' }) {
  return (
    <section className={`relative w-full py-20 lg:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, description, align = 'center' }) {
  const isCenter = align === 'center'

  return (
    <div className={isCenter ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff2b2b]">
          <Sparkles className="size-4" />
          {eyebrow}
        </div>
      )}
      <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#0f172a] lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
      )}
    </div>
  )
}

function AiDashboardSection() {
  return (
    <PageSection>
      <div className="rounded-[40px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80 overflow-visible lg:p-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff2b2b]">
              <BrainCircuit className="size-4" />
              AI Retail Engine
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#0f172a] lg:text-6xl">
              AI Retail Engine
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Единый центр управления продажами: данные, касса, ESL, LED-промо и AI-рекомендации
            для команды Redprice.
          </p>
        </div>

        <div className="min-h-[560px] rounded-[32px] bg-[#f8fafc] p-5 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-[36px] border border-slate-200/70 bg-white p-7 shadow-xl shadow-slate-200/70 overflow-visible">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#ff2b2b]">
                  AI Retail Engine
                </p>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0f172a]">
                  AI Retail Engine
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  Единый центр управления продажами: данные, касса, ESL, LED-промо и
                  AI-рекомендации для команды Redprice.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 overflow-visible">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Прогноз роста</p>
                  <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-[#0f172a]">+18%</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">ожидаемый рост спроса на A-SKU</p>
                </div>
                <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 overflow-visible">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">SKU</p>
                  <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-[#ff2b2b]">42 SKU</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">готовы к LED-продвижению</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 overflow-visible">
                <p className="text-sm font-bold text-[#0f172a]">Статусы</p>
                <div className="mt-5 space-y-3">
                  {engineStatus.map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-700">{item}</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff2b2b] shadow-[0_0_0_5px_rgba(255,43,43,0.10)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8 lg:col-span-8">
              <div className="rounded-[36px] border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 overflow-hidden lg:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-black tracking-[-0.03em] text-[#0f172a]">Динамика продаж</p>
                    <p className="mt-1 text-sm text-slate-500">Продажи партнёра · Прогноз AI</p>
                  </div>
                  <BarChart3 className="size-6 text-[#ff2b2b]" />
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradientLarge" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#ff2b2b" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#ff2b2b" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                      <Tooltip cursor={{ stroke: '#ff2b2b', strokeOpacity: 0.18 }} />
                      <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" fill="transparent" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="sales" stroke="#ff2b2b" fill="url(#salesGradientLarge)" strokeWidth={3.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-[36px] border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/70 overflow-hidden">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xl font-black tracking-[-0.03em] text-[#0f172a]">ABC-анализ</p>
                    <PackageCheck className="size-6 text-[#ff2b2b]" />
                  </div>
                  <div className="mb-4 space-y-2 text-sm font-semibold text-slate-600">
                    <p>A — сильные товары</p>
                    <p>B — стабильные товары</p>
                    <p>C — товары на ротацию</p>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={abcData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                        <Tooltip cursor={{ fill: 'rgba(255,43,43,0.06)' }} />
                        <Bar dataKey="value" fill="#ff2b2b" radius={[14, 14, 6, 6]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[32px] bg-[#0f172a] p-6 text-white shadow-xl shadow-slate-900/20 overflow-hidden">
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-xl font-black tracking-[-0.03em]">AI-рекомендации</p>
                    <Sparkles className="size-6 text-red-200" />
                  </div>
                  <div className="space-y-5">
                    {demandSignals.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-start justify-between gap-3 text-sm text-slate-300">
                          <span className="min-w-0 text-pretty">{item.label}</span>
                          <span className="shrink-0">{item.value}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#ff2b2b]"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-7 rounded-3xl bg-white/10 p-5 text-sm leading-7 text-slate-200">
                    AI-рекомендации помогают Redprice выбрать промо, цену и ротацию, а партнёр
                    видит результат в прозрачном кабинете.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  )
}

function StatsSection() {
  return (
    <PageSection className="py-16 lg:py-20">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {statsItems.map((stat, index) => {
          const Icon = statIcons[index]
          return (
            <article
              key={stat.label}
              className="min-h-[200px] rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70 overflow-visible"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#ff2b2b]">
                <Icon className="size-6" strokeWidth={1.8} aria-hidden />
              </div>
              <p className="mt-10 text-5xl font-black leading-none tracking-[-0.06em] text-[#0f172a]">
                {stat.value}
              </p>
              <p className="mt-4 text-base font-medium leading-7 text-slate-500">{stat.label}</p>
            </article>
          )
        })}
      </div>
    </PageSection>
  )
}

function BenefitsSection() {
  return (
    <PageSection>
      <SectionHeader
        eyebrow="Partner value"
        title="Что получает партнёр"
        description="Не просто место на полке, а система продаж, промо, аналитики и прозрачности."
      />

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {partnerBenefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <article
              key={benefit.title}
              className="flex min-h-[260px] flex-col rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#ff2b2b]">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[#0f172a]">{benefit.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{benefit.description}</p>
              <div className="mt-auto pt-8">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {benefit.badge}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </PageSection>
  )
}

function FlowSection() {
  return (
    <PageSection>
      <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 overflow-visible lg:p-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            align="left"
            eyebrow="Redprice AI flow"
            title="Как работает Redprice AI"
            description="Данные проходят путь от товарной системы до AI-анализа, полки, промо, кассы и отчёта партнёру."
          />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {aiFlowSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="min-h-[180px] rounded-[28px] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff2b2b] shadow-sm">
                    <Icon className="size-6" />
                  </div>
                  <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-black tracking-[-0.03em] text-[#0f172a]">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
                {index < aiFlowSteps.length - 1 && (
                  <div className="mt-5 hidden justify-end lg:flex">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </PageSection>
  )
}

function TrustAndOperationsSection({ onJoinOpen }) {
  const renderCards = (items) =>
    items.map((item) => {
      const Icon = item.icon
      return (
        <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff2b2b] text-white">
              <Icon className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </div>
        </article>
      )
    })

  return (
    <PageSection>
      <div className="min-h-[620px] rounded-[40px] bg-[#0f172a] p-8 text-white shadow-2xl shadow-slate-900/30 overflow-visible lg:p-14">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-100">
            <Sparkles className="size-4" />
            Trust & operations
          </div>
          <h2 className="mt-6 text-4xl font-black tracking-[-0.05em] lg:text-6xl">
            AI помогает Redprice управлять продажами партнёра
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Партнёр получает прозрачность и доверие, а команда Redprice управляет продажами
            на основе данных и рекомендаций ИИ.
          </p>
          <Button type="button" onClick={onJoinOpen} className="btn-primary mt-10 w-full max-w-xs md:w-auto">
            Получить прозрачный кабинет
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-black tracking-[-0.03em] text-white">
              Партнёр видит всё в реальном времени
            </h3>
            <p className="mt-3 leading-7 text-slate-300">
              Это про доверие, прозрачность и контроль по своей зоне, без операционного управления магазином.
            </p>
            <div className="mt-6 grid gap-4">{renderCards(partnerVisibility)}</div>
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-[-0.03em] text-white">
              Redprice управляет на основе ИИ
            </h3>
            <p className="mt-3 leading-7 text-slate-300">
              ИИ работает внутри Redprice, а команда применяет рекомендации: меняет выкладку, запускает промо и обновляет ESL.
            </p>
            <div className="mt-6 grid gap-4">{renderCards(redpriceOperations)}</div>
          </div>
        </div>
      </div>
    </PageSection>
  )
}

function FinalCtaSection({ onJoinOpen, onConditionsOpen }) {
  return (
    <PageSection className="py-24">
      <div className="rounded-[40px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/80 lg:p-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-black tracking-[-0.05em] text-[#0f172a] lg:text-6xl">
            Готовы занять своё место в сети Redprice?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Подключитесь к партнёрской программе и получите прозрачные продажи, аналитику и
            продвижение в AI-магазине нового формата.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <Button
              type="button"
              onClick={onJoinOpen}
              className="btn-primary w-full max-w-sm md:w-auto"
            >
              Подключиться
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onConditionsOpen}
              className="btn-secondary w-full max-w-sm md:w-auto"
            >
              Скачать условия
            </Button>
          </div>
        </div>
      </div>
    </PageSection>
  )
}

export default function PartnersPage() {
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isConditionsOpen, setIsConditionsOpen] = useState(false)
  const [selectedConditionsPlan, setSelectedConditionsPlan] = useState(null)

  const openJoinModal = () => setIsJoinOpen(true)
  const openConditionsModal = () => {
    setSelectedConditionsPlan(null)
    setIsConditionsOpen(true)
  }

  useEffect(() => {
    document.documentElement.scrollLeft = 0
    document.body.scrollLeft = 0
    window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' })
  }, [])

  useSeo({
    title: 'Партнёры Redprice — сеть магазинов',
    description:
      'Страница для партнёров Redprice: AI Retail Network, прозрачная аналитика, LED-промо, ESL-ценники и рост вместе с сетью.',
  })

  return (
    <div className="flex min-h-screen w-full flex-col overflow-visible bg-[#f8fafc] font-sans text-[#0f172a] antialiased">
      <Header showCart={false} />

      <main className="min-h-screen w-full overflow-x-hidden bg-[#f8fafc] pb-16">
        <section className="relative w-full pt-24 pb-20 lg:pt-28 lg:pb-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <PartnersHero onJoinOpen={openJoinModal} onConditionsOpen={openConditionsModal} />
          </div>
        </section>

        <AiDashboardSection />
        <StatsSection />
        <BenefitsSection />
        <FlowSection />
        <TrustAndOperationsSection onJoinOpen={openJoinModal} />
        <FinalCtaSection onJoinOpen={openJoinModal} onConditionsOpen={openConditionsModal} />
      </main>

      <PartnerJoinModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <PartnerConditionsModal
        open={isConditionsOpen}
        selectedPlan={selectedConditionsPlan}
        onClose={() => {
          setIsConditionsOpen(false)
          setSelectedConditionsPlan(null)
        }}
      />
    </div>
  )
}

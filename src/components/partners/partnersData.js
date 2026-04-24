import {
  BarChart3,
  Megaphone,
  RefreshCw,
  Rocket,
  Store,
  Handshake,
  ClipboardCheck,
  TrendingUp,
  MonitorPlay,
} from 'lucide-react'

export const heroStats = [
  { value: '1 -> 50', label: 'масштаб сети магазинов' },
  { value: '24/7', label: 'одновременные продажи и промо' },
  { value: 'ABC', label: 'аналитика по категориям и SKU' },
]

export const heroMock = {
  brandName: 'Aurora Foods',
  productName: 'Aurora Granola 450г',
  oldPrice: '2 390 тг',
  newPrice: '1 690 тг',
  promoLabel: 'Скидка недели',
}

export const benefits = [
  {
    title: 'Выделенный брендированный стеллаж',
    description: 'Собственная зона бренда с фирменной шапкой, навигацией и фокусом на ваши SKU.',
    icon: Store,
  },
  {
    title: 'Продвижение на LED-экранах',
    description: 'Акции, запуск новинок и спецпредложения показываются прямо у зоны продаж.',
    icon: MonitorPlay,
  },
  {
    title: 'Аналитика продаж и ABC-анализ',
    description: 'Прозрачные данные по оборачиваемости, категориям и эффективности ассортимента.',
    icon: BarChart3,
  },
  {
    title: 'Рост вместе с сетью 1 -> 50',
    description: 'Модель масштабирования, где успешные SKU быстро тиражируются в новые магазины.',
    icon: Rocket,
  },
  {
    title: 'Ротация и управление ассортиментом',
    description: 'Плановая ротация и перераспределение товаров для контроля стока и маржи.',
    icon: RefreshCw,
  },
  {
    title: 'Маркетинговая поддержка',
    description: 'Единый промо-календарь, совместные кампании и узнаваемость в сети Redprice.',
    icon: Megaphone,
  },
]

export const plans = [
  {
    name: 'EARLY PARTNER',
    description: 'Для брендов, которые заходят в сеть на раннем этапе и закрепляют категорию.',
    benefits: [
      'Приоритетное размещение на старте',
      'Фиксация полочного пространства',
      'Базовое LED-продвижение',
      'Регулярная отчётность по продажам',
    ],
    conditionLink: '/mock/conditions/early-partner.pdf',
  },
  {
    name: 'STRATEGIC PARTNER',
    featured: true,
    description: 'Для ключевых поставщиков с целью быстрого масштабирования и роста доли.',
    benefits: [
      'Расширенная зона и брендирование',
      'Приоритет в новых точках сети',
      'Расширенный маркетинговый пакет',
      'Углублённая аналитика и рекомендации',
    ],
    conditionLink: '/mock/conditions/strategic-partner.pdf',
  },
  {
    name: 'INVESTOR PARTNER',
    description: 'Для компаний, которые рассматривают партнёрство как товарную инвестицию.',
    benefits: [
      'Гибкая модель поставок',
      'Форматы с отсрочкой и планом роста',
      'Прозрачные KPI и контроль результата',
      'Совместное планирование категории',
    ],
    conditionLink: '/mock/conditions/investor-partner.pdf',
  },
]

export const flowSteps = [
  {
    title: 'Поставщик подаёт заявку',
    description: 'Заполняете короткую форму с данными бренда и товарной матрицей.',
    icon: Handshake,
  },
  {
    title: 'Согласовываем формат партнёрства',
    description: 'Определяем план: EARLY, STRATEGIC или INVESTOR и фиксируем условия.',
    icon: ClipboardCheck,
  },
  {
    title: 'Размещаем товар и оформляем зону',
    description: 'Готовим брендированный стеллаж, электронные ценники и выкладку.',
    icon: Store,
  },
  {
    title: 'Запускаем продажи и продвижение',
    description: 'Стартуют продажи, LED-промо и отчётность с аналитикой в динамике.',
    icon: TrendingUp,
  },
]

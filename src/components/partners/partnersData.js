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
    name: 'EARLY',
    description: 'Гибкие условия для поставщиков. Подходит для теста товара и начала сотрудничества с Redprice.',
    benefits: [
      'Гибкий старт сотрудничества',
      'Тест товара в сети Redprice',
      'Базовое LED-продвижение',
      'Регулярная отчётность по продажам',
    ],
    conditionLink: '/mock/conditions/early.pdf',
  },
  {
    name: 'STRATEGIC PARTNER',
    featured: true,
    description: 'Для поставщиков, которые готовы поддержать сеть товаром и условиями, а Redprice усиливает продажи, бренд и аналитику.',
    benefits: [
      'Расширенная зона и брендирование',
      'Приоритет в новых точках сети',
      'Расширенный маркетинговый пакет',
      'Углублённая аналитика и рекомендации',
    ],
    conditionLink: '/mock/conditions/strategic.pdf',
  },
]

export const flowSteps = [
  {
    title: 'Поставщик подаёт заявку',
    description: 'Заполняете короткую форму с данными бренда и товарной матрицей.',
    icon: Handshake,
  },
  {
    title: 'Согласовываем формат сотрудничества',
    description: 'Определяем план: EARLY или STRATEGIC PARTNER и фиксируем условия.',
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

import {
  LayoutDashboard,
  Video,
  BarChart3,
  Store,
  LayoutGrid,
  FileBarChart,
  UserCog,
} from 'lucide-react'

export const INVESTOR_SECTIONS = [
  { id: 'overview', label: 'Обзор', Icon: LayoutDashboard },
  { id: 'account', label: 'Настройки аккаунта', Icon: UserCog },
  { id: 'finance', label: 'Финансы', Icon: BarChart3 },
  { id: 'traffic', label: 'Точки', Icon: Store },
  { id: 'video', label: 'Видео', Icon: Video },
  { id: 'reports', label: 'Отчёты', Icon: FileBarChart },
  { id: 'planogram', label: 'Планограмма', Icon: LayoutGrid },
]

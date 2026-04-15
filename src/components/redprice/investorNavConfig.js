import {
  LayoutDashboard,
  Video,
  BarChart3,
  Footprints,
  LayoutGrid,
  FileBarChart,
} from 'lucide-react'

export const INVESTOR_SECTIONS = [
  { id: 'overview', label: 'Обзор', Icon: LayoutDashboard },
  { id: 'video', label: 'Видео', Icon: Video },
  { id: 'finance', label: 'Финансы', Icon: BarChart3 },
  { id: 'traffic', label: 'Трафик', Icon: Footprints },
  { id: 'planogram', label: 'Планограмма', Icon: LayoutGrid },
  { id: 'reports', label: 'Отчёты', Icon: FileBarChart },
]

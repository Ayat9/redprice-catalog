import {
  LayoutDashboard,
  LineChart,
  Camera,
  Megaphone,
  FileSignature,
} from 'lucide-react'

export const SUPPLIER_SECTIONS = [
  { id: 'overview', label: 'Обзор', Icon: LayoutDashboard },
  { id: 'sales', label: 'Продажи', Icon: LineChart, perm: 'canViewSales' },
  { id: 'video', label: 'Live Monitoring', Icon: Camera, perm: 'canViewVideo' },
  { id: 'marketing', label: 'Маркетинг', Icon: Megaphone, perm: 'canViewFootfall' },
  { id: 'legal', label: 'Документы', Icon: FileSignature, perm: 'canSignDocuments' },
]

/**
 * Резервное копирование данных сайта (товары, категории, поставщики, заказы, настройки).
 * При обновлении сайта (тест → бой) сохраните копию перед заливкой и восстановите после при необходимости.
 */

export const BACKUP_STORAGE_KEYS = {
  products: 'redprice_products',
  categories: 'redprice_categories',
  suppliers: 'redprice_suppliers',
  orders: 'redprice_orders',
  settings: 'redprice_section_settings',
  stats: 'redprice_stats'
}

const BACKUP_VERSION = 1

/**
 * Собрать объект резервной копии из localStorage.
 */
export function exportBackupData() {
  const data = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    products: null,
    categories: null,
    suppliers: null,
    orders: null,
    settings: null,
    stats: null
  }
  try {
    data.products = localStorage.getItem(BACKUP_STORAGE_KEYS.products)
    data.categories = localStorage.getItem(BACKUP_STORAGE_KEYS.categories)
    data.suppliers = localStorage.getItem(BACKUP_STORAGE_KEYS.suppliers)
    data.orders = localStorage.getItem(BACKUP_STORAGE_KEYS.orders)
    data.settings = localStorage.getItem(BACKUP_STORAGE_KEYS.settings)
    data.stats = localStorage.getItem(BACKUP_STORAGE_KEYS.stats)
  } catch (e) {
    console.error('exportBackupData', e)
  }
  return data
}

/**
 * Скачать резервную копию как JSON-файл.
 */
export function downloadBackup() {
  const data = exportBackupData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `redprice-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Восстановить данные из объекта резервной копии (записать в localStorage).
 * Возвращает true при успехе. После вызова нужно перезагрузить страницу (location.reload).
 */
export function restoreBackupFromData(data) {
  if (!data || typeof data !== 'object') return false
  try {
    if (data.products != null) localStorage.setItem(BACKUP_STORAGE_KEYS.products, typeof data.products === 'string' ? data.products : JSON.stringify(data.products))
    if (data.categories != null) localStorage.setItem(BACKUP_STORAGE_KEYS.categories, typeof data.categories === 'string' ? data.categories : JSON.stringify(data.categories))
    if (data.suppliers != null) localStorage.setItem(BACKUP_STORAGE_KEYS.suppliers, typeof data.suppliers === 'string' ? data.suppliers : JSON.stringify(data.suppliers))
    if (data.orders != null) localStorage.setItem(BACKUP_STORAGE_KEYS.orders, typeof data.orders === 'string' ? data.orders : JSON.stringify(data.orders))
    if (data.settings != null) localStorage.setItem(BACKUP_STORAGE_KEYS.settings, typeof data.settings === 'string' ? data.settings : JSON.stringify(data.settings))
    if (data.stats != null) localStorage.setItem(BACKUP_STORAGE_KEYS.stats, typeof data.stats === 'string' ? data.stats : JSON.stringify(data.stats))
    return true
  } catch (e) {
    console.error('restoreBackupFromData', e)
    return false
  }
}

/**
 * Импорт товаров из CSV (шаблон для Excel).
 * Отдел закупок: скачать шаблон, заполнить в Excel, загрузить файл.
 */

import { ensureBarcode } from './barcode'

const SEP = ';'
const UTF8_BOM = '\uFEFF'

/** Заголовки CSV (шаблон) */
const CSV_HEADERS = [
  'name',
  'type',
  'article',
  'barcode',
  'categoryId',
  'supplierId',
  'variant_name',
  'variant_packQty',
  'variant_priceRetail',
  'variant_priceWholesale',
  'variant_priceSupplier'
]

/**
 * Экранировать поле для CSV (кавычки, переносы).
 */
function escapeCsvField(val) {
  const s = String(val ?? '')
  if (s.includes(SEP) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/**
 * Строка CSV из массива полей.
 */
function rowToCsv(row) {
  return row.map(escapeCsvField).join(SEP)
}

/**
 * Возвращает CSV-строку шаблона товаров (с заголовком и примерами).
 * Можно открыть в Excel, заполнить и сохранить как CSV (разделитель — точка с запятой).
 */
export function getProductTemplateCsv() {
  const header = rowToCsv(CSV_HEADERS)
  const example1 = rowToCsv([
    'Контейнер 60л',
    'Контейнер',
    'ART-001',
    '',
    'konteynery',
    's1',
    '60л',
    6,
    4500,
    4000,
    3800
  ])
  const example2 = rowToCsv([
    'Контейнер 60л',
    'Контейнер',
    'ART-001',
    '',
    'konteynery',
    's1',
    '40л',
    6,
    3800,
    3500,
    3200
  ])
  return UTF8_BOM + header + '\r\n' + example1 + '\r\n' + example2 + '\r\n'
}

/**
 * Скачать шаблон как файл (CSV для Excel).
 */
export function downloadProductTemplate() {
  const csv = getProductTemplateCsv()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shablon_tovarov.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Парсинг одной строки CSV (учитываем кавычки).
 */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (inQuotes) {
      cur += c
    } else if (c === SEP) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

/**
 * Распарсить CSV текст в массив объектов-строк (каждая строка — объект по заголовкам).
 */
function parseCsvToRows(text) {
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const raw = t.startsWith(UTF8_BOM) ? t.slice(UTF8_BOM.length) : t
  const lines = raw.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []
  const headerLine = parseCsvLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row = {}
    headerLine.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rows.push(row)
  }
  return rows
}

/**
 * Преобразовать строки CSV в массив товаров (строки с одинаковым name+article+categoryId+supplierId объединяются в один товар с вариантами).
 */
export function parseProductCsv(text, options = {}) {
  const { defaultSupplierId = '', defaultCategoryId = '' } = options
  const rows = parseCsvToRows(text)
  if (!rows.length) return { products: [], errors: [] }

  const errors = []
  const byKey = new Map()

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const name = (r.name ?? '').trim()
    if (!name) {
      errors.push(`Строка ${i + 2}: не указано название товара`)
      continue
    }
    const type = (r.type ?? '').trim()
    const article = (r.article ?? '').trim()
    const categoryId = (r.categoryId ?? '').trim() || defaultCategoryId
    const supplierId = (r.supplierId ?? '').trim() || defaultSupplierId
    const variantName = (r.variant_name ?? '').trim() || 'Вариант'
    const packQty = Math.max(1, parseInt(r.variant_packQty, 10) || 1)
    const priceRetail = Math.max(0, parseFloat(String(r.variant_priceRetail).replace(',', '.')) || 0)
    const priceWholesale = Math.max(0, parseFloat(String(r.variant_priceWholesale).replace(',', '.')) || 0)
    const priceSupplier = Math.max(0, parseFloat(String(r.variant_priceSupplier).replace(',', '.')) || 0)

    const key = `${name}|${article}|${categoryId}|${supplierId}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        name,
        type,
        article,
        barcode: (r.barcode ?? '').trim(),
        categoryId,
        supplierId,
        variants: []
      })
    }
    const prod = byKey.get(key)
    prod.variants.push({
      id: `v${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
      name: variantName,
      packQty,
      price: priceRetail,
      priceRetail,
      priceWholesale,
      priceSupplier
    })
  }

  const products = Array.from(byKey.values()).map((p) => {
    const id = `p${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const barcode = p.barcode ? p.barcode : undefined
    return {
      id,
      name: p.name,
      type: p.type,
      article: p.article || '',
      barcode: barcode || '',
      imageUrl: '',
      categoryId: p.categoryId,
      supplierId: p.supplierId,
      variants: p.variants
    }
  })

  return { products, errors }
}

/**
 * После создания товаров проставить штрихкоды тем, у кого пусто.
 */
export function ensureProductBarcodes(products) {
  return products.map((p) => ({
    ...p,
    barcode: ensureBarcode(p.barcode, p.id)
  }))
}

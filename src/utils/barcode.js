/**
 * Генерация EAN-13 штрихкода.
 * Первые 12 цифр — произвольные (префикс 200 для внутреннего использования),
 * 13-я — контрольная сумма.
 */
function ean13CheckDigit(digits12) {
  const s = String(digits12).padStart(12, '0').slice(0, 12)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = parseInt(s[i], 10) || 0
    sum += (i % 2 === 0) ? d : d * 3
  }
  const check = (10 - (sum % 10)) % 10
  return s + String(check)
}

/**
 * Генерирует уникальный EAN-13 на основе seed (id товара или timestamp).
 */
export function generateEAN13(seed = '') {
  const t = Date.now().toString(10).slice(-8)
  const h = Math.abs((seed || t).split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0))
  const base = (200000000000 + (h % 800000000000)).toString(10).slice(0, 12)
  return ean13CheckDigit(base)
}

/**
 * Если штрихкод пустой — возвращает сгенерированный, иначе исходный.
 */
export function ensureBarcode(currentBarcode, productId) {
  const s = (currentBarcode || '').trim()
  if (s.length >= 8) return s
  return generateEAN13(productId || Date.now())
}

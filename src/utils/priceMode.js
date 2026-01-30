/**
 * Режимы цен: розница (платформа), опт (оптовые закупки), поставщик (отдел закупок).
 * Вариант товара может иметь: price (общий), priceRetail, priceWholesale, priceSupplier.
 */
export const PRICE_MODES = {
  retail: 'retail',       // Интернет магазин — розница
  wholesale: 'wholesale',  // Оптовые закупки — опт (коробки)
  supplier: 'supplier',    // Отдел закупок — цены поставщиков
}

export function getVariantPrice(variant, mode) {
  if (!variant) return 0
  switch (mode) {
    case PRICE_MODES.retail:
      return Number(variant.priceRetail ?? variant.price) || 0
    case PRICE_MODES.wholesale:
      return Number(variant.priceWholesale ?? variant.price) || 0
    case PRICE_MODES.supplier:
      return Number(variant.priceSupplier ?? variant.price) || 0
    default:
      return Number(variant.price) || 0
  }
}

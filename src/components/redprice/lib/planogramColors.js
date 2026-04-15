/**
 * Цвет стеллажа по значению доходности 0…100 (heatmap).
 * 0 — низкая (красноватый), 100 — высокая (зелёный).
 */
export function profitabilityToFill(value) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const h = (120 * v) / 100
  const s = 42 + (v / 100) * 18
  const l = 52 - (v / 100) * 8
  return `hsl(${h}, ${s}%, ${l}%)`
}

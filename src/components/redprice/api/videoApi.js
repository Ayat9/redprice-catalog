/**
 * Видеонаблюдение — заглушка под API (список камер / архив по дню).
 * Замените на fetch к регистратору или VMS.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/** Генерация демо-списка из 20 камер (структура как с бэкенда). */
export function buildMockCameras() {
  const zones = ['Вход', 'Касса', 'Зал', 'Склад', 'Парковка']
  return Array.from({ length: 20 }, (_, i) => {
    const zone = zones[i % zones.length]
    const point = `Точка ${String((i % 5) + 1).padStart(2, '0')}`
    return {
      id: `cam-${String(i + 1).padStart(2, '0')}`,
      name: `${point} · ${zone}`,
      zone,
      point,
      channel: `CH-${String(i + 1).padStart(2, '0')}`,
      /** Для будущего фильтра архива по дню (mock: все дни доступны). */
      hasArchiveForDay: () => true,
    }
  })
}

let cached = null

/**
 * @param {string} dateIso — YYYY-MM-DD (локальная дата просмотра архива / live контекст)
 */
export async function fetchCamerasForDay(dateIso) {
  await delay(80)
  if (!cached) cached = buildMockCameras()
  // Пример: в будущем фильтровать по dateIso
  return cached.map((c) => ({ ...c, dateRequested: dateIso }))
}

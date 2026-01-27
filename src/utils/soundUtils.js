// Утилита для воспроизведения звуков

export function playAddToCartSound() {
  try {
    // Создаем звук с помощью Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Создаем осциллятор для генерации звука
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    // Подключаем узлы
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Настройки звука (приятный короткий звук)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // Начальная частота
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1) // Конечная частота
    
    // Настройки громкости (envelope)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01) // Быстрое нарастание
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15) // Плавное затухание
    
    // Тип волны
    oscillator.type = 'sine'
    
    // Воспроизводим звук
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15) // Короткий звук (150ms)
  } catch (error) {
    console.warn('Не удалось воспроизвести звук:', error)
  }
}

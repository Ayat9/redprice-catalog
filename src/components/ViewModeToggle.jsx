import { useState, useEffect } from 'react'
import './ViewModeToggle.css'

const VIEW_MODES = {
  LIST: 'list',
  LARGE_GRID: 'large-grid',
  MEDIUM_GRID: 'medium-grid',
  SMALL_GRID: 'small-grid'
}

function ViewModeToggle({ onViewChange, defaultView = VIEW_MODES.MEDIUM_GRID }) {
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('productViewMode')
    return saved || defaultView
  })
  const [showImages, setShowImages] = useState(() => {
    const saved = localStorage.getItem('productShowImages')
    return saved !== null ? saved === 'true' : true
  })

  useEffect(() => {
    localStorage.setItem('productViewMode', viewMode)
    localStorage.setItem('productShowImages', showImages.toString())
    onViewChange({ viewMode, showImages })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, showImages])

  return (
    <div className="view-mode-toggle">
      <div className="view-mode-buttons">
        <button
          className={`view-btn ${viewMode === VIEW_MODES.LIST ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODES.LIST)}
          title="Список"
        >
          <span className="view-icon">☰</span>
        </button>
        <button
          className={`view-btn ${viewMode === VIEW_MODES.LARGE_GRID ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODES.LARGE_GRID)}
          title="Крупная сетка"
        >
          <span className="view-icon">⊞</span>
        </button>
        <button
          className={`view-btn ${viewMode === VIEW_MODES.MEDIUM_GRID ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODES.MEDIUM_GRID)}
          title="Средняя сетка"
        >
          <span className="view-icon">⊞</span>
        </button>
        <button
          className={`view-btn ${viewMode === VIEW_MODES.SMALL_GRID ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODES.SMALL_GRID)}
          title="Мелкая сетка"
        >
          <span className="view-icon">⊞</span>
        </button>
      </div>
      <div className="view-options">
        <label className="toggle-option">
          <input
            type="checkbox"
            checked={showImages}
            onChange={(e) => setShowImages(e.target.checked)}
          />
          <span>Показывать фото</span>
        </label>
      </div>
    </div>
  )
}

export default ViewModeToggle
export { VIEW_MODES }

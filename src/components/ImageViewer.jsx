import { useState, useEffect } from 'react'
import './ImageViewer.css'

function ImageViewer({ images, currentIndex = 0, onClose }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex)

  useEffect(() => {
    setActiveIndex(currentIndex)
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  if (!images || images.length === 0) {
    return null
  }

  const currentImage = images[activeIndex]

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
        <button className="image-viewer-close" onClick={onClose}>
          ×
        </button>
        
        {images.length > 1 && (
          <>
            <button className="image-viewer-nav image-viewer-prev" onClick={handlePrevious}>
              ‹
            </button>
            <button className="image-viewer-nav image-viewer-next" onClick={handleNext}>
              ›
            </button>
            <div className="image-viewer-counter">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}

        <div className="image-viewer-content">
          <img 
            src={currentImage} 
            alt={`Изображение ${activeIndex + 1}`}
            className="image-viewer-image"
          />
        </div>

        {images.length > 1 && (
          <div className="image-viewer-thumbnails">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Миниатюра ${index + 1}`}
                className={`image-viewer-thumbnail ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageViewer

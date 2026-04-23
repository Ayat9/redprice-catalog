import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Подпись на canvas. Поддерживает мышь и touch, hi-DPI, очистку, валидацию «не пусто».
 *
 * Props:
 *   onChange(dataUrl | null)  — вызывается после каждого штриха и при очистке.
 *   width, height (CSS px)    — размер поля.
 *
 * Использование:
 *   <SignaturePad onChange={setDataUrl} />
 */
export function SignaturePad({ onChange, width = 520, height = 180, className = '' }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPoint = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const setup = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
  }, [width, height])

  useEffect(() => {
    setup()
  }, [setup])

  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const t = e.touches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    return { x: cx - rect.left, y: cy - rect.top }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawingRef.current = true
    lastPoint.current = getPos(e)
  }

  const draw = (e) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const p = getPos(e)
    if (!ctx || !p || !lastPoint.current) return
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    if (isEmpty) setIsEmpty(false)
  }

  const endDraw = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPoint.current = null
    const dataUrl = canvasRef.current?.toDataURL('image/png')
    onChange?.(dataUrl || null)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange?.(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-1 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="block w-full cursor-crosshair touch-none rounded-lg bg-white"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {isEmpty
            ? 'Нарисуйте подпись мышью или пальцем'
            : 'Подпись сохранена в буфере — можно отправлять'}
        </span>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Очистить
        </button>
      </div>
    </div>
  )
}

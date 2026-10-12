import { useEffect, useRef, useState } from 'react'

/**
 * Miniatura "en vivo": la propia web de ejemplo dentro de un iframe reducido, no interactivo y decorativo.
 * Solo se carga cuando la tarjeta está a punto de verse (así no pesa en la carga inicial de la página).
 */
export function LiveThumb({ src, width, height, bg }: { src: string; width: number; height: number; bg: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [near, setNear] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / width))
    ro.observe(el)
    setScale(el.clientWidth / width)
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setNear(true), io.disconnect()), { rootMargin: '300px' })
    io.observe(el)
    return () => (ro.disconnect(), io.disconnect())
  }, [width])

  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ aspectRatio: `${width} / ${height}`, background: bg }} aria-hidden="true">
      {near && scale > 0 && (
        <iframe
          src={src}
          title=""
          tabIndex={-1}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setLoaded(true)}
          className="pointer-events-none absolute top-0 left-0 border-0 transition-opacity duration-500"
          style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left', opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  )
}

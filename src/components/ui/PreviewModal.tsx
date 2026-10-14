import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import type { Project } from '../../data/site'

/**
 * Vista previa navegable de una web de ejemplo: se abre sobre la página (iframe a una web alojada en este mismo sitio),
 * con selector Escritorio / Móvil, enlace para abrirla en pestaña nueva y cierre con Esc, clic fuera o botón.
 */
export default function PreviewModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [loaded, setLoaded] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const url = project.preview ?? ''
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeRef.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key !== 'Tab' || !dialogRef.current) return
      const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], iframe')
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      document.documentElement.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [])

  // Esc también cuando el foco está dentro de la web de ejemplo (mismo origen).
  const onFrameLoad = () => {
    setLoaded(true)
    try {
      frameRef.current?.contentWindow?.addEventListener('keydown', (e) => e.key === 'Escape' && onCloseRef.current())
    } catch {
      /* otro origen: no se puede escuchar */
    }
  }

  const tab = (d: 'desktop' | 'mobile', label: string) => (
    <button type="button" role="tab" aria-selected={device === d} onClick={() => (setDevice(d), setLoaded(false))} className={`h-9 rounded-[8px] px-4 text-sm font-medium transition-colors ${device === d ? 'bg-ink text-paper' : 'text-mute hover:text-ink'}`}>
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-ink/70 p-0 backdrop-blur-sm sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Vista previa de ${project.business}`} className="flex w-full max-w-[1400px] flex-col overflow-hidden bg-paper shadow-[var(--shadow-soft)] sm:rounded-3xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/10 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="font-head truncate text-[1.5rem] leading-none">{project.business}</p>
            <p className="truncate text-sm text-mute">Vista previa · {project.sector}</p>
          </div>
          <div role="tablist" aria-label="Tamaño de pantalla" className="hidden gap-1 rounded-[10px] bg-ink/5 p-1 sm:flex">
            {tab('desktop', 'Escritorio')}
            {tab('mobile', 'Móvil')}
          </div>
          <a href={url} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium text-ink ring-1 ring-ink/15 transition-colors hover:bg-ink/5">
            Abrir en pestaña nueva <Icon name="arrowUpRight" size={14} />
          </a>
          <a href="#contacto" onClick={onClose} className="inline-flex h-9 items-center rounded-[8px] bg-cobalt px-4 text-sm font-medium text-ink transition-colors hover:bg-[#7cc6ff]">
            Quiero una web así
          </a>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar la vista previa" className="flex size-9 items-center justify-center rounded-[8px] ring-1 ring-ink/15 transition-colors hover:bg-ink/5">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 justify-center bg-ink/[0.04] sm:p-4">
          {!loaded && (
            <div role="status" className="absolute inset-0 flex items-center justify-center text-sm text-mute">
              <span className="mr-3 size-5 animate-spin rounded-full border-2 border-ink/15 border-t-ink" aria-hidden="true" /> Cargando la web…
            </div>
          )}
          <iframe
            ref={frameRef}
            key={device}
            src={url}
            title={`Web de ejemplo: ${project.business}`}
            onLoad={onFrameLoad}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            className={`h-full bg-white transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${device === 'mobile' ? 'w-[390px] max-w-full rounded-[28px] ring-8 ring-ink/80' : 'w-full sm:rounded-xl sm:ring-1 sm:ring-ink/15'}`}
          />
        </div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

type FrameProps = { children: ReactNode; className?: string; url?: string; dark?: boolean }

/** Marco de navegador minimalista. El contenido escala con container queries (cqw). */
export function BrowserFrame({ children, className = '', url = 'tunegocio.com', dark = false }: FrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] ${dark ? 'bg-[#1a1c24] ring-1 ring-white/10' : 'bg-[#fbfaf8] ring-1 ring-black/[0.07]'} ${className}`}
    >
      <div className={`flex h-[clamp(22px,4.2cqw,34px)] items-center gap-3 px-3 ${dark ? 'border-b border-white/5' : 'border-b border-black/[0.06]'}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`size-[7px] rounded-full ${dark ? 'bg-white/15' : 'bg-black/[0.12]'}`} />
          ))}
        </div>
        <div
          className={`mx-auto flex h-[60%] w-[46%] min-w-0 items-center justify-center gap-1.5 truncate rounded-md text-[clamp(8px,1.3cqw,11px)] ${dark ? 'bg-white/[0.06] text-white/45' : 'bg-black/[0.04] text-black/45'}`}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {url}
        </div>
        <div className="w-[27px]" />
      </div>
      <div className="relative [container-type:inline-size]">{children}</div>
    </div>
  )
}

/** Marco de smartphone con isla y bisel fino. */
export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] bg-[#111216] p-[7px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] ${className}`}>
      <div className="relative overflow-hidden rounded-[2rem] [container-type:inline-size]">
        <div className="absolute top-[7px] left-1/2 z-20 h-[5.5cqw] w-[30cqw] -translate-x-1/2 rounded-full bg-[#111216]" />
        {children}
      </div>
    </div>
  )
}

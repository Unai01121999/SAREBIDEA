import { cn } from '@/lib/utils'

/** Marca SAREBIDEA: el tejado azul de la "A". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex size-8 items-center justify-center rounded-lg bg-foreground', className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-3.5 w-auto">
        <path d="M0 100 37 0h26l37 100H74L50 33 26 100Z" fill="#0A93F5" />
      </svg>
    </span>
  )
}

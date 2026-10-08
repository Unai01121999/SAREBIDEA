import * as React from 'react'
import { toneClasses, type Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

/** Etiqueta de estado con color semántico y puntito. */
function Badge({ tone = 'neutral', dot = true, className, children, ...props }: React.ComponentProps<'span'> & { tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', toneClasses[tone], className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
export { Badge }

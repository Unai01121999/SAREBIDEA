import { hashColor } from '@/lib/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Avatar con iniciales y color estable según el nombre. */
function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, ...hashColor(name) }}
    >
      {initials(name)}
    </span>
  )
}
export { Avatar }

import { cn } from '@/lib/utils'

export interface Stat {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'danger' | 'warning' | 'success'
  onClick?: () => void
  active?: boolean
}

const tones = { default: '', danger: 'text-destructive', warning: 'text-warning', success: 'text-success' }

/** Tira de indicadores compactos (pueden actuar como filtros). */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => {
        const body = (
          <>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn('mt-1 text-xl font-semibold tracking-tight tabular', tones[s.tone ?? 'default'])}>{s.value}</p>
            {s.hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.hint}</p>}
          </>
        )
        const cls = cn('rounded-xl border bg-card px-4 py-3 text-left shadow-xs', s.onClick && 'transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm', s.active && 'border-brand/50 ring-2 ring-brand/15')
        return s.onClick ? (
          <button key={s.label} type="button" onClick={s.onClick} aria-pressed={s.active} className={cls}>
            {body}
          </button>
        ) : (
          <div key={s.label} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

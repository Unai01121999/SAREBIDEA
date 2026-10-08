'use client'

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface KpiProps {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  /** Variación porcentual respecto al periodo anterior. */
  delta?: number
  href?: string
  loading?: boolean
  spark?: number[]
  accent?: 'brand' | 'success' | 'warning' | 'info' | 'danger'
}

const accents = {
  brand: { chip: 'bg-brand/12 text-brand', stroke: 'var(--chart-1)' },
  success: { chip: 'bg-success/12 text-success', stroke: 'var(--chart-3)' },
  warning: { chip: 'bg-warning/14 text-warning', stroke: 'var(--chart-4)' },
  info: { chip: 'bg-info/12 text-info', stroke: 'var(--chart-2)' },
  danger: { chip: 'bg-destructive/12 text-destructive', stroke: 'var(--destructive)' },
}

const gid = (s: string) => `g-${s.replace(/[^a-z0-9]/gi, '')}`

export function KpiCard({ label, value, icon: Icon, hint, delta, href, loading, spark, accent = 'brand' }: KpiProps) {
  const a = accents[accent]
  const body = (
    <div className="group relative h-full overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-[box-shadow,translate,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex size-8 items-center justify-center rounded-lg', a.chip)}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-3 truncate text-[1.75rem] leading-none font-semibold tracking-tight tabular">{value}</p>
      )}
      <div className="mt-2.5 flex min-h-5 items-center gap-2 text-xs text-muted-foreground">
        {typeof delta === 'number' && !loading && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', delta >= 0 ? 'text-success' : 'text-destructive')}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1).replace('.', ',')} %
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
      {spark && spark.length > 1 && (
        <div className="pointer-events-none absolute right-0 bottom-0 h-12 w-28 opacity-70" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v) => ({ v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gid(label)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={a.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={a.stroke} strokeWidth={1.5} fill={`url(#${gid(label)})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
  return href ? (
    <Link href={href} className="block rounded-xl outline-offset-2">
      {body}
    </Link>
  ) : (
    body
  )
}

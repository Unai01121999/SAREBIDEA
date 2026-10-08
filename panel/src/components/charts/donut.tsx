'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { formatCurrency } from '@/lib/format'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']

/** Reparto por servicios con leyenda a un lado. */
export function Donut({ data }: { data: { name: string; total: number }[] }) {
  const total = data.reduce((a, b) => a + b.total, 0)
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative size-44 shrink-0" role="img" aria-label="Reparto de la facturación por servicio">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip format={(n) => formatCurrency(n)} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Total facturado</span>
          <span className="text-lg font-semibold tracking-tight tabular">{formatCurrency(total, 'EUR', true)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="text-muted-foreground tabular">{total ? Math.round((d.total / total) * 100) : 0} %</span>
            <span className="w-20 text-right font-medium tabular">{formatCurrency(d.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

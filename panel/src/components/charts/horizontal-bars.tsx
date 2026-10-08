'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { formatCurrency } from '@/lib/format'

/** Ranking horizontal (facturación por cliente). */
export function HorizontalBars({ data, height = 300 }: { data: { name: string; total: number }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Facturación por cliente">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tick={{ fill: 'var(--foreground)', fontSize: 12 }} tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)} />
          <Tooltip cursor={{ fill: 'var(--accent)', opacity: 0.6 }} content={<ChartTooltip format={(n) => formatCurrency(n)} />} />
          <Bar dataKey="total" name="Facturado" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

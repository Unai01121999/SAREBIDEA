'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { formatCurrency } from '@/lib/format'

export interface RevenuePoint {
  label: string
  full: string
  paid: number
  open: number
}

/** Ingresos por mes: cobrado y pendiente apilados. */
export function RevenueChart({ data, height = 280 }: { data: RevenuePoint[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Gráfico de ingresos mensuales">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <Tooltip cursor={{ fill: 'var(--accent)', opacity: 0.6 }} content={<ChartTooltip format={(n) => formatCurrency(n)} />} />
          <Bar dataKey="paid" name="Cobrado" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="open" name="Pendiente" stackId="a" fill="var(--chart-1)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

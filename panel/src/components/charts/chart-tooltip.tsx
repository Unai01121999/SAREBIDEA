/** Tooltip de gráficos con el estilo del panel (usa las variables de tema). */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: { full?: string; name?: string } }[]
  label?: string
  format: (n: number) => string
}) {
  if (!active || !payload?.length) return null
  const title = payload[0]?.payload?.full ?? payload[0]?.payload?.name ?? label
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {title && <p className="mb-1.5 font-medium capitalize">{title}</p>}
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto pl-4 font-medium tabular">{format(p.value ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Exporta filas a CSV (con BOM y ; para que Excel en español lo abra bien). */
export function downloadCsv(filename: string, rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    // Inyección de fórmulas: un texto que empieza por = + - @ (o tabulador/retorno) lo ejecutaría Excel como fórmula
    // (p. ej. un nombre de empresa «=HYPERLINK(…)» enviado desde el formulario). Se antepone ' para que sea texto.
    // Los números (importes, negativos incluidos) se exportan tal cual.
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = [headers.join(';'), ...rows.map((r) => headers.map((h) => esc(r[h])).join(';'))].join('\r\n')
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

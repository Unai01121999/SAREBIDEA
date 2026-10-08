const hues = [220, 262, 160, 32, 346, 188, 280, 100]
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Colores de avatar que funcionan en claro y oscuro (usa color-mix con el fondo de la tarjeta). */
export function hashColor(name: string) {
  const h = hues[hash(name) % hues.length]
  return { backgroundColor: `hsl(${h} 70% 55% / 0.16)`, color: `hsl(${h} 70% 52%)` }
}

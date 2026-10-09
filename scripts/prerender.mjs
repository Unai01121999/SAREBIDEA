// Prerenderiza la portada: abre la web compilada en un navegador, copia el HTML ya pintado dentro de <div id="root">
// de dist/index.html y así buscadores y previsualizadores de enlaces ven el contenido sin ejecutar JavaScript.
// React lo reemplaza al cargar. Si no hay Chromium disponible, se omite sin romper la compilación.
import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const dist = 'dist'
if (!existsSync(join(dist, 'index.html'))) throw new Error('Falta dist/: ejecuta antes `npm run build`.')
const chrome = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'
let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  console.log('Prerender omitido: playwright-core no está instalado.')
  process.exit(0)
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  const file = join(dist, path.endsWith('/') ? path + 'index.html' : path)
  if (!existsSync(file)) return void res.writeHead(404).end()
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(0)
const port = server.address().port
let browser
try {
  browser = await chromium.launch({ executablePath: chrome })
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })).newPage()
  await page.route(/googletagmanager|google-analytics/, (r) => r.abort())
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1')
  await page.waitForTimeout(800)
  const html = await page.evaluate(() => {
    const root = document.getElementById('root').cloneNode(true)
    root.querySelectorAll('[role="dialog"], [aria-label="Aviso de cookies"], script, style').forEach((n) => n.remove()) // banner de cookies y similares
    return root.innerHTML
  })
  const index = readFileSync(join(dist, 'index.html'), 'utf8')
  const out = index.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  if (out === index) throw new Error('No se encontró <div id="root"></div> en dist/index.html (¿ya prerenderizado?).')
  writeFileSync(join(dist, 'index.html'), out)
  console.log(`Prerender listo: ${Math.round(html.length / 1024)} KB de HTML en la portada.`)
} catch (e) {
  console.log('Prerender omitido:', e.message)
} finally {
  await browser?.close()
  server.close()
}

// Prerenderiza la portada: abre la web compilada en un navegador, copia el HTML ya pintado dentro de <div id="root">
// de dist/index.html y así buscadores y previsualizadores de enlaces ven el contenido sin ejecutar JavaScript.
// React lo reemplaza al cargar. Si no hay Chromium disponible, se omite sin romper la compilación.
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

const dist = 'dist'
if (!existsSync(join(dist, 'index.html'))) throw new Error('Falta dist/: ejecuta antes `npm run build`.')
// Marca de versión: https://sarebidea.com/version.txt permite comprobar qué compilación está publicada.
let commit = ''
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  /* sin git */
}
// El sitemap lleva como fecha de última modificación la de esta compilación.
const sitemap = join(dist, 'sitemap.xml')
if (existsSync(sitemap)) writeFileSync(sitemap, readFileSync(sitemap, 'utf8')
  .replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>`))
writeFileSync(join(dist, 'version.txt'), `SAREBIDEA · compilación ${new Date().toISOString()}${commit ? ` · ${commit}` : ''}\n`)
const chrome = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'
let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  console.log('Prerender omitido: playwright-core no está instalado.')
  process.exit(0)
}
const template = readFileSync(join(dist, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('No se encontró <div id="root"></div> en dist/index.html (¿ya prerenderizado?).')

// Páginas que se prerenderizan: la portada y las tres páginas legales (cada una con su propia URL).
const pages = [
  { route: '/', file: 'index.html' },
  { route: '/aviso-legal/', title: 'Aviso legal', description: 'Aviso legal de SAREBIDEA: identificación del titular, condiciones de uso del sitio web y propiedad intelectual.' },
  { route: '/politica-de-privacidad/', title: 'Política de privacidad', description: 'Política de privacidad de SAREBIDEA: qué datos personales tratamos, para qué, durante cuánto tiempo y cómo ejercer tus derechos.' },
  { route: '/politica-de-cookies/', title: 'Política de cookies', description: 'Política de cookies de SAREBIDEA: qué cookies y almacenamiento usa la web y cómo cambiar tu elección en cualquier momento.' },
]

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  // Las rutas de página devuelven la plantilla sin prerenderizar (como hará el servidor con la portada y con cada carpeta).
  if (pages.some((p) => p.route === path)) return void res.writeHead(200, { 'content-type': 'text/html' }).end(template)
  const file = join(dist, path.endsWith('/') ? path + 'index.html' : path)
  if (!existsSync(file)) return void res.writeHead(404).end()
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(0)
const port = server.address().port

// Precarga de las fuentes que se ven al abrir la web (titular, texto y botones): el navegador las pide a la vez que el CSS.
const preload = ['funnel-display-latin-600-normal', 'geist-latin-400-normal', 'geist-latin-500-normal']
  .map((name) => readdirSync(join(dist, 'assets')).find((f) => f.startsWith(`${name}-`) && f.endsWith('.woff2')))
  .filter(Boolean)
  .map((f) => `    <link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />\n`)
  .join('')

const setMeta = (html, key, value) => html.replace(new RegExp(`(<meta\\s+(?:property|name)="${key}"\\s+content=")[^"]*(")`), `$1${value}$2`)
/** Cabecera propia de una página legal: título, descripción, canonical, Open Graph y Twitter (y sin los datos estructurados de la portada). */
function legalHead(html, p) {
  const title = `${p.title} · SAREBIDEA`
  const url = `https://sarebidea.com${p.route}`
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`).replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  for (const [k, v] of [['description', p.description], ['og:title', title], ['og:description', p.description], ['og:url', url], ['twitter:title', title], ['twitter:description', p.description]]) out = setMeta(out, k, v)
  return out.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
}

let browser
try {
  browser = await chromium.launch({ executablePath: chrome })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort())
  const outputs = []
  for (const p of pages) {
    const page = await ctx.newPage()
    await page.goto(`http://localhost:${port}${p.route}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('h1')
    await page.waitForTimeout(800)
    const html = await page.evaluate(() => {
      const root = document.getElementById('root').cloneNode(true)
      root.querySelectorAll('[role="dialog"], [aria-label="Aviso de cookies"], script, style').forEach((n) => n.remove()) // banner de cookies y similares
      return root.innerHTML
    })
    await page.close()
    let out = template.replace('</head>', `${preload}  </head>`).replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    if (p.title) out = legalHead(out, p)
    outputs.push({ p, out, kb: Math.round(html.length / 1024) })
  }
  // Se escribe todo al final: si algo falla, no queda nada a medias.
  for (const { p, out, kb } of outputs) {
    const file = p.file ? join(dist, p.file) : join(dist, p.route, 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, out)
    console.log(`Prerender listo: ${p.route} (${kb} KB de HTML)`)
  }
} catch (e) {
  console.log('Prerender omitido:', e.message)
} finally {
  await browser?.close()
  server.close()
}

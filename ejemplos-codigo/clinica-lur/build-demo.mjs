// Genera la web de ejemplo para publicarla en /ejemplos/clinica-lur/ del sitio de SAREBIDEA.
//   node build-demo.mjs   →  ejecuta build.mjs (carpeta site/) y deja el resultado adaptado en ../../public/ejemplos/clinica-lur/
// Adaptaciones: rutas bajo /ejemplos/clinica-lur/, tipografías e iconos (Lucide) alojados en local, sin scripts inline
// (política de seguridad de /ejemplos/) y meta noindex.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BASE = '/ejemplos/clinica-lur/'
const here = path.dirname(new URL(import.meta.url).pathname)
const dest = path.resolve(here, '../../public/ejemplos/clinica-lur')

execFileSync('node', ['build.mjs'], { cwd: here, stdio: 'inherit' })
// Las capturas de la miniatura (preview-*.jpg) se conservan entre compilaciones.
const keep = fs.existsSync(dest) ? fs.readdirSync(dest).filter((f) => /^preview-.*\.jpg$/.test(f)).map((f) => [f, fs.readFileSync(path.join(dest, f))]) : []
fs.rmSync(dest, { recursive: true, force: true })
fs.cpSync(path.join(here, 'site'), dest, { recursive: true })
fs.rmSync(path.join(dest, 'robots.txt'), { force: true })
for (const [f, buf] of keep) fs.writeFileSync(path.join(dest, f), buf)

// Tipografías e iconos en local
fs.mkdirSync(path.join(dest, 'assets/fonts'), { recursive: true })
for (const f of fs.readdirSync(path.join(here, 'vendor'))) {
  if (f.endsWith('.woff2')) fs.copyFileSync(path.join(here, 'vendor', f), path.join(dest, 'assets/fonts', f))
}
fs.copyFileSync(path.join(here, 'vendor/lucide.min.js'), path.join(dest, 'assets/lucide.min.js'))
fs.writeFileSync(path.join(dest, 'assets/js-flag.js'), "document.documentElement.classList.add('js')\n")

const faces = []
for (const w of [400, 500]) for (const s of ['normal', 'italic'])
  faces.push(`@font-face{font-family:"Cormorant Garamond";font-style:${s};font-weight:${w};font-display:swap;src:url("fonts/cormorant-garamond-latin-${w}-${s}.woff2") format("woff2")}`)
for (const w of [400, 500, 600])
  faces.push(`@font-face{font-family:"Manrope";font-style:normal;font-weight:${w};font-display:swap;src:url("fonts/manrope-latin-${w}-normal.woff2") format("woff2")}`)
const cssPath = path.join(dest, 'assets/styles.css')
const touchFix = `
/* Vista previa en móvil (iframe): el body no debe ser contenedor de scroll (overflow-x:hidden lo convierte en uno y en iOS impide desplazar la web dentro del iframe)
   ni forzar el desplazamiento suave en pantallas táctiles. «clip» recorta igual sin crear contenedor de scroll. */
html, body { overflow-x: visible !important; }
@supports (overflow: clip) { html, body { overflow-x: clip !important; } }
@media (hover: none) { html { scroll-behavior: auto !important; } }
`
fs.writeFileSync(cssPath, '/* Tipografías alojadas en local (sin Google Fonts) */\n' + faces.join('\n') + '\n' + fs.readFileSync(cssPath, 'utf8') + touchFix)

// main.js: la "portada" pasa de "/" a la ruta base
const jsPath = path.join(dest, 'assets/main.js')
let js = fs.readFileSync(jsPath, 'utf8')
js = js.replace("location.pathname === '/' || location.pathname === '/index.html'", `location.pathname === '${BASE}' || location.pathname === '${BASE}index.html'`)
js = js.replace("url.pathname !== '/' && url.pathname !== '/index.html'", `url.pathname !== '${BASE}' && url.pathname !== '${BASE}index.html'`)
// Los <img onerror="this.remove()"> (quitan la foto si falta, para mostrar el hueco etiquetado) son manejadores en línea y la CSP de
// /ejemplos/ no los permite: se sustituyen por un manejador equivalente (captura de errores + imágenes que ya hubieran fallado).
js += `
;(() => {
  const drop = (img) => img.tagName === 'IMG' && img.remove()
  document.addEventListener('error', (e) => drop(e.target), true)
  document.querySelectorAll('img').forEach((img) => img.complete && img.naturalWidth === 0 && drop(img))
})()
`
fs.writeFileSync(jsPath, js)

// HTML: rutas absolutas → bajo la ruta base; sin Google Fonts ni unpkg; sin script inline; noindex
const htmls = []
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') && htmls.push(path.join(d, e.name))))
walk(dest)
for (const f of htmls) {
  let h = fs.readFileSync(f, 'utf8')
  h = h.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}`) // primero las rutas existentes; después se añaden las locales
  h = h.replace(/<link rel="preconnect"[^>]*>/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
  h = h.replace('<script>document.documentElement.classList.add(\'js\')</script>', `<script src="${BASE}assets/js-flag.js"></script>`)
  h = h.replace('https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js', `${BASE}assets/lucide.min.js`)
  h = h.replace(/Para mostrar las tipografías y los iconos, el sitio carga recursos[^<]*?(?=<\/p>)/, 'Las tipografías y los iconos se sirven desde el propio sitio, sin servicios de terceros.')
  h = h.replace(/ onerror="this\.remove\(\)"/g, '')
  if (!h.includes('name="robots"')) h = h.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex, nofollow">')
  fs.writeFileSync(f, h)
}
console.log('Clínica Lur →', dest, `(${htmls.length} páginas)`)

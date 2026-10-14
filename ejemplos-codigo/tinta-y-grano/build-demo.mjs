// Genera la vista previa de «Tinta & Grano» para el portafolio: public/ejemplos/tinta-y-grano/
// Parte de la web original (src/, tal como se entregó) y la adapta a la política de seguridad de /ejemplos/ (todo del mismo origen, sin scripts en línea):
//  · tipografías (Cormorant Garamond e Inter) alojadas en local en lugar de Google Fonts,
//  · el script en línea que añade la clase «js» pasa a un archivo (js-flag.js),
//  · `noindex`,
//  · los archivos CSS/JS se enlazan con una huella de su contenido (styles.css?v=…): si el servidor o el navegador guardaron una versión
//    antigua con el mismo nombre, al cambiar el contenido se descarga la nueva, y HTML, estilos y script nunca quedan desparejados.
// Uso: node build-demo.mjs   (las capturas preview-*.jpg se generan aparte con Chromium; ver README)
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '../../public/ejemplos/tinta-y-grano')
mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (!/^preview-.*\.jpg$/.test(f)) rmSync(join(out, f), { recursive: true, force: true })

cpSync(join(here, 'src/img'), join(out, 'img'), { recursive: true })
mkdirSync(join(out, 'fonts'), { recursive: true })
for (const f of readdirSync(join(here, 'vendor'))) cpSync(join(here, 'vendor', f), join(out, 'fonts', f))

const faces = [
  ...[[400, 'normal'], [400, 'italic'], [500, 'normal'], [500, 'italic'], [600, 'normal'], [600, 'italic']].map(
    ([w, s]) => `@font-face{font-family:"Cormorant Garamond";font-style:${s};font-weight:${w};font-display:swap;src:url("fonts/cormorant-garamond-latin-${w}-${s}.woff2") format("woff2")}`,
  ),
  ...[400, 500, 600].map((w) => `@font-face{font-family:"Inter";font-style:normal;font-weight:${w};font-display:swap;src:url("fonts/inter-latin-${w}-normal.woff2") format("woff2")}`),
].join('\n')
const touchFix = `
/* Vista previa en móvil (iframe): el body no debe ser contenedor de scroll (overflow-x:hidden lo convierte en uno y en iOS impide desplazar la web dentro del iframe)
   ni forzar el desplazamiento suave en pantallas táctiles. «clip» recorta igual sin crear contenedor de scroll. */
html, body { overflow-x: visible !important; }
@supports (overflow: clip) { html, body { overflow-x: clip !important; } }
@media (hover: none) { html { scroll-behavior: auto !important; } }
`
const css = '/* Tipografías alojadas en local (sin Google Fonts: sin peticiones a terceros) */\n' + faces + '\n\n' + readFileSync(join(here, 'src/styles.css'), 'utf8') + touchFix
const js = readFileSync(join(here, 'src/script.js'), 'utf8')
const flag = "document.documentElement.classList.add('js');\n"
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10)
writeFileSync(join(out, 'styles.css'), css)
writeFileSync(join(out, 'script.js'), js)
writeFileSync(join(out, 'js-flag.js'), flag)

const html = readFileSync(join(here, 'src/index.html'), 'utf8')
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .replace("<script>document.documentElement.classList.add('js')</script>", `<script src="js-flag.js?v=${hash(flag)}"></script>`)
  .replace(/href="styles\.css[^"]*"/, `href="styles.css?v=${hash(css)}"`)
  .replace(/src="script\.js[^"]*"/, `src="script.js?v=${hash(js)}"`)
  .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="robots" content="noindex, nofollow">')
if (!html.includes('js-flag.js') || !html.includes('styles.css?v=') || !html.includes('script.js?v=')) throw new Error('No se pudo adaptar index.html')
writeFileSync(join(out, 'index.html'), html.replace(/\r\n/g, '\n'))
console.log('Listo: public/ejemplos/tinta-y-grano/')

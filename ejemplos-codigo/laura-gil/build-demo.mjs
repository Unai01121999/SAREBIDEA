// Genera la vista previa de «Laura Gil» para el portafolio: public/ejemplos/laura-gil/
// Parte de la web original (src/) y la adapta a la política de seguridad de /ejemplos/ (todo del mismo origen, sin scripts en línea):
//  · tipografías (Cormorant Garamond y Manrope) alojadas en local en lugar de Google Fonts,
//  · sin `onerror` en línea, sin canonical ni og:image de marcador de posición, y con noindex.
// Uso: node build-demo.mjs   (después, las capturas preview-*.jpg se generan con Chromium; ver README)
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '../../public/ejemplos/laura-gil')
const keep = ['preview-desktop.jpg', 'preview-mobile.jpg']
mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (!keep.includes(f)) rmSync(join(out, f), { recursive: true, force: true })

cpSync(join(here, 'src/assets'), join(out, 'assets'), { recursive: true })
mkdirSync(join(out, 'fonts'), { recursive: true })
for (const f of readdirSync(join(here, 'vendor'))) cpSync(join(here, 'vendor', f), join(out, 'fonts', f))

const faces = []
for (const [w, s] of [[400, 'normal'], [400, 'italic'], [500, 'normal'], [500, 'italic'], [600, 'normal']])
  faces.push(`@font-face{font-family:"Cormorant Garamond";font-style:${s};font-weight:${w};font-display:swap;src:url("fonts/cormorant-garamond-latin-${w}-${s}.woff2") format("woff2")}`)
for (const w of [400, 500, 600])
  faces.push(`@font-face{font-family:"Manrope";font-style:normal;font-weight:${w};font-display:swap;src:url("fonts/manrope-latin-${w}-normal.woff2") format("woff2")}`)
writeFileSync(join(out, 'styles.css'), faces.join('\n') + '\n' + readFileSync(join(here, 'src/styles.css'), 'utf8'))
cpSync(join(here, 'src/main.js'), join(out, 'main.js'))

const head = (html) =>
  html
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
    .replace(/<link rel="canonical"[^>]*>(<!--.*?-->)?\s*/g, '')
    .replace(/<meta property="og:image"[^>]*>(<!--.*?-->)?\s*/g, '')
    .replace(/ onerror="this\.remove\(\)"/g, '')
    .replace(/<meta name="robots"[^>]*>\s*/g, '')
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">')
for (const f of ['index.html', 'legal.html']) writeFileSync(join(out, f), head(readFileSync(join(here, 'src', f), 'utf8')))
console.log('Listo: public/ejemplos/laura-gil/')

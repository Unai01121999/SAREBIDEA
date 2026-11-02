// Genera la vista previa de «Bar Costa» para el portafolio: public/ejemplos/bar-costa/
// Parte de la web original (src/, tal como se entregó) y la adapta a la política de seguridad de /ejemplos/ (scripts del mismo origen, sin scripts ni manejadores en línea):
//  · tipografías (Cormorant Garamond e Inter) alojadas en local en lugar de Google Fonts,
//  · el script en línea de admin.html pasa a js/admin.js y los `onerror` en línea se sustituyen por un listener delegado (js/img-fallback.js),
//  · `noindex`,
//  · contraseña del área privada de la DEMO pública: «demo» (la real de config.js no se publica),
//  · .htaccess propio: igual que el resto de /ejemplos/ pero con permiso para las fotos de Unsplash y el mapa de OpenStreetMap.
// Uso: node build-demo.mjs
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '../../public/ejemplos/bar-costa')
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'fonts'), { recursive: true })
cpSync(join(here, 'src'), out, { recursive: true })
for (const f of readdirSync(join(here, 'vendor'))) cpSync(join(here, 'vendor', f), join(out, 'fonts', f))

const face = (fam, file, w, s = 'normal') => `@font-face{font-family:"${fam}";font-style:${s};font-weight:${w};font-display:swap;src:url("../fonts/${file}.woff2") format("woff2")}`
const faces = [
  face('Cormorant Garamond', 'cormorant-garamond-latin-500-normal', 500),
  face('Cormorant Garamond', 'cormorant-garamond-latin-600-normal', 600),
  face('Cormorant Garamond', 'cormorant-garamond-latin-500-italic', 500, 'italic'),
  face('Inter', 'inter-latin-400-normal', 400),
  face('Inter', 'inter-latin-500-normal', 500),
  face('Inter', 'inter-latin-600-normal', 600),
].join('\n')
const cssPath = join(out, 'css/styles.css')
const touchFix = `
/* Vista previa en móvil (iframe): el body no debe ser contenedor de scroll (overflow-x:hidden lo convierte en uno y en iOS impide desplazar la web dentro del iframe)
   ni forzar el desplazamiento suave en pantallas táctiles. «clip» recorta igual sin crear contenedor de scroll. */
html, body { overflow-x: visible !important; }
@supports (overflow: clip) { html, body { overflow-x: clip !important; } }
@media (hover: none) { html { scroll-behavior: auto !important; } }
`
writeFileSync(cssPath, '/* Tipografías alojadas en local (sin Google Fonts) */\n' + faces + '\n' + readFileSync(cssPath, 'utf8') + touchFix)

// Las imágenes que fallan se ocultan (antes con `onerror` en línea, que la política de seguridad bloquea).
writeFileSync(join(out, 'js/img-fallback.js'), `document.addEventListener('error', function (e) {
  var i = e.target;
  if (i && i.tagName === 'IMG') i.style.visibility = 'hidden';
}, true);
`)

const head = (html) =>
  html
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
    .replace(/<meta name="robots"[^>]*>\s*/g, '')
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">')

// index.html
let index = head(readFileSync(join(out, 'index.html'), 'utf8'))
index = index.replace('<script src="js/main.js"></script>', '<script src="js/img-fallback.js"></script>\n<script src="js/main.js"></script>')
writeFileSync(join(out, 'index.html'), index)

// Demo pública: sin «área privada». admin.html (y su script) no se publican: el panel del bar solo tiene sentido en la web real
// de cada cliente, con su propio servidor, y aquí mostraba un acceso con usuario y contraseña escritos en el código.
rmSync(join(out, 'admin.html'), { force: true })
rmSync(join(out, 'js/admin.js'), { force: true })
index = readFileSync(join(out, 'index.html'), 'utf8')
// Todos los enlaces al área privada (menú y pie), con su separador «·» si lo lleva delante.
const adminLink = /(<span class="sep">·<\/span>)?\s*<a href="admin\.html"[^>]*><\/a>/g
if (!adminLink.test(index)) throw new Error('No se encontró el enlace a admin.html')
writeFileSync(join(out, 'index.html'), index.replace(adminLink, ''))

// Reservas de la demo: no se guarda nada en el navegador (podrían ser datos reales de alguien que crea que es un bar de verdad)
// y el mensaje deja claro que es una web de ejemplo.
const store = join(out, 'js/store.js')
const storeText = readFileSync(store, 'utf8')
const saveFn = /const save = \(l\) => \{[^\n]*\};/
if (!saveFn.test(storeText)) throw new Error('No se encontró save() en store.js')
writeFileSync(store, storeText.replace(saveFn, 'const save = () => {}; // demo: no se guarda nada\n  try { localStorage.removeItem(KEY); } catch (e) {}'))
const mainFile = join(out, 'js/main.js')
const mainText = readFileSync(mainFile, 'utf8')
const okMsg = 'msg(`¡Gracias, ${r.nombre}! Hemos recibido tu solicitud (ref. ${r.id}). ${Content.T("bk.ok")}`, true);'
if (!mainText.includes(okMsg)) throw new Error('No se encontró el mensaje de reserva en main.js')
writeFileSync(mainFile, mainText.replace(okMsg, 'msg(`Esto es una web de ejemplo de SAREBIDEA: la reserva no se ha enviado ni guardado. En la web real de tu bar, aquí te llegaría la solicitud de ${r.nombre}.`, true);'))

// `onerror` en línea dentro de las plantillas de JS
for (const f of ['js/main.js', 'js/editor.js']) {
  const p = join(out, f)
  writeFileSync(p, readFileSync(p, 'utf8').replace(/ onerror="[^"]*"/g, ''))
}
// Sin credenciales en la demo pública (no hay área privada)
const cfg = join(out, 'js/config.js')
const cfgText = readFileSync(cfg, 'utf8')
if (!/adminPass: "[^"]*"/.test(cfgText)) throw new Error('No se encontró adminPass')
writeFileSync(cfg, cfgText.replace(/adminUser: "[^"]*"/, 'adminUser: ""').replace(/adminPass: "[^"]*"/, 'adminPass: ""'))

// Archivos que no forman parte de la web publicada
for (const f of ['server.js', 'package.json', '.env.example', 'LEEME.md', 'INSTRUCCIONES_EXPORTACION.md']) rmSync(join(out, f), { force: true })

writeFileSync(join(out, '.htaccess'), `# Bar Costa (web de ejemplo): igual que el resto de /ejemplos/ pero con permiso para sus fotografías de Unsplash y el mapa de OpenStreetMap.
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; frame-src https://www.openstreetmap.org; connect-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'none'; object-src 'none'"
</IfModule>
`)
console.log('Listo: public/ejemplos/bar-costa/')

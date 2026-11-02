// Tras `next build`: calcula la huella SHA-256 de cada <script> en línea de las páginas exportadas (out/**/*.html) y la
// escribe en out/.htaccess (plantilla en public/.htaccess). Así la CSP del panel permite SOLO esos scripts, sin 'unsafe-inline'.
// También pone caché de 1 año a out/_next/static (los nombres llevan huella).
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'out'
const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : []
  })

const hashes = new Set()
for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, 'utf8')
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || !body) continue
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
}
const htaccess = join(OUT, '.htaccess')
const tpl = readFileSync(htaccess, 'utf8')
if (tpl.split('__SCRIPT_HASHES__').length !== 2) throw new Error('out/.htaccess debe tener __SCRIPT_HASHES__ exactamente una vez (en la CSP)')
if (!hashes.size) throw new Error('No se han encontrado scripts en línea: revisa la exportación de Next.js')
const result = tpl.replace('__SCRIPT_HASHES__', [...hashes].sort().join(' '))
if (!/script-src 'self' 'sha256-/.test(result)) throw new Error('La CSP del panel no ha quedado bien escrita')
writeFileSync(htaccess, result)
writeFileSync(join(OUT, '_next/static/.htaccess'), '<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n')
console.log(`CSP del panel: ${hashes.size} scripts en línea permitidos por huella.`)

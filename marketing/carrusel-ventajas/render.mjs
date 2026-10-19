// Genera los PNG (1080×1350, formato vertical 4:5 de Instagram/LinkedIn) y un PDF del carrusel. Uso: node render.mjs
import { chromium } from '/home/user/SAREBIDEA/node_modules/playwright-core/index.mjs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'png'); mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
await p.goto(pathToFileURL(join(here, 'carrusel.html')).href, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
const names = ['00-portada','01-te-encuentran-en-google','02-abierta-24-7','03-genera-confianza','04-mas-contactos','05-es-tuya','06-contacto']
for (let i = 0; i < names.length; i++) await p.locator('#s' + i).screenshot({ path: join(out, `sarebidea-ventajas-${names[i]}.png`) })
await p.addStyleTag({ content: '@page{size:1080px 1350px;margin:0}body{background:none}.slide{margin:0;page-break-after:always}' })
await p.pdf({ path: join(here, 'sarebidea-ventajas-pagina-web.pdf'), width: '1080px', height: '1350px', printBackground: true })
console.log('Listo:', names.length, 'diapositivas + PDF')
await b.close()

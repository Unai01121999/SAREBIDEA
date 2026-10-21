// Renderiza las capas del vídeo (fondo, brillos, marco del móvil y textos de cada escena) a PNG.
import { chromium } from '/home/user/SAREBIDEA/node_modules/playwright-core/index.mjs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
const here = dirname(fileURLToPath(import.meta.url)); const out = process.argv[2]; mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto(pathToFileURL(join(here, 'capas.html')).href); await p.evaluate(() => document.fonts.ready)
for (const id of ['bg', 'g1', 'g2', 'frame', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'])
  await p.locator('#' + id).screenshot({ path: join(out, id + '.png'), omitBackground: id !== 'bg' })
await b.close()

// Une la web pública (dist/) con el panel compilado (panel/out/) en dist/panel/, listo para subir a Hostinger.
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'

if (!existsSync('dist/index.html')) throw new Error('Falta dist/: ejecuta antes `npm run build`.')
if (!existsSync('panel/out/index.html')) throw new Error('Falta panel/out/: ejecuta antes `npm run build:panel`.')
rmSync('dist/panel', { recursive: true, force: true })
cpSync('panel/out', 'dist/panel', { recursive: true })
// Los archivos de _next/static llevan huella en el nombre: caché de 1 año.
writeFileSync('dist/panel/_next/static/.htaccess', '<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n')
console.log('Listo: dist/ contiene la web y el panel (dist/panel/).')

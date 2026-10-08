// Une la web pública (dist/) con el panel compilado (panel/out/) en dist/panel/, listo para subir a Hostinger.
import { cpSync, existsSync, rmSync } from 'node:fs'

if (!existsSync('dist/index.html')) throw new Error('Falta dist/: ejecuta antes `npm run build`.')
if (!existsSync('panel/out/index.html')) throw new Error('Falta panel/out/: ejecuta antes `npm run build:panel`.')
rmSync('dist/panel', { recursive: true, force: true })
cpSync('panel/out', 'dist/panel', { recursive: true })
console.log('Listo: dist/ contiene la web y el panel (dist/panel/).')

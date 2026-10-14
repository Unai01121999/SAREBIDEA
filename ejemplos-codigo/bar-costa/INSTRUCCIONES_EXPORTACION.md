# Exportación de la web

## Tecnologías
- HTML5, CSS3 y JavaScript puro (sin frameworks ni compilación).
- Fuentes: Google Fonts (Cormorant Garamond e Inter), cargadas por CDN.
- Imágenes: Unsplash por URL (provisionales), cargadas por CDN. Se pueden cambiar desde el área privada o en `public/js/config.js`.
- Mapa: OpenStreetMap (iframe).
- Datos (reservas y contenido editado): `localStorage` del navegador. No hay base de datos ni backend.
- Servidor incluido: `server.js` (Node.js ≥ 16, sin dependencias). Opcional: cualquier hosting estático sirve.

## Archivos
- `public/index.html` — web pública
- `public/admin.html` — área privada (reservas + editor de contenido)
- `public/css/styles.css`
- `public/js/config.js` (datos del bar), `content.js` (textos y definición del editor), `editor.js`, `main.js`, `store.js`
- `server.js`, `package.json`, `.env.example`, `.gitignore`, `LEEME.md`

## Arrancar
```
npm install
npm start
```
Abre http://localhost:3000 (el área privada en /admin.html). Otro puerto: `PORT=8080 npm start` (en PowerShell: `$env:PORT=8080; npm start`).
`npm run build` no compila nada: la carpeta `public/` ya es la web final.

## Subirla a un hosting estático (sin Node)
Sube el contenido de `public/` (index.html, admin.html, css, js) a la raíz del hosting.

## Seguridad
- No hay API keys ni secretos. En `public/js/config.js` hay un usuario/contraseña **de ejemplo** (`admin` / `cambiar-esta-clave`). Cámbialos antes de publicar.
- El área privada es una demo del lado del cliente: la contraseña es visible en el código y las reservas/ediciones no se comparten entre dispositivos. Para producción hace falta un backend (ver `LEEME.md`).
- Lo que ya hayas editado en el navegador actual vive en su `localStorage`, no en los archivos: no se copia con la carpeta. Antes de mover la web usa en el panel «Exportar copia» y, en el nuevo sitio, «Importar copia».

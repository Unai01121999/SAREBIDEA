# Web clínica dental (plantilla premium)

Sitio estático multipágina (HTML/CSS/JS sin dependencias de build).

## Uso
1. Edita `site.config.mjs` (nombre, teléfono, dirección, horario, tratamientos, equipo, formulario...).
2. Copia tus fotografías reales en `images/` con los nombres de abajo (si falta una, se ve un hueco etiquetado).
3. `node build.mjs` genera la carpeta `site/`.
4. Para verla en local: `cd site && python -m http.server 4173` y abre http://localhost:4173

Las rutas son absolutas (`/clinica/`), así que `site/` debe servirse desde la raíz de un dominio o servidor local.

## Imágenes esperadas (`images/`)
hero.jpg, clinica.jpg, tratamiento-general.jpg, tratamiento-estetica.jpg, tratamiento-ortodoncia.jpg,
tratamiento-implantologia.jpg, tratamiento-blanqueamiento.jpg, tratamiento-odontopediatria.jpg,
equipo-1.jpg, equipo-2.jpg, equipo-3.jpg, galeria-1.jpg ... galeria-6.jpg
Recomendado: WebP/AVIF o JPG optimizado, 1600 px de ancho máximo.

## Pendiente antes de publicar
- `draftNotice: false` en la configuración.
- `formEndpoint` con un servicio real (Formspree, Basin, función propia...). Mientras esté vacío el formulario valida pero NO simula envíos.
- `siteUrl` (activa canonical, Open Graph, sitemap) y datos reales para el JSON-LD `Dentist`.
- `mapEmbedUrl` y `mapsDirectionsUrl`.
- Confirmar qué tratamientos se ofrecen (`enabled`), equipo y reseñas reales.
- Revisar textos legales con asesoría; alojar tipografías e iconos en local (ahora: Google Fonts y unpkg/Lucide).

## Créditos de imágenes provisionales
Las fotografías de `images/` (excepto equipo, que queda vacío) proceden de Unsplash (licencia Unsplash: uso libre, sin atribución obligatoria). Son imágenes de stock provisionales: sustitúyelas por fotos reales de la clínica y no las presentes como fotos de sus instalaciones.

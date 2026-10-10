# SAREBIDEA · Landing

React + TypeScript + Vite + Tailwind CSS v4 + Motion + Lenis. Sin WebGL: la escena 3D del hero es CSS 3D con DOM real.

```bash
npm install
npm run dev        # desarrollo
npm run build      # producción en dist/
SINGLE=1 npm run build   # un único index.html autocontenido (vista previa)
```

- Contenido editable (textos, FAQ, ejemplos): `src/data/site.ts`
- Capturas reales de proyectos: añade `image: '/proyectos/x.jpg'` al proyecto en `site.ts`.
- Formulario de contacto (nombre completo, teléfono, email, tipo de negocio, descripción): envía a `src/lib/leads.ts`.
- Producción (Supabase): el formulario guarda en la tabla `leads`. Esas solicitudes aparecen solas en el panel (`/panel/`) como clientes con origen «Formulario web». El botón «Área privada» abre el panel, que pide correo y contraseña + código de 6 cifras (solo los correos de `admin_emails`). Configura `.env` a partir de `.env.example`.
  - En la vista previa de claude.ai se guardan en la base de datos del artifact (solo el equipo puede leer y escribir).
  - En local se guardan en localStorage (solo para probar).
  - Sin variables de Supabase la web funciona en modo local.
- Antes de publicar: `og:image` (`/og.jpg`), dominio en `canonical`, email/teléfono reales, páginas legales.
- Decisiones de diseño: `DESIGN.md`.
- Logo: `src/components/ui/Logo.tsx` (vectorial, azul #0A93F5, tipografía Montserrat). Original en `public/brand/`.

## Legal y cookies
- `src/data/site.ts` → `legal`: completa titular, NIF y domicilio (aparecen en Aviso legal y Política de privacidad).
- Textos en `src/components/legal/LegalPage.tsx`; rutas `#aviso-legal`, `#politica-de-privacidad`, `#politica-de-cookies`.
- Banner y preferencias: `src/components/legal/CookieBanner.tsx`; estado en `src/lib/consent.ts`. Todo lo opcional empieza desactivado.
- Cualquier script de terceros (analítica, píxeles, mapas, vídeos…) debe cargarse con `onConsent('analytics' | 'marketing', ...)`, nunca en `index.html`. Las tipografías van alojadas en el propio sitio (`@fontsource`).

## Panel de administración
- `panel/`: aplicación aparte (Next.js + Prisma + PostgreSQL) para gestionar clientes, webs, dominios, hosting, facturación y tareas. Ver `panel/README.md`.

### Publicar web + panel en Hostinger
`npm run build:all` compila la web pública y el panel y deja todo en `dist/` (el panel en `dist/panel/`). Sube el contenido de `dist/` a `public_html`. Variables al compilar: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (web) y `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (panel). El botón «Área privada» de la web abre `/panel/`.

## SEO

- `index.html`: título, descripción, canonical, Open Graph/Twitter y datos estructurados JSON-LD (WebSite, ProfessionalService con dirección en Gueñes y FAQPage). Si cambias las preguntas de `src/data/site.ts`, actualiza también el bloque FAQPage.
- `public/og.jpg` (imagen al compartir), `public/sitemap.xml` y `public/robots.txt` (con el sitemap y `/panel/` bloqueado).
- `scripts/prerender.mjs` (incluido en `npm run build:all`) deja el HTML de la portada ya pintado en `dist/index.html` para buscadores y previsualizadores. Se omite solo si no hay Chromium.

## Servidor (.htaccess y cabeceras de seguridad)

`public/.htaccess` (y los de `public/assets/`, `panel/public/` y `_next/static`, que genera `scripts/merge-panel.mjs`) configuran Hostinger:

- **Una sola dirección:** `http://` y `www.` redirigen a `https://sarebidea.com` (301, un solo salto). Solo actúa sobre sarebidea.com, no sobre la dirección temporal de Hostinger.
- **Compresión** de HTML, CSS, JS, JSON y SVG; **caché** de 1 año para los archivos con huella (`/assets/`, `/panel/_next/static/`), 30 días para imágenes y revalidación siempre para páginas, sitemap y robots.
- **Cabeceras:** HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` y una política de contenido (CSP) que solo permite el propio sitio, Supabase y Google Analytics. El panel tiene la suya, `noindex` y no se puede incrustar en otras webs.
- Página 404 propia (`public/404.html`, con `noindex`), `/.well-known/security.txt`, listado de carpetas desactivado y archivos sensibles bloqueados.

**Si añades un servicio externo** (mapa de Google, vídeo de YouTube, Calendly…) hay que permitirlo en la CSP de `public/.htaccess`, o el navegador lo bloqueará. Para volver atrás basta con borrar el `.htaccess` del servidor.

## Rendimiento (peso de la web)

- La portada ya no usa la librería `@supabase/supabase-js`: el formulario hace un único `fetch` a la API REST (`src/lib/supabase.ts`, `src/lib/leads.ts`). El panel sí la sigue usando (tiene su propio `package.json`).
- Animaciones con `LazyMotion` + `domAnimation` y componentes `m.*` en lugar de `motion.*` (no se carga el motor de arrastre ni el de layout).
- El texto legal (`LegalPage`) se descarga solo al abrir una de sus páginas.
- Fuentes: se quitaron Funnel Display 700 y Montserrat 500 (se sustituyen por la más cercana ya cargada). `scripts/prerender.mjs` precarga Funnel Display 600, Geist 400 y Geist 500, las que se ven al abrir la web.
- Resultado: JS inicial de 698 KB (204 KB comprimidos) a 428 KB (133 KB comprimidos), y 9 archivos de fuentes en vez de 11.

## Páginas legales con URL propia

`/aviso-legal/`, `/politica-de-privacidad/` y `/politica-de-cookies/` son páginas independientes (no una capa sobre la portada). `scripts/prerender.mjs` genera un HTML estático para cada una, con su título, descripción, URL canónica y etiquetas sociales, y las incluye en `sitemap.xml`. Los enlaces antiguos con `#` (`/#aviso-legal`…) redirigen a la dirección nueva. El texto está en `src/components/legal/LegalPage.tsx`.

## Ajustes menores de SEO y accesibilidad

- **Zonas táctiles**: los enlaces y botones del pie tienen al menos 24 px de alto (comprobado con Playwright, 0 objetivos pequeños en escritorio y móvil).
- **Ejemplos sin duplicar**: `Showcase` pinta solo la variante que corresponde (carrusel en móvil, composición en escritorio), así el HTML no repite cada proyecto ni su `<h3>`.
- **`/llms.txt`**: resumen en texto plano de la web (servicios, packs, páginas y contacto) para asistentes de IA. Se encuentra en `public/llms.txt`.

## Pack de interés en el formulario

El formulario pregunta «¿Qué pack te interesa?» en un menú desplegable (Starter, Professional, Premium o «No lo tengo claro»). Es obligatorio. Se guarda en `solicitudes.pack_interes`, el trigger `lead_to_client` lo copia a `clientes.pack_interes` y aparece en la ficha del cliente (Datos generales y pestaña Origen), editable desde el formulario de cliente y en la exportación. El correo «Nuevo Cliente» también lo incluye. Migración: `supabase/migrations/008_pack_de_interes.sql`.

## Alta de cliente: web, dominio y hosting

En la ficha del cliente solo se piden la URL de la web, el dominio y el proveedor de hosting. Si se rellenan, se crean en Webs, Dominios y Hosting (la web se llama como el negocio). El resto de datos (tecnología, registrador, renovación, costes…) se completan después en cada sección.

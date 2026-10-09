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

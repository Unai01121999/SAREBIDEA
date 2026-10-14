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

En la ficha del cliente solo se piden la URL de la web, el dominio y el proveedor de hosting. Si se rellenan, se crean en Webs, Dominios y Hosting (la web se llama como el negocio). Al reabrir la ficha esos datos aparecen rellenos y, si se cambian, se actualizan los registros existentes (no se duplican); vacío = no se toca nada. El resto de datos (tecnología, registrador, renovación, costes…) se completan después en cada sección.

## Menú del panel

«Clientes» abre el listado (con el botón «Nuevo cliente» encima) y «Webs» abre la pestaña «Todas las webs», la primera; desde ahí se cambia a Producción, Desarrollo, Pausadas o Archivadas.

## Facturación por pack

**Al elegir el cliente en una factura nueva se rellenan solos los datos que ya tiene:** su pack (el que ya se le ha facturado; si no, el de su web; si no, el que eligió en el formulario), el tipo de factura (primera factura si aún no se le ha facturado ningún pack; solo mantenimiento si ya la tiene; renovación de hosting y dominio si se factura desde la ficha de un dominio), la web (si tiene una sola), el IVA de sus facturas anteriores y los importes del pack. Debajo del campo Pack se indica de dónde sale; todo se puede cambiar. Si el cliente no tiene pack, se avisa y se elige a mano. Cada factura nueva se hace eligiendo el pack: el precio del pack va en la **base imponible** y el mantenimiento mensual del pack en otro apartado (**Mantenimiento**); el total es (base + mantenimiento) + IVA. La **primera factura** es conjunta (pack + primer mes de mantenimiento). A partir del mes siguiente se genera sola una **factura independiente de mantenimiento** por mes, **el mismo día del mes en que se emitió la primera** (pendiente de cobro). Con Supabase la crea la base de datos cada día a las 04:05 UTC (tarea `facturas-mantenimiento-mensual` de pg_cron, función `generar_facturas_mantenimiento`, migración `010`), aunque nadie abra el panel; no se repiten (índice único `facturas_mantenimiento_unica`). En modo demostración las genera el propio panel al abrirse. Las facturas antiguas sin pack se pueden seguir editando a mano. Migración: `supabase/migrations/009_facturacion_por_pack.sql`. «Añadir pack» (Webs) crea la primera factura conjunta.

**Renovación anual de hosting y dominio.** El primer año (hosting + dominio) va incluido en el pack. Después se factura una vez al año, **30 días antes de que venza la renovación del dominio** (la fecha de renovación se fija a 1 año del registro al dar de alta el dominio): factura de «Renovación de hosting y dominio», pendiente de cobro, que vence el día de la renovación. Importe (base imponible, + IVA): **Starter 90 € · Professional 120 € · Premium 180 €** según el pack del cliente (el de la primera factura de pack de esa web o, si no, de ese cliente; si aún no tiene pack se usa el coste anual del dominio; sin ninguno de los dos no se genera). Con Supabase la crea la base de datos cada día a las 04:10 UTC (tarea `facturas-renovacion-anual` de pg_cron, función `generar_facturas_renovacion`, migración `014`), aunque nadie abra el panel; no se repite (índice único `facturas_renovacion_unica`) y nunca factura años pasados. En la ficha del dominio se ve cuándo se emitirá o cuál es la factura ya emitida. En modo demostración la genera el propio panel al abrirse. Los precios están en `panel/src/lib/packs.ts` (`RENEWAL_PRICES`) y en la función SQL `precio_renovacion`: si cambian, hay que cambiar los dos.

El hosting ya no es una sección del menú: se gestiona desde la ficha de cada cliente.

## Archivo de cada factura

Cada factura admite su archivo real (JPG, PNG, WEBP o PDF, máx. 10 MB) desde **Facturación** y desde la pestaña **Facturación** de la ficha del cliente: «Adjuntar» / «Cambiar» / «Quitar» (con permiso de edición) y «Ver» (cualquiera con acceso a facturación). «Ver» lo abre en otra pestaña del navegador, sin descargarlo; si el navegador tiene Adobe Acrobat como visor de PDF, se abre ahí. El archivo se guarda en un bucket privado de Supabase Storage (`facturas`) y se abre con una URL firmada que caduca a los 5 minutos. Migración: `supabase/migrations/011_archivo_de_factura.sql`.

## Ficha de la factura

Si una factura no tiene web y el cliente tiene una sola, se vincula a ella automáticamente al guardarla.

Al hacer clic en una factura (en **Facturación** o en la pestaña Facturación de la ficha del cliente) se abre su **ficha** (`/facturacion/ficha?id=…`): datos de la factura, importes (pack, mantenimiento, IVA y total) y el apartado **Archivos adjuntos**, donde se pueden **adjuntar varios archivos** a la misma factura (también arrastrándolos), verlos con «Ver» en otra pestaña y quitarlos. En las tablas, «Ver» abre el archivo (o un menú si hay varios). Migración: `supabase/migrations/012_varios_archivos_por_factura.sql`.

## Hosting sin plan ni coste

La ficha y el formulario de hosting solo muestran proveedor, web asociada, fechas de contratación y renovación, estado y notas; ya no hay plan ni coste anual/mensual. Las columnas `plan` y `coste_anual` de `alojamientos` quedan sin usar (migración `013`).

## Ejemplo «Tinta & Grano» con vista previa

El ejemplo 1 del portafolio es la web real **Tinta & Grano** (café de especialidad y librería; segunda versión, con Cormorant Garamond e Inter alojadas en local), alojada en `public/ejemplos/tinta-y-grano/` (se publica en `/ejemplos/tinta-y-grano/`). Al pinchar en el ejemplo se abre una **vista previa** sobre la página (iframe) con selector Escritorio/Móvil, «Abrir en pestaña nueva» y cierre con Esc. Las miniaturas son capturas reales de esa web (`preview-desktop.jpg` / `preview-mobile.jpg`). Detalles:

- Las tipografías están alojadas en local (sin Google Fonts) y el script inline se movió a `js-flag.js`, para cumplir la política de seguridad (`public/ejemplos/.htaccess`: CSP propia, `noindex`, sin terceros).
- `/ejemplos/` está en `robots.txt` como `Disallow` y con `X-Robots-Tag: noindex`: no compite con la web principal en Google.
- Para añadir otra web de ejemplo: copia su carpeta a `public/ejemplos/<nombre>/`, haz sus capturas y rellena `screenshot` y `preview` en `projects` (`src/data/site.ts`).

## Ejemplo «Maison Alba» (peluquería) con vista previa

El ejemplo 2 del portafolio es **Maison Alba**, una web React/Vite. Su código fuente está en `ejemplos-codigo/maison-alba/` y la versión compilada en `public/ejemplos/maison-alba/` (se publica en `/ejemplos/maison-alba/`). Se abre en la misma vista previa que Tinta & Grano. Detalles:

- **Miniatura en vivo**: en el portafolio se ve la propia web reducida (iframe no interactivo que solo se carga cuando la tarjeta está a punto de verse), no una captura.
- **Fotografías**: la web carga sus fotos de Unsplash (`images.unsplash.com`); `public/ejemplos/maison-alba/.htaccess` permite solo ese origen para imágenes. Sustitúyelas por fotos propias en `src/data/site.ts` (`IMAGES`) si quieres que sean locales.
- **Recompilar** tras cambiar algo: `cd ejemplos-codigo/maison-alba && npm install && npx vite build --base=./` y copiar `dist/*` a `public/ejemplos/maison-alba/` (conservando su `.htaccess` y añadiendo `<meta name="robots" content="noindex, nofollow">` al `index.html`).

## Ejemplo «Taller Ibarra» (taller mecánico) con vista previa

El ejemplo 3 del portafolio es la web real **Taller Ibarra**, alojada en `public/ejemplos/taller-ibarra/` (se publica en `/ejemplos/taller-ibarra/`). Se abre en la misma vista previa que los otros dos ejemplos y su miniatura es una captura real (`preview-desktop.jpg` / `preview-mobile.jpg`). Las tipografías (Cormorant Garamond e Inter) están alojadas en local, sin Google Fonts. Los datos de contacto (`config.js`) están vacíos a propósito: la demo muestra «pendiente» y su formulario no envía nada. Sus datos reales irían en `config.js`.

## Ejemplo «Clínica Lur» (clínica dental) con vista previa

El ejemplo 4 del portafolio es la web real **Clínica Lur**: web estática de varias páginas (portada, aviso legal, privacidad y cookies). El código fuente está en `ejemplos-codigo/clinica-lur/` y la versión publicada en `public/ejemplos/clinica-lur/` (`/ejemplos/clinica-lur/`). Se abre en la misma vista previa que los demás ejemplos; la miniatura es una captura real (`preview-*.jpg`).

- **Regenerar**: `cd ejemplos-codigo/clinica-lur && node build-demo.mjs`. Ejecuta `build.mjs` y adapta el resultado: rutas bajo `/ejemplos/clinica-lur/`, tipografías (Cormorant Garamond y Manrope) e iconos (Lucide) alojados en local (antes Google Fonts y unpkg), sin scripts ni `onerror` en línea (política de seguridad de `/ejemplos/`) y `noindex`.
- `draftNotice` está en `false` en `site.config.mjs` para que no salga la franja de «Borrador» en la demo.
- Faltan las fotos del equipo (`equipo-1..3.jpg`): la web muestra un hueco etiquetado, como estaba diseñada.

## Caché de las webs de ejemplo

`public/ejemplos/.htaccess` hace que el navegador **revalide siempre** HTML, CSS, JS e imágenes (los nombres no cambian al actualizar una demo); solo las tipografías se guardan 30 días. Las capturas de las miniaturas llevan versión en el nombre (`preview-v2-*.jpg`): al cambiar una captura, súbele la versión al nombre y actualiza `screenshot` en `src/data/site.ts`.

## Rediseño visual (2026-10-13)

Mejora de la presentación sin tocar el contenido: el texto (485 fragmentos), los 33 enlaces, el `<head>` de SEO (título, metas, canonical, JSON-LD), las rutas, el formulario y el panel son idénticos a la versión anterior (comprobado automáticamente antes y después). Cambios principales: `src/index.css` (utilidades de ritmo `.section-y` / `.section-gap`, `.card-lift`, escala de titulares y `lede`, sombras más contenidas, sin vaivenes continuos), `Hero.tsx` (tipografía y columnas por anchura), `Services.tsx` (composición editorial), `Packs.tsx` (tres tarjetas iguales), `Faq.tsx`, `About.tsx`, `FinalCta.tsx` (contraste de etiquetas) y `Footer.tsx` (dos columnas en móvil).

## Zips y ejecución en local

- `sarebidea-codigo-completo.zip` incluye `LEEME.txt` (pasos) y los archivos `.env` / `panel/.env` con la conexión pública a Supabase (clave *publishable*, pública por diseño; no se suben a git). Sin ellos el formulario solo guardaría en el navegador y el panel entraría en «Modo demostración».
- `scripts/prerender.mjs`: si no hay Chromium (otro equipo), copia la portada a `/aviso-legal/`, `/politica-de-privacidad/` y `/politica-de-cookies/` en vez de dejar esas rutas sin página.
- `sarebidea-web-y-panel.zip` incluye `LEEME-SUBIR.txt` (borrar tras extraer).

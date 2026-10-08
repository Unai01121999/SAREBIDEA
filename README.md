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
- Formulario (nombre completo, teléfono, email, tipo de negocio, descripción) y Área Privada (`#area-privada`) con tres apartados: Clientes (ID SB-0001…, ficha con web, dominio y vencimientos), Cuentas (cantidad y estado del pago) y Webs (web, dominio y avisos de vencimiento). Los datos pasan por `src/lib/leads.ts`.
- Producción (Supabase): el formulario guarda en la tabla `leads` y el Área privada pide correo y contraseña + código de 6 cifras (solo los correos de `admin_emails`). Configura `.env` a partir de `.env.example`.
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

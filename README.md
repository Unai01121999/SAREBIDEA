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
- Producción: acceso con Google + segundo factor (solo sarebidea@sarebidea.com) y correo "Nuevo Cliente" por cada formulario, con Supabase + Resend. Pasos en `SETUP-BACKEND.md`; SQL en `supabase/migrations/`, función de correo en `supabase/functions/notify-new-lead/`.
  - En la vista previa de claude.ai se guardan en la base de datos del artifact (solo el equipo puede leer y escribir).
  - En local se guardan en localStorage (solo para probar).
  - Para la web real hace falta un backend con login (p. ej. Supabase o Firebase): basta con reimplementar las funciones de `leads.ts`.
- Antes de publicar: `og:image` (`/og.jpg`), dominio en `canonical`, email/teléfono reales, páginas legales.
- Decisiones de diseño: `DESIGN.md`.
- Logo: `src/components/ui/Logo.tsx` (vectorial, azul #0A93F5, tipografía Montserrat). Original en `public/brand/`.

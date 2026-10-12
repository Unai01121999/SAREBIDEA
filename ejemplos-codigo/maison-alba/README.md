# Maison Alba: web premium para peluquería

React 19 + TypeScript + Vite 8 + Tailwind CSS 4. Tipografías autoalojadas (Cormorant Garamond y Geist).

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de producción en /dist
```

## Qué editar (todo en `src/data/site.ts`)

| Campo | Qué hacer |
|---|---|
| `SALON` | Nombre, ciudad, dirección, teléfono, email, Instagram, Google Maps, horarios y enlaces legales. Vacío = el footer muestra "Pendiente de configurar". |
| `BOOKING.externalUrl` | Enlace de tu plataforma de reservas (Treatwell, Booksy, Fresha, Calendly...). Si se rellena, todos los botones "Reservar" llevan allí. |
| `BOOKING.endpoint` | URL de tu backend (POST JSON). Solo se muestra confirmación si responde con éxito. |
| `SERVICES`, `TEAM`, `TESTIMONIALS` | Contenido de ejemplo. Precios orientativos de peluquería (ajustar a tu tarifa), nombres "pendiente" y reseñas de demostración. |
| `IMAGES` | IDs de fotografías de Unsplash (licencia libre). Sustituir por fotos propias del salón. |

## Reservas: comportamiento honesto

1. Con `externalUrl`: enlace directo a la plataforma oficial.
2. Con `endpoint`: formulario de 4 pasos (servicio, profesional, fecha y franja, datos) con estados de envío, error y confirmación real.
3. Con solo `SALON.email`: abre el correo con la solicitud preparada y avisa de que la cita no está confirmada.
4. Sin nada configurado: avisa de que las reservas online no están disponibles. Nunca simula una cita confirmada.

Las franjas horarias son preferencias (no hay disponibilidad real sin backend ni plataforma).

## Pendiente antes de publicar

- Datos reales del negocio y páginas legales (aviso legal, privacidad, cookies).
- Fotografías propias y reseñas reales.
- Añadir JSON-LD `HairSalon` y ajustar `<title>`/Open Graph en `index.html` cuando existan datos reales.

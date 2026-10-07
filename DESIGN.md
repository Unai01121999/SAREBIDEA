# Sarebidea — Landing page · Documento de diseño

## 1. Objetivo de negocio

- **Quién entra:** dueños de comercios y pequeños negocios (restaurante, peluquería, clínica, taller, tienda, profesional independiente). No son técnicos, entran casi siempre desde el móvil y desconfían de "las agencias".
- **Qué tienen que pensar en 5 segundos:** "Esto parece una empresa seria, moderna, y saben hacer que un negocio como el mío se vea increíble".
- **Conversión:** una única acción, *pedir propuesta*. Todos los CTA llevan al mismo formulario corto al final (#contacto), que pide lo mínimo (nombre, tipo de negocio, teléfono/email).
- **Objeciones a resolver, en orden:** ¿me sirve a mí? (Ejemplos por sector) → ¿qué incluye? (Servicios) → ¿me va a dar trabajo? (Cómo funciona) → ¿es de fiar? (FAQ).
- **Nombre:** se usa *Sarebidea* (nombre del proyecto; en euskera "sare" = red, "bidea" = camino) como marca provisional. Cambiable en `src/data/site.ts`.

## 2. Arquitectura de la página

| # | Sección | Trabajo que hace | CTA |
|---|---|---|---|
| 0 | Navbar sticky | Orientación + CTA siempre visible | Crear mi web |
| 1 | Hero + escena 3D | Promesa + prueba visual inmediata (una web de verdad flotando) | Quiero mi web / Ver ejemplos |
| 2 | El problema | Espejo: "esa es mi web". Mockup de web antigua anotada como una revisión de diseño | — |
| 3 | Servicios | Qué incluye: 6 tarjetas con la misma estructura (visual, etiqueta, título, frase y 3 puntos "incluye") + franja "Y además, siempre incluido" | — |
| 4 | Cómo funciona | 3 pasos con línea de progreso ligada al scroll. "Tú no haces nada" | Empezar |
| 5 | Ejemplos | 7 webs de sector en browser mockups 3D con tilt | Quiero una así |
| 9 | FAQ | 8 preguntas, acordeón accesible | — |
| 10 | CTA final + formulario | Cierre con glow animado y formulario de 3 campos | Quiero mi web |
| 11 | Footer | Navegación, legal, redes | — |

## 3. Sistema visual

- **Claro u oscuro:** decidido por el uso real (un comerciante, de día, en el móvil) → **lienzo claro y cálido** con una "inmersión" oscura en el CTA final y el footer que dan ritmo y profundidad. Evita el cliché de "SaaS oscuro con neón".
- **Color:** tinta casi negra `#0D0E12`, papel `#F5F3EF`, un solo acento **cobalto** `#3A3FF2` con sus tintes. Los gradientes son de luz (cobalto → lila → melocotón muy desaturados), nunca de UI.
- **Tipografía:** *Funnel Display* (titulares grandes, tracking −0.035em) + *Geist* (texto). Escala: 88/64/44/28/18/15 px en desktop, fluida con `clamp()`.
- **Forma:** radios 14/22/32 px, bordes de 1px con alfa, sombras con offset y blur (profundidad real, no halos).
- **Glass:** solo en dos sitios con función: navbar al hacer scroll y las tarjetas flotantes de la escena 3D.
- **Iconos:** SVG propios, trazo 1.5px. Sin emojis ni iconos de stock.
- **Superficies del navegador:** selección, focus ring, scrollbar y caret tematizados.

## 4. Estrategia de animación

- **Un momento protagonista:** la escena 3D del hero (web desktop + móvil + notificación de "nueva solicitud") que sigue al ratón con muelles y un reflejo especular que se desplaza con la luz.
- Resto: revelados de texto por máscara en titulares, línea de progreso en "Cómo funciona", tilt 3D en ejemplos, botones magnéticos, navbar dinámica, glow animado en CTA final, scroll suave (Lenis).
- **Curvas:** `cubic-bezier(0.23,1,0.32,1)` para entradas, muelles `{duration .5, bounce .15}` para lo que sigue al ratón. UI < 300 ms.
- **Rendimiento:** solo `transform`/`opacity`/`clip-path`; sin WebGL (el 3D es CSS 3D con DOM real: nítido, accesible y ~0 KB extra). Hover gateado con `(hover:hover) and (pointer:fine)`.
- **`prefers-reduced-motion`:** sin parallax, sin tilt, sin scroll suave, sin flotación; los revelados pasan a fundido simple.
- **Móvil:** escena 3D simplificada y estática (sin seguimiento), tilt desactivado, menú a pantalla completa.

## 5. Componentes

```
src/
  data/site.ts            ← todo el contenido editable (textos, planes, FAQ, ejemplos, testimonios)
  lib/motion.ts           ← curvas y variantes compartidas
  hooks/                  ← useMagnetic, useTilt, useLenis
  components/
    ui/                   ← Button (magnético), Logo, Icon, Reveal, TextReveal, Section
    mockups/              ← BrowserFrame, PhoneFrame, SiteMock (mini-webs por sector)
  sections/               ← Navbar, Hero, HeroScene, Problem, Services, Process,
                             Showcase, Faq, FinalCta, Footer
```

Sustituir ejemplos por capturas reales: cada proyecto en `site.ts` acepta `image` (ruta a captura); si existe, el mockup la muestra en lugar del placeholder.

> 2026-10-05: eliminadas a petición de Unai las secciones de Precios y "Más que una web bonita" (Diferenciación).
> 2026-10-05: eliminada a petición de Unai la sección de testimonios de ejemplo.

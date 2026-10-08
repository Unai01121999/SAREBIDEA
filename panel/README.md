# SAREBIDEA · Panel de administración

Panel privado para gestionar el negocio de webs: **clientes, webs, dominios, hosting, facturación y tareas** en un solo sitio.

- **Next.js 16** (App Router) · **React 19** · **TypeScript** estricto
- **Tailwind CSS 4** con componentes al estilo shadcn/ui (Radix UI) · modo claro y oscuro
- **TanStack Query** (datos) · **TanStack Table** (tablas) · **Zustand** (estado de interfaz)
- **react-hook-form + Zod** (formularios) · **dnd-kit** (Kanban) · **Recharts** (gráficos)
- **Prisma 7 + PostgreSQL** (esquema y seed listos)

Es una aplicación **independiente de la web pública** (que sigue en la raíz del repositorio, con Vite y Hostinger).

## Arrancar

```bash
cd panel
npm install        # instala y genera el cliente de Prisma
npm run dev        # http://localhost:3000
```

Sin configurar nada, el panel funciona con **datos de ejemplo** guardados en el navegador (modo `mock`): 48 clientes, 60 webs, 54 dominios, 43 hostings, 166 facturas, 30 tareas y actividad. En *Configuración → Datos* se pueden restablecer.

## Qué incluye

| Módulo | Qué hace |
|---|---|
| **Dashboard** | 8 KPI (clientes, webs activas/en desarrollo/archivadas, dominios, hosting, facturación mensual y anual), gráfico de ingresos, actividad reciente, próximas renovaciones de dominios y hosting, últimas tareas completadas y últimos clientes |
| **Clientes** | Tabla con búsqueda, orden, filtros, paginación, columnas visibles y exportación a CSV. Ficha con datos, servicios, webs, dominios, facturación e historial. Crear, editar, archivar y eliminar |
| **Webs** | Listado por estado (producción, desarrollo, pausadas, archivadas), ficha con datos técnicos (staging, repositorio, rama, hosting) y acciones rápidas |
| **Dominios** | Alertas por color (caducado, 7, 15 y 30 días), filtros, ficha con DNS y nameservers |
| **Hosting** | Listado, indicadores (activos, próximos a renovar, coste anual) y ficha |
| **Facturación** | Facturas con estados, KPI financieros, evolución de ingresos, facturación por cliente y reparto por servicios. Numeración correlativa automática |
| **Tareas** | Kanban con arrastrar y soltar (ratón, táctil y teclado), filtros, etiquetas y comentarios internos |
| **Configuración** | Empresa, impuestos y moneda, usuarios y roles (matriz de permisos), proveedores de hosting y registradores |

Extras: búsqueda global (**Ctrl/⌘ + K**), menú «Nuevo» en la cabecera, barra lateral fija y colapsable (cajón en móvil), migas de pan, estados de carga y vacíos, accesibilidad (foco visible, etiquetas, navegación con teclado, `prefers-reduced-motion`).

## Arquitectura

```
UI (páginas y componentes)
   │  hooks de TanStack Query  (src/hooks/use-entities.ts)
   ▼
Servicios  ──  interfaz DataSource / Repository  (src/services/repository.ts)
   │
   ├── mock-source.ts   datos en el navegador (ahora)
   └── (pendiente) fuente real contra PostgreSQL con Prisma
```

La interfaz solo conoce la interfaz `DataSource`. Cambiar de datos de ejemplo a PostgreSQL consiste en **implementar esa interfaz** y seleccionarla en `src/services/index.ts`; ninguna página ni componente cambia.

### Estructura de carpetas

```
panel/
├─ prisma/
│  ├─ schema.prisma        modelo de datos (User, Client, Website, Domain, Hosting, Invoice, Task…)
│  └─ seed.ts              carga los datos de ejemplo en PostgreSQL
├─ prisma.config.ts        configuración de Prisma 7 (URL, migraciones, seed)
└─ src/
   ├─ app/                 rutas (App Router)
   │  ├─ (app)/            zona con barra lateral: dashboard, clientes, webs, dominios, hosting,
   │  │                    facturacion, tareas, configuracion
   │  ├─ layout.tsx        raíz: fuente, tema, proveedores
   │  └─ globals.css       tokens de diseño (colores, radios) en claro/oscuro
   ├─ components/
   │  ├─ ui/               primitivas (botón, diálogo, tabla, select, tabs…) estilo shadcn
   │  ├─ layout/           app-shell, sidebar, header, búsqueda global, migas, tema
   │  ├─ data-table/       tabla avanzada reutilizable
   │  ├─ charts/           gráficos (ingresos, barras, donut)
   │  ├─ forms/            campos y diálogo de formulario compartidos
   │  ├─ clients|websites|domains|hosting|invoices|tasks|settings/   formularios y vistas de cada módulo
   │  ├─ dashboard/ shared/   KPI, listas, insignias de estado
   ├─ hooks/               TanStack Query: listados, detalle y mutaciones por entidad
   ├─ services/            DataSource, repositorio genérico y fuente de ejemplo
   ├─ store/               Zustand (menú, búsqueda)
   ├─ lib/                 utilidades, formato, etiquetas, métricas, navegación, CSV
   ├─ mocks/generate.ts    generador determinista de datos realistas (lo usan la app y el seed)
   └─ types/domain.ts      modelos TypeScript (reflejan el esquema de Prisma)
```

### Decisiones de diseño

- **Un único repositorio genérico** (`createEntityHooks` + `Repository<T>`) evita repetir CRUD siete veces y garantiza el mismo comportamiento de caché y avisos en todos los módulos.
- **Métricas como funciones puras** (`src/lib/metrics.ts`): se pueden testear y, llegado el caso, mover al servidor sin tocar la interfaz.
- **Dinero** en `Decimal(10,2)` en la base de datos (nunca `Float`); en la interfaz se maneja como número y se formatea con `Intl`.
- **Facturas protegidas**: la relación factura → cliente es `Restrict`; un cliente con facturas no se borra, se archiva (obligación de conservación).
- **Historial sin clave foránea** al cliente: sobrevive al borrado.

## Base de datos (Prisma + PostgreSQL)

Entidades: `User`, `Client`, `Website`, `Domain`, `Hosting`, `Invoice`, `Task`, más `TaskComment`, `ActivityLog` y `Setting`.

Pensado para **más de 500 clientes** (y muchos más):

- Índices en todas las claves de listados y búsquedas: estado + archivado, empresa, email, CIF, fecha de alta (descendente), `renewsAt` en dominios y hosting (alertas por rango), `status + dueAt` en facturas, `status + position` en tareas, etc.
- Claves de texto (`cuid`), sin autoincrementales que filtren volumen de negocio.
- Enumeraciones nativas de PostgreSQL y arrays (`services`, `labels`, `nameservers`).
- Para búsquedas de texto sobre miles de filas se recomienda añadir `pg_trgm` en una migración propia:

  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX client_company_trgm ON "Client" USING gin (company gin_trgm_ops);
  ```

### Conectar la base de datos

1. Copia `.env.example` a `.env` y pon `DATABASE_URL`. Puedes usar el PostgreSQL de tu proyecto de **Supabase** (*Project Settings → Database → Connection string*; para producción usa la URL del *pooler*).
2. Crea las tablas: `npm run db:migrate`
3. Carga los datos de ejemplo (opcional): `npm run db:seed`
4. Explora los datos: `npm run db:studio`

## Pasar a producción: lo que falta

El panel es completo a nivel de interfaz y de modelo de datos, pero **hoy no tiene backend ni inicio de sesión**. Antes de publicarlo con datos reales:

1. **Autenticación (imprescindible).** Protege todo el panel: Supabase Auth o Auth.js con acceso solo para el correo propietario y segundo factor, y un `middleware.ts` (`proxy.ts` en Next 16) que redirija a `/login`. No lo publiques sin esto.
2. **Fuente de datos real.** Implementa `DataSource` con Route Handlers o Server Actions que usen Prisma (con validación Zod en el servidor y comprobación de rol en cada operación) y actívala en `src/services/index.ts`. Conversiones a tener en cuenta: `Decimal ↔ number`, `Date ↔ ISO string`, `Client.archivedAt ↔ archived` y `TaskComment` como tabla.
3. **Paginación y filtros en servidor** cuando las tablas superen unos miles de filas (`manualPagination`, `manualSorting` y `manualFiltering` de TanStack Table).
4. **Roles**: la matriz de *Configuración → Usuarios y roles* es informativa; hay que aplicarla en el servidor.
5. **Alertas por correo** de renovaciones (tarea programada que consulte `renewsAt` a 30, 15 y 7 días) y copias de seguridad de la base de datos.
6. Alojamiento: Vercel o un VPS con Node. **No es compatible con el hosting compartido de Hostinger** (necesita ejecutar Node.js).

## Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` / `npm start` | Producción |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:generate` | Generar el cliente de Prisma |
| `npm run db:migrate` | Crear/actualizar tablas |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run db:studio` | Explorar la base de datos |

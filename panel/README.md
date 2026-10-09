# SAREBIDEA · Panel de administración

Panel privado para gestionar el negocio de webs: **clientes, webs, dominios, hosting, facturación y tareas** en un solo sitio.

- **Next.js 16** (App Router) · **React 19** · **TypeScript** estricto
- **Tailwind CSS 4** con componentes al estilo shadcn/ui (Radix UI) · modo claro y oscuro
- **TanStack Query** (datos) · **TanStack Table** (tablas) · **Zustand** (estado de interfaz)
- **react-hook-form + Zod** (formularios) · **dnd-kit** (Kanban) · **Recharts** (gráficos)
- **Prisma 7 + PostgreSQL** (esquema y seed listos)

Se compila como **sitio estático** y se publica en `/panel/` junto a la web pública (que sigue en la raíz del repositorio con Vite). El botón «Área privada» de la web abre `/panel/`. Desde la raíz del repositorio, `npm run build:all` compila ambas y las deja unidas en `dist/` para subir a Hostinger.

## Arrancar

```bash
cd panel
npm install        # instala y genera el cliente de Prisma
npm run dev        # http://localhost:3000/panel
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

1. **Autenticación.** Ya incluida: pantalla de acceso con correo, contraseña y segundo factor (Supabase), la misma sesión que la web pública (`src/components/auth/auth-gate.tsx`). Ojo: protege la *interfaz*; los datos reales deben protegerse además en la base de datos con RLS, porque el código del panel es público.
2. **Fuente de datos real.** Implementa `DataSource` con Route Handlers o Server Actions que usen Prisma (con validación Zod en el servidor y comprobación de rol en cada operación) y actívala en `src/services/index.ts`. Conversiones a tener en cuenta: `Decimal ↔ number`, `Date ↔ ISO string`, `Client.archivedAt ↔ archived` y `TaskComment` como tabla.
3. **Paginación y filtros en servidor** cuando las tablas superen unos miles de filas (`manualPagination`, `manualSorting` y `manualFiltering` de TanStack Table).
4. **Roles**: la matriz de *Configuración → Usuarios y roles* es informativa; hay que aplicarla en el servidor.
5. **Alertas por correo** de renovaciones (tarea programada que consulte `renewsAt` a 30, 15 y 7 días) y copias de seguridad de la base de datos.
6. Alojamiento: como el panel es estático, **sirve en el hosting compartido de Hostinger** (`public_html/panel`). Para mantenerlo así, los datos deben leerse y escribirse **desde el navegador con Supabase** (protegido con RLS), no con Prisma en un servidor. Prisma + PostgreSQL requiere un servidor Node (Vercel o un VPS).

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

## Origen de los clientes (alta manual o formulario)
Cada cliente guarda cómo llegó (`origin`): **Alta manual** (creado en el panel) o **Formulario web**. Se ve como insignia en la cabecera de la ficha, como columna y filtro en el listado y en la pestaña **Origen** de la ficha, que muestra además lo que la persona escribió en el formulario.

Las solicitudes del formulario se importan solas desde la tabla `leads` de Supabase al abrir el panel y cada 3 minutos (`src/services/leads-sync.ts`). Es idempotente: cada solicitud se identifica por `sourceId` y no se duplica.

## Datos enlazados (no rellenar dos veces)
Todo cuelga de la ficha del cliente: webs, dominios, hosting, facturas y tareas guardan solo el **identificador** del cliente, nunca una copia de sus datos. Si cambias su nombre, correo o dirección, se actualiza en todas partes.

Además, los formularios nuevos **se rellenan solos** con lo que ya se sabe (`src/lib/prefill.ts`; solo toca los campos que no hayas editado):
- **Web:** nombre, dominio (el de su correo, o el nombre de la empresa), URL de producción y de staging, hosting, tecnología y lo que pidió en el formulario.
- **Dominio:** el dominio de su web, la web asociada (si solo tiene una), registrador, nameservers y coste según lo que ya tiene.
- **Hosting:** web asociada, proveedor, plan y coste.
- **Factura:** datos fiscales del cliente (CIF y dirección) a la vista y un selector «Facturar un servicio del cliente» que rellena concepto, descripción, importe y recurrencia desde su hosting, dominio o web. Cada factura queda enlazada (`websiteId`, `domainId`, `hostingId`) y aparece en «Facturas relacionadas» de esa web, dominio o hosting.
- **Tarea:** si el cliente tiene una sola web, se asocia sola.
- El cliente **añade solo los servicios contratados** (diseño web, dominio, hosting, mantenimiento…) al crear lo correspondiente.

## Web, dominio y hosting desde la ficha del cliente

El formulario de cliente (alta y edición) incluye un bloque opcional «Web, dominio y hosting». Si se deja vacío no se crea nada. Si se rellena un apartado, se crea automáticamente el registro en su listado (Webs, Dominios, Hosting), asociado al cliente, y el dominio y el hosting quedan enlazados a la web nueva. El hosting se elige de la lista de proveedores de Configuración. Los campos que falten toman valores por defecto (renovación a un año, plan «Básico», etc.).

## Packs

En **Webs → Añadir pack** se elige cliente y pack: Starter (399 € + IVA, mantenimiento 19 €/mes), Professional (699 € + IVA, 29 €/mes) o Premium (1.199 € + IVA, 49 €/mes). Se crea la web (en desarrollo, con el pack anotado) y, opcionalmente, la factura del pack y la factura recurrente del primer mes de mantenimiento. Los precios están en `src/lib/packs.ts`.

## Datos en Supabase

Con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` definidas al compilar, el panel guarda todo en Supabase (`src/services/supabase-source.ts`): `clients`, `websites`, `domains`, `hostings`, `invoices`, `tasks`, `panel_users`, `activity` y `app_settings`. Las tablas se crean con `supabase/migrations/004_panel_datos.sql`.

- **Seguridad:** RLS activado y una única política por tabla, `is_admin()` (correo en `admin_emails` + doble factor). El visitante anónimo no tiene ningún permiso sobre estas tablas.
- **Formulario → cliente:** un trigger (`leads_to_client`) crea el cliente con origen «Formulario web» al llegar cada solicitud. No hace falta tener el panel abierto.
- **Datos antiguos del navegador:** en *Configuración → Datos* se pueden subir a Supabase o descartar (sin duplicar los clientes del formulario).
- Sin esas variables, el panel funciona en modo demostración con datos de ejemplo en el navegador.

## Usuarios y roles

Se gestionan en **Configuración → Usuarios y roles** (solo el propietario puede cambiarlos; el administrador los ve).

- **Alta:** crea la cuenta de acceso en Supabase Authentication con una contraseña temporal (se muestra una sola vez) y una fila en `panel_users` con el rol. La primera vez que entra, la persona configura el doble factor.
- **Cambios:** rol, activar/desactivar, restablecer contraseña y eliminar. Todo pasa por la Edge Function `manage-panel-users` (`supabase/functions/manage-panel-users`), que solo acepta al propietario con doble factor. `admin_emails` se sincroniza sola desde `panel_users`.
- **Permisos (los aplica la base de datos con RLS; el panel solo oculta lo que no corresponde):**

| Módulo | Propietario | Administrador | Editor | Solo lectura |
|---|---|---|---|---|
| Clientes, webs, dominios, hosting | todo | todo | todo | lectura |
| Tareas | todo | todo | todo | lectura |
| Facturación | todo | todo | lectura | sin acceso |
| Configuración y usuarios | todo | lectura | sin acceso | sin acceso |

Migración: `supabase/migrations/005_roles_y_usuarios.sql`.

## Historial de cambios (tabla `activity`)

Lo escribe la propia base de datos con disparadores (`supabase/migrations/006_historial_automatico.sql`), así que queda anotado cualquier cambio de clientes, webs, dominios, hosting, facturas, tareas y ajustes, con el **nombre de quien lo hizo** (sale de `panel_users`) y los campos modificados. Las altas, cambios y bajas de usuarios las anota la función `manage-panel-users`. No se anotan los movimientos de tarjetas del tablero ni los cambios automáticos de servicios.

## Nombres de la base de datos (en español)

Tablas: `clientes`, `webs`, `dominios`, `alojamientos` (hosting), `facturas`, `tareas`, `usuarios_panel`, `actividad`, `ajustes`, `solicitudes` (formulario de la web) y `correos_admin`. Las columnas también están en español (`empresa`, `persona_contacto`, `correo`, `fecha_renovacion`, `coste_anual`, `creado_el`…).

La correspondencia con los campos del código está en un único archivo, `src/services/db-schema.ts`. Los valores guardados (`ACTIVE`, `OWNER`, `PENDING`…) siguen en inglés. Los nombres de las funciones SQL (`panel_role`, `panel_can`…) tampoco cambian. Migración documentada en `supabase/migrations/007_nombres_en_espanol.sql`.

La vista `leads` es **temporal**: mantiene vivo el formulario de la versión anterior de la web. Una vez publicada la nueva versión, bórrala en el SQL Editor: `drop view public.leads;`

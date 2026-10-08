import type { DataSource } from './repository'
import { mockSource } from './mock-source'

/**
 * Fuente de datos activa.
 * - "mock": datos de ejemplo en el navegador (por defecto).
 * - "prisma": PostgreSQL real. Hay que implementar `DataSource` contra los Route Handlers de /api (ver README, apartado "Pasar a producción").
 */
export const dataSource: DataSource = mockSource

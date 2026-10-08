// Configuración de Prisma 7: el esquema, las migraciones, el seed y la URL de conexión viven aquí.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` (postinstall) no se conecta: el valor de reserva evita que falle la instalación sin .env.
    // Para migrar o cargar el seed hace falta la URL real en .env.
    url: process.env.DATABASE_URL ?? 'postgresql://sin-configurar:sin-configurar@localhost:5432/sin-configurar',
  },
})

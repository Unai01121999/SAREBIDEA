// Base de datos de ejemplo en el navegador (localStorage). Solo se usa con NEXT_PUBLIC_DATA_SOURCE="mock".
// En producción se sustituye por Prisma + PostgreSQL sin tocar la interfaz (ver src/services).
import { generateDataset, type Dataset } from '@/mocks/generate'

const KEY = 'sarebidea-panel-db-v1'
let db: Dataset | null = null

export function getDb(): Dataset {
  if (db) return db
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    db = raw ? (JSON.parse(raw) as Dataset) : generateDataset()
  } catch {
    db = generateDataset()
  }
  return db
}

export function persistDb() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* almacenamiento bloqueado: se mantiene en memoria durante la sesión */
  }
}

export function resetDb() {
  db = generateDataset()
  persistDb()
  return db
}

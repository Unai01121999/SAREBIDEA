import type { ActivityEntry, AppSettings, EntityMap, EntityName, NewEntity } from '@/types/domain'

/** Contrato de acceso a datos. La UI solo conoce esta interfaz: hay una implementación en memoria y otra HTTP/Prisma. */
export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | null>
  create(input: NewEntity<T>): Promise<T>
  update(id: string, patch: Partial<NewEntity<T>>): Promise<T>
  remove(id: string): Promise<void>
}

export interface DataSource {
  repo<K extends EntityName>(name: K): Repository<EntityMap[K]>
  activity: { list(): Promise<ActivityEntry[]> }
  settings: { get(): Promise<AppSettings>; update(patch: Partial<AppSettings>): Promise<AppSettings> }
  reset?(): Promise<void>
}

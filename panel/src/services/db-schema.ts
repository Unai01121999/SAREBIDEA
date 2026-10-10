// Nombres de tablas y columnas de Supabase (en español) y su correspondencia con los campos del panel (camelCase en inglés).
// Es el único sitio que conoce los nombres de la base de datos: si cambian, solo hay que tocar este archivo.
import type { EntityName } from '@/types/domain'

const COMUN = { id: 'id', createdAt: 'creado_el', updatedAt: 'actualizado_el' }

export const TABLAS: Record<EntityName, string> = {
  clients: 'clientes',
  websites: 'webs',
  domains: 'dominios',
  hostings: 'alojamientos',
  invoices: 'facturas',
  tasks: 'tareas',
  users: 'usuarios_panel',
}

/** campo del panel → columna de la tabla */
export const COLUMNAS: Record<EntityName, Record<string, string>> = {
  clients: { ...COMUN, company: 'empresa', contactName: 'persona_contacto', email: 'correo', phone: 'telefono', address: 'direccion', postalCode: 'codigo_postal', province: 'provincia', country: 'pais', taxId: 'cif_nif', status: 'estado', services: 'servicios', notes: 'notas', archived: 'archivado', packInterest: 'pack_interes', origin: 'origen', sourceId: 'id_origen', formData: 'datos_formulario' },
  websites: { ...COMUN, clientId: 'cliente_id', name: 'nombre', status: 'estado', technology: 'tecnologia', description: 'descripcion', domainName: 'nombre_dominio', productionUrl: 'url_produccion', stagingUrl: 'url_pruebas', repoUrl: 'url_repositorio', mainBranch: 'rama_principal', hostingProvider: 'proveedor_hosting', pack: 'pack', startDate: 'fecha_inicio', publishDate: 'fecha_publicacion' },
  domains: { ...COMUN, clientId: 'cliente_id', websiteId: 'web_id', name: 'nombre', registrar: 'registrador', registeredAt: 'fecha_registro', renewsAt: 'fecha_renovacion', annualCost: 'coste_anual', autoRenew: 'renovacion_automatica', dns: 'dns', nameservers: 'servidores_dns', notes: 'notas' },
  hostings: { ...COMUN, clientId: 'cliente_id', websiteId: 'web_id', provider: 'proveedor', plan: 'plan', annualCost: 'coste_anual', contractedAt: 'fecha_contratacion', renewsAt: 'fecha_renovacion', active: 'activo', notes: 'notas' },
  invoices: { ...COMUN, number: 'numero', clientId: 'cliente_id', concept: 'concepto', description: 'descripcion', issuedAt: 'fecha_emision', dueAt: 'fecha_vencimiento', subtotal: 'base_imponible', taxRate: 'iva', status: 'estado', recurring: 'recurrente', websiteId: 'web_id', domainId: 'dominio_id', hostingId: 'alojamiento_id' },
  tasks: { ...COMUN, title: 'titulo', description: 'descripcion', clientId: 'cliente_id', websiteId: 'web_id', priority: 'prioridad', status: 'estado', labels: 'etiquetas', comments: 'comentarios', position: 'posicion', dueAt: 'fecha_limite', completedAt: 'completada_el' },
  users: { ...COMUN, name: 'nombre', email: 'correo', role: 'rol', active: 'activo', authId: 'id_autenticacion' },
}

export const TABLA_ACTIVIDAD = 'actividad'
export const COLUMNAS_ACTIVIDAD: Record<string, string> = { ...COMUN, entity: 'entidad', entityId: 'entidad_id', clientId: 'cliente_id', message: 'mensaje', actor: 'autor' }
export const TABLA_AJUSTES = 'ajustes'
export const TABLA_SOLICITUDES = 'solicitudes'

const invertir = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]))

/** Convierte un objeto del panel en una fila de la tabla (solo cambian las claves de primer nivel; los JSON conservan las suyas). */
export function aFila(cols: Record<string, string>, obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [cols[k] ?? k, v]))
}

/** Convierte una fila de la tabla en un objeto del panel. */
export function desdeFila<T>(cols: Record<string, string>, fila: Record<string, unknown>): T {
  const inv = invertir(cols)
  return Object.fromEntries(Object.entries(fila).map(([k, v]) => [inv[k] ?? k, v])) as T
}

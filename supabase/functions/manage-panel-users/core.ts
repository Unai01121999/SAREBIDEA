// Lógica de «Usuarios y roles» del panel, separada de Deno/Supabase para poder probarla con un almacén falso.
// Solo el propietario (OWNER, activo y con doble factor) puede crear, cambiar, restablecer o borrar usuarios.

export const ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] as const
export type Role = (typeof ROLES)[number]

export interface PanelUserRow {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  auth_id: string | null
  created_at?: string
  updated_at?: string
}

export interface Store {
  /** Usuario de la sesión: correo y nivel de autenticación (aal2 = con doble factor). `null` si el token no vale. */
  caller(jwt: string): Promise<{ email: string; aal: string } | null>
  panelUserByEmail(email: string): Promise<PanelUserRow | null>
  panelUserById(id: string): Promise<PanelUserRow | null>
  insertPanelUser(row: PanelUserRow): Promise<void>
  updatePanelUser(id: string, patch: Partial<PanelUserRow>): Promise<PanelUserRow>
  deletePanelUser(id: string): Promise<void>
  /** Crea la cuenta de acceso. Si el correo ya existía en Authentication, devuelve su id y le cambia la contraseña. */
  authCreateOrReset(email: string, password: string): Promise<{ id: string }>
  authSetPassword(authId: string, password: string): Promise<void>
  authDelete(authId: string): Promise<void>
  randomId(): string
  randomPassword(): string
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function requireOwner(store: Store, authorization: string | null) {
  const jwt = authorization?.replace(/^Bearer\s+/i, '')
  if (!jwt) throw new HttpError(401, 'Falta iniciar sesión')
  const who = await store.caller(jwt)
  if (!who) throw new HttpError(401, 'Sesión no válida')
  if (who.aal !== 'aal2') throw new HttpError(403, 'Hace falta el segundo factor')
  const me = await store.panelUserByEmail(who.email.toLowerCase())
  if (!me || !me.active || me.role !== 'OWNER') throw new HttpError(403, 'Solo el propietario puede gestionar usuarios')
  return me
}

const toPublic = (u: PanelUserRow) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.created_at, updatedAt: u.updated_at })

export async function handle(store: Store, authorization: string | null, body: Record<string, unknown>) {
  const me = await requireOwner(store, authorization)
  const action = String(body.action ?? '')

  if (action === 'create') {
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const role = String(body.role ?? '') as Role
    if (name.length < 2) throw new HttpError(400, 'Escribe el nombre')
    if (!EMAIL.test(email)) throw new HttpError(400, 'Revisa el correo electrónico')
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) throw new HttpError(400, 'Rol no válido')
    const password = body.password ? String(body.password) : store.randomPassword()
    if (password.length < 10) throw new HttpError(400, 'La contraseña debe tener al menos 10 caracteres')
    if (await store.panelUserByEmail(email)) throw new HttpError(409, 'Ese correo ya tiene acceso al panel')
    const auth = await store.authCreateOrReset(email, password)
    const row: PanelUserRow = { id: `usr_${store.randomId()}`, name, email, role, active: true, auth_id: auth.id }
    await store.insertPanelUser(row)
    return { user: toPublic(row), tempPassword: password }
  }

  const target = await store.panelUserById(String(body.id ?? ''))
  if (!target) throw new HttpError(404, 'Usuario no encontrado')
  if (target.id === me.id && action !== 'update') throw new HttpError(400, 'No puedes hacerlo con tu propia cuenta')

  if (action === 'update') {
    const patch: Partial<PanelUserRow> = {}
    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (name.length < 2) throw new HttpError(400, 'Escribe el nombre')
      patch.name = name
    }
    if (body.role !== undefined) {
      if (target.role === 'OWNER') throw new HttpError(400, 'No se puede cambiar el rol del propietario')
      if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(String(body.role))) throw new HttpError(400, 'Rol no válido')
      patch.role = body.role as Role
    }
    if (body.active !== undefined) {
      if (target.role === 'OWNER') throw new HttpError(400, 'No se puede desactivar al propietario')
      patch.active = Boolean(body.active)
    }
    const saved = await store.updatePanelUser(target.id, { ...patch, updated_at: new Date().toISOString() })
    return { user: toPublic(saved) }
  }

  if (target.role === 'OWNER') throw new HttpError(400, 'No se puede hacer con el propietario')

  if (action === 'reset_password') {
    const password = store.randomPassword()
    if (!target.auth_id) {
      const auth = await store.authCreateOrReset(target.email, password)
      await store.updatePanelUser(target.id, { auth_id: auth.id })
    } else {
      await store.authSetPassword(target.auth_id, password)
    }
    return { tempPassword: password }
  }

  if (action === 'delete') {
    await store.deletePanelUser(target.id)
    if (target.auth_id) await store.authDelete(target.auth_id)
    return { ok: true }
  }

  throw new HttpError(400, 'Acción no válida')
}

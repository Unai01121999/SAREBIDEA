'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, KeyRound, Minus, Plus, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field, SelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usersApi } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { dataSource } from '@/services'
import { createPanelUser, deletePanelUser, resetPanelUserPassword, updatePanelUser } from '@/services/panel-users'
import { roleLabel } from '@/lib/labels'
import { USER_ROLES, type AdminUser, type UserRole } from '@/types/domain'

const schema = z.object({ name: z.string().trim().min(2, 'Escribe el nombre'), email: z.email('Revisa el correo'), role: z.enum(USER_ROLES), password: z.string().refine((v) => v === '' || v.length >= 10, 'Mínimo 10 caracteres, o déjala vacía para generar una') })
type Values = z.infer<typeof schema>

/** Permisos por rol. Los aplica la base de datos (políticas RLS) y el panel oculta lo que no corresponde. */
const MATRIX: { module: string; roles: Record<UserRole, 'full' | 'read' | 'none'> }[] = [
  { module: 'Clientes, webs, dominios y hosting', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'full', VIEWER: 'read' } },
  { module: 'Tareas', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'full', VIEWER: 'read' } },
  { module: 'Facturación', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'read', VIEWER: 'none' } },
  { module: 'Configuración y usuarios', roles: { OWNER: 'full', ADMIN: 'read', EDITOR: 'none', VIEWER: 'none' } },
]
const cell = { full: <Check className="mx-auto size-4 text-success" aria-label="Acceso total" />, read: <span className="text-xs text-muted-foreground">Solo lectura</span>, none: <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="Sin acceso" /> }

export function UsersPanel() {
  const { data: users, isLoading } = usersApi.useList()
  const qc = useQueryClient()
  const canManage = useCan()('settings', 'write')
  const real = dataSource.kind === 'supabase'
  const mockCreate = usersApi.useCreate()
  const mockUpdate = usersApi.useUpdate(true)
  const mockRemove = usersApi.useRemove()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<AdminUser | undefined>()
  const [credentials, setCredentials] = useState<{ email: string; password: string; created: boolean } | null>(null)
  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', role: 'EDITOR', password: '' } })

  /** Con Supabase, las altas, cambios y bajas pasan por la función de servidor; en modo demostración se guardan en el navegador. */
  const run = async (task: () => Promise<unknown>, ok?: string) => {
    setBusy(true)
    try {
      await task()
      await qc.invalidateQueries()
      if (ok) toast.success(ok)
      return true
    } catch (err) {
      toast.error((err as Error).message || 'No se ha podido completar')
      return false
    } finally {
      setBusy(false)
    }
  }
  const setRole = (u: AdminUser, role: UserRole) => (real ? run(() => updatePanelUser(u.id, { role: role as Exclude<UserRole, 'OWNER'> }), 'Rol actualizado') : mockUpdate.mutate({ id: u.id, patch: { role } }))
  const setActive = (u: AdminUser, active: boolean) => (real ? run(() => updatePanelUser(u.id, { active }), active ? 'Acceso activado' : 'Acceso desactivado') : mockUpdate.mutate({ id: u.id, patch: { active } }))
  const resetPassword = (u: AdminUser) =>
    run(async () => {
      const r = await resetPanelUserPassword(u.id)
      setCredentials({ email: u.email, password: r.tempPassword, created: false })
    })
  const confirmDelete = async () => {
    if (!toDelete) return
    if (real) {
      if (await run(() => deletePanelUser(toDelete.id), 'Usuario eliminado')) setToDelete(undefined)
    } else mockRemove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })
  }

  const submit = handleSubmit(async (v) => {
    if (real) {
      const done = await run(async () => {
        const r = await createPanelUser({ name: v.name, email: v.email, role: v.role as Exclude<UserRole, 'OWNER'>, password: v.password || undefined })
        setCredentials({ email: r.user.email, password: r.tempPassword, created: true })
      })
      if (!done) return
    } else {
      await mockCreate.mutateAsync({ name: v.name, email: v.email, role: v.role, active: true })
    }
    reset()
    setOpen(false)
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Usuarios administradores</CardTitle>
            <CardDescription>{canManage ? 'Quién puede entrar al panel y con qué permisos.' : 'Quién puede entrar al panel y con qué permisos. Solo el propietario puede cambiarlos.'}</CardDescription>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> Añadir usuario
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <Skeleton className="mx-5 mb-5 h-32" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === 'OWNER' ? (
                        <Badge tone="brand" dot={false}>
                          {roleLabel.OWNER}
                        </Badge>
                      ) : (
                        <Select value={u.role} disabled={!canManage || busy} onValueChange={(v) => setRole(u, v as UserRole)}>
                          <SelectTrigger className="h-8 w-40" aria-label={`Rol de ${u.name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.filter((r) => r !== 'OWNER').map((r) => (
                              <SelectItem key={r} value={r}>
                                {roleLabel[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={u.active} disabled={u.role === 'OWNER' || !canManage || busy} onCheckedChange={(v) => setActive(u, v)} aria-label={`Activar ${u.name}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'OWNER' && canManage && (
                        <div className="flex justify-end gap-1">
                          {real && (
                            <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => resetPassword(u)} aria-label={`Restablecer contraseña de ${u.name}`} title="Restablecer contraseña" className="text-muted-foreground">
                              <KeyRound />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(u)} aria-label={`Eliminar ${u.name}`} className="text-muted-foreground hover:text-destructive">
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles y permisos</CardTitle>
          <CardDescription>Qué puede hacer cada rol.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                {USER_ROLES.map((r) => (
                  <TableHead key={r} className="text-center">
                    {roleLabel[r]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX.map((m) => (
                <TableRow key={m.module}>
                  <TableCell className="font-medium">{m.module}</TableCell>
                  {USER_ROLES.map((r) => (
                    <TableCell key={r} className="text-center">
                      {cell[m.roles[r]]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title="Añadir usuario" description="Se crea su cuenta de acceso con el rol que elijas. Verá solo las secciones que su rol permite." onSubmit={submit} submitting={busy || mockCreate.isPending} submitLabel="Crear usuario">
        <Field label="Nombre" required error={e.name?.message} htmlFor="u-name" className="sm:col-span-2">
          <Input id="u-name" {...register('name')} aria-invalid={!!e.name} />
        </Field>
        <Field label="Correo electrónico" required error={e.email?.message} htmlFor="u-email">
          <Input id="u-email" type="email" {...register('email')} aria-invalid={!!e.email} />
        </Field>
        <Field label="Rol" htmlFor="u-role">
          <SelectField control={control} name="role" id="u-role" options={USER_ROLES.filter((r) => r !== 'OWNER').map((r) => ({ value: r, label: roleLabel[r] }))} />
        </Field>
        {real && (
          <Field label="Contraseña temporal" error={e.password?.message} hint="Vacía = se genera una. Tendrá que configurar el doble factor al entrar." htmlFor="u-pass" className="sm:col-span-2">
            <Input id="u-pass" type="text" autoComplete="off" {...register('password')} aria-invalid={!!e.password} />
          </Field>
        )}
      </FormDialog>
      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{credentials?.created ? 'Usuario creado' : 'Nueva contraseña'}</DialogTitle>
            <DialogDescription>Compártelas por un canal seguro. La contraseña solo se muestra ahora; en su primer acceso configurará el doble factor.</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 px-6 py-5 text-sm">
            {[
              ['Correo', credentials?.email ?? ''],
              ['Contraseña temporal', credentials?.password ?? ''],
              ['Dirección del panel', `${typeof window !== 'undefined' ? window.location.origin : ''}/panel/`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="truncate font-mono">{v}</dd>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Copiar ${k}`} onClick={() => navigator.clipboard?.writeText(v).then(() => toast.success('Copiado'))}>
                  <Copy />
                </Button>
              </div>
            ))}
          </dl>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Hecho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title={`Eliminar a ${toDelete?.name ?? ''}`} description="Perderá el acceso al panel de inmediato." loading={busy || mockRemove.isPending} onConfirm={confirmDelete} />
    </div>
  )
}

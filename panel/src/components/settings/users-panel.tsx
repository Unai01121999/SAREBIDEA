'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field, SelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usersApi } from '@/hooks/use-entities'
import { roleLabel } from '@/lib/labels'
import { USER_ROLES, type AdminUser, type UserRole } from '@/types/domain'

const schema = z.object({ name: z.string().trim().min(2, 'Escribe el nombre'), email: z.email('Revisa el correo'), role: z.enum(USER_ROLES) })
type Values = z.infer<typeof schema>

/** Permisos por rol (referencia visual; en producción se aplican en el servidor). */
const MATRIX: { module: string; roles: Record<UserRole, 'full' | 'read' | 'none'> }[] = [
  { module: 'Clientes, webs, dominios y hosting', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'full', VIEWER: 'read' } },
  { module: 'Tareas', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'full', VIEWER: 'read' } },
  { module: 'Facturación', roles: { OWNER: 'full', ADMIN: 'full', EDITOR: 'read', VIEWER: 'none' } },
  { module: 'Configuración y usuarios', roles: { OWNER: 'full', ADMIN: 'read', EDITOR: 'none', VIEWER: 'none' } },
]
const cell = { full: <Check className="mx-auto size-4 text-success" aria-label="Acceso total" />, read: <span className="text-xs text-muted-foreground">Solo lectura</span>, none: <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="Sin acceso" /> }

export function UsersPanel() {
  const { data: users, isLoading } = usersApi.useList()
  const create = usersApi.useCreate()
  const update = usersApi.useUpdate(true)
  const remove = usersApi.useRemove()
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<AdminUser | undefined>()
  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', role: 'EDITOR' } })

  const submit = handleSubmit(async (v) => {
    await create.mutateAsync({ ...v, active: true })
    reset()
    setOpen(false)
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Usuarios administradores</CardTitle>
            <CardDescription>Quién puede entrar al panel y con qué permisos.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Invitar usuario
          </Button>
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
                        <Select value={u.role} onValueChange={(v) => update.mutate({ id: u.id, patch: { role: v as UserRole } })}>
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
                      <Switch checked={u.active} disabled={u.role === 'OWNER'} onCheckedChange={(v) => update.mutate({ id: u.id, patch: { active: v } })} aria-label={`Activar ${u.name}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'OWNER' && (
                        <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(u)} aria-label={`Eliminar ${u.name}`} className="text-muted-foreground hover:text-destructive">
                          <Trash2 />
                        </Button>
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

      <FormDialog open={open} onOpenChange={setOpen} title="Invitar usuario" description="Recibirá acceso al panel con el rol que elijas." onSubmit={submit} submitting={create.isPending} submitLabel="Invitar">
        <Field label="Nombre" required error={e.name?.message} htmlFor="u-name" className="sm:col-span-2">
          <Input id="u-name" {...register('name')} aria-invalid={!!e.name} />
        </Field>
        <Field label="Correo electrónico" required error={e.email?.message} htmlFor="u-email">
          <Input id="u-email" type="email" {...register('email')} aria-invalid={!!e.email} />
        </Field>
        <Field label="Rol" htmlFor="u-role">
          <SelectField control={control} name="role" id="u-role" options={USER_ROLES.filter((r) => r !== 'OWNER').map((r) => ({ value: r, label: roleLabel[r] }))} />
        </Field>
      </FormDialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title={`Eliminar a ${toDelete?.name ?? ''}`} description="Perderá el acceso al panel de inmediato." loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}

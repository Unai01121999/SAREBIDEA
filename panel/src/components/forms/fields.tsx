'use client'

import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { clientsApi, websitesApi } from '@/hooks/use-entities'
import { cn } from '@/lib/utils'

/** Campo con etiqueta, ayuda y error. */
export function Field({ label, error, hint, required, className, htmlFor, children }: { label: string; error?: string; hint?: string; required?: boolean; className?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

const NONE = '__none'

export interface Option {
  value: string
  label: string
}

/** Select controlado por react-hook-form. Si `allowNone`, la opción vacía se guarda como ''. */
export function SelectField<T extends FieldValues>({ control, name, options, placeholder = 'Selecciona…', allowNone, noneLabel = 'Ninguno', id }: { control: Control<T>; name: Path<T>; options: Option[]; placeholder?: string; allowNone?: boolean; noneLabel?: string; id?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select value={field.value ? String(field.value) : allowNone ? NONE : undefined} onValueChange={(v) => field.onChange(v === NONE ? '' : v)}>
          <SelectTrigger id={id} aria-invalid={!!fieldState.error}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {allowNone && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

export function SwitchField<T extends FieldValues>({ control, name, label, hint }: { control: Control<T>; name: Path<T>; label: string; hint?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-lg border px-3.5 py-2.5">
          <div>
            <Label htmlFor={`sw-${name}`}>{label}</Label>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <Switch id={`sw-${name}`} checked={!!field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  )
}

export function CheckboxGroupField<T extends FieldValues>({ control, name, options }: { control: Control<T>; name: Path<T>; options: Option[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = field.value ?? []
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/60 has-[[data-state=checked]]:border-brand/40 has-[[data-state=checked]]:bg-brand/5">
                <Checkbox checked={value.includes(o.value)} onCheckedChange={(c) => field.onChange(c ? [...value, o.value] : value.filter((v) => v !== o.value))} />
                {o.label}
              </label>
            ))}
          </div>
        )
      }}
    />
  )
}

/** Selector de cliente (alimentado por TanStack Query). */
export function ClientSelectField<T extends FieldValues>({ control, name, id }: { control: Control<T>; name: Path<T>; id?: string }) {
  const { data } = clientsApi.useList()
  const options = (data ?? []).filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.company }))
  return <SelectField control={control} name={name} options={options} placeholder="Elige un cliente" id={id} />
}

/** Selector de web, filtrado por el cliente elegido. */
export function WebsiteSelectField<T extends FieldValues>({ control, name, clientId, id }: { control: Control<T>; name: Path<T>; clientId?: string; id?: string }) {
  const { data } = websitesApi.useList()
  const options = (data ?? []).filter((w) => !clientId || w.clientId === clientId).map((w) => ({ value: w.id, label: w.domainName || w.name }))
  return <SelectField control={control} name={name} options={options} allowNone noneLabel="Sin web asociada" placeholder="Sin web asociada" id={id} />
}

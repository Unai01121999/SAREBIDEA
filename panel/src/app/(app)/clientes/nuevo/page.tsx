'use client'

import { useRouter } from 'next/navigation'
import { ClientFormFields, useClientForm } from '@/components/clients/client-form'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NewClientPage() {
  const router = useRouter()
  const { form, submit, submitting } = useClientForm(undefined, (saved) => router.push(saved ? `/clientes/${saved.id}` : '/clientes'))
  return (
    <div className="animate-fade-up">
      <PageHeader title="Nuevo cliente" description="Datos generales, servicios contratados y notas internas." crumbs={[{ label: 'Clientes', href: '/clientes' }, { label: 'Nuevo cliente' }]} />
      <form onSubmit={submit} noValidate>
        <Card className="max-w-3xl">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <ClientFormFields form={form} />
          </CardContent>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => router.push('/clientes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Crear cliente'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

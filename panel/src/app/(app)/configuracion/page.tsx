'use client'

import { Database, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { CompanyForm, TaxForm } from '@/components/settings/company-tax-forms'
import { ProvidersPanel } from '@/components/settings/providers-panel'
import { UsersPanel } from '@/components/settings/users-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResetData } from '@/hooks/use-entities'

export default function SettingsPage() {
  const reset = useResetData()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="animate-fade-up">
      <PageHeader title="Configuración" description="Empresa, impuestos, usuarios, roles y proveedores." crumbs={[{ label: 'Configuración' }]} />
      <Tabs defaultValue="empresa">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="impuestos">Impuestos y moneda</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios y roles</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa">
          <CompanyForm />
        </TabsContent>
        <TabsContent value="impuestos">
          <TaxForm />
        </TabsContent>
        <TabsContent value="usuarios">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="proveedores">
          <ProvidersPanel />
        </TabsContent>
        <TabsContent value="datos">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-muted-foreground" /> Datos de ejemplo
              </CardTitle>
              <CardDescription>Ahora mismo el panel funciona con datos ficticios guardados en este navegador. Al conectar PostgreSQL con Prisma, esta sección desaparece.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setConfirm(true)}>
                <RotateCcw /> Restablecer datos de ejemplo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Restablecer datos de ejemplo" description="Se borrarán los cambios que hayas hecho y se generarán de nuevo los datos ficticios." confirmLabel="Restablecer" loading={reset.isPending} onConfirm={() => reset.mutate(undefined, { onSuccess: () => setConfirm(false) })} />
    </div>
  )
}

'use client'

import { Archive, Building2, CircleDollarSign, Code2, Globe, Server, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { ActivityFeed, CompletedTasks, LatestClients, RenewalList } from '@/components/dashboard/widgets'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, domainsApi, hostingsApi, invoicesApi, tasksApi, useActivity, websitesApi } from '@/hooks/use-entities'
import { formatCurrency } from '@/lib/format'
import { routes } from '@/lib/routes'
import { dashboardStats, revenueSeries, upcomingRenewals } from '@/lib/metrics'

export default function DashboardPage() {
  const clients = clientsApi.useList()
  const websites = websitesApi.useList()
  const domains = domainsApi.useList()
  const hostings = hostingsApi.useList()
  const invoices = invoicesApi.useList()
  const tasks = tasksApi.useList()
  const activity = useActivity()

  const loading = [clients, websites, domains, hostings, invoices, tasks].some((q) => q.isLoading)
  const stats = useMemo(
    () => (loading ? null : dashboardStats({ clients: clients.data!, websites: websites.data!, domains: domains.data!, hostings: hostings.data!, invoices: invoices.data!, tasks: tasks.data! })),
    [loading, clients.data, websites.data, domains.data, hostings.data, invoices.data, tasks.data],
  )
  const series = useMemo(() => (invoices.data ? revenueSeries(invoices.data, 12) : []), [invoices.data])
  const domainRenewals = useMemo(() => upcomingRenewals(domains.data ?? [], 'domain', 45), [domains.data])
  const hostingRenewals = useMemo(() => upcomingRenewals((hostings.data ?? []).filter((h) => h.active), 'hosting', 45), [hostings.data])
  const completed = useMemo(() => (tasks.data ?? []).filter((t) => t.status === 'DONE').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 5), [tasks.data])
  const latestClients = useMemo(() => [...(clients.data ?? [])].filter((c) => !c.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [clients.data])

  const spark = series.map((s) => s.total)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dashboard"
        description="Visión global de tu negocio: clientes, webs, renovaciones y facturación."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/facturacion">
              <TrendingUp /> Ver facturación
            </Link>
          </Button>
        }
      />

      <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total clientes" value={String(stats?.clients ?? 0)} icon={Users} hint={stats ? `${stats.activeClients} activos` : undefined} href="/clientes" loading={loading} />
        <KpiCard label="Webs activas" value={String(stats?.webProduction ?? 0)} icon={Globe} accent="success" hint="En producción" href="/webs/produccion" loading={loading} />
        <KpiCard label="Webs en desarrollo" value={String(stats?.webDevelopment ?? 0)} icon={Code2} accent="info" hint="Proyectos en marcha" href="/webs/desarrollo" loading={loading} />
        <KpiCard label="Webs archivadas" value={String(stats?.webArchived ?? 0)} icon={Archive} accent="warning" hint="Histórico" href="/webs/archivadas" loading={loading} />
        <KpiCard label="Dominios gestionados" value={String(stats?.domains ?? 0)} icon={Building2} accent="info" hint={stats ? `${formatCurrency(stats.domainsCost)}/año` : undefined} href="/dominios" loading={loading} />
        <KpiCard label="Hosting activos" value={String(stats?.hostingActive ?? 0)} icon={Server} accent="success" hint={stats ? `${formatCurrency(stats.hostingCost)}/año` : undefined} href="/hosting" loading={loading} />
        <KpiCard label="Facturación mensual" value={formatCurrency(stats?.thisMonth ?? 0)} icon={CircleDollarSign} delta={stats?.monthDelta} hint="vs. mismo periodo anterior" spark={spark.slice(-8)} href="/facturacion" loading={loading} />
        <KpiCard label="Facturación anual" value={formatCurrency(stats?.thisYear ?? 0)} icon={TrendingUp} accent="success" hint="Base imponible del año" spark={spark} href="/facturacion" loading={loading} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos mensuales</CardTitle>
            <CardDescription>Últimos 12 meses · cobrado y pendiente (base imponible)</CardDescription>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-[280px] w-full" /> : <RevenueChart data={series} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity.data} loading={activity.isLoading} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Renovaciones de dominios</CardTitle>
              <CardDescription>Caducados y próximos 45 días</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dominios">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RenewalList items={domainRenewals} clients={clients.data} loading={domains.isLoading} href={routes.domain} empty="No hay dominios por renovar." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Renovaciones de hosting</CardTitle>
              <CardDescription>Caducados y próximos 45 días</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/hosting">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RenewalList items={hostingRenewals} clients={clients.data} loading={hostings.isLoading} href={routes.hosting} empty="No hay hosting por renovar." />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <CardTitle>Últimas tareas completadas</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tareas">Ir a tareas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <CompletedTasks tasks={completed} clients={clients.data} loading={tasks.isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <CardTitle>Últimos clientes añadidos</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/clientes">Ver clientes</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <LatestClients clients={latestClients} loading={clients.isLoading} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

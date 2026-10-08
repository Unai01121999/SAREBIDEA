import { WebsitesView } from '@/components/websites/websites-view'

// El panel se publica como sitio estático: los estados posibles se generan en la compilación.
export const dynamicParams = false

export function generateStaticParams() {
  return ['produccion', 'desarrollo', 'pausadas', 'archivadas', 'todas'].map((estado) => ({ estado }))
}

export default async function WebsitesPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado } = await params
  return <WebsitesView estado={estado} />
}

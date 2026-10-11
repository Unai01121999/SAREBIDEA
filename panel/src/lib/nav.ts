import { Building2, CheckSquare, CreditCard, Globe, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Destino al pulsar, si es distinto de `href` (que sirve para marcar la sección como activa). */
  to?: string
  children?: { label: string; href: string }[]
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    label: 'Webs',
    href: '/webs',
    icon: Globe,
    // Al pulsar «Webs» se abre la pestaña «Todas»; desde ahí se cambia a Producción, Desarrollo, etc.
    to: '/webs/todas',
  },
  { label: 'Dominios', href: '/dominios', icon: Building2 },
  { label: 'Facturación', href: '/facturacion', icon: CreditCard },
  { label: 'Tareas', href: '/tareas', icon: CheckSquare },
  { label: 'Configuración', href: '/configuracion', icon: Settings },
]

/** ¿Está activa esta ruta? (`/` solo coincide exacta). */
export const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

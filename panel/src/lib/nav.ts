import { Building2, CheckSquare, CreditCard, Globe, LayoutDashboard, Server, Settings, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  children?: { label: string; href: string }[]
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Users,
    children: [
      { label: 'Listado de clientes', href: '/clientes' },
      { label: 'Nuevo cliente', href: '/clientes/nuevo' },
    ],
  },
  {
    label: 'Webs',
    href: '/webs',
    icon: Globe,
    children: [
      { label: 'Producción', href: '/webs/produccion' },
      { label: 'Desarrollo', href: '/webs/desarrollo' },
      { label: 'Archivadas', href: '/webs/archivadas' },
    ],
  },
  { label: 'Dominios', href: '/dominios', icon: Building2 },
  { label: 'Hosting', href: '/hosting', icon: Server },
  { label: 'Facturación', href: '/facturacion', icon: CreditCard },
  { label: 'Tareas', href: '/tareas', icon: CheckSquare },
  { label: 'Configuración', href: '/configuracion', icon: Settings },
]

/** ¿Está activa esta ruta? (`/` solo coincide exacta). */
export const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

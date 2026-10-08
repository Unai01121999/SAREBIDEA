// Generador determinista de datos de ejemplo realistas.
// Lo usan el modo "mock" de la app y el seed de Prisma (prisma/seed.ts), por eso solo importa tipos con rutas relativas.
import type {
  ActivityEntry,
  AdminUser,
  AppSettings,
  Client,
  ClientStatus,
  Domain,
  Hosting,
  Invoice,
  InvoiceConcept,
  InvoiceStatus,
  ServiceType,
  Task,
  TaskPriority,
  TaskStatus,
  Technology,
  Website,
  WebsiteStatus,
} from '../types/domain'

export interface Dataset {
  clients: Client[]
  websites: Website[]
  domains: Domain[]
  hostings: Hosting[]
  invoices: Invoice[]
  tasks: Task[]
  users: AdminUser[]
  activity: ActivityEntry[]
  settings: AppSettings
}

// --- utilidades -----------------------------------------------------------------------------

/** PRNG mulberry32: misma semilla, mismos datos. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const pad = (n: number, w = 3) => String(n).padStart(w, '0')

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '')

// --- catálogos ------------------------------------------------------------------------------

const BUSINESS_TYPES = [
  'Panadería',
  'Restaurante',
  'Clínica Dental',
  'Fisioterapia',
  'Peluquería',
  'Floristería',
  'Taller',
  'Gestoría',
  'Ferretería',
  'Academia',
  'Estudio de Yoga',
  'Carpintería',
  'Librería',
  'Óptica',
  'Inmobiliaria',
  'Bodega',
]
const SURNAMES = [
  'Urrutia',
  'Etxeberria',
  'Zubiaur',
  'Arrieta',
  'Goikoetxea',
  'Lasa',
  'Mendizabal',
  'Aguirre',
  'Ibarra',
  'Olaizola',
  'Garmendia',
  'Uriarte',
  'Elorriaga',
  'Larrea',
  'Berasategui',
  'Iturbe',
]
const FIRST_NAMES = ['Maite', 'Iker', 'Ane', 'Joseba', 'Nerea', 'Unai', 'Amaia', 'Mikel', 'Leire', 'Asier', 'Itziar', 'Gorka', 'Izaro', 'Aitor', 'Oihana', 'Jon']
const STREETS = ['Gran Vía', 'Kale Nagusia', 'Calle Mayor', 'Avenida de la Libertad', 'Calle Ercilla', 'Plaza Nueva', 'Calle Autonomía', 'Paseo del Árbol de Gernika']
const PROVINCES: { name: string; prefix: string; w: number }[] = [
  { name: 'Bizkaia', prefix: '48', w: 6 },
  { name: 'Gipuzkoa', prefix: '20', w: 2 },
  { name: 'Álava', prefix: '01', w: 1.5 },
  { name: 'Navarra', prefix: '31', w: 1 },
  { name: 'Madrid', prefix: '28', w: 1 },
  { name: 'Barcelona', prefix: '08', w: 0.7 },
]
const TLDS = ['.com', '.es', '.eus', '.com', '.es']
const NAMESERVERS: Record<string, string[]> = {
  Hostinger: ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
  OVH: ['dns200.anycast.me', 'ns200.anycast.me'],
  Cloudflare: ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
  DonDominio: ['ns1.dondominio.com', 'ns2.dondominio.com'],
  GoDaddy: ['ns55.domaincontrol.com', 'ns56.domaincontrol.com'],
  Otros: ['ns1.proveedor-dns.net', 'ns2.proveedor-dns.net'],
}
const HOSTING_PLANS: Record<string, string[]> = {
  Hostinger: ['Premium', 'Business', 'Cloud Startup'],
  SiteGround: ['StartUp', 'GrowBig', 'GoGeek'],
  OVH: ['Perso', 'Pro', 'Performance'],
  Cloudways: ['DigitalOcean 1 GB', 'DigitalOcean 2 GB', 'Vultr HF 2 GB'],
  Raiola: ['Hosting Básico', 'Hosting Pro', 'Hosting Empresa'],
  Otros: ['Plan compartido', 'VPS 2 GB'],
}
const TASK_LABELS = ['SEO', 'Diseño', 'Bug', 'Contenido', 'Migración', 'Mantenimiento', 'Facturación', 'Cliente urgente']

export const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: 'SAREBIDEA',
    taxId: '79078063S',
    address: 'Gueñes, Bizkaia',
    email: 'sarebidea@sarebidea.com',
    phone: '',
    website: 'https://sarebidea.com',
  },
  taxes: { vat: 21, irpf: 15 },
  currency: 'EUR',
  hostingProviders: ['Hostinger', 'SiteGround', 'OVH', 'Cloudways', 'Raiola', 'Otros'],
  domainRegistrars: ['Hostinger', 'OVH', 'Cloudflare', 'DonDominio', 'GoDaddy', 'Otros'],
}

// --- generador ------------------------------------------------------------------------------

/** Conjunto vacío (solo la persona propietaria y los ajustes): punto de partida para trabajar con datos reales. */
export function emptyDataset(now: Date = new Date()): Dataset {
  const t = now.toISOString()
  return {
    clients: [],
    websites: [],
    domains: [],
    hostings: [],
    invoices: [],
    tasks: [],
    users: [{ id: 'usr_001', name: 'Unai Padura Larrea', email: 'sarebidea@sarebidea.com', role: 'OWNER', active: true, createdAt: t, updatedAt: t }],
    activity: [],
    settings: DEFAULT_SETTINGS,
  }
}

export function generateDataset(now: Date = new Date(), seed = 20260707): Dataset {
  const rand = rng(seed)
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const chance = (p: number) => rand() < p
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
  const weighted = <T,>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = rand() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
  const t0 = new Date(now)
  t0.setHours(12, 0, 0, 0)
  const at = (offsetDays: number) => new Date(t0.getTime() + offsetDays * DAY).toISOString()
  const money = (n: number) => Math.round(n * 100) / 100

  // Clientes -----------------------------------------------------------------------------
  const clients: Client[] = []
  const usedNames = new Set<string>()
  for (let i = 0; i < 48; i++) {
    let company = ''
    while (!company || usedNames.has(company)) company = `${pick(BUSINESS_TYPES)} ${pick(SURNAMES)}`
    usedNames.add(company)
    const first = pick(FIRST_NAMES)
    const last = pick(SURNAMES)
    const prov = weighted(PROVINCES, PROVINCES.map((p) => p.w))
    const isCompany = chance(0.6)
    const nif = int(10_000_000, 79_999_999)
    const taxId = isCompany ? `B${int(10_000_000, 99_999_999)}` : `${nif}${'TRWAGMYFPDXBNJZSQVHLCKE'[nif % 23]}`
    const status: ClientStatus = weighted(['ACTIVE', 'PENDING', 'INACTIVE'] as const, [70, 15, 15])
    const createdAt = at(-int(5, 900))
    clients.push({
      id: `cli_${pad(i + 1)}`,
      company,
      contactName: `${first} ${last} ${pick(SURNAMES)}`,
      email: `${slug(first)}@${slug(company)}${pick(TLDS)}`,
      phone: `${pick(['6', '6', '6', '9'])}${int(10, 99)} ${int(100, 999)} ${int(100, 999)}`,
      address: `${pick(STREETS)} ${int(1, 80)}`,
      postalCode: `${prov.prefix}${pad(int(1, 99), 3)}`,
      province: prov.name,
      country: 'España',
      taxId,
      status,
      services: [],
      notes: chance(0.3) ? pick(['Prefiere contacto por WhatsApp.', 'Factura a nombre de la sociedad.', 'Pide siempre presupuesto cerrado.', 'Cliente recomendado por otro cliente.', 'Pagos por transferencia a 30 días.']) : '',
      archived: i === 5 || i === 31,
      origin: 'MANUAL',
      sourceId: null,
      formData: null,
      createdAt,
      updatedAt: createdAt,
    })
  }
  clients.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  clients.forEach((c, i) => (c.id = `cli_${pad(i + 1)}`))
  // Aproximadamente la mitad llegó por el formulario de la web: guardan lo que se escribió en él.
  const FORM_TEXTS = [
    'Quiero una web nueva con catálogo y pedidos por WhatsApp.',
    'Necesito reservas online y que salga bien en Google Maps.',
    'Mi web actual es muy antigua. Quiero algo moderno que se vea bien en el móvil.',
    'Abrimos en dos meses y necesitamos la web lista para entonces.',
    'Busco una tienda online sencilla con pago con tarjeta.',
  ]
  clients.forEach((c, i) => {
    if (i % 2 === 0) return
    c.origin = 'FORM'
    c.sourceId = `lead_${pad(i + 1)}`
    c.formData = { code: `SB-${pad(i + 1, 4)}`, businessType: c.company.split(' ')[0], description: FORM_TEXTS[i % FORM_TEXTS.length], submittedAt: c.createdAt }
  })

  // Webs ---------------------------------------------------------------------------------
  const websites: Website[] = []
  const KINDS: { label: string; tech: Technology[] }[] = [
    { label: 'Web corporativa', tech: ['WORDPRESS', 'NEXTJS', 'WEBFLOW', 'REACT'] },
    { label: 'Tienda online', tech: ['SHOPIFY', 'PRESTASHOP', 'WORDPRESS', 'NEXTJS'] },
    { label: 'Landing de campaña', tech: ['NEXTJS', 'WEBFLOW', 'REACT'] },
    { label: 'Web con reservas', tech: ['WORDPRESS', 'NEXTJS', 'OTHER'] },
  ]
  for (const c of clients) {
    const n = c.status === 'ACTIVE' ? weighted([1, 2, 3], [60, 30, 10]) : c.status === 'PENDING' ? weighted([0, 1], [40, 60]) : weighted([0, 1], [50, 50])
    for (let k = 0; k < n; k++) {
      const kind = pick(KINDS)
      const status: WebsiteStatus =
        c.status === 'INACTIVE' ? weighted(['ARCHIVED', 'PAUSED'] as const, [70, 30]) : c.status === 'PENDING' ? 'DEVELOPMENT' : weighted(['PRODUCTION', 'DEVELOPMENT', 'PAUSED', 'ARCHIVED'] as const, [62, 20, 6, 12])
      const created = Math.max(-int(20, 800), -Math.floor((now.getTime() - Date.parse(c.createdAt)) / DAY) + 2)
      const start = at(created)
      const domainName = `${slug(c.company)}${k ? k + 1 : ''}${pick(TLDS)}`
      const tech = pick(kind.tech)
      const publish = status === 'PRODUCTION' || status === 'PAUSED' || status === 'ARCHIVED' ? at(Math.min(-1, created + int(20, 70))) : null
      websites.push({
        id: `web_${pad(websites.length + 1)}`,
        clientId: c.id,
        name: `${kind.label} · ${c.company}`,
        status,
        technology: tech,
        description: `${kind.label} de ${c.company}. ${tech === 'WORDPRESS' ? 'Tema a medida y plugins esenciales.' : tech === 'SHOPIFY' ? 'Catálogo, pasarela de pago y envíos.' : 'Diseño responsive, SEO básico y formulario de contacto.'}`,
        domainName,
        productionUrl: status === 'DEVELOPMENT' ? '' : `https://${domainName}`,
        stagingUrl: `https://staging.${domainName}`,
        repoUrl: tech === 'NEXTJS' || tech === 'REACT' ? `https://github.com/sarebidea/${slug(c.company)}` : '',
        mainBranch: 'main',
        hostingProvider: pick(['Hostinger', 'Hostinger', 'SiteGround', 'OVH', 'Cloudways', 'Raiola']),
        startDate: start,
        publishDate: publish,
        createdAt: start,
        updatedAt: at(-int(0, 120)),
      })
    }
  }

  // Dominios -----------------------------------------------------------------------------
  // Fechas de renovación repartidas a propósito para que se vean todas las alertas.
  const renewalOffsets = [-18, -3, 2, 5, 6, 9, 13, 15, 21, 27, 30, 41, 58, 90, 120, 160, 210, 260, 310, 350]
  const domains: Domain[] = []
  let dIdx = 0
  for (const w of websites) {
    if (w.status === 'ARCHIVED' && chance(0.5)) continue
    const registrar = weighted(['Hostinger', 'OVH', 'Cloudflare', 'DonDominio', 'GoDaddy', 'Otros'] as const, [34, 20, 14, 16, 10, 6])
    const regDaysAgo = int(60, 2000)
    const offset = dIdx < renewalOffsets.length ? renewalOffsets[dIdx] : int(31, 360)
    dIdx++
    const tld = w.domainName.slice(w.domainName.lastIndexOf('.'))
    domains.push({
      id: `dom_${pad(domains.length + 1)}`,
      clientId: w.clientId,
      websiteId: w.id,
      name: w.domainName,
      registrar,
      registeredAt: at(-regDaysAgo),
      renewsAt: at(offset),
      annualCost: money(tld === '.eus' ? int(1400, 2000) / 100 : tld === '.es' ? int(900, 1400) / 100 : int(1099, 1799) / 100),
      autoRenew: chance(0.55),
      dns: `A @ 185.${int(10, 250)}.${int(1, 250)}.${int(1, 250)}\nCNAME www ${w.domainName}\nMX @ mx.${w.domainName} (10)`,
      nameservers: NAMESERVERS[registrar],
      notes: chance(0.15) ? 'Transferido desde otro registrador el año pasado.' : '',
      createdAt: at(-regDaysAgo),
      updatedAt: at(-int(0, 90)),
    })
  }

  // Hosting ------------------------------------------------------------------------------
  const hostRenewals = [-9, 4, 8, 12, 17, 24, 29, 44, 63, 95, 140, 200, 280, 340]
  const hostings: Hosting[] = []
  let hIdx = 0
  for (const w of websites) {
    if (w.status === 'ARCHIVED' || !chance(0.82)) continue
    const provider = w.hostingProvider
    const plans = HOSTING_PLANS[provider] ?? HOSTING_PLANS.Otros
    const offset = hIdx < hostRenewals.length ? hostRenewals[hIdx] : int(31, 360)
    hIdx++
    hostings.push({
      id: `hos_${pad(hostings.length + 1)}`,
      clientId: w.clientId,
      websiteId: w.id,
      provider,
      plan: pick(plans),
      annualCost: money(provider === 'Cloudways' ? int(180, 420) : provider === 'Hostinger' ? int(36, 120) : int(60, 240)),
      contractedAt: at(offset - 365 * int(1, 3)),
      renewsAt: at(offset),
      active: w.status !== 'PAUSED' || chance(0.5),
      notes: chance(0.12) ? 'Backups diarios incluidos. Revisar SSL antes de renovar.' : '',
      createdAt: at(offset - 365),
      updatedAt: at(-int(0, 60)),
    })
  }

  // Facturas -----------------------------------------------------------------------------
  const CONCEPTS: { c: InvoiceConcept; w: number; min: number; max: number; recurring: boolean; text: string }[] = [
    { c: 'WEB_DEVELOPMENT', w: 22, min: 500, max: 2400, recurring: false, text: 'Diseño y desarrollo de página web' },
    { c: 'HOSTING', w: 24, min: 36, max: 280, recurring: true, text: 'Alojamiento web anual' },
    { c: 'DOMAIN', w: 16, min: 10, max: 22, recurring: true, text: 'Renovación de dominio' },
    { c: 'MAINTENANCE', w: 24, min: 40, max: 140, recurring: true, text: 'Mantenimiento mensual' },
    { c: 'SEO', w: 9, min: 300, max: 950, recurring: false, text: 'Optimización SEO local' },
    { c: 'ECOMMERCE', w: 5, min: 1200, max: 3600, recurring: false, text: 'Tienda online' },
  ]
  const billableIds = new Set(clients.filter((c) => c.status !== 'INACTIVE').map((c) => c.id))
  const billable = clients.filter((c) => billableIds.has(c.id))
  const billableWebs = websites.filter((w) => billableIds.has(w.clientId))
  const billableDomains = domains.filter((d) => billableIds.has(d.clientId))
  const billableHostings = hostings.filter((h) => billableIds.has(h.clientId))
  const invoices: Invoice[] = []
  const counters: Record<number, number> = {}
  const draft: Omit<Invoice, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>[] = []
  for (let m = 13; m >= 0; m--) {
    const count = int(7, 12) + Math.round((13 - m) * 0.3)
    for (let i = 0; i < count; i++) {
      const cfg = weighted(CONCEPTS, CONCEPTS.map((x) => x.w))
      const day = m * 30 + int(0, 29)
      if (day < 1) continue
      const issued = at(-day)
      const terms = pick([15, 30, 30, 45])
      // Cada factura se refiere a algo real del cliente: su hosting, su dominio o su web.
      let clientId = pick(billable).id
      let websiteId: string | null = null
      let domainId: string | null = null
      let hostingId: string | null = null
      let description = cfg.text
      let subtotal = money(int(cfg.min * 100, cfg.max * 100) / 100)
      if (cfg.c === 'HOSTING' && billableHostings.length) {
        const h = pick(billableHostings)
        clientId = h.clientId
        hostingId = h.id
        websiteId = h.websiteId
        subtotal = h.annualCost
        description = `Alojamiento web ${h.provider} ${h.plan}`
      } else if (cfg.c === 'DOMAIN' && billableDomains.length) {
        const d = pick(billableDomains)
        clientId = d.clientId
        domainId = d.id
        websiteId = d.websiteId
        subtotal = d.annualCost
        description = `Renovación del dominio ${d.name}`
      } else if (billableWebs.length) {
        const w = pick(billableWebs)
        clientId = w.clientId
        websiteId = w.id
        description = `${cfg.text} · ${w.domainName}`
      }
      draft.push({
        clientId,
        concept: cfg.c,
        description,
        issuedAt: issued,
        dueAt: at(-day + terms),
        subtotal,
        taxRate: 21,
        recurring: cfg.recurring,
        websiteId,
        domainId,
        hostingId,
      })
    }
  }
  draft.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))
  for (const d of draft) {
    const year = new Date(d.issuedAt).getFullYear()
    counters[year] = (counters[year] ?? 0) + 1
    const overdueDays = Math.floor((t0.getTime() - Date.parse(d.dueAt)) / DAY)
    let status: InvoiceStatus
    if (chance(0.025)) status = 'CANCELLED'
    else if (overdueDays > 0) status = overdueDays < 60 && chance(0.12) ? 'OVERDUE' : 'PAID'
    else status = chance(0.35) ? 'PAID' : 'PENDING'
    invoices.push({
      ...d,
      id: `inv_${pad(invoices.length + 1)}`,
      number: `F-${year}-${pad(counters[year])}`,
      status,
      createdAt: d.issuedAt,
      updatedAt: d.issuedAt,
    })
  }

  // Tareas -------------------------------------------------------------------------------
  const prodWebs = websites.filter((w) => w.status === 'PRODUCTION' || w.status === 'DEVELOPMENT')
  const TASK_TEMPLATES: { title: string; desc: string; labels: string[] }[] = [
    { title: 'Renovar dominio', desc: 'Confirmar con el cliente y renovar antes del vencimiento. Emitir factura.', labels: ['Facturación'] },
    { title: 'Migrar web al nuevo hosting', desc: 'Copiar archivos y base de datos, probar en staging y cambiar DNS.', labels: ['Migración'] },
    { title: 'Corregir formulario de contacto', desc: 'Los correos no llegan al cliente. Revisar SMTP y SPF.', labels: ['Bug', 'Cliente urgente'] },
    { title: 'Diseñar landing de campaña', desc: 'Propuesta en Figma con tres variantes de cabecera.', labels: ['Diseño'] },
    { title: 'Configurar SEO local', desc: 'Ficha de Google Business, palabras clave de zona y datos estructurados.', labels: ['SEO'] },
    { title: 'Revisar certificado SSL', desc: 'Comprobar renovación automática y redirección HTTPS.', labels: ['Mantenimiento'] },
    { title: 'Actualizar plugins y WordPress', desc: 'Backup previo, actualizar y revisar que todo funciona.', labels: ['Mantenimiento'] },
    { title: 'Subir contenidos nuevos', desc: 'El cliente envía textos y fotos. Maquetar y publicar.', labels: ['Contenido'] },
    { title: 'Optimizar velocidad', desc: 'Imágenes en WebP, caché y reducir JavaScript. Objetivo: 90+ en Lighthouse.', labels: ['SEO', 'Mantenimiento'] },
    { title: 'Enviar presupuesto', desc: 'Presupuesto cerrado con alcance, plazos y forma de pago.', labels: ['Facturación'] },
  ]
  const tasks: Task[] = []
  const colCount: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 }
  const AUTHORS = ['Unai', 'Unai', 'Soporte']
  for (let i = 0; i < 30; i++) {
    const tpl = TASK_TEMPLATES[i % TASK_TEMPLATES.length]
    const w = pick(prodWebs)
    const status: TaskStatus = weighted(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const, [30, 26, 14, 30])
    const priority: TaskPriority = weighted(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const, [20, 40, 28, 12])
    const created = -int(1, 40)
    const due = status === 'DONE' ? null : chance(0.85) ? int(-6, 21) : null
    const completed = status === 'DONE' ? at(-int(0, 28)) : null
    tasks.push({
      id: `tsk_${pad(i + 1)}`,
      title: `${tpl.title} · ${w.domainName}`,
      description: tpl.desc,
      clientId: w.clientId,
      websiteId: w.id,
      priority,
      status,
      labels: tpl.labels,
      comments: chance(0.4)
        ? [{ id: `cmt_${pad(i + 1)}_1`, author: pick(AUTHORS), text: pick(['Pendiente de respuesta del cliente.', 'Empiezo esta tarde.', 'Subido a staging, falta revisión.', 'Ojo: tiene una promoción activa esta semana.']), createdAt: at(created + 1) }]
        : [],
      position: colCount[status]++,
      dueAt: due === null ? null : at(due),
      completedAt: completed,
      createdAt: at(created),
      updatedAt: completed ?? at(created + 1),
    })
  }

  // Usuarios -----------------------------------------------------------------------------
  const users: AdminUser[] = [
    { id: 'usr_001', name: 'Unai Padura Larrea', email: 'sarebidea@sarebidea.com', role: 'OWNER', active: true, createdAt: at(-900), updatedAt: at(-900) },
    { id: 'usr_002', name: 'Soporte SAREBIDEA', email: 'soporte@sarebidea.com', role: 'EDITOR', active: true, createdAt: at(-300), updatedAt: at(-300) },
    { id: 'usr_003', name: 'Gestoría Arrieta', email: 'contacto@gestoriaarrieta.es', role: 'VIEWER', active: false, createdAt: at(-120), updatedAt: at(-60) },
  ]

  // Servicios contratados por cliente (derivados de lo que realmente tiene) --------------------
  for (const c of clients) {
    const s = new Set<ServiceType>()
    const ws = websites.filter((w) => w.clientId === c.id)
    if (ws.length) s.add('WEB_DESIGN')
    if (hostings.some((h) => h.clientId === c.id)) s.add('HOSTING')
    if (domains.some((d) => d.clientId === c.id)) s.add('DOMAIN')
    if (invoices.some((i) => i.clientId === c.id && i.concept === 'MAINTENANCE')) s.add('MAINTENANCE')
    if (invoices.some((i) => i.clientId === c.id && i.concept === 'SEO')) s.add('SEO')
    if (ws.some((w) => w.technology === 'SHOPIFY' || w.technology === 'PRESTASHOP') || invoices.some((i) => i.clientId === c.id && i.concept === 'ECOMMERCE')) s.add('ECOMMERCE')
    c.services = [...s]
  }

  // Actividad reciente (derivada de los datos) ---------------------------------------------------
  const nameOf = (id: string) => clients.find((c) => c.id === id)?.company ?? 'Cliente'
  const activity: ActivityEntry[] = []
  const push = (e: Omit<ActivityEntry, 'id'>) => activity.push({ ...e, id: `act_${pad(activity.length + 1)}` })
  for (const c of clients.slice(-6)) push({ entity: 'client', entityId: c.id, clientId: c.id, message: `Nuevo cliente: ${c.company}`, actor: 'Unai', createdAt: c.createdAt })
  for (const i of invoices.filter((x) => x.status === 'PAID').slice(-8)) push({ entity: 'invoice', entityId: i.id, clientId: i.clientId, message: `Factura ${i.number} cobrada (${nameOf(i.clientId)})`, actor: 'Sistema', createdAt: i.dueAt < at(0) ? i.dueAt : i.issuedAt })
  for (const t of tasks.filter((x) => x.status === 'DONE').slice(0, 6)) push({ entity: 'task', entityId: t.id, clientId: t.clientId, message: `Tarea completada: ${t.title}`, actor: 'Unai', createdAt: t.completedAt ?? t.updatedAt })
  for (const w of websites.filter((x) => x.publishDate && x.status === 'PRODUCTION').slice(-4)) push({ entity: 'website', entityId: w.id, clientId: w.clientId, message: `Web publicada: ${w.domainName}`, actor: 'Unai', createdAt: w.publishDate! })
  for (const d of domains.slice(0, 3)) push({ entity: 'domain', entityId: d.id, clientId: d.clientId, message: `Dominio actualizado: ${d.name}`, actor: 'Unai', createdAt: d.updatedAt })
  activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  activity.forEach((a, i) => (a.id = `act_${pad(i + 1)}`))

  return { clients, websites, domains, hostings, invoices, tasks, users, activity, settings: DEFAULT_SETTINGS }
}

// Todo el contenido editable de la landing vive aquí.
// Los valores marcados con XXX o "de ejemplo" son placeholders a sustituir.

export const brand = {
  name: 'SAREBIDEA',
  email: 'sarebidea@sarebidea.com',
}

/**
 * Datos del titular que exige el art. 10 de la LSSI y el art. 13 del RGPD.
 * COMPLETA los campos "PENDIENTE" antes de publicar: aparecen tal cual en el Aviso legal y la Política de privacidad.
 */
export const legal = {
  owner: 'Unai Padura Larrea',
  taxId: '79078063S',
  address: 'Gueñes',
  /** Si eres sociedad inscrita; si eres autónomo, déjalo vacío ('') y no se muestra. */
  registry: '',
  domain: 'sarebidea.com',
  url: 'https://sarebidea.com',
  updated: '7 de octubre de 2026',
}

export const nav = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Packs', href: '#packs' },
  { label: 'Ejemplos', href: '#ejemplos' },
  { label: 'Quién soy', href: '#quien-soy' },
  { label: 'FAQ', href: '#faq' },
]

/** Packs y precios (resumen de PRECIOS_DISEÑO_WEB_Y_MANTENIMIENTO.pdf: solo lo más relevante). Los precios de la web no incluyen IVA. */
export const packs = [
  {
    key: 'starter',
    name: 'Starter',
    price: '399 €',
    maintenance: '19 €/mes',
    inherits: false,
    web: [
      'Inicio, servicios, «Sobre nosotros» y contacto',
      'Botón de WhatsApp y Google Maps',
      'Formulario de contacto básico',
      'Diseño responsive: móvil, tablet y ordenador',
      'SEO básico',
      'Dominio + hosting 1 año y SSL',
    ],
    care: [
      'Renovación de dominio, hosting y SSL',
      'Actualizaciones y copias de seguridad',
      'Monitorización y corrección de pequeños errores',
      'Soporte por email/WhatsApp',
      '1 pequeña modificación de contenido al mes (opcional, con límite de tiempo)',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: '699 €',
    maintenance: '29 €/mes',
    inherits: true,
    web: [
      'Diseño personalizado',
      'Página individual para cada servicio',
      'Google Business, Analytics y Search Console',
      'SEO on-page y optimización de velocidad',
      'Copy básico orientado a conversión',
      'Galería de imágenes o proyectos',
    ],
    care: [
      'Todo el mantenimiento técnico',
      'Copias de seguridad más frecuentes',
      'Monitorización de Analytics y Search Console',
      'Hasta 2 pequeñas modificaciones de contenido al mes',
      'Informe básico periódico del estado de la web',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '1.199 €',
    maintenance: '49 €/mes',
    inherits: true,
    web: [
      'Web totalmente personalizada',
      'Base de datos con Supabase y panel de administración',
      'Sistema de reservas, usuarios y áreas privadas',
      'Formularios avanzados y automatizaciones',
      'Gestión de clientes/solicitudes',
      'SEO avanzado y optimización avanzada de rendimiento',
    ],
    care: [
      'Mantenimiento de Supabase, panel y automatizaciones',
      'Copias de seguridad de base de datos',
      'Monitorización de errores y revisiones de seguridad',
      'Hasta 3 pequeñas modificaciones de contenido al mes',
      'Prioridad en soporte e informe mensual',
    ],
  },
]

export const problems = [
  { title: 'Parece de otra época', body: 'Diseño de hace diez años que transmite justo lo contrario de lo que eres hoy.' },
  { title: 'En el móvil se rompe', body: 'Textos diminutos y botones imposibles. Y el 70% de tus visitas llegan desde ahí.' },
  { title: 'No inspira confianza', body: 'Sin reseñas, sin fotos reales, sin datos claros. El cliente duda y se va.' },
  { title: 'Cambiar algo es un drama', body: 'Actualizar un horario o un precio depende de alguien que ya no contesta.' },
  { title: 'No te llega ningún contacto', body: 'Recibe visitas, pero nadie llama, reserva ni escribe.' },
  { title: 'Tu competencia sale mejor', body: 'El negocio de al lado aparece antes en Google y se ve más profesional.' },
]

export type ServiceKey = 'design' | 'mobile' | 'seo' | 'conversion' | 'speed' | 'care'

export const services: {
  key: ServiceKey
  /** Etiqueta corta que resume el beneficio de un vistazo. */
  tag: string
  title: string
  body: string
  includes: string[]
}[] = [
  {
    key: 'design',
    tag: 'Sin plantillas',
    title: 'Diseño hecho para ti',
    body: 'Tu web se parece a tu negocio, no a la de otros.',
    includes: ['Tus colores, tu logo y tu estilo', 'Textos escritos por nosotros', 'Fotos cuidadas y optimizadas'],
  },
  {
    key: 'mobile',
    tag: 'Móvil primero',
    title: 'Perfecta en el móvil',
    body: 'Donde te buscan 7 de cada 10 clientes.',
    includes: ['Botones grandes y fáciles de pulsar', 'Llamar o escribir con un toque', 'Se ve bien en cualquier pantalla'],
  },
  {
    key: 'seo',
    tag: 'SEO local',
    title: 'Te encuentran en Google',
    body: 'Apareces cuando alguien busca lo que haces cerca de ti.',
    includes: ['Ficha de Google Business', 'Palabras clave de tu zona', 'Enlace a Google Maps'],
  },
  {
    key: 'conversion',
    tag: 'Más contactos',
    title: 'Pensada para que te contacten',
    body: 'Cada visita tiene un camino claro para escribirte.',
    includes: ['WhatsApp, llamada y formulario', 'Reservas o citas online', 'Avisos de cada solicitud'],
  },
  {
    key: 'speed',
    tag: 'Menos de 1 s',
    title: 'Carga al instante',
    body: 'Nadie espera, nadie se va a la competencia.',
    includes: ['Imágenes ligeras', 'Hosting rápido incluido', 'Certificado de seguridad (https)'],
  },
  {
    key: 'care',
    tag: 'Mantenimiento',
    title: 'Nosotros la cuidamos',
    body: 'Tú atiendes tu negocio; de la web nos ocupamos nosotros.',
    includes: ['Copias de seguridad diarias', 'Cambios de horarios y precios', 'Soporte por teléfono o email'],
  },
]

/** Lo que va incluido siempre, aparte de los seis servicios. */
export const serviceExtras = [
  { icon: 'pin', label: 'Dominio y hosting el primer año' },
  { icon: 'star', label: 'Panel sencillo para editar textos' },
  { icon: 'user', label: 'Una persona de contacto para todo' },
  { icon: 'bolt', label: 'Lista en 1 semana desde la llamada' },
] as const

export const steps = [
  {
    n: '01',
    title: 'Cuéntanos tu negocio',
    body: 'Una llamada de 15 minutos. Nos hablas de lo que haces, a quién quieres llegar y qué te gusta. Nada de formularios eternos.',
    you: 'Tú: una conversación',
  },
  {
    n: '02',
    title: 'Diseñamos tu web',
    body: 'Escribimos los textos, preparamos las imágenes y te enseñamos una propuesta completa. Ajustamos lo que quieras hasta que te encante.',
    you: 'Tú: decir "me gusta"',
  },
  {
    n: '03',
    title: 'La publicamos',
    body: 'Dominio, hosting, Google y formularios funcionando. Te entregamos tu web lista para recibir clientes.',
    you: 'Tú: recibir clientes',
  },
]

export type Project = {
  id: string
  business: string
  sector: string
  headline: string
  cta: string
  nav: string[]
  /** Ruta a una captura real. Si existe, sustituye al placeholder. */
  image?: string
  result: string
  /** Estructura de la mini-web: cada sector con su propia composición. */
  layout: 'split' | 'centered' | 'booking' | 'poster' | 'service' | 'shop' | 'editorial'
  theme: {
    bg: string
    fg: string
    accent: string
    accentFg: string
    soft: string
    font: 'serif' | 'display' | 'sans'
  }
}

export const projects: Project[] = [
  {
    id: 'restaurante',
    business: 'Brasa & Sal',
    sector: 'Restaurante',
    headline: 'Fuego lento, mesa larga.',
    cta: 'Reservar mesa',
    nav: ['Carta', 'Vinos', 'Reservas'],
    result: 'Reservas online integradas',
    layout: 'split',
    theme: { bg: '#1b1512', fg: '#f3e7d9', accent: '#d9733c', accentFg: '#1b1512', soft: '#3a2c24', font: 'serif' },
  },
  {
    id: 'peluqueria',
    business: 'Estudio Nácar',
    sector: 'Peluquería',
    headline: 'Tu pelo, en las mejores manos.',
    cta: 'Pedir cita',
    nav: ['Servicios', 'Equipo', 'Cita'],
    result: 'Citas desde el móvil 24/7',
    layout: 'centered',
    theme: { bg: '#f6ece6', fg: '#3b2a26', accent: '#b5654f', accentFg: '#fff', soft: '#ead7cd', font: 'serif' },
  },
  {
    id: 'clinica',
    business: 'Clínica Lur',
    sector: 'Clínica',
    headline: 'Cuidamos de ti, sin esperas.',
    cta: 'Reservar consulta',
    nav: ['Tratamientos', 'Equipo', 'Contacto'],
    result: 'Primera visita en 2 clics',
    layout: 'booking',
    theme: { bg: '#eef5f3', fg: '#0f3b36', accent: '#1d7f73', accentFg: '#fff', soft: '#d3e7e2', font: 'sans' },
  },
  {
    id: 'gimnasio',
    business: 'Forja',
    sector: 'Gimnasio',
    headline: 'Entrena con propósito.',
    cta: 'Prueba una semana',
    nav: ['Clases', 'Horarios', 'Tarifas'],
    result: 'Altas de prueba automáticas',
    layout: 'poster',
    theme: { bg: '#121212', fg: '#f2f2f2', accent: '#ff5a36', accentFg: '#121212', soft: '#262626', font: 'display' },
  },
  {
    id: 'taller',
    business: 'Talleres Ibarra',
    sector: 'Taller',
    headline: 'Tu coche, listo cuando lo necesitas.',
    cta: 'Pedir presupuesto',
    nav: ['Servicios', 'ITV', 'Cita'],
    result: 'Presupuestos por WhatsApp',
    layout: 'service',
    theme: { bg: '#0f1b2d', fg: '#eef2f7', accent: '#f5c443', accentFg: '#0f1b2d', soft: '#1d2d45', font: 'display' },
  },
  {
    id: 'tienda',
    business: 'La Despensa de Ane',
    sector: 'Tienda local',
    headline: 'Producto de aquí, de toda la vida.',
    cta: 'Ver productos',
    nav: ['Tienda', 'Productores', 'Pedidos'],
    result: 'Pedidos para recoger en tienda',
    layout: 'shop',
    theme: { bg: '#f3efe2', fg: '#2f3a1f', accent: '#5b6b2f', accentFg: '#fff', soft: '#e3dcc6', font: 'serif' },
  },
  {
    id: 'profesional',
    business: 'Laura Gil',
    sector: 'Asesora fiscal',
    headline: 'Impuestos claros. Cero sustos.',
    cta: 'Agendar llamada',
    nav: ['Servicios', 'Sobre mí', 'Contacto'],
    result: 'Agenda de llamadas conectada',
    layout: 'editorial',
    theme: { bg: '#f4f4f1', fg: '#16251f', accent: '#16251f', accentFg: '#f4f4f1', soft: '#e2e4dd', font: 'sans' },
  },
]

export const faqs = [
  {
    q: '¿Cuánto cuesta una web?',
    a: 'Desde 399 € + IVA con el Pack Starter. El Pack Professional cuesta 699 € + IVA y el Premium 1.199 € + IVA. Además, cada pack lleva un mantenimiento mensual: 19 €, 29 € o 49 €/mes.',
  },
  {
    q: '¿Cuánto tarda en estar lista mi web?',
    a: 'En 1 semana desde nuestra llamada de 15 minutos. Te damos la fecha de entrega concreta antes de empezar.',
  },
  {
    q: '¿Tengo que aportar los textos y fotografías?',
    a: 'No. Escribimos los textos a partir de nuestra conversación y te ayudamos con las imágenes. Si tienes fotos propias, mejor; si no, usamos imágenes de calidad o organizamos una sesión.',
  },
  {
    q: '¿La web funciona en móvil?',
    a: 'Sí, y no como versión reducida: la diseñamos primero para el móvil, porque es desde donde te buscan la mayoría de tus clientes.',
  },
  {
    q: '¿Incluye dominio y hosting?',
    a: 'Sí. Nos encargamos de registrar tu dominio y alojar la web durante el primer año. Si ya tienes dominio, lo conectamos sin coste.',
  },
  {
    q: '¿Puedo modificar la web después?',
    a: 'Claro. Puedes pedirnos cambios cuando quieras, y si prefieres hacerlos tú, te dejamos un panel sencillo para editar textos, horarios y fotos.',
  },
  {
    q: '¿Hacéis mantenimiento?',
    a: 'Sí. Actualizaciones, seguridad, copias de seguridad y pequeños cambios. Tu web siempre funcionando sin que tengas que pensar en ello.',
  },
  {
    q: '¿Está optimizada para Google?',
    a: 'Sí. Cuidamos la velocidad, la estructura y el SEO local, y configuramos tu ficha de Google Business para que te encuentren quienes buscan cerca de ti.',
  },
  {
    q: '¿Qué pasa si ya tengo una web?',
    a: 'La revisamos contigo, aprovechamos lo que funcione y migramos tu contenido y tu dominio sin que pierdas visitas ni posicionamiento.',
  },
]

export const businessTypes = [
  'Restaurante o bar',
  'Peluquería o estética',
  'Clínica o salud',
  'Gimnasio o deporte',
  'Taller',
  'Tienda',
  'Profesional independiente',
  'Otro',
]

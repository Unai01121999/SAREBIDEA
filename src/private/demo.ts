// Datos de ejemplo SOLO para la vista previa de diseño (compilación con VITE_DEMO=1).
// No se incluye en la web de producción: se importa de forma dinámica detrás de esa variable.
import type { Lead } from '../lib/leads'

const day = 86_400_000
const ago = (d: number, h = 0) => new Date(Date.now() - d * day - h * 3_600_000).toISOString()
const inDays = (d: number) => new Date(Date.now() + d * day).toISOString().slice(0, 10)

const leads: Lead[] = [
  { id: 'd1', code: 'SB-0008', name: 'Maite Urrutia Goikoetxea', phone: '688 120 334', email: 'maite@panaderiaurrutia.com', businessType: 'Panadería / pastelería', description: 'Quiero una web con catálogo de tartas por encargo y pedidos por WhatsApp.', source: 'web', status: 'nuevo', createdAt: ago(0, 2) },
  { id: 'd2', code: 'SB-0007', name: 'Iker Zubiaur', phone: '611 904 227', email: 'iker@zubiaurfisio.es', businessType: 'Clínica / salud', description: 'Fisioterapia. Necesito reservas online y que salga bien en Google Maps.', source: 'web', status: 'nuevo', createdAt: ago(1, 5) },
  { id: 'd3', code: 'SB-0006', name: 'Restaurante Brasa & Sal', phone: '944 331 208', email: 'reservas@brasaysal.com', businessType: 'Restaurante', description: 'Web con carta, reservas y galería de platos.', source: 'telefono', status: 'cliente', notes: 'Pide mantenimiento mensual. Factura a nombre de Brasa & Sal S.L.', website: 'https://brasaysal.com', domain: 'brasaysal.com', domainExpiry: inDays(12), webExpiry: inDays(210), amount: 1450, paymentStatus: 'pagado', createdAt: ago(60) },
  { id: 'd4', code: 'SB-0005', name: 'Clínica Dental Lur', phone: '946 552 101', email: 'info@clinicalur.es', businessType: 'Clínica / salud', description: 'Rediseño completo, cita previa y página por tratamiento.', source: 'presencial', status: 'cliente', website: 'https://clinicalur.es', domain: 'clinicalur.es', domainExpiry: inDays(-6), webExpiry: inDays(95), amount: 2200, paymentStatus: 'atrasado', createdAt: ago(48) },
  { id: 'd5', code: 'SB-0004', name: 'Ane Etxeberria Goñi', phone: '600 482 119', email: 'ane@floristeriaane.com', businessType: 'Tienda / comercio', description: 'Floristería con tienda online pequeña.', source: 'web', status: 'contactado', amount: 980, paymentStatus: 'pendiente', createdAt: ago(5) },
  { id: 'd6', code: 'SB-0003', name: 'Peluquería Nerea', phone: '655 710 342', email: 'nerea@nereastudio.es', businessType: 'Belleza / estética', description: 'Web con reservas y precios de servicios.', source: 'email', status: 'cliente', website: 'https://nereastudio.es', domain: 'nereastudio.es', domainExpiry: inDays(160), webExpiry: inDays(18), amount: 690, paymentStatus: 'pendiente', createdAt: ago(35) },
  { id: 'd7', code: 'SB-0002', name: 'Gestoría Arrieta', phone: '944 118 790', email: 'contacto@gestoriaarrieta.es', businessType: 'Servicios profesionales', description: 'Web corporativa sencilla con formulario de contacto.', source: 'web', status: 'cliente', website: 'https://gestoriaarrieta.es', domain: 'gestoriaarrieta.es', domainExpiry: inDays(300), webExpiry: inDays(300), amount: 850, paymentStatus: 'pagado', createdAt: ago(90) },
  { id: 'd8', code: 'SB-0001', name: 'Joseba Lasa', phone: '', email: 'joseba.lasa@correo.com', businessType: 'Otro', description: 'Preguntaba precios, de momento no sigue adelante.', source: 'web', status: 'descartado', createdAt: ago(120) },
]

/** Carga los ejemplos en el almacén local si aún no hay nada (para que se vea el panel con contenido). */
export async function seedDemo() {
  try {
    if (!localStorage.getItem('sarebidea-leads')) localStorage.setItem('sarebidea-leads', JSON.stringify(leads))
  } catch {
    /* sin almacenamiento: el panel se verá vacío */
  }
}

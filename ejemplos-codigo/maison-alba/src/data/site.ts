/**
 * CONTENIDO EDITABLE DEL SALON
 * ----------------------------------------------------------------------------
 * Todo lo marcado como "PENDIENTE" son datos de ejemplo que debes sustituir
 * por la información real del negocio antes de publicar.
 * Las fotografías son imágenes de Unsplash (licencia libre) a modo de
 * referencia artística: sustitúyelas por fotografías propias del salón.
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const photo = (id: string, width: number) =>
  `${unsplash(id)}?auto=format&fit=crop&q=60&w=${width}`;

export const photoSet = (id: string, widths: number[] = [480, 800, 1200, 1800]) =>
  widths.map((w) => `${photo(id, w)} ${w}w`).join(", ");

export const IMAGES = {
  hero: { id: "1633381521050-26bb467d9d5a", alt: "Retrato en blanco y negro de una mujer con melena larga en movimiento" },
  intro: { id: "1779350676620-fde279b1d023", alt: "Corte bob castaño con brillo, visto de espaldas" },
  introDetail: { id: "1617690825153-8bb0a8e3c911", alt: "Mujer recogiendo su cabello con ambas manos" },
  cut: { id: "1679838396784-83b28784c28d", alt: "Mujer ajustando su cabello en blanco y negro" },
  color: { id: "1605980766335-d3a41c7332a1", alt: "Cabello rubio con matices cálidos" },
  balayage: { id: "1605980625600-88b46abafa8d", alt: "Ondas largas con balayage ceniza" },
  treatment: { id: "1779350676620-fde279b1d023", alt: "Cabello liso y brillante tras un tratamiento" },
  styling: { id: "1629397685944-7073f5589754", alt: "Estilista rizando mechones con plancha en el salón" },
  salon1: { id: "1781450090585-1a511b7066d9", alt: "Interior luminoso del salón con espejos de arco" },
  salon2: { id: "1790009419892-f6f3fd516fb2", alt: "Tocador de madera con espejo circular y sillón negro" },
  salon3: { id: "1626383120723-2a941488860d", alt: "Sillón minimalista junto a una pared blanca" },
  salon4: { id: "1600948836101-f9ffda59d250", alt: "Tres sillones frente a espejos circulares sobre pared oscura" },
  salon5: { id: "1790009419857-51fa0a2d9354", alt: "Puestos de trabajo con paneles de mármol" },
  g1: { id: "1554519934-e32b1629d9ee", alt: "Melena rubia larga con ondas suaves, vista de espaldas" },
  g2: { id: "1638064432604-8da1fc75de09", alt: "Cabello castaño con reflejos cobrizos" },
  g3: { id: "1682450285233-1fb10d4a4616", alt: "Ondas naturales en tono miel" },
  g4: { id: "1554519880-ffe46861d570", alt: "Cabello castaño con rizos definidos" },
  g5: { id: "1554519515-242161756769", alt: "Coloración con matices multicolor" },
  g6: { id: "1648157963892-fa90a04e278b", alt: "Corte rubio pulido con collar" },
  team1: { id: "1506863530036-1efeddceb993", alt: "Retrato en blanco y negro de una profesional del salón" },
  team2: { id: "1547547700-b3954043b1b8", alt: "Retrato en blanco y negro de una profesional con trenzas" },
  team3: { id: "1495914510314-ba3164b1321f", alt: "Retrato en blanco y negro de una profesional con los ojos cerrados" },
  cta: { id: "1531924224004-7beee12117a6", alt: "Mujer agitando su melena en blanco y negro" },
} as const;

export const SALON = {
  name: "Maison Alba", // PENDIENTE: nombre real del salón
  tagline: "Atelier capilar",
  city: "", // PENDIENTE: ciudad (SEO local)
  address: "", // PENDIENTE: dirección completa
  phone: "", // PENDIENTE: teléfono (formato +34 600 000 000)
  email: "", // PENDIENTE: email donde recibir solicitudes de cita
  instagram: "", // PENDIENTE: URL completa del perfil de Instagram
  mapsUrl: "", // PENDIENTE: enlace de Google Maps
  hours: [
    { days: "Martes a viernes", time: "10:00 a 20:00" },
    { days: "Sábado", time: "9:00 a 15:00" },
    { days: "Domingo y lunes", time: "Cerrado" },
  ] as { days: string; time: string }[], // PENDIENTE: confirmar horarios reales
  legal: {
    aviso: "#aviso-legal", // PENDIENTE: enlaces a las páginas legales reales
    privacidad: "#privacidad",
    cookies: "#cookies",
  },
};

/**
 * RESERVAS
 * - externalUrl: si el salón ya usa una plataforma (Treatwell, Booksy, Fresha,
 *   Calendly...) pega aquí su enlace oficial y el flujo redirige allí.
 * - endpoint: URL de tu backend que recibe un POST JSON con la solicitud.
 *   Solo se muestra confirmación si el servidor responde con éxito.
 * Si ninguno está configurado, la solicitud se envía por email (SALON.email).
 */
export const BOOKING = {
  externalUrl: "", // PENDIENTE
  endpoint: "", // PENDIENTE
  timeWindows: [
    { id: "manana", label: "Mañana", hint: "10:00 a 13:00" },
    { id: "mediodia", label: "Mediodía", hint: "13:00 a 16:00" },
    { id: "tarde", label: "Tarde", hint: "16:00 a 20:00" },
  ],
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string; // Precios orientativos: ajustar a la tarifa real del salón
  image: keyof typeof IMAGES;
};

export const SERVICES: Service[] = [
  {
    id: "corte",
    name: "Corte y estilismo",
    description: "Un corte pensado para tu rostro, tu textura y tu manera de vivir el cabello.",
    duration: "60 min",
    price: "Desde 38 €",
    image: "cut",
  },
  {
    id: "color",
    name: "Coloración personalizada",
    description: "Tonos diseñados a medida, con diagnóstico previo y un acabado luminoso.",
    duration: "2 h",
    price: "Desde 65 €",
    image: "color",
  },
  {
    id: "balayage",
    name: "Balayage e iluminación",
    description: "Luz trabajada a mano, con transiciones suaves que crecen con naturalidad.",
    duration: "3 h",
    price: "Desde 140 €",
    image: "balayage",
  },
  {
    id: "tratamientos",
    name: "Tratamientos capilares",
    description: "Rituales de reparación e hidratación para devolver fuerza y brillo a la fibra.",
    duration: "45 min",
    price: "Desde 35 €",
    image: "treatment",
  },
  {
    id: "ocasiones",
    name: "Peinados y ocasiones",
    description: "Recogidos y acabados para novias, invitadas y noches que merecen un detalle más.",
    duration: "75 min",
    price: "Desde 45 €",
    image: "styling",
  },
];

export const TEAM = [
  {
    name: "Nombre pendiente",
    role: "Dirección creativa y color",
    bio: "Breve presentación de la profesional. Texto de ejemplo para sustituir.",
    image: "team1",
  },
  {
    name: "Nombre pendiente",
    role: "Corte y estilismo",
    bio: "Breve presentación de la profesional. Texto de ejemplo para sustituir.",
    image: "team2",
  },
  {
    name: "Nombre pendiente",
    role: "Tratamientos y acabados",
    bio: "Breve presentación de la profesional. Texto de ejemplo para sustituir.",
    image: "team3",
  },
] as const;

export const PROFESSIONALS = [
  { id: "cualquiera", label: "Sin preferencia" },
  ...TEAM.map((t, i) => ({ id: `pro-${i}`, label: `${t.role}` })),
];

/** Contenido de demostración: sustituir por opiniones reales con permiso. */
export const TESTIMONIALS = [
  {
    quote: "Salí con el cabello que siempre quise y con la sensación de haber sido escuchada.",
    author: "Opinión de ejemplo",
    role: "Sustituir por reseña real",
  },
  {
    quote: "Cada detalle está cuidado, del diagnóstico al último gesto con el secador.",
    author: "Opinión de ejemplo",
    role: "Sustituir por reseña real",
  },
  {
    quote: "Un color luminoso que crece bien y que se siente completamente mío.",
    author: "Opinión de ejemplo",
    role: "Sustituir por reseña real",
  },
];

export const NAV = [
  { href: "#servicios", label: "Servicios" },
  { href: "#salon", label: "El salón" },
  { href: "#trabajo", label: "Nuestro trabajo" },
  { href: "#contacto", label: "Contacto" },
];

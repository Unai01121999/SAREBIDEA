// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN ÚNICA DE LA CLÍNICA
//  Todo lo que aparezca entre [corchetes] es provisional y debe
//  sustituirse por datos reales. Los campos vacíos ("") no se
//  muestran o quedan marcados como pendientes.
//  Después ejecuta:  node build.mjs
// ─────────────────────────────────────────────────────────────
export default {
  // Muestra una franja discreta superior avisando de que es un borrador.
  // Ponlo en false antes de publicar.
  draftNotice: false,

  name: "Clínica Lur",
  legalName: "[Razón social pendiente]",
  siteUrl: "",                            // p. ej. "https://www.miclinica.es" (activa canonical, sitemap y Open Graph)
  locality: "[Localidad]",                // se usa en título SEO y datos estructurados

  phone: "",                              // texto visible, p. ej. "943 000 000"
  phoneHref: "",                          // p. ej. "+34943000000"
  email: "",                              // p. ej. "hola@miclinica.es"
  address: {
    street: "",                           // p. ej. "Calle Mayor 1, 1.º"
    postalCode: "",
    city: "",
    region: "",
  },
  hours: [
    { d: "Lunes a viernes", h: "[Horario pendiente]" },
    { d: "Sábado", h: "[Horario pendiente]" },
  ],
  mapEmbedUrl: "",                        // URL "embed" de Google Maps / OpenStreetMap de la ubicación real
  mapsDirectionsUrl: "",                  // enlace "Cómo llegar"
  bookingUrl: "",                         // sistema de reservas real (si existe); si no, se usa el formulario
  social: [
    // { label: "Instagram", url: "https://..." },
  ],

  // Formulario: endpoint real que reciba el POST JSON (Formspree, Basin, Getform,
  // una función propia...). Mientras esté vacío, el formulario NO simula envíos.
  formEndpoint: "",

  // Titular del sitio (aviso legal y pie de página)
  owner: {
    name: "[Titular pendiente]",
    taxId: "[NIF/CIF pendiente]",
    address: "[Domicilio pendiente]",
    registry: "[Datos de inscripción / colegiación pendientes, si proceden]",
  },

  // Equipo: dejar vacío mientras no haya datos reales (se muestran huecos provisionales).
  // { name, role, bio, training, photo: "equipo-1.jpg" }
  team: [],

  // Opiniones: solo reseñas reales y autorizadas. Vacío = se muestra la filosofía de atención.
  // { text, author, source, url }
  reviews: [],
  reviewsProfileUrl: "",                  // enlace a perfil público verificado (opcional)

  // Tratamientos propuestos. Confirma con la clínica cuáles se ofrecen
  // y pon enabled:false en los que no.
  treatments: [
    {
      slug: "odontologia-general",
      enabled: true,
      name: "Odontología general",
      short: "Prevención, revisiones y tratamientos para mantener una buena salud bucodental.",
      long: "Las revisiones periódicas y el cuidado preventivo ayudan a detectar a tiempo cualquier cambio. En tu visita, el profesional valorará tu situación, resolverá tus dudas y te explicará las opciones disponibles.",
      img: "tratamiento-general.jpg",
      imgLabel: "Odontología general",
      alt: "Dentista revisando la boca de una paciente durante una revisión",
    },
    {
      slug: "estetica-dental",
      enabled: true,
      name: "Estética dental",
      short: "Tratamientos orientados a mejorar la apariencia de la sonrisa, según las necesidades de cada paciente.",
      long: "Cada sonrisa es distinta. Antes de proponer nada, escuchamos qué te gustaría cambiar y valoramos qué opciones son adecuadas para ti, explicándolas con claridad.",
      img: "tratamiento-estetica.jpg",
      imgLabel: "Estética dental",
      alt: "Primer plano de una mujer de cabello oscuro sonriendo",
    },
    {
      slug: "ortodoncia",
      enabled: true,
      name: "Ortodoncia",
      short: "Soluciones para corregir la posición de los dientes y mejorar la alineación dental.",
      long: "Existen distintas opciones de ortodoncia. Tras una valoración individual, el profesional te explicará cuáles pueden encajar con tu caso, sus fases y sus cuidados.",
      img: "tratamiento-ortodoncia.jpg",
      imgLabel: "Ortodoncia",
      alt: "Persona colocándose un alineador dental transparente",
    },
    {
      slug: "implantologia",
      enabled: true,
      name: "Implantología",
      short: "Opciones de tratamiento para la reposición de piezas dentales perdidas.",
      long: "Si has perdido alguna pieza, revisaremos tu situación y te presentaremos las alternativas existentes para que puedas decidir con toda la información.",
      img: "tratamiento-implantologia.jpg",
      imgLabel: "Implantología",
      alt: "Dentista examinando radiografías dentales",
    },
    {
      slug: "blanqueamiento-dental",
      enabled: true,
      name: "Blanqueamiento dental",
      short: "Tratamientos profesionales para mejorar el tono de los dientes cuando estén indicados.",
      long: "No todas las personas son candidatas a un blanqueamiento. Por eso empezamos con una revisión que permita valorar si está indicado y cómo plantearlo.",
      img: "tratamiento-blanqueamiento.jpg",
      imgLabel: "Blanqueamiento dental",
      alt: "Mujer de cabello castaño sonriendo",
    },
    {
      slug: "odontopediatria",
      enabled: true,
      name: "Odontopediatría",
      short: "Atención bucodental adaptada a las necesidades de los niños.",
      long: "Una primera experiencia amable marca la relación de los más pequeños con el cuidado dental. Adaptamos el ritmo y las explicaciones a su edad.",
      img: "tratamiento-odontopediatria.jpg",
      imgLabel: "Odontopediatría",
      alt: "Dentista examinando los dientes de un niño pequeño",
    },
  ],
};

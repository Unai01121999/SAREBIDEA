/* =====================================================================
   CONFIG.JS — TODOS LOS DATOS EDITABLES DEL BAR
   Todo lo marcado como [PROVISIONAL] es un dato de ejemplo.
   Sustitúyelo por los datos reales del negocio.
   ===================================================================== */
window.BAR = {
  name: "Bar Costa",
  tagline: "Cenas de fin de semana",
  address: "Calle Ejemplo, 00, 00000 Ciudad", // [PROVISIONAL]
  phone: "+34 600 000 000",                  // [PROVISIONAL] (visible)
  phoneRaw: "+34600000000",                  // [PROVISIONAL] (para enlaces tel:)
  whatsapp: "34600000000",                   // [PROVISIONAL] prefijo país + número, sin + ni espacios
  email: "hola@ejemplo.com",                 // [PROVISIONAL]
  instagram: "@nombredelbar",                // [PROVISIONAL]
  instagramUrl: "https://instagram.com/",    // [PROVISIONAL]
  facebookUrl: "https://facebook.com/",      // [PROVISIONAL]
  tiktokUrl: "https://tiktok.com/",          // [PROVISIONAL]
  // Coordenadas del mapa (provisionales: centro de Madrid)
  mapLat: 40.4168, mapLng: -3.7038,

  // Horario general (texto visible en contacto)
  hours: [
    ["Lunes a jueves", "Cerrado"],            // [PROVISIONAL]
    ["Viernes", "20:00 – 00:30"],             // [PROVISIONAL]
    ["Sábado", "20:00 – 00:30"],              // [PROVISIONAL]
    ["Domingo", "Cerrado"]                    // [PROVISIONAL]
  ],

  // Reservas: días de la semana (0=domingo ... 6=sábado) y franjas horarias
  bookingDays: [5, 6],
  bookingSlots: ["20:00", "20:30", "21:00", "21:30", "22:00", "22:30"],
  maxPartySize: 10,

  // ÁREA PRIVADA — cambia esta contraseña. OJO: al ser una web estática sin
  // servidor, NO es seguridad real (ver LEEME.md). Sirve como demo.
  adminUser: "admin",
  adminPass: "demo",

  // Imágenes (provisionales, de Unsplash). Cambia por fotos propias del local.
  img: {
    hero:  "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
    about: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    about2:"https://images.unsplash.com/photo-1470337458703-46ad1756a187",
    weekend:"https://images.unsplash.com/photo-1559339352-11d035aa65de"
  },

  // Carta destacada. Precios y platos PROVISIONALES.
  menu: [
    { cat: "entrantes", name: "Entrante de la casa 1", desc: "Descripción provisional del plato. Producto de temporada.", price: "00,00 €", img: "photo-1546069901-ba9599a7e63c" },
    { cat: "entrantes", name: "Entrante de la casa 2", desc: "Descripción provisional del plato. Para abrir boca.", price: "00,00 €", img: "photo-1541529086526-db283c563270" },
    { cat: "principales", name: "Plato principal 1", desc: "Descripción provisional del plato, con guarnición.", price: "00,00 €", img: "photo-1544025162-d76694265947" },
    { cat: "principales", name: "Plato principal 2", desc: "Descripción provisional del plato del día.", price: "00,00 €", img: "photo-1414235077428-338989a2e8c0" },
    { cat: "hamburguesas", name: "Hamburguesa de la casa", desc: "Descripción provisional. Pan artesano y salsa propia.", price: "00,00 €", img: "photo-1568901346375-23c9450c58cd" },
    { cat: "hamburguesas", name: "Pizza de la casa", desc: "Descripción provisional. Masa de fermentación lenta.", price: "00,00 €", img: "photo-1513104890138-7c749659a591" },
    { cat: "compartir", name: "Tabla para compartir", desc: "Descripción provisional. Ideal para 2–3 personas.", price: "00,00 €", img: "photo-1543007630-9710e4a00a20" },
    { cat: "compartir", name: "Ración para compartir", desc: "Descripción provisional. Para picar entre amigos.", price: "00,00 €", img: "photo-1565299624946-b28f40a0ae38" },
    { cat: "postres", name: "Postre de la casa 1", desc: "Descripción provisional. Elaboración propia.", price: "00,00 €", img: "photo-1578985545062-69928b1d9587" },
    { cat: "postres", name: "Postre de la casa 2", desc: "Descripción provisional. Para terminar dulce.", price: "00,00 €", img: "photo-1519915212116-7cfef71f1d3e" }
  ],
  categories: [
    ["todos", "Todo"], ["entrantes", "Entrantes"], ["principales", "Principales"],
    ["hamburguesas", "Hamburguesas y pizzas"], ["compartir", "Para compartir"], ["postres", "Postres"]
  ],
  cartaUrl: "#carta",   // enlace al PDF/carta completa cuando exista, p. ej. "carta.pdf"

  gallery: [
    ["photo-1517248135467-4c7edcad34c4", "Interior del local", "tall"],
    ["photo-1414235077428-338989a2e8c0", "Nuestros platos", ""],
    ["photo-1551538827-9c037cb4f32a", "Cócteles", ""],
    ["photo-1536935338788-846bb9981813", "Ambiente nocturno", "wide"],
    ["photo-1568901346375-23c9450c58cd", "Hamburguesas", ""],
    ["photo-1572116469696-31de0f17cc34", "La barra", "tall"],
    ["photo-1470337458703-46ad1756a187", "Bebidas", ""],
    ["photo-1513104890138-7c749659a591", "Pizzas", ""]
  ]
};

// Helper para construir URLs de imagen optimizadas
// Acepta: id de Unsplash ("photo-..."), URL de Unsplash, o cualquier otra URL/ruta/imagen subida (se usa tal cual)
window.unsplash = (src, w) => {
  if (/^photo-/.test(src)) src = "https://images.unsplash.com/" + src;
  if (/^https:\/\/images\.unsplash\.com\//.test(src)) return src.split("?")[0] + "?auto=format&fit=crop&q=70&w=" + (w || 800);
  return src;
};

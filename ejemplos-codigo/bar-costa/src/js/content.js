/* CONTENIDO EDITABLE
   - DEF: valores por defecto de todos los textos.
   - GROUPS: secciones y campos del editor del área privada.
   - Las ediciones se guardan como "overrides" en localStorage y se aplican sobre window.BAR.
   En producción, sustituir load()/save() por llamadas a tu servidor. */
(function () {
  const B = window.BAR, O = JSON.parse(JSON.stringify(B));
  const KEY = "bar_content_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let ov = load();

  const DEF = {
    "nav.1": "Nosotros", "nav.2": "Carta", "nav.3": "Cenas", "nav.4": "Galería", "nav.5": "Contacto",
    "nav.cta": "Reservar mesa", "nav.admin": "Área privada", "nav.sticky": "Reservar",
    "show.nosotros": "1", "show.carta": "1", "show.cenas": "1", "show.galeria": "1", "show.contacto": "1",
    "hero.eyebrow": "Viernes y sábados · Cenas",
    "hero.sub": "Donde empieza el fin de semana",
    "hero.text": "Cuando cae la noche, el bar se transforma: luz cálida, buena mesa y una carta pensada para compartir con amigos o en pareja.",
    "hero.btn1": "Reservar mesa", "hero.btn2": "Ver carta",
    "about.eyebrow": "Nuestra casa",
    "about.title": "Un bar de barrio con *alma de cena*",
    "about.p1": "Bar Costa nació de una idea sencilla: tener un sitio donde sentirse como en casa, con el aire de mar y la cocina sin prisa de las tardes de verano. Empezó como una pequeña barra de barrio, con cafés por la mañana y vermut al mediodía. Poco a poco los vecinos empezaron a quedarse a cenar, y lo que era una excepción se volvió costumbre. Hoy seguimos fieles a aquella esencia: producto fresco, recetas hechas con calma y una mesa siempre lista para quien llega con ganas de compartir.",
    "about.p2": "Durante la semana es un sitio para tomar algo. Los fines de semana el espacio se transforma en un lugar para cenar con calma, brindar y alargar la sobremesa con amigos o en pareja.",
    "about.pil1t": "Producto", "about.pil1d": "Cocina de temporada",
    "about.pil2t": "Ambiente", "about.pil2d": "Luz tenue y buena música",
    "about.pil3t": "Barra", "about.pil3d": "Cócteles y vinos",
    "about.stamp": "Desde 20XX",
    "menu.eyebrow": "Propuesta gastronómica",
    "menu.title": "Para compartir, *para disfrutar*",
    "menu.lead": "Una selección de nuestros platos. Los precios y descripciones son provisionales.",
    "menu.btn": "Ver carta completa",
    "menu.note": "Consulta alérgenos al reservar o con nuestro equipo.",
    "cat.todos": "Todo", "cat.entrantes": "Entrantes", "cat.principales": "Principales",
    "cat.hamburguesas": "Hamburguesas y pizzas", "cat.compartir": "Para compartir", "cat.postres": "Postres",
    "wk.eyebrow": "Cenas de fin de semana",
    "wk.title": "Viernes y sábado *por la noche*",
    "wk.big": "Reserva tu mesa y disfruta de nuestra propuesta gastronómica en un ambiente relajado.",
    "wk.lead": "Cenas con mesa reservada, tiempo para charlar y una barra lista para cerrar la noche como se merece.",
    "wk.box": "Horarios y reservas",
    "wk.r1l": "Días de cena", "wk.r1v": "Viernes y sábado",
    "wk.r2l": "Primer turno", "wk.r2v": "20:00 [provisional]",
    "wk.r3l": "Último turno", "wk.r3v": "22:30 [provisional]",
    "wk.r4l": "Cierre de cocina", "wk.r4v": "23:30 [provisional]",
    "wk.r5l": "Reservas", "wk.r5v": "Recomendadas",
    "wk.btn": "Reservar mesa",
    "gal.eyebrow": "Galería",
    "gal.title": "Así se vive *la noche*",
    "bk.eyebrow": "Reservas",
    "bk.title": "Reserva tu *mesa*",
    "bk.text": "Cuéntanos cuándo quieres venir y te confirmaremos la reserva lo antes posible.",
    "bk.perk1": "Solo viernes y sábados", "bk.perk2": "Confirmación por teléfono o WhatsApp", "bk.perk3": "Grupos grandes: escríbenos",
    "bk.wa": "Escribir por WhatsApp",
    "bk.btn": "Solicitar reserva",
    "bk.ok": "Te confirmaremos la reserva por teléfono o WhatsApp.",
    "form.nombre": "Nombre", "form.tel": "Teléfono", "form.personas": "Personas", "form.fecha": "Fecha (vie/sáb)", "form.hora": "Hora",
    "form.coment": "Comentarios", "form.ph": "Alergias, celebración, trona…",
    "form.priv": "He leído y acepto la", "form.privlink": "política de privacidad",
    "ct.eyebrow": "Ubicación y contacto",
    "ct.title": "Ven a *vernos*",
    "ct.btn": "Cómo llegar",
    "ct.l1": "Dirección", "ct.l2": "Teléfono", "ct.l3": "Horario", "ct.l4": "Instagram",
    "foot.text": "Cenas de viernes y sábado en un ambiente cálido y relajado.",
    "foot.h1": "Navegación", "foot.h2": "Síguenos",
    "foot.l1": "Inicio", "foot.l2": "Carta", "foot.l3": "Reservas", "foot.l4": "Contacto",
    "foot.s1": "Instagram", "foot.s2": "Facebook", "foot.s3": "TikTok",
    "foot.copy": "Todos los derechos reservados.",
    "foot.lg1": "Aviso legal", "foot.lg2": "Política de privacidad",
    "legal.aviso": "[TEXTO PROVISIONAL] Sustituir por el aviso legal real: titular, NIF/CIF, domicilio, correo de contacto y datos de inscripción registral si procede.",
    "legal.privacidad": "[TEXTO PROVISIONAL] Sustituir por la política real, revisada por un profesional. Debe indicar responsable, finalidad (gestionar reservas), base jurídica, plazos de conservación, destinatarios y derechos de los usuarios.",
    "bar.metaDesc": "Cenas los viernes y sábados por la noche. Reserva tu mesa y disfruta de una propuesta gastronómica en un ambiente relajado.",
    "bar.bookingDays": O.bookingDays.join(",")
  };
  ["name", "tagline", "address", "phone", "whatsapp", "email", "instagram", "instagramUrl", "facebookUrl", "tiktokUrl", "mapLat", "mapLng", "cartaUrl", "maxPartySize", "adminUser", "adminPass"]
    .forEach(k => DEF["bar." + k] = String(O[k]));
  DEF["bar.bookingSlots"] = O.bookingSlots.join(", ");
  Object.keys(O.img).forEach(k => DEF["img." + k] = O.img[k]);
  O.hours.forEach((h, i) => { DEF["hours." + i + ".l"] = h[0]; DEF["hours." + i + ".v"] = h[1]; });

  const T = k => ov[k] !== undefined ? ov[k] : DEF[k];

  function applyBar() {
    Object.keys(ov).forEach(k => {
      const v = ov[k];
      if (k.startsWith("bar.")) {
        const n = k.slice(4);
        if (n === "mapLat" || n === "mapLng") { const f = parseFloat(String(v).replace(",", ".")); if (!isNaN(f)) B[n] = f; }
        else if (n === "maxPartySize") { const i = parseInt(v, 10); if (i > 0) B[n] = i; }
        else if (n === "bookingSlots") { const a = String(v).split(",").map(s => s.trim()).filter(Boolean); if (a.length) B[n] = a; }
        else if (n === "bookingDays") { const a = String(v).split(",").filter(s => s !== "").map(Number); if (a.length) B[n] = a; }
        else if (n === "whatsapp") B[n] = String(v).replace(/\D/g, "");
        else B[n] = v;
      } else if (k.startsWith("img.")) B.img[k.slice(4)] = v;
      else if (k.startsWith("hours.")) { const p = k.split("."); if (B.hours[p[1]]) B.hours[p[1]][p[2] === "l" ? 0 : 1] = v; }
      else if (k.startsWith("cat.")) { const c = B.categories.find(c => c[0] === k.slice(4)); if (c) c[1] = v; }
      else if (k === "menu" && Array.isArray(v)) B.menu = v;
      else if (k === "gallery" && Array.isArray(v)) B.gallery = v;
    });
    B.phoneRaw = B.phone.replace(/[^\d+]/g, "");
  }
  applyBar();

  // ---- Secciones del editor ----
  const f = (k, label, type, hint) => ({ k, label, type: type || "text", hint });
  const show = (id, label) => f("show." + id, label || "Mostrar esta sección en la web", "toggle");
  window.GROUPS = [
    { id: "general", title: "Datos del bar", icon: "🏠", anchor: "contacto", hint: "Nombre, contacto, redes y horario general. Se usan en toda la web.", fields: [
      f("bar.name", "Nombre del bar"), f("bar.tagline", "Subtítulo (aparece en la pestaña del navegador)"),
      f("bar.metaDesc", "Descripción para Google (SEO)", "area", "Una o dos frases que aparecen en los buscadores."),
      f("bar.address", "Dirección"), f("bar.phone", "Teléfono (visible)"),
      f("bar.whatsapp", "WhatsApp", "text", "Prefijo de país + número, sin + ni espacios. Ej.: 34600000000"), f("bar.email", "Email"),
      f("bar.instagram", "Instagram (texto visible)"), f("bar.instagramUrl", "Instagram (enlace)", "url"),
      f("bar.facebookUrl", "Facebook (enlace)", "url"), f("bar.tiktokUrl", "TikTok (enlace)", "url"),
      f("bar.mapLat", "Mapa: latitud", "text", "Botón derecho sobre tu local en Google Maps → copia las coordenadas."), f("bar.mapLng", "Mapa: longitud"),
      f("bar.cartaUrl", "Enlace a la carta completa", "url", "Ej.: carta.pdf (súbelo junto a la web) o una URL.")
    ].concat(O.hours.flatMap((h, i) => [f("hours." + i + ".l", "Horario " + (i + 1) + ": días"), f("hours." + i + ".v", "Horario " + (i + 1) + ": horas")])) },
    { id: "nav", title: "Menú superior y pie", icon: "🧭", anchor: "inicio", hint: "Nombres de los enlaces del menú, botones fijos y pie de página.", fields: [
      f("nav.1", "Menú: enlace 1"), f("nav.2", "Menú: enlace 2"), f("nav.3", "Menú: enlace 3"), f("nav.4", "Menú: enlace 4"), f("nav.5", "Menú: enlace 5"),
      f("nav.cta", "Botón «Reservar mesa»"), f("nav.admin", "Botón «Área privada»"), f("nav.sticky", "Botón fijo en móvil"),
      f("foot.text", "Texto bajo el logo (pie)", "area"), f("foot.h1", "Pie: título columna 2"), f("foot.h2", "Pie: título columna 3"),
      f("foot.l1", "Pie: enlace 1"), f("foot.l2", "Pie: enlace 2"), f("foot.l3", "Pie: enlace 3"), f("foot.l4", "Pie: enlace 4"),
      f("foot.s1", "Red social 1"), f("foot.s2", "Red social 2"), f("foot.s3", "Red social 3"),
      f("foot.copy", "Texto del copyright"), f("foot.lg1", "Enlace aviso legal"), f("foot.lg2", "Enlace política de privacidad")] },
    { id: "hero", title: "Portada", icon: "🌙", anchor: "inicio", hint: "Lo primero que ve el visitante.", fields: [
      f("img.hero", "Imagen de fondo", "img"), f("hero.eyebrow", "Texto superior"), f("hero.sub", "Frase principal"),
      f("hero.text", "Texto breve", "area"), f("hero.btn1", "Botón principal"), f("hero.btn2", "Botón secundario")] },
    { id: "about", title: "Sobre nosotros", icon: "📖", anchor: "nosotros", toggle: "nosotros", hint: "La historia del bar.", fields: [
      show("nosotros"), f("about.eyebrow", "Texto superior"), f("about.title", "Título", "text", "Usa *asteriscos* para cursiva dorada."),
      f("about.p1", "Párrafo 1 (historia)", "area"), f("about.p2", "Párrafo 2", "area"),
      f("about.pil1t", "Pilar 1: título"), f("about.pil1d", "Pilar 1: texto"), f("about.pil2t", "Pilar 2: título"), f("about.pil2d", "Pilar 2: texto"),
      f("about.pil3t", "Pilar 3: título"), f("about.pil3d", "Pilar 3: texto"),
      f("about.stamp", "Sello sobre la foto"), f("img.about", "Foto grande del local", "img"), f("img.about2", "Foto pequeña", "img")] },
    { id: "menu", title: "Carta y platos", icon: "🍽️", anchor: "carta", toggle: "carta", list: "menu", hint: "Textos de la sección y todos los platos.", fields: [
      show("carta"), f("menu.eyebrow", "Texto superior"), f("menu.title", "Título"), f("menu.lead", "Texto", "area"),
      f("menu.btn", "Botón «carta completa»"), f("menu.note", "Nota bajo el botón"),
      f("cat.todos", "Categoría: todos"), f("cat.entrantes", "Categoría 1"), f("cat.principales", "Categoría 2"),
      f("cat.hamburguesas", "Categoría 3"), f("cat.compartir", "Categoría 4"), f("cat.postres", "Categoría 5")] },
    { id: "weekend", title: "Cenas de fin de semana", icon: "🕯️", anchor: "cenas", toggle: "cenas", hint: "Sección destacada de horarios y turnos.", fields: [
      show("cenas"), f("img.weekend", "Imagen de fondo", "img"), f("wk.eyebrow", "Texto superior"), f("wk.title", "Título"),
      f("wk.big", "Frase destacada", "area"), f("wk.lead", "Texto", "area"), f("wk.box", "Título de la caja de horarios")]
      .concat([1, 2, 3, 4, 5].flatMap(i => [f("wk.r" + i + "l", "Fila " + i + ": concepto"), f("wk.r" + i + "v", "Fila " + i + ": valor")])).concat([f("wk.btn", "Botón")]) },
    { id: "gallery", title: "Galería", icon: "📷", anchor: "galeria", toggle: "galeria", list: "gallery", hint: "Fotos del local, platos y ambiente.", fields: [
      show("galeria"), f("gal.eyebrow", "Texto superior"), f("gal.title", "Título")] },
    { id: "book", title: "Reservas", icon: "📅", anchor: "reservas", hint: "Formulario, horas y días disponibles.", fields: [
      f("bk.eyebrow", "Texto superior"), f("bk.title", "Título"), f("bk.text", "Texto", "area"),
      f("bk.perk1", "Ventaja 1"), f("bk.perk2", "Ventaja 2"), f("bk.perk3", "Ventaja 3"), f("bk.wa", "Botón WhatsApp"),
      f("bar.bookingDays", "Días en los que se aceptan reservas", "days"),
      f("bar.bookingSlots", "Horas disponibles", "text", "Separadas por comas. Ej.: 20:00, 20:30, 21:00"),
      f("bar.maxPartySize", "Máximo de personas por reserva"),
      f("form.nombre", "Formulario: etiqueta nombre"), f("form.tel", "Formulario: etiqueta teléfono"), f("form.personas", "Formulario: etiqueta personas"),
      f("form.fecha", "Formulario: etiqueta fecha"), f("form.hora", "Formulario: etiqueta hora"), f("form.coment", "Formulario: etiqueta comentarios"),
      f("form.ph", "Formulario: ejemplo en comentarios"), f("form.priv", "Casilla de privacidad: texto"), f("form.privlink", "Casilla de privacidad: enlace"),
      f("bk.btn", "Botón enviar"), f("bk.ok", "Mensaje tras reservar", "area", "Va después de «Gracias, nombre…».")] },
    { id: "contact", title: "Contacto y mapa", icon: "📍", anchor: "contacto", toggle: "contacto", hint: "Dirección, horario y mapa (los datos están en «Datos del bar»).", fields: [
      show("contacto"), f("ct.eyebrow", "Texto superior"), f("ct.title", "Título"), f("ct.btn", "Botón «Cómo llegar»"),
      f("ct.l1", "Etiqueta: dirección"), f("ct.l2", "Etiqueta: teléfono"), f("ct.l3", "Etiqueta: horario"), f("ct.l4", "Etiqueta: Instagram")] },
    { id: "legal", title: "Textos legales", icon: "⚖️", anchor: "inicio", hint: "Revisa estos textos con un profesional.", fields: [
      f("legal.aviso", "Aviso legal", "area"), f("legal.privacidad", "Política de privacidad", "area")] },
    { id: "access", title: "Acceso privado", icon: "🔑", anchor: "inicio", hint: "Usuario y contraseña del área privada.", fields: [
      f("bar.adminUser", "Usuario"), f("bar.adminPass", "Contraseña")] }
  ];

  window.Content = {
    T, DEF,
    defaults: k => DEF[k],
    defMenu: () => O.menu, defGallery: () => O.gallery,
    isCustom: k => ov[k] !== undefined,
    /** Guarda solo lo que difiere del original. Devuelve false si no cabe en el almacenamiento. */
    save(values, menu, gallery) {
      const next = {};
      Object.keys(values).forEach(k => { if (String(values[k]) !== String(DEF[k])) next[k] = values[k]; });
      if (JSON.stringify(menu) !== JSON.stringify(O.menu)) next.menu = menu;
      if (JSON.stringify(gallery) !== JSON.stringify(O.gallery)) next.gallery = gallery;
      try { localStorage.setItem(KEY, JSON.stringify(next)); ov = next; return true; } catch (e) { return false; }
    },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} ov = {}; },
    export: () => JSON.stringify(ov),
    import(json) { const o = JSON.parse(json); if (typeof o !== "object" || !o) throw 0; localStorage.setItem(KEY, JSON.stringify(o)); ov = o; },
    menu: () => B.menu, gallery: () => B.gallery
  };
})();

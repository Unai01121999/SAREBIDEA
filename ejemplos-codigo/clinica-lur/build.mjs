// Generador estático: node build.mjs  →  carpeta ./site
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cfg from "./site.config.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, "site");
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const treatments = cfg.treatments.filter((t) => t.enabled);
const a = cfg.address;
const fullAddress = [a.street, [a.postalCode, a.city].filter(Boolean).join(" "), a.region].filter(Boolean).join(", ");
const abs = (p) => (cfg.siteUrl ? cfg.siteUrl.replace(/\/$/, "") + p : p);

/* ───────── Piezas reutilizables ───────── */
const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;

// Imagen editorial con marcador provisional: si el archivo no existe, se ve el hueco etiquetado.
const media = ({ src, alt, label, ratio = "r-45", tone = "t1", eager = false, cls = "" }) =>
  `<figure class="media ${ratio} ${tone} ${cls}" data-label="${esc("Fotografía provisional: " + label)}"><img src="/assets/img/${src}" alt="${esc(alt)}" width="1200" height="900" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} onerror="this.remove()"></figure>`;

const phoneLink = (cls = "") =>
  cfg.phoneHref ? `<a class="${cls}" href="tel:${esc(cfg.phoneHref)}">${esc(cfg.phone)}</a>` : `<span class="todo">Teléfono pendiente de indicar</span>`;
const emailLink = () => (cfg.email ? `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>` : `<span class="todo">Correo pendiente de indicar</span>`);
const bookingHref = cfg.bookingUrl || "/#cita";
const contactHref = "/#contacto";

const nav = [
  ["Inicio", "/#inicio"],
  ["La clínica", "/#clinica"],
  ["Tratamientos", "/#tratamientos"],
  ["Equipo", "/#equipo"],
  ["Contacto", "/#contacto"],
];

const header = (current) => `
<header class="site-header ${cfg.draftNotice ? "" : ""}">
  <div class="wrap header-in">
    <a class="logo" href="/" aria-label="${esc(cfg.name)}, inicio"><b>${esc(cfg.name)}</b><small>Odontología</small></a>
    <nav class="nav" aria-label="Principal">
      ${nav.map(([l, h]) => `<a class="nl" href="${h}">${l}</a>`).join("")}
    </nav>
    <a class="btn btn-primary btn-sm header-cta" href="${bookingHref}">Reservar cita</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menú"><span></span><span></span></button>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>
<div class="mobile-menu" id="mobile-menu">
  ${nav.map(([l, h]) => `<a class="ml" href="${h}">${l}</a>`).join("")}
  <div class="mm-foot">
    <a class="btn btn-primary" href="${bookingHref}">Reservar cita</a>
    ${cfg.phoneHref ? `<a class="btn btn-ghost" href="tel:${esc(cfg.phoneHref)}">${icon("phone")} Llamar ${esc(cfg.phone)}</a>` : ""}
  </div>
</div>`;

const hoursHtml = () => `<div class="hours">${cfg.hours.map((h) => `<div><span>${esc(h.d)}</span><span>${esc(h.h)}</span></div>`).join("")}</div>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="logo" href="/"><b>${esc(cfg.name)}</b><small>Odontología</small></a>
        <p style="margin-top:22px;max-width:34ch">Atención bucodental personalizada, explicada con claridad y pensada para que te sientas en buenas manos.</p>
        ${cfg.social.length ? `<ul style="margin-top:22px">${cfg.social.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join("")}</ul>` : ""}
      </div>
      <div>
        <h4>Tratamientos</h4>
        <ul>${treatments.map((t) => `<li><a href="/#tratamientos">${esc(t.name)}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h4>Navegación</h4>
        <ul>${nav.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h4>Contacto</h4>
        <ul>
          <li>${cfg.phoneHref ? `<a href="tel:${esc(cfg.phoneHref)}">${esc(cfg.phone)}</a>` : "Teléfono pendiente"}</li>
          <li>${fullAddress ? esc(fullAddress) : "Dirección pendiente"}</li>
          ${cfg.hours.map((h) => `<li>${esc(h.d)}: ${esc(h.h)}</li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(cfg.owner.name)} · ${esc(cfg.owner.taxId)}</span>
      <nav aria-label="Legal">
        <a href="/aviso-legal/">Aviso legal</a><a href="/privacidad/">Política de privacidad</a><a href="/cookies/">Política de cookies</a>
      </nav>
    </div>
  </div>
</footer>`;

const page = ({ path: p, title, desc, body, image = "hero.jpg", noindex = false, jsonld = true }) => {
  const url = abs(p);
  const ld = jsonld && p === "/" ? { "@context": "https://schema.org", "@type": "Dentist", name: cfg.name, url: cfg.siteUrl || undefined, telephone: cfg.phoneHref || undefined, email: cfg.email || undefined, address: a.street ? { "@type": "PostalAddress", streetAddress: a.street, postalCode: a.postalCode || undefined, addressLocality: a.city || undefined, addressRegion: a.region || undefined, addressCountry: "ES" } : undefined, sameAs: cfg.social.length ? cfg.social.map((s) => s.url) : undefined } : null;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ""}
${cfg.siteUrl ? `<link rel="canonical" href="${esc(url)}">` : ""}
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
${cfg.siteUrl ? `<meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(abs("/assets/img/" + image))}">` : ""}
<meta name="theme-color" content="#FAF9F6">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23FAF9F6'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-size='20' text-anchor='middle' fill='%2355645A'%3EC%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
<script>document.documentElement.classList.add('js')</script>
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Saltar al contenido</a>
${cfg.draftNotice ? `<div class="notice" role="note">Borrador: textos, datos e imágenes provisionales pendientes de confirmar por la clínica.</div>` : ""}
${header(p)}
<div class="scroll-sentinel" aria-hidden="true" style="position:absolute;top:0;height:1px;width:1px"></div>
<main id="main">
${body}
</main>
${footer()}
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js" defer></script>
<script src="/assets/main.js" defer></script>
</body>
</html>`;
};

/* ───────── Secciones ───────── */
const trust = () => `
<section class="trust" data-nav="inicio" aria-label="Por qué elegirnos">
  <div class="wrap trust-grid">
    ${[
      ["01", "heart-handshake", "Atención personalizada", "Dedicamos tiempo a escucharte para entender qué necesitas y cómo te sientes."],
      ["02", "microscope", "Tecnología odontológica", "Apoyamos el diagnóstico y la planificación con los recursos disponibles en la clínica."],
      ["03", "smile", "Cuidado integral de la sonrisa", "Desde la prevención hasta la estética, con una visión completa de tu salud bucodental."],
    ].map(([n, ic, t, d], i) => `
    <article class="trust-item reveal" style="--d:${i * 90}ms">
      <div class="trust-top"><span class="num">${n}</span>${icon(ic)}</div>
      <h3>${t}</h3><p>${d}</p>
    </article>`).join("")}
  </div>
</section>`;

const treatmentsGrid = () => `
<section class="section" id="tratamientos" data-nav="tratamientos" aria-labelledby="t-title">
  <div class="wrap">
    <div class="sec-head reveal">
      <h2 class="h2" id="t-title">Cuidamos de tu sonrisa <em>en cada etapa.</em></h2>
      <p class="lead">Descubre nuestros tratamientos y encuentra la atención que necesitas para tu salud bucodental.</p>
    </div>
    <div class="tgrid">
      ${treatments.map((t, i) => `
      <article class="titem reveal" style="--d:${(i % 2) * 80}ms">
        <div class="zoom">${media({ src: t.img, alt: t.alt, label: t.imgLabel, ratio: ["r-43", "r-34", "r-45", "r-32", "r-43", "r-45"][i % 6], tone: ["t1", "t2", "t3", "t4", "t5", "t2"][i % 6] })}</div>
        <div class="meta"><span class="idx">0${i + 1}</span><h3>${esc(t.name)}</h3></div>
        <p>${esc(t.short)}</p>
        <button class="tlink" type="button" aria-expanded="false" aria-controls="td-${t.slug}" data-toggle>Descubrir tratamiento ${icon("arrow-right")}</button>
        <div class="tdetail" id="td-${t.slug}"><div>
          <p>${esc(t.long)}</p>
          <a class="tlink" href="${bookingHref}" data-motivo="${t.slug}">Solicitar cita ${icon("arrow-right")}</a>
        </div></div>
      </article>`).join("")}
    </div>
  </div>
</section>`;

const editorial = (flip = false) => `
<section class="section" id="clinica" data-nav="clinica" aria-labelledby="ed-title">
  <div class="wrap split ${flip ? "flip" : ""}">
    <div class="vis reveal-img">${media({ src: "clinica.jpg", alt: "Dentista examinando a un paciente en la consulta", label: "La clínica, el equipo o un profesional con un paciente", ratio: "r-45", tone: "t3" })}</div>
    <div class="copy reveal">
      <h2 class="h2" id="ed-title">Cuidar de ti va más allá <em>de tu sonrisa.</em></h2>
      <div class="prose">
        <p>Creemos que una buena experiencia dental comienza escuchando a cada persona.</p>
        <p>Por eso, apostamos por una atención cercana, explicaciones claras y tratamientos adaptados a las necesidades de cada paciente.</p>
        <p>Queremos que cada visita sea una oportunidad para cuidar de tu salud bucodental con tranquilidad y confianza.</p>
      </div>
      <a class="btn btn-ghost" href="#galeria">Conoce nuestra clínica ${icon("arrow-right")}</a>
    </div>
  </div>
</section>`;

const pillars = (title = "Una forma diferente de cuidar <em>tu sonrisa.</em>") => `
<section class="section tint" data-nav="clinica" aria-labelledby="p-title">
  <div class="wrap">
    <div class="sec-head reveal"><h2 class="h2" id="p-title">${title}</h2></div>
    <div class="pillars">
      ${[
        ["Escucha y confianza", "Dedicamos atención a comprender las necesidades y expectativas de cada paciente."],
        ["Planificación personalizada", "Cada propuesta de tratamiento debe adaptarse a la situación clínica y las necesidades individuales."],
        ["Tecnología y precisión", "Utilizamos los recursos tecnológicos disponibles en la clínica para apoyar el diagnóstico y la planificación cuando corresponde."],
        ["Acompañamiento", "Te explicamos las opciones de tratamiento para que puedas tomar decisiones informadas junto al profesional."],
      ].map(([t, d], i) => `<article class="pillar reveal" style="--d:${(i % 2) * 90}ms"><span class="n">0${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div></article>`).join("")}
    </div>
  </div>
</section>`;

const teamSection = (tint = true) => {
  const members = cfg.team.length ? cfg.team : [0, 1, 2].map((i) => ({ placeholder: true, i }));
  return `
<section class="section ${tint ? "tint" : ""}" id="equipo" data-nav="equipo" aria-labelledby="eq-title">
  <div class="wrap">
    <div class="sec-head reveal"><h2 class="h2" id="eq-title">Profesionales que <em>cuidan de ti.</em></h2></div>
    <div class="team">
      ${members.map((m, i) => m.placeholder ? `
      <article class="person reveal" style="--d:${i * 90}ms">
        ${media({ src: `equipo-${i + 1}.jpg`, alt: "Retrato del profesional", label: `Retrato profesional ${i + 1}`, ratio: "r-34", tone: ["t2", "t3", "t5"][i] })}
        <div><h3>Nombre y apellidos</h3><p class="role">Especialidad</p></div>
        <p class="pending">Breve biografía y formación verificada, pendientes de aportar por la clínica.</p>
      </article>` : `
      <article class="person reveal" style="--d:${i * 90}ms">
        ${media({ src: m.photo || `equipo-${i + 1}.jpg`, alt: `Retrato de ${m.name}`, label: m.name, ratio: "r-34", tone: "t2" })}
        <div><h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p></div>
        <p>${esc(m.bio || "")}</p>${m.training ? `<p class="note">${esc(m.training)}</p>` : ""}
      </article>`).join("")}
    </div>
  </div>
</section>`;
};

const gallery = () => `
<section class="section tint" id="galeria" data-nav="clinica" aria-labelledby="g-title">
  <div class="wrap">
    <div class="sec-head reveal"><h2 class="h2" id="g-title">Un espacio pensado para que <em>te sientas bien.</em></h2></div>
    <div class="mosaic">
      ${[
        ["galeria-1.jpg", "Recepción", "Recepción de la clínica", "t1", "m1"],
        ["galeria-2.jpg", "Sala de espera", "Sala de espera de la clínica", "t2", "m2"],
        ["galeria-3.jpg", "Gabinete dental", "Gabinete dental", "t3", "m3"],
        ["galeria-4.jpg", "Equipamiento", "Equipamiento de la clínica", "t4", "m4"],
        ["galeria-5.jpg", "Detalles arquitectónicos", "Detalle arquitectónico de la clínica", "t5", "m5"],
        ["galeria-6.jpg", "Espacio de atención al paciente", "Espacio de atención al paciente", "t1", "m6"],
      ].map(([s, l, alt, tone, c], i) => `<div class="zoom ${c} reveal" style="--d:${(i % 3) * 70}ms">${media({ src: s, alt, label: l, ratio: "", tone })}</div>`).join("")}
    </div>
  </div>
</section>`;

const opinions = () => cfg.reviews.length ? `
<section class="section" data-nav="equipo" aria-labelledby="o-title">
  <div class="wrap">
    <div class="sec-head reveal"><h2 class="h2" id="o-title">La confianza se construye <em>con cada experiencia.</em></h2></div>
    <div class="quotes">
      ${cfg.reviews.map((r) => `<figure class="quote reveal" style="margin:0"><p>“${esc(r.text)}”</p><cite>${esc(r.author || "Paciente")}${r.source ? `, ${r.url ? `<a href="${esc(r.url)}" rel="noopener" target="_blank" style="text-decoration:underline">${esc(r.source)}</a>` : esc(r.source)}` : ""}</cite></figure>`).join("")}
    </div>
    ${cfg.reviewsProfileUrl ? `<p style="margin-top:40px"><a class="tlink" href="${esc(cfg.reviewsProfileUrl)}" rel="noopener" target="_blank">Ver más opiniones ${icon("arrow-right")}</a></p>` : ""}
  </div>
</section>` : `
<section class="section" data-nav="equipo" aria-labelledby="o-title">
  <div class="wrap philo">
    <div class="reveal">
      <h2 class="h2" id="o-title" style="margin-bottom:34px">La confianza se construye <em>con cada experiencia.</em></h2>
      <p class="big">Escuchar primero, explicar con claridad y decidir juntos. Así entendemos cada visita.</p>
    </div>
    <div class="prose reveal" style="--d:120ms">
      <p>Cada persona llega con su historia, sus dudas y su propio ritmo. Nuestro trabajo es darte el tiempo y la información que necesitas para sentirte tranquilo con cada decisión sobre tu salud bucodental.</p>
    </div>
  </div>
</section>`;

const infoBlock = () => `
<dl class="info">
  <div class="info-row">${icon("map-pin")}<div><dt>Dirección</dt><dd>${fullAddress ? esc(fullAddress) : '<span class="todo">Dirección pendiente de indicar</span>'}</dd></div></div>
  <div class="info-row">${icon("phone")}<div><dt>Teléfono</dt><dd>${phoneLink()}</dd></div></div>
  <div class="info-row">${icon("mail")}<div><dt>Correo electrónico</dt><dd>${emailLink()}</dd></div></div>
  <div class="info-row">${icon("clock")}<div><dt>Horario</dt><dd>${hoursHtml()}</dd></div></div>
  ${cfg.mapsDirectionsUrl ? `<div><a class="tlink" href="${esc(cfg.mapsDirectionsUrl)}" rel="noopener" target="_blank">Cómo llegar ${icon("arrow-right")}</a></div>` : `<div class="note">El enlace «Cómo llegar» se activará al indicar la ubicación real.</div>`}
</dl>`;

const mapBlock = () => `
<div class="map">
  ${cfg.mapEmbedUrl
    ? `<div class="media r-169 t2"><iframe title="Mapa con la ubicación de la clínica" src="${esc(cfg.mapEmbedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
    : `<div class="media r-169 t2" data-label=""><div class="map-pending"><p>Mapa pendiente: se mostrará aquí con la ubicación real de la clínica.</p></div></div>`}
</div>`;

const form = (idPrefix = "f") => `
<form class="form" id="${idPrefix === "f" ? "cita" : idPrefix + "-cita"}" data-appointment data-endpoint="${esc(cfg.formEndpoint)}" novalidate>
  <h3>Solicita tu cita</h3>
  <p class="note">Rellena solo lo necesario. Nos pondremos en contacto contigo para concretar el día y la hora. Enviar este formulario no confirma la cita.</p>
  <div class="field"><label for="${idPrefix}-nombre">Nombre</label><input id="${idPrefix}-nombre" name="nombre" type="text" autocomplete="name" required aria-describedby="${idPrefix}-nombre-e"><p class="err" id="${idPrefix}-nombre-e" role="alert"></p></div>
  <div class="field"><label for="${idPrefix}-contacto">Teléfono o correo electrónico</label><input id="${idPrefix}-contacto" name="contacto" type="text" inputmode="email" autocomplete="tel email" required aria-describedby="${idPrefix}-contacto-e"><p class="err" id="${idPrefix}-contacto-e" role="alert"></p></div>
  <div class="field"><label for="${idPrefix}-motivo">Motivo general de la consulta <span class="opt">(opcional)</span></label>
    <select id="${idPrefix}-motivo" name="motivo"><option value="">Prefiero comentarlo en la primera visita</option>${treatments.map((t) => `<option value="${t.slug}">${esc(t.name)}</option>`).join("")}<option value="otro">Otro motivo</option></select></div>
  <div class="field"><label for="${idPrefix}-preferencia">Día u horario preferido <span class="opt">(opcional)</span></label><input id="${idPrefix}-preferencia" name="preferencia" type="text" placeholder="Por ejemplo: martes por la tarde"></div>
  <div class="hp" aria-hidden="true"><label>No rellenar este campo<input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
  <div class="check"><input id="${idPrefix}-priv" type="checkbox" name="privacidad" required><label for="${idPrefix}-priv">He leído y acepto la <a href="/privacidad/">política de privacidad</a>.</label><p class="err" role="alert"></p></div>
  <p class="note">Por favor, no incluyas información clínica o datos de salud en este formulario.</p>
  <p class="form-status" role="status" aria-live="polite" tabindex="-1"></p>
  <button class="btn btn-primary" type="submit">Enviar solicitud ${icon("arrow-right")}</button>
  ${cfg.formEndpoint ? "" : `<!-- TODO: configura formEndpoint en site.config.mjs para activar el envío real -->`}
</form>`;
// El mensaje de error de la casilla se muestra en el <p.err> contiguo; para accesibilidad se enlaza por .check
const contactSection = () => `
<section class="section tint" id="contacto" data-nav="contacto" aria-labelledby="c-title">
  <div class="wrap contact-grid">
    <div class="reveal">
      <h2 class="h2" id="c-title" style="margin-bottom:40px">Hablemos de <em>tu primera visita.</em></h2>
      ${infoBlock()}
      ${mapBlock()}
    </div>
    <div class="reveal" style="--d:100ms">${form("f")}</div>
  </div>
</section>`;

/* ───────── Páginas ───────── */
const pages = [];
const base = (n) => `${n} | ${cfg.name}, clínica dental en ${cfg.locality}`;

pages.push({
  path: "/",
  title: `${cfg.name} | Clínica dental en ${cfg.locality}`,
  desc: `Clínica dental en ${cfg.locality}: atención personalizada, tecnología moderna y explicaciones claras para cuidar de tu salud bucodental. Solicita tu cita.`,
  body: `
<section class="hero" id="inicio" data-nav="inicio" aria-labelledby="h1">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Odontología · Estética · Bienestar</p>
      <h1 class="display" id="h1">Tu mejor sonrisa <em>empieza aquí.</em></h1>
      <p class="lead">Cuidamos de tu salud bucodental con un enfoque personalizado, tecnología moderna y una atención pensada para que te sientas en buenas manos.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${bookingHref}">Solicitar cita</a>
        <a class="btn btn-ghost" href="#tratamientos">Descubrir tratamientos</a>
      </div>
    </div>
    <div class="hero-visual">
      ${media({ src: "hero.jpg", alt: "Mujer sonriendo con naturalidad con camisa blanca", label: "Retrato editorial, sonrisa natural", ratio: "", tone: "t3", eager: true })}
      <div class="badge">${icon("heart-handshake")}<span>Atención personalizada</span></div>
    </div>
  </div>
</section>
${trust()}
${editorial()}
${pillars()}
${gallery()}
${treatmentsGrid()}
${teamSection(true)}
${opinions()}
${contactSection()}`,
});

const ph = (t) => `<span class="ph">${t}</span>`;
const legalWrap = (h1, inner) => `<section class="page-hero"><div class="wrap"><h1 class="display" style="font-size:clamp(2.2rem,4.6vw,3.8rem);max-width:none">${h1}</h1><p class="note" style="margin-top:18px">Texto base provisional. Debe ser revisado y completado por la clínica y su asesoría legal antes de publicar.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap legal">${inner}</div></section>`;

pages.push({
  path: "/aviso-legal/",
  title: base("Aviso legal"),
  desc: `Aviso legal y datos identificativos del titular del sitio web de ${cfg.name}.`,
  noindex: true,
  body: legalWrap("Aviso legal", `
<h2>Titular del sitio web</h2>
<ul><li>Titular: ${ph(esc(cfg.owner.name))}</li><li>NIF/CIF: ${ph(esc(cfg.owner.taxId))}</li><li>Domicilio: ${ph(esc(cfg.owner.address))}</li><li>Correo electrónico: ${cfg.email ? esc(cfg.email) : ph("[pendiente]")}</li><li>Datos registrales y de colegiación: ${ph(esc(cfg.owner.registry))}</li></ul>
<h2>Objeto</h2><p>Este sitio web ofrece información general sobre los servicios de la clínica y permite contactar para solicitar una cita. La información tiene carácter orientativo y no sustituye a la valoración de un profesional sanitario.</p>
<h2>Propiedad intelectual</h2><p>Los contenidos, textos, imágenes y diseño del sitio pertenecen a su titular o cuentan con licencia de uso. Queda prohibida su reproducción sin autorización.</p>
<h2>Responsabilidad</h2><p>El titular procura mantener la información actualizada, pero no garantiza la ausencia de errores u omisiones. El uso del sitio es responsabilidad del usuario.</p>
<h2>Legislación aplicable</h2><p>Este aviso se rige por la legislación española. ${ph("[Jurisdicción y condiciones adicionales, a completar]")}</p>`),
});

pages.push({
  path: "/privacidad/",
  title: base("Política de privacidad"),
  desc: `Política de privacidad de ${cfg.name}: cómo tratamos los datos que nos facilitas al solicitar una cita.`,
  noindex: true,
  body: legalWrap("Política de privacidad", `
<h2>Responsable del tratamiento</h2><p>${ph(esc(cfg.owner.name))}, ${ph(esc(cfg.owner.taxId))}, ${ph(esc(cfg.owner.address))}. Contacto: ${cfg.email ? esc(cfg.email) : ph("[correo pendiente]")}.</p>
<h2>Finalidad</h2><p>Gestionar las solicitudes de contacto y de cita que nos envías a través del formulario o por otros canales de contacto.</p>
<h2>Datos que recogemos</h2><ul><li>Nombre.</li><li>Teléfono o correo electrónico.</li><li>Motivo general de la consulta y preferencia horaria, si decides indicarlos.</li></ul><p>Te pedimos que no incluyas datos clínicos en el formulario.</p>
<h2>Base de legitimación</h2><p>Tu consentimiento, que otorgas al marcar la casilla de aceptación y enviar el formulario.</p>
<h2>Conservación</h2><p>Conservaremos los datos el tiempo necesario para atender tu solicitud y, después, durante los plazos legales aplicables. ${ph("[Plazo concreto a definir]")}</p>
<h2>Destinatarios</h2><p>No cedemos tus datos a terceros salvo obligación legal. ${ph("[Indicar proveedores de alojamiento y de recepción del formulario, si actúan como encargados del tratamiento]")}</p>
<h2>Tus derechos</h2><p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${cfg.email ? esc(cfg.email) : ph("[correo pendiente]")}. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>`),
});

pages.push({
  path: "/cookies/",
  title: base("Política de cookies"),
  desc: `Política de cookies del sitio web de ${cfg.name}.`,
  noindex: true,
  body: legalWrap("Política de cookies", `
<h2>Qué son las cookies</h2><p>Son pequeños archivos que un sitio web guarda en tu dispositivo para recordar información de tu visita.</p>
<h2>Cookies que utiliza este sitio</h2><p>Este sitio no utiliza cookies propias de analítica ni de publicidad. ${ph("[Revisar y actualizar si se incorporan analítica, mapas, vídeo u otros servicios de terceros]")}</p>
<h2>Servicios de terceros</h2><p>Para mostrar las tipografías y los iconos, el sitio carga recursos desde servidores de terceros (Google Fonts y unpkg), lo que implica que tu navegador envíe tu dirección IP a esos servicios. ${ph("[Recomendado: alojar tipografías e iconos en el propio servidor antes de publicar]")}${cfg.mapEmbedUrl ? " El mapa incrustado procede de un servicio externo que puede instalar sus propias cookies." : ""}</p>
<h2>Cómo gestionarlas</h2><p>Puedes bloquear o eliminar cookies desde la configuración de tu navegador.</p>`),
});

/* ───────── Salida ───────── */
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { recursive: true, force: true });
fs.mkdirSync(path.join(out, "assets", "img"), { recursive: true });
fs.copyFileSync(path.join(root, "src", "styles.css"), path.join(out, "assets", "styles.css"));
fs.copyFileSync(path.join(root, "src", "main.js"), path.join(out, "assets", "main.js"));
const imgSrc = path.join(root, "images");
if (fs.existsSync(imgSrc)) for (const f of fs.readdirSync(imgSrc)) fs.copyFileSync(path.join(imgSrc, f), path.join(out, "assets", "img", f));

for (const p of pages) {
  const dir = path.join(out, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(p));
}
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\n${cfg.siteUrl ? `Sitemap: ${cfg.siteUrl.replace(/\/$/, "")}/sitemap.xml\n` : ""}`);
if (cfg.siteUrl) fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => !p.noindex).map((p) => `<url><loc>${abs(p.path)}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`OK: ${pages.length} páginas en ${out}`);

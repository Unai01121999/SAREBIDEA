/* ========= CONFIGURACIÓN (rellenar antes de publicar) ========= */
const SITE = {
  email: "",      // p. ej. "laura@dominio.es"
  phone: "",      // p. ej. "+34 600 000 000"
  address: "",    // dirección del despacho, si existe
  hours: "",      // horario de atención
  mode: "",       // "Presencial y online", etc.
  // URL del servicio de recepción de formularios (Formspree, Getform, Netlify Forms, endpoint propio...).
  // Mientras esté vacío, el formulario NO envía nada y lo indica claramente.
  formEndpoint: ""
};
/* =============================================================== */

document.documentElement.classList.add("js");
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
$("#year").textContent = new Date().getFullYear();

/* datos de contacto */
$$("[data-contact]").forEach(el => {
  const v = SITE[el.dataset.contact];
  if (!v) return;
  if (el.dataset.contact === "email") el.innerHTML = `<a href="mailto:${v}">${v}</a>`;
  else if (el.dataset.contact === "phone") el.innerHTML = `<a href="tel:${v.replace(/\s/g, "")}">${v}</a>`;
  else el.textContent = v;
});
const ctaEmail = $("#cta-email");
if (SITE.email) ctaEmail.href = `mailto:${SITE.email}`;

/* nav: fondo al desplazar */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* menú móvil */
const burger = $("#burger"), menu = $("#mobile-menu");
const setMenu = open => {
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menu.hidden = !open;
};
burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", e => { if (e.key === "Escape") { setMenu(false); burger.focus(); } });
matchMedia("(min-width:960px)").addEventListener("change", e => e.matches && setMenu(false));

/* aparición al desplazar */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });

/* acordeón */
$$(".acc button").forEach(b => b.addEventListener("click", () => {
  const item = b.closest(".acc__item");
  const open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", open);
  item.classList.toggle("is-open", open);
}));

/* enlaces que preseleccionan el tipo de consulta */
$$("[data-topic]").forEach(a => a.addEventListener("click", () => {
  const sel = $("#f-topic");
  const opt = [...sel.options].find(o => o.textContent === a.dataset.topic);
  if (opt) sel.value = opt.value || opt.textContent;
}));

/* formulario */
const form = $("#form"), status = $("#status");
const rules = {
  nombre: v => v.trim().length < 2 ? "Indica tu nombre." : "",
  contacto: v => {
    v = v.trim();
    if (!v) return "Indica un correo electrónico o un teléfono.";
    const mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const tel = /^\+?[\d\s().-]{9,}$/.test(v);
    return mail || tel ? "" : "Introduce un correo válido (nombre@dominio.es) o un teléfono de al menos 9 dígitos.";
  },
  tipo: v => v ? "" : "Selecciona el tipo de consulta.",
  mensaje: v => v.trim().length < 10 ? "Cuéntame brevemente qué necesitas (mínimo 10 caracteres)." : "",
  privacidad: (v, el) => el.checked ? "" : "Debes aceptar la política de privacidad para enviar la consulta."
};
const ids = { nombre: "name", contacto: "contact", tipo: "topic", mensaje: "msg", privacidad: "priv" };
const check = name => {
  const el = form.elements[name];
  const msg = rules[name](el.value, el);
  $("#e-" + ids[name]).textContent = msg;
  el.closest(".field").classList.toggle("has-error", !!msg);
  el.setAttribute("aria-invalid", !!msg);
  return !msg;
};
Object.keys(rules).forEach(n => form.elements[n].addEventListener("blur", () => check(n)));
form.addEventListener("submit", async e => {
  e.preventDefault();
  status.className = "status"; status.textContent = "";
  const results = Object.keys(rules).map(check);
  if (results.includes(false)) {
    form.querySelector("[aria-invalid=true]").focus();
    return;
  }
  if (form.elements.web.value) return; // honeypot: bots
  if (!SITE.formEndpoint) {
    status.className = "status is-warn";
    status.textContent = "Formulario pendiente de configurar: todavía no hay un servicio de recepción conectado, por lo que este mensaje no se ha enviado. Añade la URL en SITE.formEndpoint (main.js) antes de publicar.";
    return;
  }
  const btn = $("#submit"); btn.disabled = true; btn.textContent = "Enviando…";
  try {
    const data = Object.fromEntries(new FormData(form));
    delete data.web;
    const r = await fetch(SITE.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error();
    form.reset();
    status.textContent = "Gracias. Tu consulta se ha enviado correctamente; te responderé para valorar los siguientes pasos.";
  } catch {
    status.className = "status is-error";
    status.textContent = "No se ha podido enviar el mensaje. Inténtalo de nuevo en unos minutos" + (SITE.email ? ` o escríbeme a ${SITE.email}.` : ".");
  } finally {
    btn.disabled = false; btn.textContent = "Enviar consulta";
  }
});

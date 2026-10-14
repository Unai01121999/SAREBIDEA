(function () {
  const B = window.BAR, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Textos editables: *palabra* => cursiva dorada */
  const fmt = s => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
  $$("[data-t]").forEach(e => { e.innerHTML = fmt(Content.T(e.dataset.t)); });
  $$("img[data-img]").forEach(i => { i.alt = i.alt || B.name; });
  $("#metaDesc").content = Content.T("bar.metaDesc");
  /* Secciones ocultas desde el área privada */
  ["nosotros", "carta", "cenas", "galeria", "contacto"].forEach(id => {
    if (Content.T("show." + id) !== "0") return;
    const s = $("#" + id); if (s) s.style.display = "none";
    $$(`a[href="#${id}"]`).forEach(a => { (a.closest("li") || a).style.display = "none"; });
  });
  const DN = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  /* Datos del bar en el DOM */
  document.title = B.name + " · " + B.tagline;
  $$("[data-bind]").forEach(e => e.textContent = B[e.dataset.bind]);
  $$("[data-href]").forEach(e => {
    const k = e.dataset.href;
    e.href = k === "tel" ? "tel:" + B.phoneRaw : B[k];
  });
  $("#yr").textContent = new Date().getFullYear();
  $$("[data-img]").forEach(i => { i.src = unsplash(B.img[i.dataset.img], +i.dataset.w || 900); });
  $("#hours").innerHTML = B.hours.map(h => `<div><span>${esc(h[0])}</span><b>${esc(h[1])}</b></div>`).join("");
  $("#cartaLink").href = B.cartaUrl;
  const wa = "https://wa.me/" + B.whatsapp + "?text=" + encodeURIComponent("Hola, me gustaría reservar una mesa en " + B.name + ".");
  $("#waBtn").href = wa; $("#waSticky").href = wa;
  $("#route").href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(B.address);
  const d = 0.006;
  $("#mapFrame").src = `https://www.openstreetmap.org/export/embed.html?bbox=${B.mapLng - d},${B.mapLat - d / 2},${B.mapLng + d},${B.mapLat + d / 2}&layer=mapnik&marker=${B.mapLat},${B.mapLng}`;

  /* Imágenes con fallback elegante si fallan */
  $$("img").forEach(i => i.addEventListener("error", () => { i.style.visibility = "hidden"; }));

  /* Carta */
  $("#tabs").innerHTML = B.categories.map((c, i) => `<button class="tab${i ? "" : " active"}" data-c="${c[0]}">${esc(c[1])}</button>`).join("");
  $("#cards").innerHTML = B.menu.filter(m => !m.hide).map((m, i) => `
    <article class="dish rv" data-c="${m.cat}" style="--d:${(i % 4) * .08}s">
      <div class="im ph"><img src="${unsplash(m.img, 600)}" alt="${esc(m.name)}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
      <div class="tx"><div class="row"><h3>${esc(m.name)}</h3><span class="price">${esc(m.price)}</span></div><p>${esc(m.desc)}</p></div>
    </article>`).join("");
  $("#tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab"); if (!t) return;
    $$(".tab").forEach(x => x.classList.toggle("active", x === t));
    $$(".dish").forEach(c => c.classList.toggle("hide", t.dataset.c !== "todos" && c.dataset.c !== t.dataset.c));
  });

  /* Galería */
  $("#mosaic").innerHTML = B.gallery.map((g, i) => `
    <figure class="${g[2]} rv ph" style="--d:${(i % 4) * .07}s"><img src="${unsplash(g[0], g[2] === "wide" ? 1000 : 700)}" alt="${esc(g[1])}" loading="lazy" onerror="this.style.visibility='hidden'"><figcaption>${esc(g[1])}</figcaption></figure>`).join("");

  /* Reveal al hacer scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  $$(".rv").forEach(e => io.observe(e));

  /* Nav + botón fijo móvil */
  const nav = $("#nav"), sticky = $("#sticky"), book = $("#reservas");
  const onScroll = () => {
    nav.classList.toggle("scrolled", scrollY > 40);
    const r = book.getBoundingClientRect();
    sticky.classList.toggle("show", scrollY > innerHeight * .7 && !(r.top < innerHeight * .6 && r.bottom > 0));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const burger = $("#burger"), links = $("#links");
  const toggle = o => { burger.classList.toggle("open", o); links.classList.toggle("open", o); document.body.style.overflow = o ? "hidden" : ""; };
  burger.addEventListener("click", () => toggle(!links.classList.contains("open")));
  $$("#links a").forEach(a => a.addEventListener("click", () => toggle(false)));

  /* Formulario de reserva */
  $("#personas").innerHTML = Array.from({ length: B.maxPartySize }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? "personas" : "persona"}</option>`).join("") + `<option value="+">Más de ${B.maxPartySize} (consultar)</option>`;
  $("#personas").value = "2";
  $("#hora").innerHTML = B.bookingSlots.map(h => `<option>${h}</option>`).join("");
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  $("#fecha").min = iso(new Date());
  const msg = (t, ok) => { const m = $("#msg"); m.className = "msg " + (ok ? "ok" : "err"); m.textContent = t; };
  $("#form").addEventListener("submit", e => {
    e.preventDefault();
    const v = n => $("#" + n).value.trim();
    if (!v("nombre") || !v("tel") || !v("fecha")) return msg("Por favor, completa nombre, teléfono y fecha.", false);
    if (!/^[+\d][\d\s()-]{6,}$/.test(v("tel"))) return msg("Revisa el teléfono: no parece válido.", false);
    const [y, m, dd] = v("fecha").split("-").map(Number);
    const day = new Date(y, m - 1, dd).getDay();
    if (!B.bookingDays.includes(day)) return msg("Solo aceptamos reservas para: " + B.bookingDays.map(d => DN[d]).join(" y ") + ".", false);
    if (new Date(y, m - 1, dd) < new Date(new Date().setHours(0, 0, 0, 0))) return msg("Esa fecha ya ha pasado.", false);
    if (!$("#priv").checked) return msg("Debes aceptar la política de privacidad.", false);
    const r = Store.add({ nombre: v("nombre"), tel: v("tel"), personas: v("personas"), fecha: v("fecha"), hora: v("hora"), coment: v("coment") });
    msg(`¡Gracias, ${r.nombre}! Hemos recibido tu solicitud (ref. ${r.id}). ${Content.T("bk.ok")}`, true);
    $("#form").reset(); $("#personas").value = "2";
  });

  /* Textos legales (PROVISIONALES) */
  const paras = s => s.split(/\n+/).map(p => "<p>" + esc(p) + "</p>").join("");
  const legal = {
    aviso: ["Aviso legal", paras(Content.T("legal.aviso")) + "<p><b>Titular:</b> " + esc(B.name) + "<br><b>Dirección:</b> " + esc(B.address) + "<br><b>Email:</b> " + esc(B.email) + "</p>"],
    privacidad: ["Política de privacidad", paras(Content.T("legal.privacidad"))]
  };
  const modal = $("#modal");
  $$("[data-legal]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const l = legal[a.dataset.legal]; $("#mTitle").textContent = l[0]; $("#mBody").innerHTML = l[1]; modal.classList.add("open"); }));
  $("#mClose").onclick = () => modal.classList.remove("open");
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
})();

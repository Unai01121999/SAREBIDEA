(function () {
  'use strict';
  var C = window.TALLER || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- datos reales (sin inventar) ---------- */
  function pending(el, text) { el.textContent = text; el.classList.add('pending'); }
  $$('[data-cfg]').forEach(function (el) {
    var k = el.getAttribute('data-cfg'), v = (C[k] || '').trim();
    if (v) { el.textContent = v; el.classList.remove('pending'); }
    else if (k === 'email') { var row = el.closest('[data-cfg-row]'); if (row) row.hidden = true; }
    else pending(el, '[' + { phone: 'Teléfono', address: 'Dirección', hours: 'Horario', legalName: 'Titular' }[k] + ' pendiente]');
  });

  var phone = (C.phone || '').replace(/[^\d+]/g, '');
  $$('[data-call-text]').forEach(function (a) { if (phone) a.href = 'tel:' + phone; });
  $$('[data-call]').forEach(function (a) {
    if (phone) a.href = 'tel:' + phone;
    else { a.setAttribute('aria-disabled', 'true'); a.title = 'Teléfono pendiente de configurar'; a.removeAttribute('href'); }
  });
  $$('[data-mail]').forEach(function (a) { if (C.email) a.href = 'mailto:' + C.email; });

  var map = $('#map'), route = $('#route');
  if (C.address) {
    var q = encodeURIComponent(C.address + ' Taller Ibarra');
    map.innerHTML = '<iframe title="Mapa de ubicación de Taller Ibarra" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + q + '&output=embed"></iframe>';
    route.href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
  } else {
    map.textContent = 'El mapa se mostrará al configurar la dirección real del taller.';
    route.setAttribute('aria-disabled', 'true'); route.removeAttribute('href');
  }
  if (!C.FORM_ENDPOINT) $('#setup-notice').hidden = false;
  $('#year').textContent = new Date().getFullYear();

  /* ---------- imágenes reales si existen ---------- */
  $$('.media[data-img]').forEach(function (m) {
    var img = new Image();
    img.alt = m.getAttribute('data-label') || '';
    img.decoding = 'async';
    img.onload = function () { m.insertBefore(img, m.firstChild); m.classList.add('has-img'); };
    img.src = m.getAttribute('data-img');
  });

  /* ---------- header + menú ---------- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('solid', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var burger = $('#burger'), nav = $('#nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () {
    nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }); });

  /* ---------- reveal ---------- */
  var items = $$('.reveal').filter(function (e) { return !e.closest('.hero'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (e) { io.observe(e); });
  } else items.forEach(function (e) { e.classList.add('in'); });

  /* ---------- servicio → formulario ---------- */
  $$('[data-service]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#f-service').value = b.getAttribute('data-service');
      $('#contacto').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () { $('input[name=nombre]').focus({ preventScroll: true }); }, 700);
    });
  });

  /* ---------- diálogo legal ---------- */
  var dlg = $('#legal');
  $$('[data-legal]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = $('#t-' + a.getAttribute('data-legal'));
      $('#legal-body').innerHTML = '';
      $('#legal-body').appendChild(t.content.cloneNode(true));
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
  });
  $('#legal-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ---------- formulario ---------- */
  var form = $('#form'), status = $('#status'), btn = $('#submit');
  var loadedAt = Date.now();

  function setErr(input, msg) {
    var f = input.closest('.field'); if (!f) return;
    f.classList.toggle('bad', !!msg);
    $('.err', f).textContent = msg || '';
  }
  function validate() {
    var ok = true, d = form.elements;
    var rules = [
      ['nombre', function (v) { return v.trim().length >= 2 ? '' : 'Indica tu nombre.'; }],
      ['telefono', function (v) { return /^\+?[\d\s().-]{9,16}$/.test(v.trim()) ? '' : 'Introduce un teléfono válido.'; }],
      ['email', function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'El correo no parece válido.'; }],
      ['vehiculo', function (v) { return v.trim().length >= 2 ? '' : 'Indica marca y modelo.'; }],
      ['servicio', function (v) { return v ? '' : 'Selecciona un servicio.'; }],
      ['mensaje', function (v) { return v.trim().length >= 10 ? '' : 'Cuéntanos brevemente el problema (mín. 10 caracteres).'; }],
      ['fecha', function (v) { return !v || new Date(v) >= new Date(new Date().toDateString()) ? '' : 'La fecha no puede ser pasada.'; }]
    ];
    rules.forEach(function (r) {
      var el = d[r[0]], m = r[1](el.value); setErr(el, m); if (m) ok = false;
    });
    var cErr = $('#err-consent');
    cErr.textContent = d.consent.checked ? '' : 'Debes aceptar la política de privacidad.';
    if (!d.consent.checked) ok = false;
    return ok;
  }
  function say(msg, cls) { status.textContent = msg; status.className = 'status ' + (cls || ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('');
    if (!validate()) { say('Revisa los campos marcados.', 'ko'); var b = $('.bad input, .bad select, .bad textarea', form); if (b) b.focus(); return; }
    if (form.elements.web.value) return;                       // honeypot
    if (Date.now() - loadedAt < 3000) { say('Un momento… inténtalo de nuevo.', 'ko'); return; }
    if (!C.FORM_ENDPOINT) { say('El formulario aún no está conectado a un sistema de recepción. No se ha enviado nada.', 'ko'); return; }

    var data = {}; ['nombre', 'telefono', 'email', 'vehiculo', 'servicio', 'fecha', 'mensaje'].forEach(function (k) { data[k] = form.elements[k].value.trim(); });
    data.consentimiento = true; data.consentimiento_fecha = new Date().toISOString();
    btn.disabled = true; say('Enviando…');
    fetch(C.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say('Solicitud enviada. Te contactaremos lo antes posible.', 'ok'); })
      .catch(function () { say('No hemos podido enviar la solicitud. Inténtalo de nuevo' + (C.phone ? ' o llámanos al ' + C.phone : '') + '.', 'ko'); })
      .then(function () { btn.disabled = false; });
  });
  $$('input,select,textarea', form).forEach(function (el) {
    el.addEventListener('input', function () { setErr(el, ''); });
  });
})();

(() => {
  const doc = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHome = location.pathname === '/' || location.pathname === '/index.html';

  /* Iconos lineales (Lucide) */
  const icons = () => window.lucide && window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
  icons();
  addEventListener('load', icons);

  const header = doc.querySelector('.site-header');

  /* Aparición progresiva */
  const items = [...doc.querySelectorAll('.reveal, .reveal-img')];
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* Menú móvil */
  const burger = doc.querySelector('.burger');
  const menu = doc.getElementById('mobile-menu');
  const setOpen = (open) => {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('open', open);
    menu.toggleAttribute('inert', !open);
    doc.body.classList.toggle('menu-open', open);
  };
  if (burger && menu) {
    menu.setAttribute('inert', '');
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); burger.focus(); } });
    matchMedia('(min-width: 1025px)').addEventListener('change', (m) => m.matches && setOpen(false));
  }

  /* Subrayado deslizante del menú + seguimiento del scroll */
  const navEl = doc.querySelector('.nav');
  const links = navEl ? [...navEl.querySelectorAll('a.nl')] : [];
  const hashOf = (l) => (l.getAttribute('href').split('#')[1] || '');
  let activeLink = null;
  const ink = doc.createElement('span');
  ink.className = 'nav-ink';
  ink.setAttribute('aria-hidden', 'true');
  const place = (l) => {
    if (!l) { ink.style.opacity = '0'; return; }
    ink.style.opacity = '1';
    ink.style.width = l.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + l.offsetLeft + 'px)';
  };
  const setActive = (l) => {
    activeLink = l;
    links.forEach((x) => {
      x.classList.toggle('is-active', x === l);
      if (x === l) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current');
    });
    place(l);
  };
  if (navEl) {
    navEl.appendChild(ink);
    links.forEach((l) => {
      l.addEventListener('pointerenter', () => place(l));
      l.addEventListener('focus', () => place(l));
      l.addEventListener('blur', () => place(activeLink));
    });
    navEl.addEventListener('pointerleave', () => place(activeLink));
    if ('ResizeObserver' in window) new ResizeObserver(() => place(activeLink)).observe(navEl);
    if (doc.fonts) doc.fonts.ready.then(() => place(activeLink));

    if (isHome && 'IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const l = links.find((x) => hashOf(x) === en.target.dataset.nav);
          if (l && l !== activeLink) setActive(l);
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      doc.querySelectorAll('main [data-nav]').forEach((s) => spy.observe(s));
      setActive(links[0]);
    }
  }

  /* Ir a un apartado: scroll suave hasta la sección */
  const scrollToId = (id) => {
    const target = !id || id === 'inicio' ? null : doc.getElementById(id);
    if (id && id !== 'inicio' && !target) return false;
    const y = target ? target.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0) + 1 : 0;
    scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
    return true;
  };
  doc.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !isHome) return; // en páginas legales el enlace navega a la portada
    if (url.pathname !== '/' && url.pathname !== '/index.html') return;
    const id = url.hash.slice(1);
    if (!scrollToId(id)) return;
    e.preventDefault();
    history.replaceState(null, '', id && id !== 'inicio' ? '#' + id : location.pathname);
    setOpen(false);
    const motivo = a.dataset.motivo;
    const sel = motivo && doc.querySelector('#cita select[name="motivo"]');
    if (sel) sel.value = motivo;
  });
  if (isHome && location.hash) setTimeout(() => scrollToId(location.hash.slice(1)), 60);

  /* Fichas de tratamiento desplegables */
  doc.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.titem').classList.toggle('open', open);
    });
  });

  /* Feedback de clic: onda en botones y menú */
  if (!reduce) {
    doc.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('.btn, .ml, .burger');
      if (!t) return;
      const r = t.getBoundingClientRect();
      const d = doc.createElement('span');
      d.className = 'ripple';
      d.style.left = (e.clientX - r.left) + 'px';
      d.style.top = (e.clientY - r.top) + 'px';
      d.style.setProperty('--s', Math.max(r.width, r.height) / 10 * 2.4);
      t.appendChild(d);
      d.addEventListener('animationend', () => d.remove());
    });
  }

  /* Formularios de cita */
  doc.querySelectorAll('form[data-appointment]').forEach((form) => {
    const endpoint = form.dataset.endpoint || '';
    const status = form.querySelector('.form-status');
    const started = Date.now();

    const rules = {
      nombre: (v) => (v.trim().length >= 2 ? '' : 'Indícanos tu nombre.'),
      contacto: (v) => {
        v = v.trim();
        if (!v) return 'Indícanos un teléfono o un correo electrónico.';
        if (v.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisa el correo electrónico.';
        const digits = v.replace(/[\s.\-()]/g, '').replace(/^\+/, '');
        return /^\d{9,15}$/.test(digits) ? '' : 'Revisa el teléfono (entre 9 y 15 cifras).';
      },
    };
    const setErr = (field, msg) => {
      const wrap = field.closest('.field, .check');
      const out = wrap && wrap.querySelector('.err');
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (wrap && wrap.classList.contains('field')) wrap.classList.toggle('invalid', !!msg);
      if (out) { out.textContent = msg; out.style.display = msg ? 'block' : 'none'; }
      return !msg;
    };
    const check = (el) => {
      if (el.name === 'privacidad') return setErr(el, el.checked ? '' : 'Necesitamos que aceptes la política de privacidad para gestionar tu solicitud.');
      return rules[el.name] ? setErr(el, rules[el.name](el.value)) : true;
    };
    form.querySelectorAll('input[name=nombre], input[name=contacto]').forEach((el) => {
      el.addEventListener('blur', () => check(el));
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });

    const show = (msg, isErr) => {
      status.textContent = msg;
      status.classList.add('show');
      status.classList.toggle('error', !!isErr);
      status.focus && status.focus();
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.classList.remove('show');
      const els = ['nombre', 'contacto', 'privacidad'].map((n) => form.elements[n]);
      const ok = els.map(check).every(Boolean);
      if (!ok) { els.find((el) => el.getAttribute('aria-invalid') === 'true')?.focus(); return; }

      // Antispam: campo trampa + tiempo mínimo de rellenado
      if (form.elements.web.value || Date.now() - started < 2500) { show('No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos segundos.', true); return; }

      if (!endpoint) {
        show('El envío online aún no está activado en este sitio. Mientras tanto, puedes contactar con la clínica por teléfono o correo electrónico.', true);
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        delete data.web;
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('http ' + res.status);
        form.reset();
        show('Hemos recibido tu solicitud. El equipo de la clínica se pondrá en contacto contigo para concretar la cita. Esto no es todavía una reserva confirmada.', false);
      } catch {
        show('No hemos podido enviar tu solicitud. Inténtalo de nuevo o contacta directamente con la clínica.', true);
      } finally {
        btn.disabled = false;
      }
    });
  });
})();

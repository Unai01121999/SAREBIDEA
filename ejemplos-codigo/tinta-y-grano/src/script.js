/* Tinta & Grano — interacción (sin dependencias) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ═════════════════════ DATOS ═════════════════════ */
  const COFFEES = [
    { id: 'espresso', n: 'Espresso', t: 'caliente', p: '2,10', i: 5, note: 'Crema densa, cacao amargo y un final de naranja confitada.', L: [{ c: '#2a1409', p: 78 }, { c: '#b97a3d', p: 14 }] },
    { id: 'cortado', n: 'Cortado', t: 'caliente', p: '2,60', i: 4, note: 'Espresso cortado con leche caliente. Corto, redondo y honesto.', L: [{ c: '#2a1409', p: 40 }, { c: '#d9a46b', p: 40 }, { c: '#f2dcc0', p: 8 }] },
    { id: 'flat', n: 'Flat white', t: 'caliente', p: '3,40', i: 4, note: 'Doble ristretto y microespuma sedosa. El más pedido de la casa.', L: [{ c: '#2a1409', p: 30 }, { c: '#c58b52', p: 24 }, { c: '#f1e0c8', p: 32 }] },
    { id: 'capu', n: 'Capuccino', t: 'caliente', p: '3,20', i: 3, note: 'Tercios exactos: espresso, leche y una espuma que aguanta la cuchara.', L: [{ c: '#2a1409', p: 26 }, { c: '#d0955c', p: 28 }, { c: '#f7ecdb', p: 32 }] },
    { id: 'latte', n: 'Latte de avellana', t: 'caliente', p: '3,80', i: 2, note: 'Leche cremosa, avellana tostada y un toque de sal marina.', L: [{ c: '#2a1409', p: 16 }, { c: '#c9985f', p: 20 }, { c: '#ecd5b4', p: 46 }, { c: '#fbf3e6', p: 10 }] },
    { id: 'v60', n: 'V60 · Etiopía Guji', t: 'filtro', p: '4,20', i: 3, note: 'Jazmín, bergamota y melocotón. Se prepara a la vista, a 93 °C.', L: [{ c: '#8a4a1c', p: 84 }] },
    { id: 'chemex', n: 'Chemex · Huila', t: 'filtro', p: '5,90', i: 3, note: 'Para compartir. Panela, manzana roja y mucha limpieza en taza.', L: [{ c: '#a1591f', p: 88 }] },
    { id: 'cold', n: 'Cold brew', t: 'frio', p: '3,90', i: 4, ice: true, note: 'Infusionado doce horas en frío. Dulce, sin acidez, con hielo largo.', L: [{ c: '#1c0e06', p: 88 }] },
    { id: 'tonic', n: 'Espresso tonic', t: 'frio', p: '4,30', i: 4, ice: true, note: 'Tónica artesana, rodaja de pomelo y espresso cayendo en cascada.', L: [{ c: '#dbeee9', p: 62 }, { c: '#7a4320', p: 8 }, { c: '#2a1409', p: 18 }] },
    { id: 'mocha', n: 'Mocha de la casa', t: 'caliente', p: '4,10', i: 2, note: 'Chocolate negro 70 %, espresso y nata ligeramente montada.', L: [{ c: '#3a1d0e', p: 34 }, { c: '#6b3a1f', p: 30 }, { c: '#e9d5b5', p: 20 }, { c: '#fffaf0', p: 6 }] },
  ];

  const BOOKS = [
    { id: 1, t: 'La casa de los almendros', a: 'Irene Valdés', g: 'novela', gl: 'Novela', c: '#2f4a3a', ac: '#e4b363', ink: '#f6efe0', p: 'sun', price: '19,90', pages: 312, shelf: 'Sala · B3', txt: 'Tres generaciones, una casa en la sierra y un almendro que solo florece cuando alguien miente. Una novela de voces superpuestas que se lee en una tarde y se piensa durante un mes.' },
    { id: 2, t: 'Cartas desde el último tren', a: 'Mateo Roiz', g: 'novela', gl: 'Novela', c: '#8b2e2a', ac: '#f1d9a5', ink: '#fbf0dc', p: 'stripes', price: '18,50', pages: 264, shelf: 'Sala · B4', txt: 'Un jefe de estación recibe cada noche una carta sin remitente. Cuando decide contestar, el pueblo entero empieza a cambiar de horario.' },
    { id: 3, t: 'Sal y ceniza', a: 'Lucía Arteaga', g: 'poesia', gl: 'Poesía', c: '#e9dcc6', ac: '#c0542b', ink: '#2a1b12', p: 'waves', price: '14,00', pages: 96, shelf: 'Altillo · A1', txt: 'Poemas breves sobre el mar que se retira y lo que deja en la orilla. Edición en papel verjurado, con cinta marcapáginas.' },
    { id: 4, t: 'Pequeño catálogo de ausencias', a: 'Nerea Ibarra', g: 'poesia', gl: 'Poesía', c: '#1f2a44', ac: '#9fb6e8', ink: '#eaf0ff', p: 'grid', price: '13,50', pages: 80, shelf: 'Altillo · A1', txt: 'Un inventario tierno y exacto de las cosas que ya no están: la voz de un abuelo, un número de teléfono, un olor a pan.' },
    { id: 5, t: 'Elogio de la lentitud', a: 'Daniel Ferrán', g: 'ensayo', gl: 'Ensayo', c: '#d8c7a3', ac: '#2c4636', ink: '#1b1511', p: 'arch', price: '17,00', pages: 188, shelf: 'Sala · C2', txt: 'Un ensayo contra la urgencia que defiende, con humor y datos, el derecho a tardar. Recomendado leerlo con un V60 y sin mirar el móvil.' },
    { id: 6, t: 'Atlas del silencio', a: 'Clara Montoya', g: 'ensayo', gl: 'Ensayo', c: '#3a3a3a', ac: '#d9d4c7', ink: '#f2efe6', p: 'grid', price: '21,00', pages: 340, shelf: 'Sala · C3', txt: 'Un recorrido por los lugares más silenciosos del planeta y por lo que descubrimos cuando dejamos de hablar.' },
    { id: 7, t: 'El zorro que coleccionaba lluvia', a: 'Ona Bellver', g: 'ilustrado', gl: 'Ilustrado', c: '#e8a94a', ac: '#7a2e1d', ink: '#2a140c', p: 'halves', price: '22,90', pages: 48, shelf: 'Rincón infantil', txt: 'Un zorro, doscientos frascos y una sequía. Álbum ilustrado a gouache, para leer en voz alta y mirar despacio.' },
    { id: 8, t: 'Mil kilómetros de costa', a: 'Álvaro Lasa', g: 'viajes', gl: 'Viajes', c: '#2d6a73', ac: '#f2e9d0', ink: '#f8f4e6', p: 'waves', price: '20,50', pages: 276, shelf: 'Sala · D1', txt: 'A pie, en tren y en barcazas, la crónica de un invierno recorriendo el litoral norte sin más plan que el siguiente faro.' },
    { id: 9, t: 'Nocturno 47', a: 'Sira & Tomás Vela', g: 'comic', gl: 'Cómic', c: '#151515', ac: '#ff6b3d', ink: '#fff2e6', p: 'stripes', price: '24,00', pages: 144, shelf: 'La Cripta · Z', txt: 'Noir en un barrio que nunca duerme: una detective insomne, un gato sin dueño y un crimen que solo ocurre de madrugada.' },
    { id: 10, t: 'Manual para despertar volcanes', a: 'Pablo Echarri', g: 'ilustrado', gl: 'Ilustrado', c: '#b4532a', ac: '#f4e3c3', ink: '#fff3e0', p: 'arch', price: '19,00', pages: 72, shelf: 'Rincón infantil', txt: 'Instrucciones ilustradas, absurdas y muy rigurosas para hablarle a las montañas. Para todas las edades.' },
    { id: 11, t: 'Diario de un faro', a: 'Eneko Salaberri', g: 'novela', gl: 'Novela', c: '#20405e', ac: '#f5f0e1', ink: '#f5f0e1', p: 'sun', price: '17,90', pages: 228, shelf: 'Sala · B2', txt: 'Un farero, trescientas noches y una lámpara que empieza a responder. Una novela breve, luminosa y un poco inquietante.' },
    { id: 12, t: 'Otras mañanas', a: 'Paula Cuesta', g: 'poesia', gl: 'Poesía', c: '#6d7b4f', ac: '#f4eadb', ink: '#fbf6ea', p: 'halves', price: '12,90', pages: 72, shelf: 'Altillo · A2', txt: 'Poemas para las mañanas que no son la de hoy. Un libro pequeño que cabe en el bolsillo del abrigo.' },
  ];

  const SPACES = [
    { id: 'sala', n: 'La Sala de Lectura', d: 'Techos altos, estanterías hasta el cielo y butacas de orejas junto a lámparas de latón. Aquí solo se susurra.', tags: ['40 plazas', 'Silencio', 'Enchufes'], pos: '30% 50%' },
    { id: 'patio', n: 'El Patio', d: 'Ladrillo visto, ventanales, plantas por todas partes y sol de mañana sobre las mesas. El sitio para desayunos largos.', tags: ['28 plazas', 'Luz natural', 'Plantas'], pos: '22% 50%' },
    { id: 'barra', n: 'La Barra', d: 'Doce taburetes frente a la máquina. Se ve el café nacer, se conversa con quien lo prepara y se pide el segundo sin darse cuenta.', tags: ['12 plazas', 'Café a la vista', 'Sin reserva'], pos: '35% 50%' },
    { id: 'altillo', n: 'El Altillo', d: 'Una planta alta de techos con vigas, mesas largas, luz de mañana y la sección de poesía. Se sube por una escalera que cruje a propósito.', tags: ['16 plazas', 'Poesía', 'Mesas largas'], pos: '48% 50%' },
    { id: 'cripta', n: 'La Cripta', d: 'Bóvedas de ladrillo, velas y ediciones raras. Un sótano donde el tiempo va un poco más despacio.', tags: ['10 plazas', 'Velas', 'Ediciones raras'], pos: '45% 50%' },
  ];

  const AGENDA = [
    { d: 'Lun', t: 'Club de lectura lenta', h: '19:30', x: 'Un capítulo por semana, un café de filtro y cero spoilers. Se admiten dudas y se prohíben las prisas.' },
    { d: 'Mié', t: 'Cata a ciegas', h: '18:00', x: 'Tres orígenes, ninguna etiqueta. Adivina cuál es el de Huila y llévate un paquete de 250 g.' },
    { d: 'Vie', t: 'Vinilos y poesía', h: '20:30', x: 'Micro abierto de lecturas con vinilos de la casa. Trae un poema tuyo o ajeno.' },
    { d: 'Sáb', t: 'Taller de encuadernación', h: '11:00', x: 'Cose tu propio cuaderno con papel de algodón e hilo encerado. Todo el material incluido.' },
  ];

  /* ═════════════════════ TOAST ═════════════════════ */
  const toast = (msg, sub = '') => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-ic"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><b>${msg}</b><span class="s">${sub}</span></div>`;
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
    let left = 4200, started = performance.now(), timer;
    const dismiss = () => { t.classList.remove('in'); t.classList.add('out'); setTimeout(() => t.remove(), 220); };
    const arm = () => { started = performance.now(); timer = setTimeout(dismiss, left); };
    t.addEventListener('pointerenter', () => { clearTimeout(timer); left -= performance.now() - started; });
    t.addEventListener('pointerleave', () => { left = Math.max(left, 1200); arm(); });
    arm();
  };

  /* ═════════════════════ TABS ═════════════════════ */
  function tabs(root, onChange) {
    const btns = $$(':scope > button', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-selected') === 'true') return;
      btns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      onChange(b.dataset.filter);
    }));
  }

  /* ═════════════════════ CARTA DE CAFÉ ═════════════════════ */
  // ilustración lineal: el vaso se rellena por capas, sin sombras ni brillos
  function glassSVG(c) {
    const top = 18, bottom = 126, H = bottom - top;
    let y = bottom, rects = '';
    c.L.forEach((l) => { const h = H * l.p / 100; y -= h; rects += `<rect x="8" y="${y.toFixed(1)}" width="112" height="${(h + 0.6).toFixed(1)}" fill="${l.c}"/>`; });
    const glass = 'M20 18 H100 L93 118 Q92 126 84 126 H36 Q28 126 27 118 Z';
    const ice = c.ice ? [[34, 34, -8], [62, 28, 10], [82, 46, -4]].map(([x, yy, r]) =>
      `<rect x="${x}" y="${yy}" width="20" height="20" rx="4" fill="rgba(255,255,255,.3)" stroke="rgba(255,255,255,.6)" transform="rotate(${r} ${x + 10} ${yy + 10})"/>`).join('') : '';
    const handle = !c.ice ? '<path d="M99 40 h8 a15 15 0 0 1 0 36 h-10" fill="none" stroke="#30251F" stroke-width="3.5" stroke-linecap="round"/>' : '';
    const steam = !c.ice ? [40, 60, 80].map((x, k) => `<path class="glass-steam" style="animation-delay:${k * .8}s" d="M${x} 8 q-6 -9 0 -17 t0 -17" fill="none" stroke="#74785B" stroke-width="2.4" stroke-linecap="round"/>`).join('') : '';
    const uid = 'cl' + c.id;
    return `<svg viewBox="0 -34 130 170" aria-hidden="true"><defs><clipPath id="${uid}"><path d="${glass}"/></clipPath></defs>
      ${handle}<g clip-path="url(#${uid})">${rects}${ice}</g>
      <path d="${glass}" fill="none" stroke="#30251F" stroke-width="3"/>${steam}</svg>`;
  }

  function renderCoffee(filter = 'all') {
    const list = COFFEES.filter((c) => filter === 'all' || c.t === filter);
    $('#coffeeList').innerHTML = list.map((c, k) => `
      <li class="menu-item" style="--i:${k}">
        <div class="menu-glass">${glassSVG(c)}</div>
        <div><h3>${c.n}</h3><p>${c.note}</p></div>
        <div class="menu-meta"><span class="price">${c.p} €</span><span class="dots" title="Intensidad">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= c.i ? 'on' : ''}"></i>`).join('')}</span></div>
      </li>`).join('');
  }

  /* ═════════════════════ LIBROS ═════════════════════ */
  const bookHTML = (b) => `
    <div class="book3d" style="--c:${b.c};--a:${b.ac};--ink:${b.ink}">
      <div class="face front pat-${b.p}" style="color:${b.ink}"><span class="b-kicker">${b.gl}</span><span class="b-title">${b.t}</span><span class="b-author">${b.a}</span></div>
      <div class="face back"></div>
      <div class="face spine" style="color:${b.ink}"><span>${b.t}</span></div>
      <div class="face pages"></div><div class="face top"></div><div class="face bottom"></div>
    </div>`;

  // spring para el seguimiento decorativo del cursor
  function springer(apply, k = 0.12, d = 0.76) {
    const S = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, run: false };
    const step = () => {
      S.vx = (S.vx + (S.tx - S.x) * k) * d; S.vy = (S.vy + (S.ty - S.y) * k) * d;
      S.x += S.vx; S.y += S.vy; apply(S.x, S.y);
      if (Math.abs(S.vx) + Math.abs(S.vy) + Math.abs(S.tx - S.x) + Math.abs(S.ty - S.y) < 0.01) { S.run = false; apply(S.tx, S.ty); return; }
      requestAnimationFrame(step);
    };
    return { to(x, y) { S.tx = x; S.ty = y; if (!S.run) { S.run = true; requestAnimationFrame(step); } } };
  }

  function renderBooks(filter = 'all') {
    const grid = $('#bookGrid');
    const list = BOOKS.filter((b) => filter === 'all' || b.g === filter);
    grid.innerHTML = list.map((b, k) => `
      <button class="book" data-id="${b.id}" style="--i:${k}" aria-label="${b.t}, de ${b.a}">
        <div class="book-stage">${bookHTML(b)}</div>
        <h3>${b.t}</h3><small>${b.a}</small><span class="price">${b.price} €</span>
      </button>`).join('');
    if (fine && !reduce) $$('.book', grid).forEach((el) => {
      const b3 = $('.book3d', el);
      const sp = springer((x, y) => { b3.style.setProperty('--by', x.toFixed(2) + 'deg'); b3.style.setProperty('--bx', y.toFixed(2) + 'deg'); });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        sp.to((0.5 - (e.clientX - r.left) / r.width) * 34, (0.5 - clamp((e.clientY - r.top) / Math.min(r.height, 300), 0, 1)) * 16);
      });
      el.addEventListener('pointerleave', () => sp.to(0, 0));
    });
  }

  /* cajón del libro */
  const drawer = $('#drawer'), overlay = $('#overlay');
  let lastFocus = null, openBook = null;
  function openDrawer(b) {
    openBook = b; lastFocus = document.activeElement;
    $('#dStage').innerHTML = bookHTML(b);
    $('#dStage').style.background = `radial-gradient(circle at 50% 70%, color-mix(in srgb, ${b.ac} 40%, transparent), transparent 62%), color-mix(in srgb, ${b.c} 30%, #E6D9C7)`;
    $('#dGenre').textContent = b.gl;
    $('#dTitle').textContent = b.t; $('#dAuthor').textContent = b.a; $('#dText').textContent = b.txt;
    $('#dPrice').textContent = b.price + ' €'; $('#dPages').textContent = b.pages; $('#dShelf').textContent = b.shelf;
    drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#dClose').focus({ preventScroll: true }), 60);
  }
  function closeDrawer() {
    drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; lastFocus?.focus?.({ preventScroll: true });
  }
  overlay.addEventListener('click', closeDrawer);
  $('#dClose').addEventListener('click', closeDrawer);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
  $('#dReserve').addEventListener('click', () => { const t = openBook?.t; closeDrawer(); setTimeout(() => toast('Ejemplar reservado', `«${t}» te espera en el mostrador 48 h.`), 250); });
  $('#bookGrid').addEventListener('click', (e) => {
    const el = e.target.closest('.book'); if (!el) return;
    openDrawer(BOOKS.find((b) => b.id === +el.dataset.id));
  });

  /* ═════════════════════ RINCONES (carrusel) ═════════════════════ */
  function renderSpaces() {
    const flow = $('#flow');
    flow.innerHTML = SPACES.map((s, k) => `
      <article class="space">
        <div class="space-art"><img src="img/${s.id}.jpg" alt="${s.n}" loading="lazy" draggable="false" style="object-position:${s.pos}"></div>
        <div class="space-body">
          <span class="num">0${k + 1}</span>
          <h3>${s.n}</h3><p>${s.d}</p>
          <div class="chips">${s.tags.map((t) => `<span>${t}</span>`).join('')}</div>
        </div>
      </article>`).join('');
    const cards = $$('.space', flow);
    let active = 0;
    const idx = () => {
      const fl = flow.getBoundingClientRect();
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - fl.left - parseFloat(getComputedStyle(flow).paddingLeft)); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    flow.addEventListener('scroll', () => { const b = idx(); if (b !== active) { active = b; $('#flowCount').textContent = `0${b + 1} / 0${cards.length}`; } }, { passive: true });
    const step = (dir) => {
      const c = cards[clamp(active + dir, 0, cards.length - 1)];
      flow.scrollTo({ left: c.offsetLeft - parseFloat(getComputedStyle(flow).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
    };
    $('#flowPrev').addEventListener('click', () => step(-1));
    $('#flowNext').addEventListener('click', () => step(1));
    flow.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
    // arrastrar con ratón
    let down = false, sx = 0, sl = 0;
    flow.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = flow.scrollLeft; flow.style.scrollSnapType = 'none'; flow.style.cursor = 'grabbing'; });
    addEventListener('pointermove', (e) => { if (down) flow.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', () => { if (!down) return; down = false; flow.style.cursor = ''; flow.style.scrollSnapType = ''; });
  }

  /* ═════════════════════ AGENDA ═════════════════════ */
  function renderAgenda() {
    $('#agendaList').innerHTML = AGENDA.map((e, k) => `
      <li class="event" data-reveal style="--i:${k}">
        <span class="event-day">${e.d}</span>
        <div><h3>${e.t}</h3><p>${e.x}</p></div>
        <span class="event-time">${e.h} h</span>
      </li>`).join('');
  }

  /* ═════════════════════ RESERVA ═════════════════════ */
  function initReserve() {
    $('#spaceSelect').innerHTML = SPACES.map((s) => `<option>${s.n}</option>`).join('');
    const date = $('#dateInput');
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = date.value = today.toISOString().slice(0, 10);
    let n = 2; const out = $('#people');
    const set = (v) => { n = clamp(v, 1, 12); out.textContent = n; };
    $('#minus').addEventListener('click', () => set(n - 1));
    $('#plus').addEventListener('click', () => set(n + 1));
    $('#reserve').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = e.target.elements.name;
      if (!name.value.trim()) { name.classList.remove('err'); void name.offsetWidth; name.classList.add('err'); name.focus(); return; }
      toast('Reserva recibida', `${name.value.trim()}, mesa para ${n} en ${e.target.elements.space.value}.`);
      e.target.reset(); date.value = date.min; set(2);
    });
    $('#reserve input[name=name]').addEventListener('input', (e) => e.target.classList.remove('err'));
  }

  /* ═════════════════════ NAVEGACIÓN ═════════════════════ */
  function initNav() {
    const nav = $('#nav'), toggle = $('#navToggle'), menu = $('#menu');
    // barra transparente sobre el hero, sólida al avanzar
    const onScroll = () => nav.classList.toggle('solid', scrollY > 60 || menu.classList.contains('open'));
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // sección activa
    const links = $$('.nav-links a[data-spy]');
    const map = { inicio: 'inicio', experiencia: 'experiencia', espacios: 'experiencia', cafe: 'cafe', libreria: 'libreria', agenda: 'agenda', contacto: 'contacto' };
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.dataset.spy === map[e.target.id]));
    }), { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

    const setMenu = (open) => {
      menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : ''; onScroll();
    };
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
    matchMedia('(min-width: 1081px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ═════════════════════ VIAJE ENTRE SECCIONES ═════════════════════ */
  function initTravel() {
    const root = document.documentElement, bar = $('#travelBar');
    const ease = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
    let raf = 0, active = false, abort = null;
    const finish = (id) => {
      active = false; cancelAnimationFrame(raf);
      root.classList.remove('travelling'); root.style.scrollBehavior = ''; bar.style.transform = 'scaleX(0)';
      removeEventListener('wheel', abort); removeEventListener('touchstart', abort); removeEventListener('keydown', abort);
      if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      const el = document.getElementById(id); if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    };
    function go(id) {
      const el = document.getElementById(id); if (!el) return;
      const y0 = scrollY, max = root.scrollHeight - innerHeight;
      const y1 = clamp(id === 'inicio' ? 0 : el.getBoundingClientRect().top + y0, 0, max);
      const dist = Math.abs(y1 - y0);
      if (dist < 4) { finish(id); return; }
      if (reduce) { scrollTo({ top: y1, behavior: 'instant' }); finish(id); return; }
      cancelAnimationFrame(raf); active = true;
      const dur = clamp(800 + dist * 0.24, 900, 1900);
      root.classList.add('travelling'); root.style.scrollBehavior = 'auto';
      abort = () => { if (active) finish(id); };
      addEventListener('wheel', abort, { passive: true, once: true });
      addEventListener('touchstart', abort, { passive: true, once: true });
      addEventListener('keydown', abort, { once: true });
      const t0 = performance.now();
      const step = (now) => {
        if (!active) return;
        const p = clamp((now - t0) / dur, 0, 1);
        scrollTo({ top: y0 + (y1 - y0) * ease(p), behavior: 'instant' });
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        if (p < 1) raf = requestAnimationFrame(step); else finish(id);
      };
      raf = requestAnimationFrame(step);
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault(); go(id);
    });
  }

  /* ═════════════════════ REVEAL ═════════════════════ */
  function initReveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  }

  /* ═════════════════════ INIT ═════════════════════ */
  renderCoffee();
  renderBooks();
  renderSpaces();
  renderAgenda();
  initReserve();
  tabs($('#coffeeTabs'), renderCoffee);
  tabs($('#bookTabs'), renderBooks);
  initNav();
  initTravel();
  initReveal();
})();

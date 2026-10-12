/* Tinta & Grano — interacción y escenas 3D (sin dependencias) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ═════════════════════ DATOS ═════════════════════ */
  const COFFEES = [
    { id: 'espresso', n: 'Espresso', t: 'caliente', p: '2,10', i: 5, note: 'Crema densa, cacao amargo y un final de naranja confitada.', hot: true,
      L: [{ c: '#2a1409', p: 78 }, { c: '#b97a3d', p: 14 }] },
    { id: 'cortado', n: 'Cortado', t: 'caliente', p: '2,60', i: 4, note: 'Espresso cortado con leche caliente. Corto, redondo y honesto.', hot: true,
      L: [{ c: '#2a1409', p: 40 }, { c: '#d9a46b', p: 40 }, { c: '#f2dcc0', p: 8 }] },
    { id: 'flat', n: 'Flat white', t: 'caliente', p: '3,40', i: 4, note: 'Doble ristretto y microespuma sedosa. Nuestro más pedido.', hot: true,
      L: [{ c: '#2a1409', p: 30 }, { c: '#c58b52', p: 24 }, { c: '#f1e0c8', p: 32 }] },
    { id: 'capu', n: 'Capuccino', t: 'caliente', p: '3,20', i: 3, note: 'Tercios exactos: espresso, leche y una espuma que aguanta la cuchara.', hot: true,
      L: [{ c: '#2a1409', p: 26 }, { c: '#d0955c', p: 28 }, { c: '#f7ecdb', p: 32 }] },
    { id: 'latte', n: 'Latte de avellana', t: 'caliente', p: '3,80', i: 2, note: 'Leche cremosa, avellana tostada y un toque de sal marina.', hot: true,
      L: [{ c: '#2a1409', p: 16 }, { c: '#c9985f', p: 20 }, { c: '#ecd5b4', p: 46 }, { c: '#fbf3e6', p: 10 }] },
    { id: 'v60', n: 'V60 · Etiopía Guji', t: 'filtro', p: '4,20', i: 3, note: 'Jazmín, bergamota y melocotón. Se prepara a la vista, a 93 °C.', hot: true,
      L: [{ c: '#8a4a1c', p: 84 }] },
    { id: 'chemex', n: 'Chemex · Huila', t: 'filtro', p: '5,90', i: 3, note: 'Para compartir. Panela, manzana roja y mucha limpieza en taza.', hot: true,
      L: [{ c: '#a1591f', p: 88 }] },
    { id: 'cold', n: 'Cold brew', t: 'frio', p: '3,90', i: 4, note: 'Infusionado doce horas en frío. Dulce, sin acidez, con hielo largo.', ice: true,
      L: [{ c: '#1c0e06', p: 88 }] },
    { id: 'tonic', n: 'Espresso tonic', t: 'frio', p: '4,30', i: 4, note: 'Tónica artesana, rodaja de pomelo y espresso cayendo en cascada.', ice: true,
      L: [{ c: '#dbeee9', p: 62 }, { c: '#7a4320', p: 8 }, { c: '#2a1409', p: 18 }] },
    { id: 'mocha', n: 'Mocha de la casa', t: 'caliente', p: '4,10', i: 2, note: 'Chocolate negro 70 %, espresso y nata ligeramente montada.', hot: true,
      L: [{ c: '#3a1d0e', p: 34 }, { c: '#6b3a1f', p: 30 }, { c: '#e9d5b5', p: 20 }, { c: '#fffaf0', p: 6 }] },
  ];

  const BOOKS = [
    { id: 1, t: 'La casa de los almendros', a: 'Irene Valdés', g: 'novela', gl: 'Novela', c: '#2f4a3a', ac: '#e4b363', ink: '#f6efe0', p: 'sun', price: '19,90', pages: 312, shelf: 'Sala · B3',
      txt: 'Tres generaciones, una casa en la sierra y un almendro que solo florece cuando alguien miente. Una novela de voces superpuestas que se lee en una tarde y se piensa durante un mes.' },
    { id: 2, t: 'Cartas desde el último tren', a: 'Mateo Roiz', g: 'novela', gl: 'Novela', c: '#8b2e2a', ac: '#f1d9a5', ink: '#fbf0dc', p: 'stripes', price: '18,50', pages: 264, shelf: 'Sala · B4',
      txt: 'Un jefe de estación recibe cada noche una carta sin remitente. Cuando decide contestar, el pueblo entero empieza a cambiar de horario.' },
    { id: 3, t: 'Sal y ceniza', a: 'Lucía Arteaga', g: 'poesia', gl: 'Poesía', c: '#e9dcc6', ac: '#c0542b', ink: '#2a1b12', p: 'waves', price: '14,00', pages: 96, shelf: 'Altillo · A1',
      txt: 'Poemas breves sobre el mar que se retira y lo que deja en la orilla. Edición en papel verjurado, con cinta marcapáginas.' },
    { id: 4, t: 'Pequeño catálogo de ausencias', a: 'Nerea Ibarra', g: 'poesia', gl: 'Poesía', c: '#1f2a44', ac: '#9fb6e8', ink: '#eaf0ff', p: 'grid', price: '13,50', pages: 80, shelf: 'Altillo · A1',
      txt: 'Un inventario tierno y exacto de las cosas que ya no están: la voz de un abuelo, un número de teléfono, un olor a pan.' },
    { id: 5, t: 'Elogio de la lentitud', a: 'Daniel Ferrán', g: 'ensayo', gl: 'Ensayo', c: '#d8c7a3', ac: '#2c4636', ink: '#1b1511', p: 'arch', price: '17,00', pages: 188, shelf: 'Sala · C2',
      txt: 'Un ensayo contra la urgencia que defiende, con humor y datos, el derecho a tardar. Recomendado leerlo con un V60 y sin mirar el móvil.' },
    { id: 6, t: 'Atlas del silencio', a: 'Clara Montoya', g: 'ensayo', gl: 'Ensayo', c: '#3a3a3a', ac: '#d9d4c7', ink: '#f2efe6', p: 'grid', price: '21,00', pages: 340, shelf: 'Sala · C3',
      txt: 'Un recorrido por los lugares más silenciosos del planeta y por lo que descubrimos cuando dejamos de hablar.' },
    { id: 7, t: 'El zorro que coleccionaba lluvia', a: 'Ona Bellver', g: 'ilustrado', gl: 'Ilustrado', c: '#e8a94a', ac: '#7a2e1d', ink: '#2a140c', p: 'halves', price: '22,90', pages: 48, shelf: 'Rincón infantil',
      txt: 'Un zorro, doscientos frascos y una sequía. Álbum ilustrado a gouache, para leer en voz alta y mirar despacio.' },
    { id: 8, t: 'Mil kilómetros de costa', a: 'Álvaro Lasa', g: 'viajes', gl: 'Viajes', c: '#2d6a73', ac: '#f2e9d0', ink: '#f8f4e6', p: 'waves', price: '20,50', pages: 276, shelf: 'Sala · D1',
      txt: 'A pie, en tren y en barcazas, la crónica de un invierno recorriendo el litoral norte sin más plan que el siguiente faro.' },
    { id: 9, t: 'Nocturno 47', a: 'Sira & Tomás Vela', g: 'comic', gl: 'Cómic', c: '#151515', ac: '#ff6b3d', ink: '#fff2e6', p: 'stripes', price: '24,00', pages: 144, shelf: 'La Cripta · Z',
      txt: 'Noir en un barrio que nunca duerme: una detective insomne, un gato sin dueño y un crimen que solo ocurre de madrugada.' },
    { id: 10, t: 'Manual para despertar volcanes', a: 'Pablo Echarri', g: 'ilustrado', gl: 'Ilustrado', c: '#b4532a', ac: '#f4e3c3', ink: '#fff3e0', p: 'arch', price: '19,00', pages: 72, shelf: 'Rincón infantil',
      txt: 'Instrucciones ilustradas, absurdas y muy rigurosas para hablarle a las montañas. Para todas las edades.' },
    { id: 11, t: 'Diario de un faro', a: 'Eneko Salaberri', g: 'novela', gl: 'Novela', c: '#20405e', ac: '#f5f0e1', ink: '#f5f0e1', p: 'sun', price: '17,90', pages: 228, shelf: 'Sala · B2',
      txt: 'Un farero, trescientas noches y una lámpara que empieza a responder. Una novela breve, luminosa y un poco inquietante.' },
    { id: 12, t: 'Otras mañanas', a: 'Paula Cuesta', g: 'poesia', gl: 'Poesía', c: '#6d7b4f', ac: '#f4eadb', ink: '#fbf6ea', p: 'halves', price: '12,90', pages: 72, shelf: 'Altillo · A2',
      txt: 'Poemas para las mañanas que no son la de hoy. Un libro pequeño que cabe en el bolsillo del abrigo.' },
  ];

  const SPACES = [
    { id: 'sala', n: 'La Sala de Lectura', d: 'Techos de cuatro metros, estanterías hasta el cielo y butacas de orejas junto a lámparas de latón. Aquí solo se susurra.', tags: ['40 plazas', 'Silencio', 'Enchufes'], pos: '30% 50%' },
    { id: 'patio', n: 'El Patio de Cristal', d: 'Ladrillo visto, ventanales, plantas por todas partes y sol de mañana sobre las mesas. El sitio para desayunos largos y charlas sin reloj.', tags: ['28 plazas', 'Luz natural', 'Plantas'], pos: '22% 50%' },
    { id: 'barra', n: 'La Barra', d: 'Doce taburetes frente a la máquina. Aquí se ve el café nacer, se conversa con quien lo prepara y se pide el segundo sin darse cuenta.', tags: ['12 plazas', 'Café a la vista', 'Sin reserva'], pos: '35% 50%' },
    { id: 'altillo', n: 'El Altillo', d: 'Una planta alta de techos con vigas, mesas largas, luz de mañana y la sección de poesía. Se sube por una escalera de madera que cruje a propósito.', tags: ['16 plazas', 'Poesía', 'Sofás'], pos: '48% 50%' },
    { id: 'cripta', n: 'La Cripta', d: 'Bóvedas de ladrillo, velas y ediciones raras. Un sótano donde el tiempo va un poco más despacio y el cómic manda.', tags: ['10 plazas', 'Velas', 'Raros'], pos: '45% 50%' },
  ];

  const RITUALS = [
    { d: 'Lun', t: 'Club de lectura lenta', h: '19:30', x: 'Un capítulo por semana, un café de filtro y cero spoilers. Se admiten dudas y se prohíben las prisas.' },
    { d: 'Mié', t: 'Cata a ciegas', h: '18:00', x: 'Tres orígenes, ninguna etiqueta. Adivina cuál es el de Huila y llévate un paquete de 250 g.' },
    { d: 'Vie', t: 'Vinilos y poesía', h: '20:30', x: 'Micro abierto de lecturas con vinilos de la casa. Trae un poema tuyo o ajeno.' },
    { d: 'Sáb', t: 'Taller de encuadernación', h: '11:00', x: 'Cose tu propio cuaderno con papel de algodón e hilo encerado. Todo el material incluido.' },
  ];

  /* ═════════════════════ UTIL: toasts ═════════════════════ */
  const toast = (msg, sub = '') => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-ic"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><b>${msg}</b><span class="s">${sub}</span></div>`;
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
    // el temporizador se pausa mientras el cursor está encima (principio Sonner)
    let left = 4200, started = performance.now(), timer;
    const dismiss = () => { t.classList.remove('in'); t.classList.add('out'); setTimeout(() => t.remove(), 220); };
    const arm = () => { started = performance.now(); timer = setTimeout(dismiss, left); };
    t.addEventListener('pointerenter', () => { clearTimeout(timer); left -= performance.now() - started; });
    t.addEventListener('pointerleave', () => { left = Math.max(left, 1200); arm(); });
    arm();
  };

  /* ═════════════════════ UTIL: tabs con pastilla deslizante ═════════════════════ */
  function tabs(root, onChange) {
    const btns = $$(':scope > button', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-selected') === 'true') return;
      btns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      onChange(b.dataset.filter);
    }));
  }

  /* ═════════════════════ CAFÉS ═════════════════════ */
  function glassSVG(c) {
    const top = 18, bottom = 126, H = bottom - top;
    let y = bottom, rects = '';
    c.L.forEach((l) => { const h = H * l.p / 100; y -= h; rects += `<rect x="8" y="${y.toFixed(1)}" width="112" height="${(h + 0.6).toFixed(1)}" fill="${l.c}"/>`; });
    const glass = 'M20 18 H100 L93 118 Q92 126 84 126 H36 Q28 126 27 118 Z';
    const ice = c.ice ? [[34, 34, -8], [62, 28, 10], [82, 46, -4], [48, 62, 14]].map(([x, yy, r]) =>
      `<rect x="${x}" y="${yy}" width="22" height="22" rx="4" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.55)" transform="rotate(${r} ${x + 11} ${yy + 11})"/>`).join('') : '';
    const handle = c.hot ? `<path d="M99 40 h8 a15 15 0 0 1 0 36 h-10" fill="none" stroke="#f1e6d3" stroke-width="7" stroke-linecap="round"/>` : '';
    const steam = c.hot ? [38, 58, 78].map((x, k) => `<path class="glass-steam" style="animation-delay:${k * .8}s" d="M${x} 8 q-6 -9 0 -17 t0 -17" fill="none" stroke="#8c7f72" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`).join('') : '';
    const uid = 'cl' + c.id;
    return `<svg viewBox="0 -34 130 170" aria-hidden="true">
      <defs><clipPath id="${uid}"><path d="${glass}"/></clipPath></defs>
      ${handle}
      <path d="${glass}" fill="rgba(255,255,255,.55)"/>
      <g clip-path="url(#${uid})">${rects}${ice}</g>
      <path d="${glass}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2.5"/>
      <path d="M30 26 L35 112" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="60" cy="132" rx="38" ry="4" fill="rgba(60,35,15,.18)"/>
      ${steam}
    </svg>`;
  }

  const tagLabel = { caliente: 'Caliente', frio: 'Frío', filtro: 'Filtrado' };
  function renderCoffee(filter = 'all') {
    const grid = $('#coffeeGrid');
    const list = COFFEES.filter((c) => filter === 'all' || c.t === filter);
    grid.innerHTML = list.map((c, k) => `
      <article class="coffee" style="--i:${k}">
        <div class="coffee-in">
          <div class="coffee-art">${glassSVG(c)}</div>
          <span class="coffee-tag">${tagLabel[c.t]}</span>
          <h3>${c.n}</h3>
          <p>${c.note}</p>
          <div class="coffee-foot">
            <span class="price">${c.p} €</span>
            <span class="dots" title="Intensidad"><span>Intensidad</span>${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= c.i ? 'on' : ''}"></i>`).join('')}</span>
          </div>
        </div>
      </article>`).join('');
    if (fine && !reduce) $$('.coffee', grid).forEach((el) => tilt(el, 8));
  }

  // Tilt decorativo con spring (rigidez/amortiguación): conserva la inercia al
  // entrar, salir o invertir el movimiento, en vez de seguir al cursor de golpe.
  function tilt(el, max) {
    const S = { rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, run: false };
    const K = 0.14, D = 0.74;
    const step = () => {
      S.vx = (S.vx + (S.tx - S.rx) * K) * D; S.vy = (S.vy + (S.ty - S.ry) * K) * D;
      S.rx += S.vx; S.ry += S.vy;
      el.style.setProperty('--rx', S.rx.toFixed(3) + 'deg');
      el.style.setProperty('--ry', S.ry.toFixed(3) + 'deg');
      const settled = Math.abs(S.vx) + Math.abs(S.vy) + Math.abs(S.tx - S.rx) + Math.abs(S.ty - S.ry) < 0.01;
      if (settled) { S.run = false; return; }
      requestAnimationFrame(step);
    };
    const kick = () => { if (!S.run) { S.run = true; requestAnimationFrame(step); } };
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('tilting');
      S.tx = (0.5 - y) * max * 2; S.ty = (x - 0.5) * max * 2;
      const t = $('.coffee-in', el);
      t.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      t.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      kick();
    });
    el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); S.tx = 0; S.ty = 0; kick(); });
  }

  /* ═════════════════════ LIBROS ═════════════════════ */
  const bookHTML = (b, dims = '') => `
    <div class="book3d" style="--c:${b.c};--a:${b.ac};--ink:${b.ink};${dims}">
      <div class="face front pat-${b.p}" style="color:${b.ink}"><span class="b-kicker">${b.gl}</span><span class="b-title">${b.t}</span><span class="b-author">${b.a}</span></div>
      <div class="face back"></div>
      <div class="face spine" style="color:${b.ink}"><span style="color:${b.ink}">${b.t}</span></div>
      <div class="face pages"></div><div class="face top"></div><div class="face bottom"></div>
    </div>`;

  function renderBooks(filter = 'all') {
    const grid = $('#bookGrid');
    const list = BOOKS.filter((b) => filter === 'all' || b.g === filter);
    grid.innerHTML = list.map((b, k) => `
      <button class="book" data-id="${b.id}" style="--i:${k}" aria-label="${b.t}, de ${b.a}">
        <div class="book-stage">${bookHTML(b)}</div>
        <h3>${b.t}</h3>
        <small>${b.a}</small>
        <span class="price">${b.price} €</span>
      </button>`).join('');
    bookTilt(grid);
  }

  /* Drawer */
  const drawer = $('#drawer'), overlay = $('#overlay');
  let lastFocus = null, openBook = null;
  function openDrawer(b) {
    openBook = b; lastFocus = document.activeElement;
    $('#dStage').innerHTML = bookHTML(b, '');
    $('#dStage').style.background = `radial-gradient(circle at 50% 72%, color-mix(in srgb, ${b.ac} 55%, transparent) 0, transparent 62%), ${b.c}`;
    $('#dGenre').textContent = b.gl;
    $('#dTitle').textContent = b.t;
    $('#dAuthor').textContent = b.a;
    $('#dText').textContent = b.txt;
    $('#dPrice').textContent = b.price + ' €';
    $('#dPages').textContent = b.pages;
    $('#dShelf').textContent = b.shelf;
    drawer.classList.add('open'); overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#dClose').focus({ preventScroll: true }), 60);
  }
  function closeDrawer() {
    drawer.classList.remove('open'); overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus?.focus?.({ preventScroll: true });
  }
  overlay.addEventListener('click', closeDrawer);
  $('#dClose').addEventListener('click', closeDrawer);

  // Arrastre para cerrar: umbral por distancia O por velocidad (un golpe seco basta),
  // con fricción al arrastrar en sentido contrario y captura del puntero.
  (() => {
    const mobile = matchMedia('(max-width: 640px)');
    let id = null, start = 0, t0 = 0, d = 0, last = 0;
    drawer.addEventListener('pointerdown', (e) => {
      if (id !== null || e.target.closest('button, a, input')) return;
      if (!e.target.closest('.drawer-stage, .drawer-grip')) return;
      id = e.pointerId; start = mobile.matches ? e.clientY : e.clientX; t0 = performance.now(); d = 0; last = start;
      drawer.setPointerCapture(id); drawer.classList.add('dragging');
    });
    drawer.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const p = mobile.matches ? e.clientY : e.clientX; last = p;
      let raw = p - start;
      d = raw > 0 ? raw : -Math.pow(-raw, 0.7) * 0.9;           // fricción hacia el lado contrario
      drawer.style.transform = mobile.matches ? `translateY(${d}px)` : `translateX(${d}px)`;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      const v = Math.abs(d) / Math.max(1, performance.now() - t0);
      const size = mobile.matches ? drawer.offsetHeight : drawer.offsetWidth;
      drawer.releasePointerCapture(id); id = null;
      drawer.classList.remove('dragging'); drawer.style.transform = '';
      if (d > size * 0.35 || (v > 0.11 && d > 24)) closeDrawer();
    };
    drawer.addEventListener('pointerup', end);
    drawer.addEventListener('pointercancel', end);
  })();
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
  $('#dReserve').addEventListener('click', () => {
    const t = openBook?.t; closeDrawer();
    setTimeout(() => toast('Ejemplar reservado', `“${t}” te espera en el mostrador 48 h.`), 250);
  });
  $('#bookGrid').addEventListener('click', (e) => {
    const el = e.target.closest('.book'); if (!el) return;
    openDrawer(BOOKS.find((b) => b.id === +el.dataset.id));
  });

  /* ═════════════════════ ESCENA 3D HERO ═════════════════════ */
  function cone({ r1, r2, h, n = 44, hsl = [36, 30, 90], cap = null, capDrop = 0, capBg = null }) {
    const el = document.createElement('div'); el.className = 'solid';
    const rm = (r1 + r2) / 2, L = Math.hypot(h, r2 - r1), tilt = Math.atan2(r2 - r1, h) * 180 / Math.PI;
    const w = 2 * Math.PI * rm / n * 1.24;
    for (let i = 0; i < n; i++) {
      const a = i * 360 / n;
      const shade = 0.6 + 0.4 * Math.max(0, Math.cos((a + 32) * Math.PI / 180));
      const f = document.createElement('i');
      f.style.cssText = `width:${w}px;height:${L}px;left:${-w / 2}px;top:${-L / 2}px;background:hsl(${hsl[0]} ${hsl[1]}% ${(hsl[2] * shade).toFixed(1)}%);transform:rotateY(${a}deg) translateZ(${rm}px) rotateX(${-tilt}deg)`;
      el.appendChild(f);
    }
    if (cap) {
      const d = document.createElement('div'); d.className = 'disc';
      d.style.cssText = `width:${cap * 2}px;height:${cap * 2}px;margin:${-cap}px 0 0 ${-cap}px;background:${capBg};transform:translateY(${-h / 2 + capDrop}px) rotateX(90deg)`;
      el.appendChild(d);
    }
    return el;
  }
  const place = (el, x, y, z, extra = '') => { el.style.transform = `translate3d(${x}px,${y}px,${z}px) ${extra}`; el._t = [x, y, z, extra]; return el; };
  // piezas "explotables": su posición base + cuánto se elevan con el scroll
  const PARTS = [];
  const part = (el, lift, delay) => { PARTS.push({ el, lift }); el.classList.add('drop'); el.style.setProperty('--d', delay); return el; };

  function buildHero() {
    const world = $('#world');
    const add = (el) => world.appendChild(el);
    const mk = (cls, css) => { const d = document.createElement('div'); d.className = cls; if (css) d.style.cssText = css; return d; };

    // Vaso de café para llevar: cuerpo (cono truncado), manguito de cartón, tapa con boca y etiquetas.
    // Todas las coordenadas son relativas al centro del mundo; y+ es hacia abajo.
    const BOTTOM = 112;                                     // base del vaso
    const bodyH = 126, sleeveH = 58;

    // cuerpo de papel
    const body = cone({ r1: 34, r2: 49, h: bodyH, n: 56, hsl: [38, 34, 96] });
    body.classList.add('obj');
    add(part(place(body, 0, BOTTOM - bodyH / 2, 0), 0, 300));

    // manguito de cartón
    const sleeveBottom = BOTTOM - 20, sleeveTop = sleeveBottom - sleeveH;
    const rAt = (y) => 34 + (49 - 34) * ((BOTTOM - y) / bodyH);      // radio del cuerpo a una altura dada
    const sleeve = cone({ r1: rAt(sleeveBottom) + 1.6, r2: rAt(sleeveTop) + 1.6, h: sleeveH, n: 56, hsl: [28, 46, 56] });
    sleeve.classList.add('obj');
    const sleeveMid = (sleeveBottom + sleeveTop) / 2;
    add(part(place(sleeve, 0, sleeveMid, 0), -46, 420));

    // etiquetas sobre el manguito (delante y detrás)
    const rl = rAt(sleeveMid) + 1.9;
    [0, 180].forEach((deg) => {
      const lab = mk('cup-label obj'); lab.innerHTML = '<b>TINTA</b><i>&amp; GRANO</i>';
      add(part(place(lab, 0, sleeveMid, 0, `rotateY(${deg}deg) translateZ(${rl.toFixed(2)}px)`), -46, 420));
    });

    // tapa: falda + cúpula + boca
    const lidY = BOTTOM - bodyH;
    const skirt = cone({ r1: 51, r2: 53.5, h: 9, n: 56, hsl: [36, 20, 90], cap: 53.5, capBg: 'radial-gradient(circle, #f3e9d6 55%, #dccdb3)', capDrop: 0 });
    skirt.classList.add('obj'); add(part(place(skirt, 0, lidY - 4.5, 0), 120, 520));
    const dome = cone({ r1: 47, r2: 40, h: 5, n: 56, hsl: [36, 18, 93], cap: 40, capBg: 'radial-gradient(circle at 60% 40%, #fff7e8, #e6d8be)' });
    dome.classList.add('obj'); add(part(place(dome, 0, lidY - 11.5, 0), 140, 560));
    const mouth = mk('disc obj', 'width:15px;height:9px;margin:-4.5px 0 0 -7.5px;background:#090402;');
    add(part(place(mouth, 20, lidY - 14.2, 6, 'rotateX(90deg)'), 140, 560));

    // vapor
    [[-6, 0], [6, 1.2], [18, 2.4]].forEach(([x, d]) => {
      const s = mk('steam obj'); s.style.animationDelay = d + 's';
      add(part(place(s, x, lidY - 52, 4), 190, 640));
    });

    // granos de café flotando alrededor
    [[-110, -70, 80], [120, -40, 50], [-70, 30, -90], [100, 70, 80], [-140, 40, 30], [60, -110, 100], [150, 10, -40]].forEach(([x, y, z], k) => {
      const be = mk('bean obj');
      be.style.animationDelay = (-k * 0.9) + 's'; be.style.animationDuration = (4 + k * 0.5) + 's';
      add(place(be, x, y, z, `rotate(${k * 47}deg)`));
    });
  }

  // Secuencia fijada (estilo "product reveal"): un único objeto 3D que rota de
  // vista cenital a 3/4 entre secciones; los pasos de texto entran y salen con él.
  function heroLoop() {
    const world = $('#world'), story = $('#top'), ui = $('#heroUi'), steps = $$('.step');
    const KEYS = [ // t, rotX, rotY, escala, y(px), explosión
      [0.00, -90, -18, 1.12, 36, 0.00],
      [0.14, -90, -18, 1.12, 36, 0.00],
      [0.28, -28, -30, 1.00, 0, 0.00],
      [0.46, -22, -52, 1.04, 0, 0.14],
      [0.60, -18, 64, 1.00, 0, 1.00],
      [0.74, -16, 150, 1.00, 0, 1.00],
      [0.86, -30, 232, 1.00, 0, 0.30],
      [1.00, -90, 342, 0.92, 24, 0.00],
    ];
    const WIN = [[0.24, 0.50], [0.53, 0.77], [0.79, 0.99]];
    const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
    const cur = { rx: -90, ry: -18, sc: 1.12, y: 36, ex: 0 };
    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, raf = 0, lastEx = -1;

    addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '120px' }).observe(story);

    const target = (p) => {
      let i = 0;
      while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
      const A = KEYS[i], B = KEYS[i + 1];
      const e = sm((p - A[0]) / (B[0] - A[0]));
      return { rx: A[1] + (B[1] - A[1]) * e, ry: A[2] + (B[2] - A[2]) * e, sc: A[3] + (B[3] - A[3]) * e, y: A[4] + (B[4] - A[4]) * e, ex: A[5] + (B[5] - A[5]) * e };
    };

    function loop(t) {
      raf = 0;
      const total = Math.max(1, story.offsetHeight - innerHeight);
      const p = clamp(-story.getBoundingClientRect().top / total, 0, 1);
      const T = target(p);
      const k = reduce ? 1 : 0.1;                       // suavizado: la escena "alcanza" al scroll con inercia
      for (const key of ['rx', 'ry', 'sc', 'y', 'ex']) cur[key] += (T[key] - cur[key]) * k;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;

      if (Math.abs(cur.ex - lastEx) > 0.002) {          // vista explosionada: las piezas se separan en vertical
        lastEx = cur.ex;
        PARTS.forEach(({ el, lift }) => { const [x, y, z, e] = el._t; el.style.transform = `translate3d(${x}px,${y - lift * 1.5 * cur.ex}px,${z}px) ${e}`; });
      }
      const bob = reduce ? 0 : Math.sin(t / 1500) * 4;
      const par = clamp((cur.rx + 90) / 70, 0, 1);       // el paralaje del cursor solo cuando ya no es cenital
      // giro continuo sobre su eje (una vuelta cada ~14 s) + un empujón extra al hacer scroll
      const spin = reduce ? cur.ry : (t * 0.0257) + cur.ry * 0.6;
      world.style.transform =
        `translateY(${cur.y + bob}px) scale(${(cur.sc * 1.9).toFixed(3)}) rotateX(${(cur.rx - cy * 10 * par).toFixed(2)}deg) rotateY(${(spin + cx * 14 * par).toFixed(2)}deg)`;

      // hero: se desvanece al empezar a bajar
      const h = 1 - sm((p - 0.05) / 0.11);
      ui.style.opacity = h.toFixed(3);
      ui.style.transform = `translateY(${(-(1 - h) * 40).toFixed(1)}px)`;
      ui.style.visibility = h < 0.01 ? 'hidden' : 'visible';

      // pasos: titular y cuerpo entran con un giro en X y salen hacia arriba
      WIN.forEach(([a, b], i) => {
        const w = (b - a), inn = sm((p - a) / (w * 0.22)), out = 1 - sm((p - (b - w * 0.2)) / (w * 0.2));
        const o = Math.min(inn, out);
        const el = steps[i]; if (!el) return;
        const dir = out < 1 ? -1 : 1;
        const rot = (1 - o) * 38 * (out < 1 ? -1 : 1), ty2 = (1 - o) * 36 * dir;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${ty2.toFixed(1)}px) rotateX(${rot.toFixed(1)}deg)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });

      if (visible) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  /* ═════════════════════ ESPACIOS (ilustraciones SVG) ═════════════════════ */
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const f1 = (n) => n.toFixed(1);

  const shelf = (x, y, w, h, rows, seed, pal) => {
    const r = rng(seed), rh = h / rows;
    let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="rgba(0,0,0,.3)"/>`;
    for (let i = 0; i < rows; i++) {
      let cx = x + 5; const base = y + (i + 1) * rh - 4;
      while (cx < x + w - 10) {
        const bw = 5 + r() * 8, bh = rh * (0.5 + r() * 0.36);
        o += `<rect x="${f1(cx)}" y="${f1(base - bh)}" width="${f1(bw)}" height="${f1(bh)}" rx="1" fill="${pal[Math.floor(r() * pal.length)]}"/>`;
        cx += bw + 1;
      }
      o += `<rect x="${x}" y="${f1(base + 1)}" width="${w}" height="4" fill="rgba(0,0,0,.5)"/>`;
    }
    return o;
  };
  const lamp = (p, x, len, c = '#f6c978', r = 56) =>
    `<line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>
     <circle class="amb" cx="${x}" cy="${len + 22}" r="${r}" fill="url(#${p}glow)"/>
     <path d="M${x - 17} ${len + 20} Q${x} ${len - 8} ${x + 17} ${len + 20} Z" fill="${c}"/>
     <ellipse cx="${x}" cy="${len + 20}" rx="17" ry="3" fill="#fff3cf"/>`;
  const chair = (x, y, c) =>
    `<g transform="translate(${x} ${y})"><rect x="8" y="0" width="68" height="46" rx="16" fill="${c}"/><rect x="0" y="26" width="86" height="34" rx="14" fill="${c}"/>
     <rect x="-8" y="22" width="20" height="44" rx="10" fill="${c}"/><rect x="74" y="22" width="20" height="44" rx="10" fill="${c}"/>
     <rect x="-8" y="22" width="20" height="44" rx="10" fill="rgba(0,0,0,.18)"/><rect x="74" y="22" width="20" height="44" rx="10" fill="rgba(0,0,0,.18)"/>
     <rect x="6" y="64" width="6" height="12" fill="#2a1a10"/><rect x="74" y="64" width="6" height="12" fill="#2a1a10"/></g>`;
  const plant = (x, y, s = 1, c = '#3f7a52') =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-17 0 L-13 -28 H13 L17 0 Z" fill="#a05a36"/>
     ${[-52, -28, -8, 14, 34, 54].map((a, i) => `<ellipse cx="0" cy="${-62 - (i % 2) * 10}" rx="9" ry="${30 + (i % 3) * 5}" fill="${c}" transform="rotate(${a} 0 -28)" opacity="${0.8 + (i % 2) * 0.2}"/>`).join('')}</g>`;
  const table = (x, y, r = 36, top = '#d9b88a') =>
    `<ellipse cx="${x}" cy="${y + 44}" rx="${r * 0.55}" ry="5" fill="rgba(0,0,0,.3)"/><rect x="${x - 3}" y="${y}" width="6" height="44" fill="#2a1a10"/>
     <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.28}" fill="${top}"/><ellipse cx="${x - r * 0.3}" cy="${y - 2}" rx="8" ry="3" fill="#fff" opacity=".9"/>
     <rect x="${x - r * 0.3 - 6}" y="${y - 12}" width="12" height="10" rx="2" fill="#fff"/>`;
  const stool = (x, y, c = '#2a1a10') => `<ellipse cx="${x}" cy="${y}" rx="17" ry="6" fill="${c}"/><rect x="${x - 2}" y="${y}" width="4" height="40" fill="${c}"/><rect x="${x - 14}" y="${y + 38}" width="28" height="3" rx="1.5" fill="${c}"/>`;
  const arch = (x, y, w, h, fill, stroke = 'none') => `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
  const defs = (p, glow = '#ffd88a') => `<defs><radialGradient id="${p}glow"><stop offset="0" stop-color="${glow}" stop-opacity=".75"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>`;
  const svg = (inner) => `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;

  const SCENES = {
    sala: () => { const p = 'sa';
      return svg(`${defs(p)}
        <rect width="400" height="500" fill="#2c4636"/><rect y="380" width="400" height="120" fill="#1a110b"/>
        <rect y="376" width="400" height="6" fill="#0d0805"/>
        ${shelf(14, 30, 112, 345, 5, 11, ['#d9b88a', '#8b2e2a', '#e4b363', '#1f2a44', '#f1e8d5', '#6d7b4f', '#b4532a'])}
        ${shelf(274, 30, 112, 345, 5, 29, ['#e4b363', '#f1e8d5', '#2d6a73', '#b4532a', '#d9b88a', '#8b2e2a'])}
        ${arch(150, 120, 100, 256, '#1e3326')}
        <path d="M200 180 V376" stroke="rgba(255,255,255,.04)" stroke-width="60"/>
        ${lamp(p, 150, 70)}${lamp(p, 250, 110)}${lamp(p, 200, 40, '#f6c978', 70)}
        <ellipse cx="200" cy="445" rx="150" ry="26" fill="#8b2e2a"/><ellipse cx="200" cy="445" rx="120" ry="18" fill="none" stroke="#e4b363" stroke-width="2" opacity=".6"/>
        ${chair(70, 340, '#c0542b')}${chair(244, 340, '#e4b363')}
        ${table(200, 398, 30, '#6b4426')}${plant(372, 392, .8)}`); },
    patio: () => { const p = 'pa';
      return svg(`${defs(p, '#fff2c4')}
        <rect width="400" height="500" fill="#dcebe3"/>
        <rect width="400" height="150" fill="#f4efd8"/>
        ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${200 + (i - 4) * 18}" y2="150" stroke="#8ea99c" stroke-width="2"/>`).join('')}
        ${[40, 80, 120].map((y) => `<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="#8ea99c" stroke-width="1.5"/>`).join('')}
        <polygon points="80,0 180,0 330,440 40,440" fill="#fff6d6" opacity=".38"/>
        <polygon points="230,0 280,0 400,420 300,420" fill="#fff6d6" opacity=".25"/>
        ${arch(24, 150, 90, 230, '#a9c8b9', '#2c4636')}${arch(292, 150, 90, 230, '#a9c8b9', '#2c4636')}
        <rect y="380" width="400" height="120" fill="#c9a77b"/>
        ${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 60 - 20}" y1="500" x2="${i * 40 + 40}" y2="380" stroke="rgba(0,0,0,.12)" stroke-width="2"/>`).join('')}
        ${plant(46, 400, 1.7, '#2f6b48')}${plant(360, 396, 1.5, '#3f7a52')}${plant(200, 360, 1, '#4f8a5e')}
        ${table(110, 400, 40, '#fff')}${table(290, 420, 44, '#fff')}`); },
    barra: () => { const p = 'ba';
      return svg(`${defs(p, '#ffc477')}
        <rect width="400" height="500" fill="#b4532a"/>
        <rect y="0" width="400" height="26" fill="#7a2e1d"/>
        <rect x="30" y="110" width="340" height="6" fill="#2a1a10"/><rect x="30" y="190" width="340" height="6" fill="#2a1a10"/>
        ${Array.from({ length: 11 }, (_, i) => `<rect x="${44 + i * 29}" y="${i % 2 ? 78 : 70}" width="16" height="${i % 2 ? 32 : 40}" rx="${i % 2 ? 3 : 8}" fill="${['#f4e3c3', '#2c4636', '#e4b363'][i % 3]}"/>`).join('')}
        ${Array.from({ length: 8 }, (_, i) => `<rect x="${50 + i * 40}" y="164" width="26" height="26" rx="3" fill="#f4e3c3"/><rect x="${54 + i * 40}" y="${i % 2 ? 150 : 156}" width="18" height="${i % 2 ? 14 : 8}" fill="#7a2e1d"/>`).join('')}
        ${lamp(p, 90, 130, '#f6c978', 50)}${lamp(p, 200, 150, '#f6c978', 50)}${lamp(p, 310, 130, '#f6c978', 50)}
        <rect x="60" y="260" width="130" height="86" rx="8" fill="#d8d2c4"/><rect x="70" y="270" width="110" height="26" rx="4" fill="#9b958a"/>
        <circle cx="88" cy="324" r="9" fill="#2a1a10"/><circle cx="125" cy="324" r="9" fill="#2a1a10"/><circle cx="162" cy="324" r="9" fill="#2a1a10"/>
        <rect x="236" y="290" width="26" height="56" rx="4" fill="#1b1511"/><rect x="274" y="300" width="22" height="46" rx="4" fill="#f4e3c3"/>
        <rect x="0" y="346" width="400" height="22" fill="#3a2418"/><rect x="0" y="368" width="400" height="132" fill="#4a2e1c"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 34 + 2}" y="372" width="30" height="128" rx="3" fill="rgba(0,0,0,.18)"/>`).join('')}
        ${stool(70, 420, '#1b1511')}${stool(160, 420, '#1b1511')}${stool(250, 420, '#1b1511')}${stool(340, 420, '#1b1511')}`); },
    altillo: () => { const p = 'al';
      return svg(`${defs(p, '#ffe2a8')}
        <rect width="400" height="500" fill="#263247"/>
        <polygon points="0,0 400,0 400,70 0,200" fill="#3a2418"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="${i * 66}" y1="0" x2="${i * 66}" y2="${200 - i * 19}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`).join('')}
        <circle cx="270" cy="210" r="62" fill="#ffe9bd"/><circle cx="270" cy="210" r="62" fill="none" stroke="#3a2418" stroke-width="8"/>
        <line x1="270" y1="148" x2="270" y2="272" stroke="#3a2418" stroke-width="4"/><line x1="208" y1="210" x2="332" y2="210" stroke="#3a2418" stroke-width="4"/>
        <polygon points="190,140 350,140 400,500 120,500" fill="#ffe9bd" opacity=".1"/>
        ${shelf(20, 150, 110, 210, 3, 5, ['#e4b363', '#f4e3c3', '#9fb6e8', '#c0542b', '#8b2e2a'])}
        <path d="M0 80 Q100 130 200 90 T400 100" fill="none" stroke="#3a2418" stroke-width="2"/>
        ${[30, 90, 150, 215, 280, 345].map((x, i) => `<circle class="amb" style="animation-delay:${i * .4}s" cx="${x}" cy="${i % 2 ? 108 : 94}" r="5" fill="#ffd88a"/>`).join('')}
        <rect y="400" width="400" height="100" fill="#5a3b26"/>
        <rect x="170" y="330" width="210" height="74" rx="22" fill="#d99a2b"/><rect x="170" y="296" width="210" height="60" rx="20" fill="#e4b363"/>
        <rect x="190" y="320" width="50" height="44" rx="10" fill="#8b2e2a"/><rect x="300" y="320" width="50" height="44" rx="10" fill="#2c4636"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${i * 14}" y="${390 - i * 10}" width="60" height="10" fill="#7a5436"/>`).join('')}
        ${plant(60, 420, 1.1, '#5d8a4f')}`); },
    cripta: () => { const p = 'cr';
      return svg(`${defs(p, '#ffb25c')}
        <rect width="400" height="500" fill="#17110d"/>
        ${Array.from({ length: 10 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${c * 70 - (r % 2 ? 35 : 0)}" y="${r * 38}" width="66" height="34" rx="2" fill="${(r + c) % 3 ? '#3a2418' : '#4a2e1c'}"/>`).join('')).join('')}
        ${arch(20, 110, 130, 300, '#0c0806', '#6b4426')}${arch(250, 110, 130, 300, '#0c0806', '#6b4426')}
        <polygon points="150,0 250,0 400,70 400,0" fill="rgba(0,0,0,.4)"/>
        <ellipse cx="200" cy="300" rx="190" ry="220" fill="url(#${p}glow)" opacity=".5"/>
        ${shelf(34, 190, 102, 190, 4, 77, ['#8b2e2a', '#e4b363', '#f4e3c3', '#6b4426', '#2d6a73'])}
        ${shelf(264, 190, 102, 190, 4, 91, ['#c0542b', '#f4e3c3', '#1f2a44', '#e4b363'])}
        <rect y="420" width="400" height="80" fill="#0e0907"/>
        ${table(200, 400, 52, '#6b4426')}
        <rect x="164" y="370" width="72" height="12" fill="#8b2e2a"/><rect x="170" y="360" width="60" height="11" fill="#e4b363"/><rect x="176" y="350" width="48" height="10" fill="#f4e3c3"/>
        ${[[96, 392], [300, 400], [200, 332]].map(([x, y], i) => `<rect x="${x - 4}" y="${y - 22}" width="8" height="22" rx="2" fill="#f4e3c3"/><ellipse class="amb" style="animation-delay:${i * .6}s" cx="${x}" cy="${y - 30}" rx="6" ry="11" fill="#ffb25c"/><circle cx="${x}" cy="${y - 30}" r="34" fill="url(#${p}glow)"/>`).join('')}`); },
  };

  function renderSpaces() {
    const flow = $('#flow');
    flow.innerHTML = SPACES.map((s, k) => `
      <article class="space" data-i="${k}">
        <div class="space-art">${SCENES[s.id]()}<img src="img/${s.id}.jpg" alt="${s.n}" loading="lazy" draggable="false" style="object-position:${s.pos || '50% 50%'}" onerror="this.remove()"></div>
        <div class="space-body">
          <h3>${s.n}</h3>
          <p>${s.d}</p>
          <div class="chips">${s.tags.map((t) => `<span>${t}</span>`).join('')}</div>
        </div>
      </article>`).join('');

    const cards = $$('.space', flow);
    let ticking = false, active = 0;
    const update = () => {
      ticking = false;
      const fr = flow.getBoundingClientRect(), mid = fr.left + fr.width / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const dist = (r.left + r.width / 2 - mid) / r.width;
        const a = Math.abs(dist);
        if (a < bestD) { bestD = a; best = i; }
        const rot = reduce ? 0 : clamp(-dist * 42, -62, 62);
        c.style.transform = `translateZ(${-Math.min(a, 2) * 160}px) rotateY(${rot}deg) rotateX(${reduce ? 0 : Math.min(a, 1.5) * 3}deg) scale(${1 - Math.min(a, 1.5) * 0.05})`;
        c.style.opacity = String(1 - Math.min(a, 1.6) * 0.32);
        c.querySelector('.space-body').style.opacity = String(clamp(1 - a * 1.4, 0, 1));
        // la foto se desplaza algo más despacio que su marco: profundidad real
        const im = c.querySelector('.space-art img');
        if (im && !reduce) im.style.transform = `translate3d(${clamp(dist, -1.5, 1.5) * -34}px,0,0)`;
      });
      if (best !== active) { active = best; $('#flowCount').textContent = `0${best + 1} / 0${cards.length}`; }
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    flow.addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    const step = (dir) => {
      const c = cards[clamp(active + dir, 0, cards.length - 1)];
      flow.scrollTo({ left: c.offsetLeft - (flow.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    };
    $('#flowPrev').addEventListener('click', () => step(-1));
    $('#flowNext').addEventListener('click', () => step(1));
    flow.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
    // posición inicial: centrada en la primera
    requestAnimationFrame(() => { flow.scrollLeft = 0; update(); });
    // arrastrar con ratón
    let down = false, sx = 0, sl = 0;
    flow.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = flow.scrollLeft; flow.style.scrollSnapType = 'none'; flow.style.cursor = 'grabbing'; });
    addEventListener('pointermove', (e) => { if (down) flow.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', () => { if (!down) return; down = false; flow.style.cursor = ''; flow.style.scrollSnapType = ''; });
  }

  /* ═════════════════════ RITUALES ═════════════════════ */
  function renderRituals() {
    $('#rituals').innerHTML = RITUALS.map((r, k) => `
      <div class="flip-wrap" data-reveal style="--i:${k}">
        <div class="flip" role="button" tabindex="0" aria-label="${r.t}, ${r.d} ${r.h}">
          <div class="flip-face flip-front">
            <span class="flip-day">${r.d}</span>
            <div><h3>${r.t}</h3><p class="flip-hint" style="margin-top:12px">${fine ? 'Pasa el cursor' : 'Toca para ver'}</p></div>
          </div>
          <div class="flip-face flip-back">
            <span class="flip-time">${r.h} h</span>
            <p>${r.x}</p>
          </div>
        </div>
      </div>`).join('');
    $$('.flip').forEach((el) => {
      const toggle = () => el.classList.toggle('on');
      // con ratón gira al pasar el cursor (CSS); el clic solo sirve en táctil
      el.parentElement.addEventListener('click', () => { if (!fine) toggle(); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* ═════════════════════ RESERVA ═════════════════════ */
  function initReserve() {
    $('#spaceSelect').innerHTML = SPACES.map((s) => `<option>${s.n}</option>`).join('');
    const date = $('#dateInput');
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = date.value = today.toISOString().slice(0, 10);
    let n = 2;
    const out = $('#people');
    const set = (v) => { n = clamp(v, 1, 12); out.textContent = n; };
    $('#minus').addEventListener('click', () => set(n - 1));
    $('#plus').addEventListener('click', () => set(n + 1));
    $('#reserve').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = e.target.elements.name;
      if (!name.value.trim()) { name.classList.remove('err'); void name.offsetWidth; name.classList.add('err'); name.focus(); return; }
      name.classList.remove('err');
      toast('Reserva recibida', `${name.value.trim()}, mesa para ${n} en ${e.target.elements.space.value}.`);
      e.target.reset(); date.value = date.min; set(2);
    });
    $('#reserve input[name=name]').addEventListener('input', (e) => e.target.classList.remove('err'));
  }

  /* ═════════════════════ REVEAL ═════════════════════ */
  function initReveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  }

  /* ═════════════════════ SPRING + MAGNETISMO ═════════════════════ */
  function springer(apply, k = 0.16, d = 0.72) {
    const S = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, run: false };
    const step = () => {
      S.vx = (S.vx + (S.tx - S.x) * k) * d; S.vy = (S.vy + (S.ty - S.y) * k) * d;
      S.x += S.vx; S.y += S.vy; apply(S.x, S.y);
      if (Math.abs(S.vx) + Math.abs(S.vy) + Math.abs(S.tx - S.x) + Math.abs(S.ty - S.y) < 0.01) { S.run = false; apply(S.tx, S.ty); return; }
      requestAnimationFrame(step);
    };
    return { to(x, y) { S.tx = x; S.ty = y; if (!S.run) { S.run = true; requestAnimationFrame(step); } } };
  }
  function magnet(el, pull = 0.22) {
    if (!fine || reduce) return;
    const sp = springer((x, y) => { el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`; }, 0.18, 0.7);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      sp.to((e.clientX - (r.left + r.width / 2)) * pull, (e.clientY - (r.top + r.height / 2)) * pull * 1.2);
    });
    el.addEventListener('pointerleave', () => sp.to(0, 0));
  }
  function bookTilt(root) {
    if (!fine || reduce) return;
    $$('.book', root).forEach((el) => {
      const b = $('.book3d', el);
      const sp = springer((x, y) => { b.style.setProperty('--by', x.toFixed(2) + 'deg'); b.style.setProperty('--bx', y.toFixed(2) + 'deg'); }, 0.12, 0.76);
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / Math.min(r.height, 300);
        sp.to((0.5 - x) * 34, (0.5 - clamp(y, 0, 1)) * 16);
      });
      el.addEventListener('pointerleave', () => sp.to(0, 0));
    });
  }

  /* ═════════════════════ NAV ═════════════════════ */
  function initNav() {
    const toggle = $('#navToggle'), menu = $('#menu');
    const links = $$('.nav-links a[data-spy]');
    const map = { top: 'top', cafe: 'cafe', libros: 'libros', espacios: 'espacios', rituales: 'espacios', visita: 'visita' };
    const setActive = (key) => links.forEach((a) => a.classList.toggle('active', a.dataset.spy === key));
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(map[e.target.id]); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'cafe', 'libros', 'espacios', 'rituales', 'visita'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
      document.documentElement.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
    matchMedia('(min-width: 761px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ═════════════════════ VIAJE ENTRE SECCIONES ═════════════════════ */
  // Desplazamiento propio: curva easeInOutQuart, duración según distancia, barra de
  // progreso, etiqueta de destino e inclinación 3D del contenido por velocidad.
  function initTravel() {
    const root = document.documentElement, bar = $('#travelBar'), label = $('#travelLabel');
    const NAMES = { top: 'Intro', cafe: 'Café', libros: 'Libros', espacios: 'Espacios', rituales: 'Rituales', visita: 'Visita' };
    const ease = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
    let raf = 0, active = false, abort = null;

    const finish = (id, y1) => {
      active = false; cancelAnimationFrame(raf);
      root.classList.remove('travelling'); root.style.removeProperty('--sk'); root.style.scrollBehavior = '';
      bar.style.transform = 'scaleX(0)';
      removeEventListener('wheel', abort); removeEventListener('touchstart', abort); removeEventListener('keydown', abort);
      if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      const el = document.getElementById(id);
      if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    };

    function go(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const y0 = scrollY;
      const max = root.scrollHeight - innerHeight;
      const y1 = clamp(id === 'top' ? 0 : el.getBoundingClientRect().top + y0, 0, max);
      const dist = Math.abs(y1 - y0);
      if (dist < 4) { finish(id, y1); return; }
      if (reduce) { scrollTo({ top: y1, behavior: 'instant' }); finish(id, y1); return; }

      cancelAnimationFrame(raf); active = true;
      const dur = clamp(900 + dist * 0.26, 1000, 2100);
      label.textContent = 'Ir a — ' + NAMES[id];
      root.classList.add('travelling'); root.style.scrollBehavior = 'auto';
      abort = () => { if (active) finish(id, scrollY); };           // cualquier gesto del usuario cancela el viaje
      addEventListener('wheel', abort, { passive: true, once: true });
      addEventListener('touchstart', abort, { passive: true, once: true });
      addEventListener('keydown', abort, { once: true });

      const t0 = performance.now(); let prev = y0;
      const step = (now) => {
        if (!active) return;
        const p = clamp((now - t0) / dur, 0, 1), y = y0 + (y1 - y0) * ease(p);
        scrollTo({ top: y, behavior: 'instant' });
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        const v = y - prev; prev = y;
        root.style.setProperty('--sk', clamp(v * 0.06, -2.4, 2.4).toFixed(2) + 'deg');
        if (p < 1) raf = requestAnimationFrame(step); else finish(id, y1);
      };
      raf = requestAnimationFrame(step);
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      go(id);
    });
    // entrada directa con hash (p. ej. /#libros)
    if (location.hash.length > 1 && document.getElementById(location.hash.slice(1))) {
      history.scrollRestoration = 'manual';
      requestAnimationFrame(() => scrollTo({ top: Math.max(0, document.getElementById(location.hash.slice(1)).getBoundingClientRect().top + scrollY), behavior: 'instant' }));
    }
  }

  /* ═════════════════════ INIT ═════════════════════ */
  initNav();
  initTravel();
  
  buildHero();
  heroLoop();
  renderCoffee();
  renderBooks();
  renderSpaces();
  renderRituals();
  initReserve();
  tabs($('#coffeeTabs'), renderCoffee);
  tabs($('#bookTabs'), renderBooks);
  initReveal();
})();

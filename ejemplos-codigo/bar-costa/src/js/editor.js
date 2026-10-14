/* Editor de contenido del área privada: secciones, vista previa, restaurar campo a campo */
(function () {
  const B = window.BAR, C = window.Content;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (t, bad) => { const e = document.createElement("div"); e.className = "toast" + (bad ? " bad" : ""); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3200); };
  const DAYS = [[1, "Lunes"], [2, "Martes"], [3, "Miércoles"], [4, "Jueves"], [5, "Viernes"], [6, "Sábado"], [0, "Domingo"]];
  let dirty = false, active = "general";

  /* ---------- Controles ---------- */
  const imgField = (attr, val) => `
    <div class="imgf" ${attr} data-v="${esc(val)}">
      <img src="${esc(unsplash(val, 300))}" alt="" onerror="this.style.opacity=.2">
      <div class="ctl">
        <input type="text" placeholder="URL, id de Unsplash o ruta (img/foto.jpg)" value="${esc(val.startsWith("data:") ? "" : val)}">
        <div><label class="btn btn-ghost btn-sm" style="cursor:pointer">Subir foto<input type="file" accept="image/*"></label>
        <span class="up" style="font-size:.78rem;color:var(--accent);align-self:center">${val.startsWith("data:") ? "Imagen subida desde tu equipo" : ""}</span></div>
      </div>
    </div>`;

  const field = f => {
    const v = String(C.T(f.k));
    let ctl, wide = "";
    if (f.type === "toggle") { ctl = `<label class="tog"><input type="checkbox" data-k="${f.k}"${v === "1" ? " checked" : ""}> <span>${esc(f.label)}</span></label>`; wide = " wide"; }
    else if (f.type === "days") { const on = v.split(","); ctl = `<div class="days" data-k="${f.k}">${DAYS.map(d => `<label><input type="checkbox" value="${d[0]}"${on.includes(String(d[0])) ? " checked" : ""}> ${d[1]}</label>`).join("")}</div>`; wide = " wide"; }
    else if (f.type === "img") { ctl = imgField(`data-k="${f.k}"`, v); wide = " wide"; }
    else if (f.type === "area") { ctl = `<textarea data-k="${f.k}">${esc(v)}</textarea>`; wide = " wide"; }
    else ctl = `<input data-k="${f.k}" value="${esc(v)}">`;
    const lab = f.type === "toggle" ? "" : `<label>${esc(f.label)}<button type="button" class="rs" data-rs="${f.k}">↺ Original</button></label>`;
    const rs = f.type === "toggle" ? `<button type="button" class="rs" data-rs="${f.k}" style="display:none"></button>` : "";
    return `<div class="f${wide}" data-fk="${f.k}">${lab}${ctl}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ""}${rs}</div>`;
  };

  const catOpts = sel => B.categories.filter(c => c[0] !== "todos").map(c => `<option value="${c[0]}"${c[0] === sel ? " selected" : ""}>${esc(C.T("cat." + c[0]))}</option>`).join("");
  const tools = (extra) => `<div class="tools"><div>${extra || ""}</div><div>
      <button type="button" class="btn btn-ghost btn-sm" data-act="up" title="Subir">↑</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" title="Bajar">↓</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="dup">Duplicar</button><button type="button" class="btn btn-ghost btn-sm dng" data-act="del">Eliminar</button></div></div>`;
  const dishItem = m => `<div class="item${m.hide ? " off" : ""}"><div class="fl">
      <div class="f"><label>Nombre del plato</label><input data-f="name" value="${esc(m.name)}"></div>
      <div class="f"><label>Precio</label><input data-f="price" value="${esc(m.price)}"></div>
      <div class="f wide"><label>Categoría</label><select data-f="cat">${catOpts(m.cat)}</select></div>
      <div class="f wide"><label>Descripción</label><textarea data-f="desc">${esc(m.desc)}</textarea></div>
      <div class="f wide"><label>Foto del plato</label>${imgField('data-f="img"', m.img)}</div></div>
      ${tools(`<label class="tog"><input type="checkbox" data-f="hide"${m.hide ? " checked" : ""}> Ocultar en la web</label>`)}</div>`;
  const galItem = g => `<div class="item"><div class="fl">
      <div class="f"><label>Pie de foto</label><input data-f="cap" value="${esc(g[1])}"></div>
      <div class="f"><label>Tamaño en la galería</label><select data-f="cls"><option value=""${g[2] === "" ? " selected" : ""}>Normal</option><option value="tall"${g[2] === "tall" ? " selected" : ""}>Alta</option><option value="wide"${g[2] === "wide" ? " selected" : ""}>Ancha</option></select></div>
      <div class="f wide"><label>Foto</label>${imgField('data-f="img"', g[0])}</div></div>${tools()}</div>`;
  const DISH_NEW = { cat: "entrantes", name: "Nuevo plato", desc: "Descripción", price: "00,00 €", img: "photo-1414235077428-338989a2e8c0" };
  const PHOTO_NEW = ["photo-1517248135467-4c7edcad34c4", "Nueva foto", ""];

  /* ---------- Construcción ---------- */
  function build() {
    $("#side").innerHTML = window.GROUPS.map(g => `<button type="button" data-s="${g.id}"><span>${g.icon}</span>${esc(g.title)}<i class="dot"></i></button>`).join("");
    $("#editor").innerHTML = window.GROUPS.map(g => {
      const normal = g.fields.filter(f => f.type !== "toggle"), tog = g.fields.filter(f => f.type === "toggle");
      return `<section class="sec" id="sec-${g.id}"><header><h2>${esc(g.title)}</h2><p>${esc(g.hint || "")}</p></header>
        <div class="body">${tog.map(field).join("")}${normal.map(field).join("")}</div>
        ${g.list === "menu" ? `<div class="listh"><h3>Platos (<span id="nMenu">${C.menu().length}</span>)</h3><button type="button" class="btn btn-primary btn-sm" id="addDish">+ Añadir plato</button></div><div class="items" id="menuList">${C.menu().map(dishItem).join("")}</div>` : ""}
        ${g.list === "gallery" ? `<div class="listh"><h3>Fotos (<span id="nGal">${C.gallery().length}</span>)</h3><button type="button" class="btn btn-primary btn-sm" id="addPhoto">+ Añadir foto</button></div><div class="items" id="galList">${C.gallery().map(galItem).join("")}</div>` : ""}
      </section>`;
    }).join("");
    refreshMarks();
    select(active);
  }

  function select(id) {
    active = id;
    $$("#side button").forEach(b => b.classList.toggle("on", b.dataset.s === id));
    $$(".sec").forEach(s => s.classList.toggle("on", s.id === "sec-" + id));
    scrollTo({ top: 0 });
    gotoPreview();
  }
  function gotoPreview() {
    if (!$("#cms").classList.contains("showprev")) return;
    const g = window.GROUPS.find(x => x.id === active), fr = $("#prevFrame"), url = "index.html#" + (g ? g.anchor : "inicio");
    $("#prevOpen").href = url;
    try { fr.contentWindow.location.hash = g.anchor; if (!fr.getAttribute("src")) fr.src = url; } catch (e) { fr.src = url; }
  }

  /* ---------- Lectura de valores ---------- */
  const getVal = el => el.classList.contains("imgf") ? el.dataset.v
    : el.classList.contains("days") ? $$("input:checked", el).map(i => +i.value).sort().join(",")
    : el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value.trim();
  const setVal = (el, v) => {
    if (el.classList.contains("imgf")) setImg(el, v);
    else if (el.classList.contains("days")) $$("input", el).forEach(i => i.checked = v.split(",").includes(i.value));
    else if (el.type === "checkbox") el.checked = v === "1";
    else el.value = v;
  };
  function refreshMarks() {
    window.GROUPS.forEach(g => {
      let mod = false;
      $$(`#sec-${g.id} [data-fk]`).forEach(w => {
        const el = $("[data-k]", w), chg = String(getVal(el)) !== String(C.defaults(el.dataset.k));
        w.classList.toggle("chg", chg); if (chg) mod = true;
      });
      if (g.list === "menu" && JSON.stringify(readMenu()) !== JSON.stringify(C.defMenu())) mod = true;
      if (g.list === "gallery" && JSON.stringify(readGal()) !== JSON.stringify(C.defGallery())) mod = true;
      const btn = $(`#side [data-s="${g.id}"]`);
      btn.classList.toggle("mod", mod);
      const off = g.toggle && getVal($(`[data-k="show.${g.toggle}"]`)) === "0";
      let o = $(".off", btn);
      if (off && !o) btn.insertAdjacentHTML("beforeend", '<em class="off" style="font-style:normal">oculta</em>'); else if (!off && o) o.remove();
    });
  }
  const setDirty = d => { dirty = d; $("#saveInfo").textContent = d ? "● Tienes cambios sin guardar." : "Todo guardado. Elige una sección para seguir editando."; $("#saveInfo").style.color = d ? "var(--gold)" : ""; };
  addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Imágenes ---------- */
  function shrink(file) {
    return new Promise((res, rej) => {
      const r = new FileReader(); r.onerror = rej;
      r.onload = () => {
        const im = new Image(); im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, 1200 / Math.max(im.width, im.height));
          const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.72));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function setImg(box, v) {
    box.dataset.v = v;
    const im = $("img", box); im.src = unsplash(v, 300); im.style.opacity = 1;
    $(".up", box).textContent = v.startsWith("data:") ? "Imagen subida desde tu equipo" : "";
    $("input[type=text]", box).value = v.startsWith("data:") ? "" : v;
  }

  /* ---------- Eventos ---------- */
  const ed = $("#editor");
  const touched = () => { setDirty(true); refreshMarks(); };
  ed.addEventListener("input", e => {
    const b = e.target.closest(".imgf");
    if (b && e.target.type === "text") { b.dataset.v = e.target.value.trim(); $("img", b).src = unsplash(b.dataset.v, 300); $("img", b).style.opacity = 1; $(".up", b).textContent = ""; }
    touched();
  });
  ed.addEventListener("change", async e => {
    if (e.target.type === "file") {
      if (!e.target.files[0]) return;
      try { setImg(e.target.closest(".imgf"), await shrink(e.target.files[0])); touched(); } catch (x) { toast("No se pudo leer esa imagen", true); }
      e.target.value = ""; return;
    }
    if (e.target.dataset.f === "hide") e.target.closest(".item").classList.toggle("off", e.target.checked);
    touched();
  });
  ed.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "addDish") { $("#menuList").insertAdjacentHTML("beforeend", dishItem(DISH_NEW)); $("#nMenu").textContent = $$("#menuList .item").length; $("#menuList").lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" }); return touched(); }
    if (t.id === "addPhoto") { $("#galList").insertAdjacentHTML("beforeend", galItem(PHOTO_NEW)); $("#nGal").textContent = $$("#galList .item").length; $("#galList").lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" }); return touched(); }
    const rs = t.closest("[data-rs]");
    if (rs) { const el = $(`[data-k="${rs.dataset.rs}"]`); setVal(el, String(C.defaults(rs.dataset.rs))); return touched(); }
    const b = t.closest("[data-act]"); if (!b) return;
    const it = b.closest(".item"), list = it.parentNode;
    if (b.dataset.act === "del") { if (!confirm("¿Eliminar este elemento?")) return; it.remove(); }
    else if (b.dataset.act === "up" && it.previousElementSibling) list.insertBefore(it, it.previousElementSibling);
    else if (b.dataset.act === "down" && it.nextElementSibling) list.insertBefore(it.nextElementSibling, it);
    else if (b.dataset.act === "dup") { const c = it.cloneNode(true); copyState(it, c); it.after(c); }
    $("#nMenu") && ($("#nMenu").textContent = $$("#menuList .item").length); $("#nGal") && ($("#nGal").textContent = $$("#galList .item").length);
    touched();
  });
  function copyState(src, dst) { // cloneNode no copia valores escritos ni dataset de imágenes
    $$("input,textarea,select", src).forEach((s, i) => { const d = $$("input,textarea,select", dst)[i]; if (s.type === "checkbox") d.checked = s.checked; else if (s.type !== "file") d.value = s.value; });
    $$(".imgf", src).forEach((s, i) => { $$(".imgf", dst)[i].dataset.v = s.dataset.v; });
  }
  $("#side").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) select(b.dataset.s); });

  /* ---------- Guardar y utilidades ---------- */
  const val = (it, f) => { const el = $(`[data-f="${f}"]`, it); return el.classList.contains("imgf") ? el.dataset.v : el.type === "checkbox" ? el.checked : el.value.trim(); };
  const readMenu = () => $$("#menuList .item").map(it => { const m = { cat: val(it, "cat"), name: val(it, "name"), desc: val(it, "desc"), price: val(it, "price"), img: val(it, "img") }; if (val(it, "hide")) m.hide = true; return m; });
  const readGal = () => $$("#galList .item").map(it => [val(it, "img"), val(it, "cap"), val(it, "cls")]);

  $("#cSave").onclick = () => {
    const values = {};
    $$("[data-k]", ed).forEach(el => { values[el.dataset.k] = getVal(el); });
    if (C.save(values, readMenu(), readGal())) {
      setDirty(false); toast("Cambios guardados. Ya se ven en la web.");
      const fr = $("#prevFrame"); if ($("#cms").classList.contains("showprev") && fr.getAttribute("src")) try { fr.contentWindow.location.reload(); } catch (e) { fr.src = fr.src; }
    } else toast("No caben tantas fotos subidas. Usa URLs o rutas para algunas imágenes.", true);
  };
  $("#cReset").onclick = () => { if (confirm("¿Restaurar TODO el contenido a los valores originales? Se perderán tus ediciones.")) { setDirty(false); C.reset(); location.reload(); } };
  $("#cExp").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([C.export()], { type: "application/json" })); a.download = "contenido-web.json"; a.click(); };
  $("#cImp").onclick = () => $("#cImpF").click();
  $("#cImpF").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { C.import(r.result); setDirty(false); location.reload(); } catch (x) { toast("Archivo no válido", true); } }; r.readAsText(f); };
  $("#cPrev").onclick = () => {
    const cms = $("#cms"), on = cms.classList.toggle("showprev");
    $("#aw").classList.toggle("wide", on); $("#cPrev").textContent = on ? "Ocultar vista previa" : "Vista previa";
    if (on) gotoPreview();
  };

  /* ---------- Pestañas principales ---------- */
  let built = false;
  $$(".ptabs .tab").forEach(t => t.onclick = () => {
    $$(".ptabs .tab").forEach(x => x.classList.toggle("active", x === t));
    $("#pRes").classList.toggle("hidden", t.dataset.p !== "pRes");
    $("#pCon").classList.toggle("hidden", t.dataset.p !== "pCon");
    if (t.dataset.p === "pCon" && !built) { build(); built = true; setDirty(false); }
  });
})();

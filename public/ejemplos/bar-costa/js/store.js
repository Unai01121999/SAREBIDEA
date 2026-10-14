/* Almacén de reservas (localStorage).
   Para producción: sustituir estas funciones por llamadas a tu servidor/API. */
window.Store = (function () {
  const KEY = "bar_reservas_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };
  return {
    all: load,
    add(r) {
      const l = load();
      r.id = "R" + Date.now().toString(36).toUpperCase();
      r.status = "pendiente";
      r.createdAt = new Date().toISOString();
      l.push(r); save(l); return r;
    },
    setStatus(id, status) { const l = load(); const r = l.find(x => x.id === id); if (r) { r.status = status; save(l); } },
    remove(id) { save(load().filter(x => x.id !== id)); },
    clear() { save([]); }
  };
})();

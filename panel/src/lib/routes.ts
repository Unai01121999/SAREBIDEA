// Rutas de las fichas. Se usan parámetros de consulta (?id=) en lugar de segmentos dinámicos porque el panel
// se publica como sitio estático (Hostinger): una URL /clientes/ficha/?id=… no necesita servidor ni reescrituras.
export const routes = {
  client: (id: string) => `/clientes/ficha?id=${encodeURIComponent(id)}`,
  website: (id: string) => `/webs/detalle?id=${encodeURIComponent(id)}`,
  domain: (id: string) => `/dominios/ficha?id=${encodeURIComponent(id)}`,
  hosting: (id: string) => `/hosting/ficha?id=${encodeURIComponent(id)}`,
}

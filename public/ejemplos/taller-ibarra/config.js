/* ============================================================
   CONFIGURACIÓN DE TALLER IBARRA — rellenar con datos REALES
   Mientras un campo esté vacío, la web muestra "pendiente"
   y no inventa nada.
   ============================================================ */
window.TALLER = {
  phone:     "",   // Ej.: "+34 600 000 000"
  email:     "",   // Opcional. Ej.: "info@talleribarra.es"
  address:   "",   // Ej.: "Calle Ejemplo 12, 48000 Bilbao"
  hours:     "",   // Ej.: "L–V 8:00–14:00 · 15:30–19:00"
  legalName: "",   // Titular legal para el aviso del formulario

  // Endpoint que RECIBE el formulario (POST JSON). Ejemplos: Formspree,
  // Web3Forms, un backend propio. Sin esto el formulario NO envía.
  FORM_ENDPOINT: ""
};

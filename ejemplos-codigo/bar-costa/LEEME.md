# Web del bar — guía rápida

## Estructura
- `index.html` — web pública
- `admin.html` — área privada de reservas
- `js/config.js` — **todos los datos editables** (nombre, teléfono, dirección, horarios, carta, galería, imágenes, contraseña)
- `css/styles.css` — estilos y paleta (variables en `:root`)

## Personalizar
1. Abre `js/config.js` y sustituye todo lo marcado `[PROVISIONAL]`.
2. Cambia las fotos de Unsplash por fotos propias (ruta local, p. ej. `img/local.jpg`).
3. En `index.html` revisa los textos marcados `[provisional]` / `[TEXTO PROVISIONAL]` (historia, turnos, aviso legal, privacidad). Los textos legales deben ser revisados por un profesional.
4. Cambia `adminPass` en `config.js`.

## Área privada (`admin.html`)
Usuario/contraseña: los de `config.js` (por defecto `admin` / `cambiar-esta-clave`).
Permite ver, filtrar, **confirmar**, cancelar y borrar reservas, avisar al cliente por WhatsApp/llamada y exportar a CSV.

## Editar el contenido desde el área privada
En `admin.html` → **Editar contenido de la web**. Una barra lateral con 11 secciones (Datos del bar, Menú y pie, Portada,
Sobre nosotros, Carta y platos, Cenas, Galería, Reservas, Contacto, Textos legales, Acceso):
- Todos los textos, botones, etiquetas del formulario, enlaces del pie, datos de contacto, horarios, días y horas de reserva.
- Imágenes por URL, id de Unsplash o **subiendo una foto** (se reduce automáticamente).
- Platos y fotos de la galería: añadir, duplicar, reordenar, eliminar, y **ocultar** platos sin borrarlos.
- **Mostrar/ocultar secciones** enteras (Nosotros, Carta, Cenas, Galería, Contacto).
- Marca naranja en las secciones y campos modificados, «↺ Original» para restaurar un campo, aviso de cambios sin guardar.
- **Vista previa** en vivo (pantallas anchas) que salta a la sección que editas.
- Restaurar todo, exportar e importar copia (`.json`). En los títulos, `*palabra*` = cursiva dorada.
El botón «Área privada» está en el menú superior, junto a «Reservar mesa».
Los valores originales viven en `js/config.js` y `js/content.js`; lo editado se guarda aparte como cambios sobre ellos.
### Limitación importante
Los cambios de contenido también se guardan solo en el navegador donde se editan: **los visitantes no verán
lo que edites** hasta que haya un servidor. Mientras tanto, usa «Exportar copia» y vuelca esos valores en
`config.js`/`content.js` o conecta `content.js` (`load`/`save`) a una API.

Esta versión es 100 % estática: las reservas se guardan en el `localStorage` del navegador donde se hacen.
Eso significa que **una reserva hecha por un cliente desde su móvil NO llega al panel del bar**, y la contraseña
es visible en el código. Es una demo funcional del flujo. Para producción necesitas un backend
(p. ej. Supabase/Firebase o un servidor propio con login real) y reemplazar las funciones de `js/store.js`
(`all`, `add`, `setStatus`, `remove`) por llamadas a su API.

## Probar en local
Abre `index.html` en el navegador, o sirve la carpeta con `npx serve`.

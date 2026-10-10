// zod con la compilación dinámica desactivada: la política de contenido del servidor prohíbe `eval`
// y zod, si no, lo intenta (y el navegador lo registra como bloqueo). Importa `z` siempre desde aquí.
import { z } from 'zod'

z.config({ jitless: true })

export { z }

import { supabase } from '@/lib/supabase'
import type { DataSource } from './repository'
import { mockSource } from './mock-source'
import { supabaseSource } from './supabase-source'

/**
 * Fuente de datos activa.
 * - Con Supabase configurado (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY al compilar): la base de datos real.
 * - Sin ellas: datos de ejemplo en el navegador (modo demostración).
 */
export const dataSource: DataSource = supabase ? supabaseSource : mockSource

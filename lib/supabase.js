import { createClient } from '@supabase/supabase-js';

// Usamos process.env (estándar de Next.js) y NEXT_PUBLIC (para el navegador)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
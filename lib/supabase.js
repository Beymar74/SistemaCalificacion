import { createClient } from '@supabase/supabase-js';

// Usamos process.env (estándar de Next.js) y NEXT_PUBLIC (para el navegador)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfvmfdliabcwnxuzeefe.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tWqbRuovwI5Hce1yVN8Ong_SL0cjk2k';

export const supabase = createClient(supabaseUrl, supabaseKey);
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCloudflareContext } from "@opennextjs/cloudflare";

const DEFAULT_PASSWORD = 'EMI2026*';

export async function POST(req: NextRequest) {
  let serviceKey: string | undefined;
  let supabaseUrl: string | undefined;

  try {
    // Intentar obtener las variables del contexto de Cloudflare (Recomendado para OpenNext/Cloudflare Workers)
    const { env } = getCloudflareContext();
    serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  } catch (e) {
    // Respaldo silencioso si no estamos corriendo en Cloudflare (ej. desarrollo local directo con next dev)
  }

  // Respaldo adicional usando process.env y acceso por corchetes para evitar el inlining de Webpack en compilación
  serviceKey = serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env as any)['SUPABASE_SERVICE_ROLE_KEY'];
  supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any)['NEXT_PUBLIC_SUPABASE_URL'];

  if (!serviceKey || !supabaseUrl) {
    const faltantes: string[] = [];
    if (!serviceKey) faltantes.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl) faltantes.push('NEXT_PUBLIC_SUPABASE_URL');

    return NextResponse.json(
      { 
        error: `Configuración de servidor incompleta. Faltan las siguientes variables de entorno: ${faltantes.join(', ')}.` 
      },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const body = await req.json();
  const { email, nombre, username } = body as { email: string; nombre: string; username: string };

  if (!email || !nombre || !username) {
    return NextResponse.json({ error: 'email, nombre y username son requeridos.' }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre, username }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.user.id, email: data.user.email });
}

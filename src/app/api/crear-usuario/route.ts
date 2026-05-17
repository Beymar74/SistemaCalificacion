import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCloudflareContext } from "@opennextjs/cloudflare";

const DEFAULT_PASSWORD = 'EMI2026*';

export async function POST(req: NextRequest) {
  let serviceKey: string | undefined;
  let supabaseUrl: string | undefined;

  let debugInfo: any = {};

  try {
    // Intentar obtener las variables del contexto de Cloudflare (Recomendado para OpenNext/Cloudflare Workers)
    const context = getCloudflareContext();
    const env = context.env as any;
    debugInfo.hasContext = true;
    debugInfo.contextKeys = Object.keys(env || {});
    serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  } catch (e: any) {
    debugInfo.contextError = e.message || String(e);
    // Respaldo silencioso si no estamos corriendo en Cloudflare (ej. desarrollo local directo con next dev)
  }

  // Respaldo adicional usando process.env y acceso por corchetes para evitar el inlining de Webpack en compilación
  try {
    debugInfo.processEnvKeys = Object.keys(process.env || {});
  } catch (e) {}

  serviceKey = serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env as any)['SUPABASE_SERVICE_ROLE_KEY'];
  supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any)['NEXT_PUBLIC_SUPABASE_URL'];

  debugInfo.serviceKey = {
    type: typeof serviceKey,
    length: serviceKey ? serviceKey.length : 0,
    prefix: serviceKey && serviceKey.length > 5 ? `${serviceKey.substring(0, 5)}...${serviceKey.slice(-5)}` : 'none'
  };

  debugInfo.supabaseUrl = {
    type: typeof supabaseUrl,
    length: supabaseUrl ? supabaseUrl.length : 0,
    prefix: supabaseUrl && supabaseUrl.length > 5 ? `${supabaseUrl.substring(0, 10)}...` : 'none'
  };

  if (!serviceKey || !supabaseUrl) {
    const faltantes: string[] = [];
    if (!serviceKey) faltantes.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl) faltantes.push('NEXT_PUBLIC_SUPABASE_URL');

    return NextResponse.json(
      { 
        error: `Configuración de servidor incompleta. Faltan las siguientes variables de entorno: ${faltantes.join(', ')}.`,
        debug: debugInfo
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

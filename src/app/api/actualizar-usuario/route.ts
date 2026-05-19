import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(req: NextRequest) {
  let serviceKey: string | undefined;
  let supabaseUrl: string | undefined;

  try {
    const context = getCloudflareContext();
    const env = context.env as any;
    serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  } catch {
    // no estamos en Cloudflare
  }

  serviceKey = serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env as any)['SUPABASE_SERVICE_ROLE_KEY'];
  supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any)['NEXT_PUBLIC_SUPABASE_URL'];

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Configuración de servidor incompleta.' }, { status: 500 });
  }

  const { id_usuario, email } = await req.json() as { id_usuario: string; email: string };

  if (!id_usuario || !email) {
    return NextResponse.json({ error: 'id_usuario y email son requeridos.' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { error } = await admin.auth.admin.updateUserById(id_usuario, {
    email: email.toLowerCase().trim(),
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

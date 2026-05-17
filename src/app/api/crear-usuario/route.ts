import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_PASSWORD = 'EMI2026*';

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Configuración de servidor incompleta. Agregue SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.' },
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

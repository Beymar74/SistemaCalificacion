import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = 'EMI2026*';

export async function POST(req: NextRequest) {
  try {
    // VARIABLES DE ENTORNO
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // DEBUG TEMPORAL
    console.log('SUPABASE URL:', supabaseUrl);
    console.log('SERVICE KEY EXISTS:', !!serviceKey);

    // VALIDACIÓN
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        {
          error:
            'Configuración de servidor incompleta. Verifique SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL'
        },
        { status: 500 }
      );
    }

    // CLIENTE ADMIN
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // BODY
    const body = await req.json();

    const {
      email,
      nombre,
      username
    }: {
      email: string;
      nombre: string;
      username: string;
    } = body;

    // VALIDACIÓN CAMPOS
    if (!email || !nombre || !username) {
      return NextResponse.json(
        {
          error: 'email, nombre y username son requeridos.'
        },
        { status: 400 }
      );
    }

    // CREAR USUARIO
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        nombre,
        username
      }
    });

    // ERROR SUPABASE
    if (error) {
      console.error('SUPABASE ERROR:', error);

      return NextResponse.json(
        {
          error: error.message
        },
        { status: 400 }
      );
    }

    // RESPUESTA OK
    return NextResponse.json({
      success: true,
      id: data.user.id,
      email: data.user.email,
      password: DEFAULT_PASSWORD
    });
  } catch (err: any) {
    console.error('SERVER ERROR:', err);

    return NextResponse.json(
      {
        error: err.message || 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
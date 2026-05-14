'use client';

import Link from 'next/link';
import { Bell, UserCircle, LayoutGrid } from 'lucide-react';

export default function CompletadoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #e8eaf0',
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#162748', letterSpacing: 0.5 }}>SCEITI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
            <Bell size={20} color="#94a3b8" />
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
            <UserCircle size={20} color="#94a3b8" />
          </button>
        </div>
      </header>

      <div style={{ padding: '28px 20px', maxWidth: 480, margin: '0 auto' }}>
        {/* Welcome text */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#162748', margin: '0 0 6px', lineHeight: 1.2 }}>
          Bienvenido, Ing. Juan Pérez
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>
          Estos son sus proyectos asignados para evaluación
        </p>

        {/* Completion card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e8eaf0',
          padding: '48px 28px',
          textAlign: 'center',
        }}>
          {/* Trophy circle */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5M7.5 18.75v-4.5m9-9.75a6 6 0 01-12 0V4.5h12v4.5z" />
            </svg>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 10px' }}>
            ¡Evaluaciones Completadas!
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 auto 32px', maxWidth: 260, lineHeight: 1.6 }}>
            Has evaluado todos los proyectos asignados para esta jornada. ¡Buen trabajo!
          </p>

          <Link
            href="/docente"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#162748',
              color: '#fff',
              padding: '13px 28px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <LayoutGrid size={16} />
            Volver a Proyectos
          </Link>
        </div>
      </div>
    </div>
  );
}
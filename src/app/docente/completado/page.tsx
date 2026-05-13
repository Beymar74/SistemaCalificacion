'use client';

import Link from 'next/link';
import { Bell, UserCircle, Archive } from 'lucide-react';

export default function CompletadoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <span className="text-base font-bold text-[#162748]">IE TechFair</span>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <Bell className="w-5 h-5 text-slate-500" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <UserCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      <div className="px-5 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#162748]">Bienvenido, Ing. Juan Pérez</h1>
        <p className="text-slate-500 text-sm mt-1 mb-8">
          Estos son sus proyectos asignados para evaluación
        </p>

        {/* Completion card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          {/* Trophy */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5M7.5 18.75v-4.5m9-9.75a6 6 0 01-12 0V4.5h12v4.5z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">¡Evaluaciones Completadas!</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
            Has evaluado todos los proyectos asignados para esta jornada. ¡Buen trabajo!
          </p>

          <Link
            href="/docente"
            className="inline-flex items-center justify-center gap-2 bg-[#162748] hover:bg-[#1e3460] text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Archive className="w-4 h-4" />
            Volver a Proyectos
          </Link>
        </div>
      </div>
    </div>
  );
}

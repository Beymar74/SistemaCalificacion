'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompletadoPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/logo/logocarrera.png" alt="Logo Carrera" className="w-10 h-10 object-contain" />
            <span className="text-lg font-black text-[#162748] tracking-tight">SCEITI</span>
          </motion.div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 flex flex-col items-center text-center mt-10"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5M7.5 18.75v-4.5m9-9.75a6 6 0 01-12 0V4.5h12v4.5z" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 mb-3">
            ¡Evaluación Completada!
          </h2>
          <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed mb-8">
            La evaluación fue registrada exitosamente. ¡Buen trabajo!
          </p>

          <Link
            href="/docente"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#162748] text-white rounded-2xl text-sm font-bold hover:bg-[#1e3460] hover:shadow-xl hover:shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            <LayoutGrid className="w-4 h-4" />
            Volver a Proyectos
          </Link>
        </motion.div>
      </main>

      <footer className="mt-auto px-6 py-10 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Feria de Innovación Tecnológica · 2026
        </p>
      </footer>
    </div>
  );
}
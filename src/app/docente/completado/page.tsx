'use client';

import Link from 'next/link';
import { LayoutGrid, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompletadoPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-hidden flex flex-col">
      {/* Background blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-emerald-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <img
              src="/logo/Emi logo.png"
              alt="Logo EMI"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain flex-shrink-0"
            />
            <div className="w-px h-6 bg-slate-200" />
            <img
              src="/logo/uicyt-logo.png"
              alt="Logo UICYT"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-contain flex-shrink-0"
            />
            <span className="text-lg sm:text-xl font-black text-[#094e8f] tracking-tight">
              UICYT
            </span>
          </motion.div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md bg-white rounded-[1.75rem] border border-slate-200/60 shadow-lg p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Decorative element inside card */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50 to-transparent opacity-50 pointer-events-none" />

          {/* Ícono de éxito */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center mb-5 sm:mb-6 border border-emerald-100 shadow-inner relative z-10">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" strokeWidth={1.5} />
          </div>

          {/* Título */}
          <h1 className="text-xl sm:text-2xl font-black text-[#162748] mb-2.5 sm:mb-3 leading-tight relative z-10">
            ¡Evaluación Completada!
          </h1>

          {/* Descripción */}
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-[16rem] sm:max-w-xs leading-relaxed mb-6 sm:mb-8 relative z-10">
            La evaluación fue registrada exitosamente en el sistema de calificaciones. ¡Buen trabajo!
          </p>

          {/* Separador decorativo */}
          <div className="w-12 h-1 bg-slate-100 rounded-full mb-6 sm:mb-8 relative z-10" />

          {/* Botón de regreso */}
          <Link
            href="/docente"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-3.5 bg-[#162748] text-white rounded-[1.5rem] text-sm font-black hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-900/20 transition-all active:scale-[0.98] min-h-[48px] relative z-10 group"
          >
            <LayoutGrid className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver a Proyectos
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6 sm:py-8 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Feria de Innovación Tecnológica · 2026
        </p>
      </footer>
    </div>
  );
}
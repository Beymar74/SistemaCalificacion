'use client';

import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Bell,
  UserCircle,
  LayoutGrid,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { proyectosAsignados } from '@/lib/data';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function DocenteHome() {
  const total = proyectosAsignados.length;
  const calificados = proyectosAsignados.filter(p => p.estado === 'Calificado').length;
  const pendientes = total - calificados;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src="/logo/logocarrera.png"
              alt="Logo Carrera"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-black text-[#162748] tracking-tight">IE TechFair</span>
          </motion.div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
              <UserCircle className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#162748] tracking-tight">
                Hola, <span className="text-blue-600">Juan Pérez</span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium">
                Tienes <span className="text-slate-900 font-bold">{pendientes} evaluaciones pendientes</span> para hoy.
              </p>
            </div>

            {/* Quick Stats Mini Cards */}
            <div className="flex gap-3">
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600">{calificados} Calificados</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">{pendientes} Pendientes</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Project List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="col-span-full mb-2 flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Proyectos Asignados
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer">
              Ver todos <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-full"
          >
            {proyectosAsignados.map(p => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full transition-all"
              >
                {/* Card Header Background */}
                <div className={`h-2 w-full ${p.estado === 'Calificado' ? 'bg-emerald-500' : 'bg-blue-600'
                  }`} />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl uppercase tracking-wider">
                      {p.stand}
                    </span>
                    {p.estado === 'Calificado' ? (
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        Completado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                    {p.categoria}
                  </p>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {p.nombre}
                  </h3>

                  <div className="mt-auto pt-6 border-t border-slate-50">
                    {p.estado === 'Calificado' ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-xs font-bold transition-all border border-slate-100"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        RESULTADO ENVIADO
                      </button>
                    ) : (
                      <Link
                        href={`/docente/evaluar/${p.id}`}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#162748] text-white rounded-2xl text-xs font-bold transition-all hover:bg-[#1e3460] hover:shadow-xl hover:shadow-blue-900/20 active:scale-[0.98]"
                      >
                        <ClipboardList className="w-4 h-4" />
                        INICIAR EVALUACIÓN
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer info for mobile */}
      <footer className="mt-auto px-6 py-10 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Feria de Innovación Tecnológica · 2026
        </p>
      </footer>
    </div>
  );
}

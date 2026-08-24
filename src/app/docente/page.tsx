'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  LayoutGrid,
  Clock,
  LogOut,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { fetchAsignacionesDocente } from '@/lib/db';
import type { ProyectoAsignado } from '@/lib/data';
import { useRouter } from 'next/navigation';
import CarreraBadge from '@/components/CarreraBadge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

interface Persona {
  nombre_completo: string;
  grado: string;
}

export default function DocenteHome() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [proyectos, setProyectos] = useState<ProyectoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: personaData } = await supabase
        .from('personas')
        .select('nombre_completo, grado')
        .eq('id_usuario', user.id)
        .single();

      setPersona(personaData);

      const data = await fetchAsignacionesDocente(user.id);

      // Filtrar solo proyectos que asistieron (asistio !== false)
      const ids = data.map(p => p.id).filter(Boolean);
      const { data: proyectosInfo } = await supabase
        .from('proyectos')
        .select('id, asistio')
        .in('id', ids);

      const asistioMap = new Map(proyectosInfo?.map(p => [p.id, p.asistio]) || []);
      const filtrados = data.filter(p => asistioMap.get(p.id) !== false);

      // Ordenar: Pendientes primero, Calificados al final
      filtrados.sort((a, b) => {
        if (a.estado === 'Pendiente' && b.estado === 'Calificado') return -1;
        if (a.estado === 'Calificado' && b.estado === 'Pendiente') return 1;
        return 0;
      });

      setProyectos(filtrados);
      setLoading(false);
    };

    cargarDatos();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const calificados = proyectos.filter(p => p.estado === 'Calificado').length;
  const pendientes = proyectos.filter(p => p.estado === 'Pendiente').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-[#162748] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-x-hidden flex flex-col">
      {/* Background blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-blue-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-indigo-100/30 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 py-1.5 sm:py-2">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          {/* Logo + nombre */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <img
              src="/logo/uicyt-logo.png"
              alt="Logo UICYT"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain flex-shrink-0 drop-shadow-sm"
            />
            <div className="flex flex-col justify-center">
              <span className="text-base sm:text-xl font-black text-[#162748] tracking-tight leading-none">
                UICYT
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mt-1">
                Evaluación Docente
              </span>
            </div>
          </motion.div>

          {/* Botón cerrar sesión */}
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-red-200 transition-all active:scale-95 flex-shrink-0 shadow-sm"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px] mx-auto w-full flex-1">
        {/* Sección bienvenida */}
        <section className="mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
          >
            {/* Saludo */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                  Panel de Evaluación
                </p>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#162748] tracking-tight leading-tight">
                Hola, <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {persona?.grado} {persona?.nombre_completo}
                </span>
              </h1>
              <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium leading-relaxed">
                Revisa y califica los proyectos asignados. Tienes{' '}
                <span className="text-[#162748] font-bold bg-slate-100 px-2 py-0.5 rounded-md">{pendientes} pendientes</span>.
              </p>
            </div>

            {/* Badges de estadísticas */}
            <div className="flex flex-wrap lg:flex-nowrap gap-3 lg:gap-4 lg:mb-1 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Calificados</p>
                  <p className="text-lg sm:text-xl font-black text-slate-700 leading-none">{calificados}</p>
                </div>
              </div>
              
              <div className="flex-1 lg:flex-none bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pendientes</p>
                  <p className="text-lg sm:text-xl font-black text-slate-700 leading-none">{pendientes}</p>
                </div>
              </div>

              <div className="flex-1 lg:flex-none bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                  <p className="text-lg sm:text-xl font-black text-slate-700 leading-none">{proyectos.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Sección proyectos */}
        <div>
          {/* Encabezado de sección */}
          <motion.div
            className="flex items-center justify-between mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-700 uppercase tracking-widest">
                Proyectos Asignados
              </h2>
            </div>
          </motion.div>

          {/* Estado vacío */}
          {proyectos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-12 sm:p-16 flex flex-col items-center text-center max-w-2xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                <ClipboardList className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-600 mb-2">Sin proyectos asignados</p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">Cuando el administrador de la feria te asigne proyectos para evaluar, aparecerán en esta sección.</p>
            </motion.div>
          )}

          {/* Grid de cards - AHORA HASTA 4 COLUMNAS */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          >
            {proyectos.map(p => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(22,39,72,0.1)' }}
                className="group bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col transition-all relative h-full"
              >
                {/* Glow de hover (subtle) */}
                <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="p-5 sm:p-6 flex flex-col flex-1 relative z-10">
                  {/* Header de la card */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    {/* Badge de stand */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stand</span>
                      <span className={`
                        px-4 py-1.5 text-base sm:text-lg font-black rounded-xl uppercase tracking-wider flex-shrink-0 inline-flex items-center justify-center
                        ${p.estado === 'Calificado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-[#162748] text-white shadow-sm shadow-blue-900/20'}
                      `}>
                        {p.stand}
                      </span>
                    </div>

                    {/* Badge de estado */}
                    {p.estado === 'Calificado' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-emerald-100 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-blue-100 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Categoría y Carrera */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {p.categoria && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {p.categoria}
                      </span>
                    )}
                    {p.carrera && (
                      <CarreraBadge carrera={p.carrera} size="xs" />
                    )}
                  </div>

                  {/* Nombre del proyecto */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug mb-6 line-clamp-3 group-hover:text-blue-600 transition-colors">
                    {p.nombre}
                  </h3>

                  {/* Botón CTA */}
                  <div className="mt-auto pt-4">
                    {p.estado === 'Calificado' ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50/80 text-slate-400 rounded-2xl text-xs sm:text-sm font-bold border border-slate-100 cursor-not-allowed min-h-[52px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        RESULTADO ENVIADO
                      </button>
                    ) : (
                      <Link
                        href={`/docente/evaluar/${p.id}`}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#162748] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all hover:bg-[#1e3460] hover:shadow-xl hover:shadow-blue-900/20 active:scale-[0.98] min-h-[52px] group-hover:bg-blue-600"
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

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 text-center opacity-50 mt-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2">
          Feria de Innovación Tecnológica <span className="w-1 h-1 rounded-full bg-slate-300" /> 2026
        </p>
      </footer>
    </div>
  );
}
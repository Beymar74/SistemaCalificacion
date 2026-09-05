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
import { getCarreraConfig } from '@/lib/constants';
import LoadingScreen from '@/components/LoadingScreen';

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
      <LoadingScreen
        message="Cargando proyectos asignados..."
        submessage="Portal Docente Evaluador · UICYT"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-x-hidden flex flex-col">
      {/* Background blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-blue-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-indigo-100/30 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3.5 shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          {/* Logo + nombre */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3.5 sm:gap-5 min-w-0"
          >
            <div className="flex items-center gap-3.5 sm:gap-5 flex-shrink-0">
              <img
                src="/logo/Emi logo.png"
                alt="Logo EMI"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0 drop-shadow-[0_2px_6px_rgba(9,78,143,0.12)]"
              />
              <div className="w-px h-7 sm:h-8 bg-slate-200 flex-shrink-0" />
              <img
                src="/logo/uicyt-logo-transparent.png"
                alt="Logo UICYT"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0 drop-shadow-[0_2px_6px_rgba(9,78,143,0.12)]"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base sm:text-lg font-black text-[#094e8f] tracking-tight leading-none">
                UICYT
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mt-0.5">
                Portal de Evaluación Docente
              </span>
            </div>
          </motion.div>

          {/* Botón cerrar sesión */}
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 hover:border-red-200 transition-all active:scale-95 flex-shrink-0 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-4 sm:px-6 py-5 sm:py-8 max-w-[1400px] mx-auto w-full flex-1">
        {/* Sección bienvenida compacta y minimalista */}
        <section className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Ambient subtle light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50/60 to-transparent pointer-events-none rounded-full blur-xl" />

            {/* Saludo minimalista */}
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#094e8f] animate-pulse" />
                <span className="text-[10px] font-black text-[#094e8f] uppercase tracking-wider">
                  Jurado Evaluador
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
                Hola, <span className="text-[#094e8f]">{persona?.grado ? `${persona.grado} ` : ''}{persona?.nombre_completo || 'Docente'}</span>
              </h1>

              <p className="text-slate-500 mt-1 text-xs font-medium">
                {proyectos.length === 0 ? (
                  'Tus proyectos asignados se mostrarán aquí una vez habilitados.'
                ) : pendientes > 0 ? (
                  <>
                    Tienes <span className="text-[#094e8f] font-bold">{pendientes} {pendientes === 1 ? 'proyecto pendiente' : 'proyectos pendientes'}</span> por calificar.
                  </>
                ) : (
                  <span className="text-emerald-600 font-bold">¡Has completado todas tus evaluaciones asignadas!</span>
                )}
              </p>
            </div>

            {/* Mini estadísticas sobrias y minimalistas */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 relative z-10 flex-shrink-0 w-full md:w-auto">
              {/* Pendientes */}
              <div className="bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 p-2 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2.5 transition-colors text-center sm:text-left justify-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200/70 text-slate-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex flex-col items-center sm:items-start">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight sm:tracking-wider leading-none">Pendientes</p>
                  <p className="text-sm sm:text-lg font-black text-slate-800 leading-tight mt-0.5">{pendientes}</p>
                </div>
              </div>

              {/* Calificados */}
              <div className="bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 p-2 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2.5 transition-colors text-center sm:text-left justify-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200/70 text-slate-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex flex-col items-center sm:items-start">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight sm:tracking-wider leading-none">Calificados</p>
                  <p className="text-sm sm:text-lg font-black text-slate-800 leading-tight mt-0.5">{calificados}</p>
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 p-2 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2.5 transition-colors text-center sm:text-left justify-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200/70 text-slate-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex flex-col items-center sm:items-start">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight sm:tracking-wider leading-none">Total</p>
                  <p className="text-sm sm:text-lg font-black text-slate-800 leading-tight mt-0.5">{proyectos.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Sección proyectos */}
        <div>
          {/* Encabezado de sección */}
          <motion.div
            className="flex items-center justify-between mb-4 sm:mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-[#094e8f]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  Proyectos Asignados
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  {proyectos.length === 0 ? 'Sin evaluaciones pendientes' : `${proyectos.length} proyectos bajo tu jurado`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Estado vacío amigable */}
          {proyectos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 flex flex-col items-center text-center max-w-xl mx-auto relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center mb-4 text-[#094e8f]">
                <ClipboardList className="w-8 h-8" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mb-2">
                Sin proyectos asignados por el momento
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-5">
                Cuando la coordinación de la feria te asigne proyectos o stands para evaluar, aparecerán listados automáticamente en esta sección.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-slate-400 text-[11px] font-semibold">
                <span>Gestión 2026 · UICYT</span>
              </div>
            </motion.div>
          )}

          {/* Grid de cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            {proyectos.map(p => {
              const cfg = getCarreraConfig(p.carrera);
              return (
                <motion.div
                  key={p.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: `0 20px 35px -10px ${cfg.hex}20` }}
                  className="group bg-white rounded-2xl sm:rounded-3xl border shadow-2xs overflow-hidden flex flex-col transition-all relative h-full"
                  style={{ borderColor: cfg.border }}
                >
                  {/* Barra superior de acento */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: cfg.hex }} />

                  <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-10">
                    {/* Header de la card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Stand */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stand</span>
                        <span 
                          className="px-2.5 py-0.5 text-xs sm:text-sm font-black font-mono rounded-lg uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center border shadow-2xs"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.text,
                            borderColor: cfg.border,
                          }}
                        >
                          {p.stand}
                        </span>
                      </div>

                      {/* Estado */}
                      {p.estado === 'Calificado' ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100/80">
                          <CheckCircle2 className="w-3 h-3" />
                          Completado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#094e8f] bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Categoría */}
                    <div className="flex items-start gap-1.5 flex-wrap mb-2.5">
                      {p.categoria && (
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {p.categoria}
                        </span>
                      )}
                    </div>

                    {/* Nombre del proyecto - no truncado */}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug mb-5 break-words group-hover:text-[#094e8f] transition-colors">
                      {p.nombre}
                    </h3>

                    {/* Botón CTA */}
                    <div className="mt-auto pt-2">
                      {p.estado === 'Calificado' ? (
                        <button
                          disabled
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold border border-slate-100 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          RESULTADO ENVIADO
                        </button>
                      ) : (
                        <Link
                          href={`/docente/evaluar/${p.id}`}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#094e8f] hover:bg-[#073b6d] text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-900/15 active:scale-[0.98]"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-[#f0d114]" />
                          EVALUAR PROYECTO
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6 sm:py-8 text-center opacity-60 mt-auto border-t border-slate-200/60 bg-white/40">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Escuela Militar de Ingeniería · Carrera de Ingeniería de Sistemas · 2026
        </p>
      </footer>
    </div>
  );
}
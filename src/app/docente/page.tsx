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
            className="flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-100">
                <img
                  src="/logo/Emi logo.png"
                  alt="Logo EMI"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                />
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-100">
                <img
                  src="/logo/uicyt-logo.png"
                  alt="Logo UICYT"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain flex-shrink-0"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-[#094e8f] tracking-tight leading-none">
                  UICYT
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0d114]" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  2026
                </span>
              </div>
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
      <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto w-full flex-1">
        {/* Sección bienvenida */}
        <section className="mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            {/* Ambient subtle light */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-50 to-transparent pointer-events-none rounded-full blur-2xl" />

            {/* Saludo */}
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/90 border border-blue-100 rounded-full mb-3.5">
                <span className="w-2 h-2 rounded-full bg-[#094e8f] animate-pulse" />
                <p className="text-[10px] sm:text-[11px] font-black text-[#094e8f] uppercase tracking-widest">
                  Panel de Jurado Evaluador
                </p>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                Hola, <br />
                <span className="text-[#094e8f]">
                  {persona?.grado ? `${persona.grado} ` : ''}{persona?.nombre_completo || 'Docente Evaluador'}
                </span>
              </h1>

              <p className="text-slate-500 mt-2.5 text-xs sm:text-sm md:text-base font-medium leading-relaxed">
                {proyectos.length === 0 ? (
                  'Bienvenido al sistema. Tus proyectos asignados se mostrarán a continuación cuando sean asignados.'
                ) : pendientes > 0 ? (
                  <>
                    Tienes <strong className="text-[#094e8f] font-bold">{pendientes} {pendientes === 1 ? 'proyecto pendiente' : 'proyectos pendientes'}</strong> por calificar en esta jornada.
                  </>
                ) : (
                  <span className="text-emerald-600 font-bold">¡Excelente! Has completado todas tus evaluaciones asignadas.</span>
                )}
              </p>
            </div>

            {/* Badges de estadísticas */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 relative z-10 w-full lg:w-auto">
              {/* Calificados */}
              <div className="flex-1 sm:min-w-[130px] bg-slate-50/80 hover:bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 transition-all flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Calificados</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none mt-0.5">{calificados}</p>
                </div>
              </div>
              
              {/* Pendientes */}
              <div className="flex-1 sm:min-w-[130px] bg-slate-50/80 hover:bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 transition-all flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pendientes</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none mt-0.5">{pendientes}</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex-1 sm:min-w-[130px] bg-slate-50/80 hover:bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/70 transition-all flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#094e8f] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none mt-0.5">{proyectos.length}</p>
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#094e8f]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  Proyectos Asignados
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
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
              className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-sm p-10 sm:p-14 lg:p-16 flex flex-col items-center text-center max-w-2xl mx-auto relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-3xl bg-blue-50/80 border border-blue-100 flex items-center justify-center mb-5 text-[#094e8f]">
                <ClipboardList className="w-9 h-9" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-2">
                Sin proyectos asignados por el momento
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-6">
                Cuando la coordinación de la feria te asigne proyectos o stands para evaluar, aparecerán listados automáticamente en esta sección.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-slate-400 text-xs font-semibold">
                <span>Gestión 2026 · UICYT</span>
              </div>
            </motion.div>
          )}

          {/* Grid de cards - HASTA 4 COLUMNAS */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          >
            {proyectos.map(p => {
              const cfg = getCarreraConfig(p.carrera);
              return (
                <motion.div
                  key={p.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, boxShadow: `0 25px 50px -12px ${cfg.hex}25` }}
                  className="group bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col transition-all relative h-full"
                  style={{ borderColor: cfg.border }}
                >
                  {/* Barra superior de acento */}
                  <div className="h-2 w-full" style={{ backgroundColor: cfg.hex }} />

                  <div className="p-5 sm:p-6 flex flex-col flex-1 relative z-10">
                    {/* Header de la card */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Stand */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stand</span>
                        <span 
                          className="px-3 py-1 text-sm sm:text-base font-black font-mono rounded-xl uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center border shadow-2xs"
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
                        <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-emerald-100/80">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[#094e8f] bg-blue-50 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-blue-100">
                          <Clock className="w-3.5 h-3.5" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Categoría y Carrera */}
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      {p.categoria && (
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {p.categoria}
                        </span>
                      )}
                      {p.carrera && (
                        <CarreraBadge carrera={p.carrera} size="xs" />
                      )}
                    </div>

                    {/* Nombre del proyecto */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug mb-6 line-clamp-3 group-hover:text-[#094e8f] transition-colors">
                      {p.nombre}
                    </h3>

                    {/* Botón CTA */}
                    <div className="mt-auto pt-2">
                      {p.estado === 'Calificado' ? (
                        <button
                          disabled
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-xs sm:text-sm font-bold border border-slate-100 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          RESULTADO ENVIADO
                        </button>
                      ) : (
                        <Link
                          href={`/docente/evaluar/${p.id}`}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#094e8f] hover:bg-[#073b6d] text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md shadow-blue-900/15 active:scale-[0.98]"
                        >
                          <ClipboardList className="w-4 h-4 text-[#f0d114]" />
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
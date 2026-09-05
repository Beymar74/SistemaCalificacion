'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Trophy, 
  ChevronRight, 
  Activity, 
  RefreshCw,
  FileSpreadsheet,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import LoadingScreen from '@/components/LoadingScreen';
import { 
  fetchProyectosAdmin, 
  fetchDocentesSummary, 
  fetchResultadosTop,
  sincronizarTodosLosResultados
} from '@/lib/db';
import { getCarreraConfig } from '@/lib/constants';
import type { Proyecto, ResultadoTop } from '../../lib/data';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProyectos: 0,
    totalDocentes: 0,
    docentesActivos: 0,
    evaluacionesCompletadas: 0,
    evaluacionesTotal: 0,
    promedioGeneral: 0
  });
  const [topProyectos, setTopProyectos] = useState<ResultadoTop[]>([]);
  const [proyectosRecientes, setProyectosRecientes] = useState<Proyecto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  async function loadDashboardData() {
    try {
      const [proyectos, docentes, top] = await Promise.all([
        fetchProyectosAdmin(),
        fetchDocentesSummary(),
        fetchResultadosTop(5)
      ]);

      const completadas = proyectos.reduce((acc, p) => acc + p.evaluacionesCompletadas, 0);
      const total = proyectos.reduce((acc, p) => acc + p.evaluacionesTotal, 0);
      const promedio = top.length > 0 
        ? top.reduce((acc, p) => acc + p.puntajeFinal, 0) / top.length 
        : 0;

      setStats({
        totalProyectos: proyectos.length,
        totalDocentes: docentes.total,
        docentesActivos: docentes.activos,
        evaluacionesCompletadas: completadas,
        evaluacionesTotal: total,
        promedioGeneral: Math.round(promedio * 10) / 10
      });

      setTopProyectos(top);
      setProyectosRecientes(proyectos.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await sincronizarTodosLosResultados();
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing results:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  if (isLoading) {
    return (
      <LoadingScreen
        message="Cargando Panel de Control Central..."
        submessage="Obteniendo métricas y estado del sistema"
        fullScreen={false}
      />
    );
  }

  const avanceGlobal = stats.evaluacionesTotal > 0 
    ? Math.round((stats.evaluacionesCompletadas / stats.evaluacionesTotal) * 100) 
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#094e8f] font-black text-xs uppercase tracking-[0.2em] mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#094e8f] border border-blue-100 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#094e8f]" />
              Resumen del Sistema · UICYT 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#162748] tracking-tight">
            Dashboard Central
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
            Panel de administración y seguimiento en tiempo real de la feria tecnológica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            title="Consolidar y sincronizar todas las notas"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
              isSyncing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white text-[#094e8f] hover:bg-blue-50/80 border border-blue-200 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 text-[#094e8f] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
          </button>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Sistema Operativo</span>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Fase de Evaluación
            </span>
          </div>
        </div>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="dashboard"
        title="Guía de Inicio Rápido: Dashboard"
        description="Bienvenido al Panel de Control Central. Aquí puede observar métricas en tiempo real sobre la Feria Tecnológica: cantidad de proyectos, participación de jurados y el avance general de las evaluaciones. Utilice el botón 'Sincronizar Datos' para consolidar los puntajes actuales de todos los proyectos."
      />

      {/* 4 Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        <StatCard
          icon={Layers}
          label="Total Proyectos"
          value={stats.totalProyectos}
          theme="blue"
          trend={`${stats.totalProyectos} Registrados`}
          subtext="Participantes en la feria"
        />
        <StatCard
          icon={Users}
          label="Docentes Activos"
          value={`${stats.docentesActivos}/${stats.totalDocentes}`}
          theme="indigo"
          trend={`${stats.totalDocentes > 0 ? Math.round((stats.docentesActivos / stats.totalDocentes) * 100) : 0}% Participación`}
          subtext="Jurados habilitados"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Avance General" 
          value={`${avanceGlobal}%`} 
          theme="emerald"
          trend={`${stats.evaluacionesCompletadas} de ${stats.evaluacionesTotal}`}
          subtext="Evaluaciones confirmadas"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Promedio General" 
          value={stats.promedioGeneral > 0 ? stats.promedioGeneral.toFixed(1) : '0.0'} 
          theme="amber"
          trend="Escala 0-100"
          subtext="Calificación promedio"
        />
      </motion.div>

      {/* Main Row: Progress Banner & Top Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Progress Banner & Recent Projects */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Progress Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#094e8f] via-[#0b4175] to-[#162748] rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/10 border border-blue-800/40"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/15 blur-[90px] -mr-32 -mt-32 rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5 tracking-tight">
                  <span>Progreso de la Feria</span>
                  <span className="bg-[#f0d114] text-[#162748] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    En Vivo
                  </span>
                </h2>
                <span className="text-xs font-bold text-blue-200/90 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                  Meta del Evento: 100%
                </span>
              </div>

              <p className="text-blue-100/90 text-xs sm:text-sm font-medium mb-6 max-w-xl leading-relaxed">
                El proceso de evaluación se encuentra en desarrollo. Se han registrado{' '}
                <strong className="text-white font-black">{stats.evaluacionesCompletadas}</strong> de las{' '}
                <strong className="text-white font-black">{stats.evaluacionesTotal}</strong> evaluaciones programadas entre todos los jurados asignados.
              </p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-white">{avanceGlobal}%</span>
                    <span className="text-xs font-bold text-blue-200">completado</span>
                  </div>
                  <span className="text-xs font-bold text-blue-200">
                    {stats.evaluacionesCompletadas} / {stats.evaluacionesTotal} evaluaciones
                  </span>
                </div>

                <div className="h-3.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/15">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${avanceGlobal}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#f0d114] via-blue-300 to-white rounded-full shadow-[0_0_15px_rgba(240,209,20,0.6)]"
                  />
                </div>
              </div>

              {/* Mini Status Badges inside banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <p className="text-[10px] font-bold text-blue-200 uppercase">Evaluadas</p>
                  <p className="text-base font-black text-white mt-0.5">{stats.evaluacionesCompletadas}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <p className="text-[10px] font-bold text-blue-200 uppercase">Pendientes</p>
                  <p className="text-base font-black text-amber-300 mt-0.5">
                    {Math.max(0, stats.evaluacionesTotal - stats.evaluacionesCompletadas)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase">Jurados Activos</p>
                  <p className="text-base font-black text-emerald-300 mt-0.5">{stats.docentesActivos}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Control de Proyectos Recientes */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#094e8f] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#162748]">Control de Proyectos</h3>
                  <p className="text-xs text-slate-400 font-medium">Últimos proyectos monitoreados</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/proyectos')}
                className="text-[#094e8f] font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1 group cursor-pointer"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {proyectosRecientes.map((p) => {
                const carreraCfg = getCarreraConfig(p.carrera);

                return (
                  <div 
                    key={p.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl transition-all border border-slate-200/60 hover:border-blue-200 gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Badge de código amigable, legible y sin salto de línea */}
                      <span className="inline-block text-xs font-bold font-mono bg-[#094e8f] text-white px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs shrink-0">
                        {p.codigo}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                          {p.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.carrera ? (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap"
                              style={{
                                backgroundColor: carreraCfg.bg,
                                color: carreraCfg.text,
                                borderColor: carreraCfg.border
                              }}
                            >
                              {p.carrera}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {p.categoria}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-xs font-black text-slate-800">
                          {p.evaluacionesCompletadas}/{p.evaluacionesTotal}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Evaluaciones</span>
                      </div>
                      <StatusBadge estado={p.estado} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Top Proyectos Widget */}
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#162748]">Top Proyectos</h3>
                    <p className="text-xs text-slate-400 font-medium">Líderes de evaluación</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {topProyectos.length > 0 ? (
                  topProyectos.map((p, idx) => {
                    const carreraCfg = getCarreraConfig(p.carrera);

                    return (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-blue-50/30 transition-all flex items-center gap-3.5"
                      >
                        {/* Medal Position */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-2xs ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-700 border border-amber-300/80 font-black' 
                            : idx === 1 
                            ? 'bg-slate-200 text-slate-700 border border-slate-300' 
                            : idx === 2 
                            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono font-bold text-[#094e8f] bg-blue-50 px-1.5 py-0.5 rounded">
                              {p.codigo}
                            </span>
                            <span 
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded border truncate max-w-[120px]"
                              style={{
                                backgroundColor: carreraCfg.bg,
                                color: carreraCfg.text,
                                borderColor: carreraCfg.border
                              }}
                            >
                              {p.carrera || p.categoria}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                            {p.nombre}
                          </h4>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-[#162748]">
                            {p.puntajeFinal.toFixed(2)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">pts</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                      <Trophy className="w-8 h-8 opacity-60" />
                    </div>
                    <p className="text-slate-800 font-black text-sm">Calificaciones en Proceso</p>
                    <p className="text-slate-400 text-xs font-medium mt-1 leading-relaxed max-w-xs">
                      Los proyectos destacados aparecerán aquí automáticamente a medida que los jurados emitan sus evaluaciones.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button 
                onClick={() => router.push('/admin/resultados')}
                className="w-full flex items-center justify-center gap-2 bg-[#094e8f] hover:bg-[#073c6e] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-900/10 active:scale-98 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Ver Podios y Resultados</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="pt-2">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3.5">
          Accesos Rápidos del Administrador
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => router.push('/admin/gestion-proyectos')}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-sm text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#094e8f] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-[#094e8f] transition-colors">Gestión de Proyectos</p>
                <p className="text-[10px] text-slate-400">Crear, editar y stands</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#094e8f] group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => router.push('/admin/docentes')}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Jurados y Docentes</p>
                <p className="text-[10px] text-slate-400">Directorio y proyectos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => router.push('/admin/asignaciones')}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-sm text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Evaluaciones</p>
                <p className="text-[10px] text-slate-400">Notas y criterios</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => router.push('/admin/reportes')}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-sm text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Reportes Oficiales</p>
                <p className="text-[10px] text-slate-400">Exportar Excel y PDF</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  theme, 
  trend, 
  subtext 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  theme: 'blue' | 'indigo' | 'emerald' | 'amber'; 
  trend: string; 
  subtext: string; 
}) {
  const themes = {
    blue: {
      bubble: "bg-blue-50 text-[#094e8f]",
      badge: "bg-blue-50 text-[#094e8f] border border-blue-100/80",
      borderHover: "hover:border-blue-200"
    },
    indigo: {
      bubble: "bg-indigo-50 text-indigo-600",
      badge: "bg-indigo-50 text-indigo-600 border border-indigo-100/80",
      borderHover: "hover:border-indigo-200"
    },
    emerald: {
      bubble: "bg-emerald-50 text-emerald-600",
      badge: "bg-emerald-50 text-emerald-600 border border-emerald-100/80",
      borderHover: "hover:border-emerald-200"
    },
    amber: {
      bubble: "bg-amber-50 text-amber-600",
      badge: "bg-amber-50 text-amber-600 border border-amber-100/80",
      borderHover: "hover:border-amber-200"
    },
  };

  const currentTheme = themes[theme];

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
      }}
      className={`bg-white p-5 sm:p-6 rounded-[2.2rem] border border-slate-200/80 shadow-xs hover:shadow-md ${currentTheme.borderHover} transition-all group`}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${currentTheme.bubble}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${currentTheme.badge}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">{value}</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-1">{subtext}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    'Evaluado': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    'En Proceso': 'bg-blue-50 text-[#094e8f] border-blue-200/80',
    'Pendiente': 'bg-amber-50 text-amber-700 border-amber-200/80',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${styles[estado] || styles.Pendiente}`}>
      {estado}
    </span>
  );
}
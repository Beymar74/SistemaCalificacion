'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Trophy,
  ChevronRight,
  Activity,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  fetchProyectosAdmin, 
  fetchDocentesSummary, 
  fetchResultadosTop,
  sincronizarTodosLosResultados
} from '@/lib/db';
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
          Cargando Panel de Control...
        </p>
      </div>
    );
  }

  const avanceGlobal = stats.evaluacionesTotal > 0 
    ? Math.round((stats.evaluacionesCompletadas / stats.evaluacionesTotal) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Activity className="w-4 h-4" />
            <span>Resumen del Sistema</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">
            Dashboard Central
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Bienvenido al panel de administración de la Feria Tecnológica.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
              isSyncing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 shadow-blue-600/5'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}
          </button>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-slate-700">Sistema Operativo</span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Fase de Evaluación
            </span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          icon={Layers}
          label="Total Proyectos"
          value={stats.totalProyectos}
          color="blue"
          trend={`${stats.totalProyectos} registrados`}
        />
        <StatCard
          icon={Users}
          label="Docentes Activos"
          value={`${stats.docentesActivos}/${stats.totalDocentes}`}
          color="indigo"
          trend={`${stats.totalDocentes > 0 ? Math.round((stats.docentesActivos / stats.totalDocentes) * 100) : 0}% participación`}
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Avance General" 
          value={`${avanceGlobal}%`} 
          color="emerald"
          trend={`${stats.evaluacionesCompletadas} de ${stats.evaluacionesTotal}`}
        />
        <StatCard 
          icon={TrendingUp} 
          label="Promedio General" 
          value={stats.promedioGeneral} 
          color="amber"
          trend="Escala 0-100"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#162748] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                Progreso de la Feria
                <span className="bg-blue-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">En Vivo</span>
              </h2>
              <p className="text-blue-200 text-sm font-medium mb-8 max-w-md">
                El proceso de evaluación está en marcha. Actualmente se han completado {stats.evaluacionesCompletadas} de las {stats.evaluacionesTotal} evaluaciones programadas.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black">{avanceGlobal}%</span>
                  <span className="text-sm font-bold text-blue-300 uppercase tracking-widest">Meta: 100%</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${avanceGlobal}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-[#162748] flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                Control de Proyectos
              </h3>
              <button 
                onClick={() => router.push('/admin/proyectos')}
                className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-1 group"
              >
                Ver todos <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              {proyectosRecientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl transition-all group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#162748] shadow-sm text-xs border border-slate-100 group-hover:scale-110 transition-transform">
                      {p.codigo.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{p.nombre}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-xs font-black text-slate-700">{p.evaluacionesCompletadas}/{p.evaluacionesTotal}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Evals</span>
                    </div>
                    <StatusBadge estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-[#162748]">Top Proyectos</h3>
            </div>

            <div className="space-y-6 flex-1">
              {topProyectos.length > 0 ? (
                topProyectos.map((p, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className={`absolute left-0 top-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-sm
                      ${idx === 0 ? 'bg-amber-100 text-amber-600' : 
                        idx === 1 ? 'bg-slate-100 text-slate-600' : 
                        idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{p.nombre}</h4>
                            <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900">{p.puntajeFinal}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">puntos</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/admin/gestion-proyectos')}
                            className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 text-sm font-medium">Resultados no disponibles aún</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
              <button 
                onClick={() => router.push('/admin/resultados')}
                className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/5 group"
              >
                <span className="uppercase tracking-widest text-[10px]">Analizar Resultados</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend, trendUp = true }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
      }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-[#162748] tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const styles: any = {
    'Evaluado': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'En Proceso': 'bg-blue-50 text-blue-600 border-blue-100',
    'Pendiente': 'bg-slate-50 text-slate-500 border-slate-100',
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[estado] || styles.Pendiente}`}>
      {estado}
    </span>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Layers,
  Users,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { fetchProyectosAdmin, fetchDocentesSummary } from '@/lib/db';
import type { EstadoProyecto } from '@/lib/data';
import type { Proyecto } from '@/lib/data';

const estadoConfig: Record<EstadoProyecto, { bg: string; text: string; dot: string; glow: string }> = {
  Evaluado: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600',
    dot: 'bg-indigo-500',
    glow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]'
  },
  'En Proceso': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    dot: 'bg-amber-50',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  },
  Pendiente: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
    glow: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]'
  },
};


const StatCard = ({ label, value, icon: Icon, color, delay }: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4 group hover:shadow-md transition-all"
  >
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-[#162748]">{value}</p>
    </div>
    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowUpRight className="w-4 h-4 text-slate-300" />
    </div>
  </motion.div>
);

const PAGE_SIZE = 8;

export default function ProyectosPage() {
  const [proyectosData, setProyectosData] = useState<Proyecto[]>([]);
  const [docentesSummary, setDocentesSummary] = useState({ activos: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');

  const cargarDatos = () => {
    setLoading(true);
    setError('');
    Promise.all([fetchProyectosAdmin(), fetchDocentesSummary()])
      .then(([proyectos, docentes]) => {
        setProyectosData(proyectos);
        setDocentesSummary(docentes);
      })
      .catch(() => setError('No se pudo cargar la información. Verifica la conexión.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return proyectosData.filter(p => {
      const q = search.toLowerCase();
      return (
        (!q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) &&
        (!estado || p.estado === estado)
      );
    });
  }, [proyectosData, search, estado]);

  const stats = useMemo(() => {
    const total = proyectosData.length;
    const evaluados = proyectosData.filter(p => p.estado === 'Evaluado').length;
    const pendientes = proyectosData.filter(p => p.estado === 'Pendiente').length;
    const enProceso = proyectosData.filter(p => p.estado === 'En Proceso').length;
    const totalEvals = proyectosData.reduce((s, p) => s + p.evaluacionesTotal, 0);
    const doneEvals  = proyectosData.reduce((s, p) => s + p.evaluacionesCompletadas, 0);
    const progreso   = totalEvals > 0 ? Math.round((doneEvals / totalEvals) * 100) : 0;
    const faltan     = totalEvals - doneEvals;
    return { total, evaluados, pendientes, enProceso, progreso, faltan };
  }, [proyectosData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="p-8 bg-white min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#162748]/20 border-t-[#162748] rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Cargando proyectos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 bg-white min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-rose-500 font-bold">{error}</p>
        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline"
        >
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black text-[#162748] tracking-tight"
          >
            Administración de Proyectos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mt-1 flex items-center gap-2 font-medium"
          >
            <LayoutList className="w-4 h-4" />
            Control central y monitoreo de la Feria Tecnológica.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Feria Activa</span>
          </div>
        </motion.div>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="proyectos"
        title="Guía del Módulo: Proyectos Registrados"
        className="mb-8"
        description="Monitoree el avance individual de cada proyecto en la feria. Puede filtrar por estado y categoría para identificar rápidamente cuáles proyectos ya fueron calificados por sus 4 jurados correspondientes, cuáles están en proceso y cuáles no han recibido ninguna evaluación."
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Proyectos" value={String(stats.total)}    icon={Layers}       color="bg-blue-600"   delay={0.1} />
        <StatCard label="Evaluados"        value={String(stats.evaluados)} icon={CheckCircle2} color="bg-indigo-500" delay={0.2} />
        <StatCard label="En Proceso"       value={String(stats.enProceso)}  icon={TrendingUp}   color="bg-sky-500"    delay={0.25} />
        <StatCard label="Pendientes"       value={String(stats.pendientes)} icon={Clock}       color="bg-rose-500"   delay={0.3} />
        <StatCard
          label="Docentes"
          value={`${docentesSummary.activos}/${docentesSummary.total}`}
          icon={Users}
          color="bg-amber-500"
          delay={0.4}
        />
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="p-5 flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={estado}
              onChange={e => { setEstado(e.target.value); setPage(1); }}
              className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">Estados</option>
              <option value="Evaluado">Evaluado</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['Código', 'Información del Proyecto', 'Categoría', 'Estado', 'Evaluaciones (4 Docentes)'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {paginated.length > 0 ? (
                  paginated.map((p, index) => {
                    const cfg = estadoConfig[p.estado];
                    const avancePct = p.evaluacionesTotal > 0
                      ? (p.evaluacionesCompletadas / p.evaluacionesTotal) * 100
                      : 0;

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <span className="text-[11px] font-black bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg uppercase">
                            {p.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{p.nombre}</p>
                            <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{p.grupo}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-100/50">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.glow} animate-pulse`} />
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-700">
                                {p.evaluacionesCompletadas}/{p.evaluacionesTotal} docentes
                              </span>
                              <span className="text-[10px] font-black text-slate-400">{Math.round(avancePct)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${avancePct}%` }}
                                transition={{ duration: 1 }}
                                className={`h-1.5 rounded-full ${
                                  avancePct === 100 ? 'bg-indigo-500' : 'bg-blue-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <Search className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-bold">No se encontraron proyectos.</p>
                        <button
                          onClick={() => { setSearch(''); setCategoria(''); setEstado(''); setPage(1); }}
                          className="text-blue-500 text-xs font-black hover:underline uppercase tracking-widest"
                        >
                          Restablecer Filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-5 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages}</span>
            {' · '}Total <span className="text-slate-900">{filtered.length}</span> Proyectos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 disabled:opacity-30 transition-all border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                    n === page
                    ? 'bg-[#162748] text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-white text-slate-500 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 disabled:opacity-30 transition-all border border-transparent hover:border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-[#162748] tracking-tight">Progreso General de Calificación</h3>
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                <TrendingUp className="w-3 h-3" />
                En tiempo real
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6">
              {stats.faltan > 0
                ? `Faltan ${stats.faltan} evaluaciones de docentes para completar la fase actual.`
                : 'Todas las evaluaciones han sido completadas.'}
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-4xl font-black text-[#162748]">{stats.progreso}<span className="text-xl text-slate-300">%</span></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Meta: 100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progreso}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#162748] rounded-3xl p-6 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <Users className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold leading-tight mb-2">4 Docentes por Proyecto</h3>
            <p className="text-blue-100/60 text-xs font-medium leading-relaxed">Cada proyecto es evaluado por exactamente 4 docentes. El estado cambia a Evaluado cuando los 4 confirman su calificación.</p>
          </div>

          <button
            onClick={cargarDatos}
            className="relative w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold transition-all backdrop-blur-md uppercase tracking-widest mt-6 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Datos
          </button>
        </div>
      </motion.div>
    </div>
  );
}

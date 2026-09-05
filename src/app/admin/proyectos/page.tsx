'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Layers,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  Filter,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import LoadingScreen from '@/components/LoadingScreen';
import { fetchProyectosAdmin, fetchDocentesSummary } from '@/lib/db';
import type { EstadoProyecto } from '@/lib/data';
import type { Proyecto } from '@/lib/data';
import {
  CATEGORIAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
  getCarreraConfig,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

const estadoConfig: Record<EstadoProyecto, { bg: string; text: string; dot: string; glow: string; border: string }> = {
  Evaluado: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    border: 'border-emerald-200/70'
  },
  'En Proceso': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]',
    border: 'border-blue-200/70'
  },
  Pendiente: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    border: 'border-amber-200/70'
  },
};

const StatCard = ({ label, value, icon: Icon, theme, subtext }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  theme: 'blue' | 'emerald' | 'sky' | 'rose' | 'amber';
  subtext: string;
}) => {
  const themes = {
    blue: {
      bubble: 'bg-blue-50 text-[#094e8f]',
      borderHover: 'hover:border-blue-200'
    },
    emerald: {
      bubble: 'bg-emerald-50 text-emerald-600',
      borderHover: 'hover:border-emerald-200'
    },
    sky: {
      bubble: 'bg-sky-50 text-sky-600',
      borderHover: 'hover:border-sky-200'
    },
    rose: {
      bubble: 'bg-rose-50 text-rose-600',
      borderHover: 'hover:border-rose-200'
    },
    amber: {
      bubble: 'bg-amber-50 text-amber-600',
      borderHover: 'hover:border-amber-200'
    }
  };

  const current = themes[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[2rem] p-5 shadow-xs border border-slate-200/80 flex items-start gap-4 group ${current.borderHover} hover:shadow-md transition-all`}
    >
      <div className={`w-11 h-11 rounded-2xl ${current.bubble} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtext}</p>
      </div>
    </motion.div>
  );
};

const PAGE_SIZE = 8;

export default function ProyectosPage() {
  const [proyectosData, setProyectosData] = useState<Proyecto[]>([]);
  const [docentesSummary, setDocentesSummary] = useState({ activos: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [categoria, setCategoria] = useState('');
  const [carrera, setCarrera] = useState('');

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
    cargarDatos();
  }, []);

  // ── filtro + orden numérico por código ──
  const filtered = useMemo(() => {
    return proyectosData
      .filter(p => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.carrera || '').toLowerCase().includes(q);
        const matchEstado = !estado || p.estado === estado;
        const matchCat = !categoria || p.categoria === categoria;
        const matchCar = !carrera || (p.carrera || '') === carrera;
        return matchSearch && matchEstado && matchCat && matchCar;
      })
      .sort((a, b) => {
        const numA = parseInt(a.codigo.replace(/\D/g, ''), 10);
        const numB = parseInt(b.codigo.replace(/\D/g, ''), 10);
        return numA - numB;
      });
  }, [proyectosData, search, estado, categoria, carrera]);

  const stats = useMemo(() => {
    const total = proyectosData.length;
    const evaluados = proyectosData.filter(p => p.estado === 'Evaluado').length;
    const pendientes = proyectosData.filter(p => p.estado === 'Pendiente').length;
    const enProceso = proyectosData.filter(p => p.estado === 'En Proceso').length;
    const totalEvals = proyectosData.reduce((s, p) => s + p.evaluacionesTotal, 0);
    const doneEvals = proyectosData.reduce((s, p) => s + p.evaluacionesCompletadas, 0);
    const progreso = totalEvals > 0 ? Math.round((doneEvals / totalEvals) * 100) : 0;
    const faltan = totalEvals - doneEvals;
    return { total, evaluados, pendientes, enProceso, progreso, faltan };
  }, [proyectosData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <LoadingScreen
      message="Cargando proyectos registrados..."
      submessage="Obteniendo stands, categorías y estados de evaluación"
      fullScreen={false}
    />
  );

  if (error) return (
    <div className="p-8 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-md">
        <p className="text-rose-600 font-bold text-sm">{error}</p>
        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#094e8f] rounded-xl text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#094e8f] border border-blue-100 flex items-center gap-1.5">
              <LayoutList className="w-3.5 h-3.5 text-[#094e8f]" />
              Control Central · UICYT 2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">
            Administración de Proyectos
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
            Monitoreo en tiempo real del progreso de evaluación de todos los proyectos registrados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            title="Recargar listado"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#094e8f]" />
            <span>Actualizar</span>
          </button>

          <div className="bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200/80 flex items-center gap-2 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Feria Activa</span>
          </div>
        </div>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="proyectos"
        title="Guía del Módulo: Proyectos Registrados"
        description="Monitoree el avance individual de cada proyecto en la feria. Puede filtrar por estado, categoría y carrera para identificar rápidamente el progreso de calificación."
      />

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard label="Total Proyectos" value={stats.total} icon={Layers} theme="blue" subtext="Registrados en feria" />
        <StatCard label="Evaluados" value={stats.evaluados} icon={CheckCircle2} theme="emerald" subtext="Calificación completa" />
        <StatCard label="En Proceso" value={stats.enProceso} icon={TrendingUp} theme="sky" subtext="Evaluación parcial" />
        <StatCard label="Pendientes" value={stats.pendientes} icon={Clock} theme="rose" subtext="Sin calificar aún" />
        <StatCard
          label="Docentes"
          value={`${docentesSummary.activos}/${docentesSummary.total}`}
          icon={Users}
          theme="amber"
          subtext="Jurados habilitados"
        />
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xs border border-slate-200/80 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5 border-b border-slate-100 bg-slate-50/50">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o carrera..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094e8f] focus:ring-2 focus:ring-[#094e8f]/10 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={categoria}
                onChange={e => { setCategoria(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-9 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#094e8f] transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={carrera}
                onChange={e => { setCarrera(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-9 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#094e8f] transition-all shadow-2xs cursor-pointer max-w-[210px]"
              >
                <option value="">Todas las Carreras</option>
                <optgroup label="Ingenierías">
                  {CARRERAS_INGENIERIAS.map(car => (
                    <option key={car} value={car}>{car}</option>
                  ))}
                </optgroup>
                <optgroup label="Técnicos Superiores">
                  {CARRERAS_TECNICOS.map(car => (
                    <option key={car} value={car}>{car}</option>
                  ))}
                </optgroup>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Quick Select */}
            <div className="relative">
              <select
                value={estado}
                onChange={e => { setEstado(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-9 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#094e8f] transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="Evaluado">Evaluados</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendientes</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Código</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Información del Proyecto</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Categoría</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Evaluaciones (Jurados)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? (
                paginated.map((p) => {
                  const cfg = estadoConfig[p.estado];
                  const avancePct = p.evaluacionesTotal > 0
                    ? (p.evaluacionesCompletadas / p.evaluacionesTotal) * 100
                    : 0;
                  return (
                    <tr key={p.id} className="group hover:bg-blue-50/20 transition-colors">
                      {/* Código */}
                      <td className="px-6 py-4.5 whitespace-nowrap align-middle">
                        <span className="inline-block text-xs font-bold font-mono bg-[#094e8f] text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs">
                          {p.codigo}
                        </span>
                      </td>

                      {/* Información */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="max-w-md">
                          <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-[#094e8f] transition-colors">
                            {p.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {p.carrera && (
                              <CarreraBadge carrera={p.carrera} size="xs" />
                            )}
                            {p.grupo && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">· {p.grupo}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-4.5 whitespace-nowrap align-middle">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#094e8f] text-xs font-bold rounded-lg border border-blue-200/60 shadow-2xs whitespace-nowrap">
                          {p.categoria}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-center align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.glow} animate-pulse`} />
                          {p.estado}
                        </span>
                      </td>

                      {/* Evaluaciones */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="flex flex-col items-center gap-1.5 min-w-[130px] max-w-[160px] mx-auto">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black text-slate-800">
                              {p.evaluacionesCompletadas}/{p.evaluacionesTotal} jurados
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 font-mono">{Math.round(avancePct)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.estado === 'Evaluado' ? 'bg-emerald-500' :
                                p.estado === 'En Proceso' ? 'bg-blue-600' : 'bg-amber-400'
                              }`}
                              style={{ width: `${avancePct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Layers className="w-7 h-7" />
                    </div>
                    <p className="text-slate-700 font-bold text-sm">No se encontraron proyectos</p>
                    <p className="text-slate-400 text-xs mt-1">Pruebe ajustando los filtros de categoría o carrera.</p>
                    {(search || estado || categoria || carrera) && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setEstado('');
                          setCategoria('');
                          setCarrera('');
                        }}
                        className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Restablecer Filtros
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500">
            Página <span className="font-bold text-slate-800">{page}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
            {' · '}Total <span className="font-bold text-slate-800">{filtered.length}</span> Proyectos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all border border-slate-200 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    n === page
                      ? 'bg-[#094e8f] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all border border-slate-200 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-[#162748] tracking-tight">Progreso General de Calificación</h3>
              <div className="flex items-center gap-1.5 text-[#094e8f] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                En tiempo real
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
              {stats.faltan > 0
                ? `Faltan ${stats.faltan} evaluaciones de jurados para completar la fase actual.`
                : 'Todas las evaluaciones programadas han sido completadas con éxito.'}
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between mb-2.5">
              <span className="text-3xl sm:text-4xl font-black text-[#162748]">
                {stats.progreso}<span className="text-xl text-slate-400 font-medium">%</span>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Meta: 100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progreso}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#094e8f] to-blue-500 shadow-[0_0_12px_rgba(9,78,143,0.3)]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Jury Card */}
        <div className="bg-gradient-to-br from-[#094e8f] to-[#162748] rounded-[2.5rem] p-6 sm:p-8 shadow-lg shadow-blue-900/10 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#f0d114]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold leading-tight mb-2">Jurados Evaluadores</h3>
            <p className="text-blue-100/80 text-xs font-medium leading-relaxed">
              Cada proyecto cuenta con docentes jurados asignados. El estado se actualiza automáticamente a &quot;Evaluado&quot; una vez que todos los jurados confirman sus notas.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            className="relative z-10 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider mt-6 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RefreshCw className="w-4 h-4 text-[#f0d114]" />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
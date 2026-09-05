'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Award,
  Clock,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchEvaluacionesDetalle, type EvaluacionDetalle } from '@/lib/db';
import { CATEGORIAS, getCarreraConfig } from '@/lib/constants';
import HelpBanner from '@/components/HelpBanner';

const CRITERIOS_DOC = [
  { key: 'doc_ind1', num: 'D1', label: 'Originalidad e Innovación', sub: 'Existe innovación del trabajo' },
  { key: 'doc_ind2', num: 'D2', label: 'Revisión Bibliográfica', sub: 'Contrasta y argumenta con fuentes' },
  { key: 'doc_ind3', num: 'D3', label: 'Enfoque Científico / Metodología', sub: 'Aporte metodológico y científico' },
  { key: 'doc_ind4', num: 'D4', label: 'Solución del Problema', sub: 'Aporte específico a la problemática' },
  { key: 'doc_ind5', num: 'D5', label: 'Coherencia de Objetivos', sub: 'Coherencia con resultados obtenidos' },
  { key: 'doc_ind6', num: 'D6', label: 'Orientación a Futuros Estudios', sub: 'Generación de nuevas líneas de estudio' },
  { key: 'doc_ind7', num: 'D7', label: 'Estructura y Redacción', sub: 'Calidad formal del documento' },
];

const CRITERIOS_EXP = [
  { key: 'exp_ind1', num: 'E1', label: 'Objetivos y Resultados', sub: 'Coherencia en la presentación' },
  { key: 'exp_ind2', num: 'E2', label: 'Aplicaciones Prácticas', sub: 'Sugerencias de aplicación directa' },
  { key: 'exp_ind3', num: 'E3', label: 'Montaje de Stand y Apoyos', sub: 'Utilización de recursos y maquetas' },
  { key: 'exp_ind4', num: 'E4', label: 'Lenguaje Técnico-Científico', sub: 'Precisión técnica y vocabulario' },
  { key: 'exp_ind5', num: 'E5', label: 'Calidad de Exposición', sub: 'Fluidez y apoyos audiovisuales' },
  { key: 'exp_ind6', num: 'E6', label: 'Dominio del Tema', sub: 'Seguridad y solidez en la defensa' },
  { key: 'exp_ind7', num: 'E7', label: 'Calidad de Respuestas', sub: 'Claridad ante preguntas del jurado' },
];

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'confirmadas' | 'pendientes'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchEvaluacionesDetalle();
      setEvaluaciones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return evaluaciones.filter(e => {
      const matchSearch =
        e.proyectoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.proyectoCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.proyectoCarrera && e.proyectoCarrera.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'confirmadas' && e.confirmada) ||
        (filtroEstado === 'pendientes' && !e.confirmada);
      const matchCat =
        filtroCategoria === 'todas' ||
        e.proyectoCategoria === filtroCategoria;
      return matchSearch && matchEstado && matchCat;
    });
  }, [evaluaciones, searchTerm, filtroEstado, filtroCategoria]);

  const stats = useMemo(() => {
    const total = evaluaciones.length;
    const confirmadas = evaluaciones.filter(e => e.confirmada).length;
    const pendientes = evaluaciones.filter(e => !e.confirmada).length;
    const conNota = evaluaciones.filter(e => e.confirmada && e.notaFinal > 0);
    const promedio = conNota.length > 0
      ? conNota.reduce((sum, e) => sum + e.notaFinal, 0) / conNota.length
      : 0;
    const pctConfirmadas = total > 0 ? Math.round((confirmadas / total) * 100) : 0;

    return { total, confirmadas, pendientes, promedio, pctConfirmadas };
  }, [evaluaciones]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#094e8f] border border-blue-100">
              Control de Jurados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">Evaluaciones</h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
            Notas, observaciones y desglose de evaluación por jurado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Recargar evaluaciones"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#094e8f] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="evaluaciones"
        title="Guía del Módulo: Historial de Evaluaciones"
        description="Examine el desglose de las calificaciones enviadas por cada docente. Expanda cualquier fila para revisar los puntajes individuales asignados a los criterios de los bloques (Bloque 1: Documentación y Bloque 2: Exposición de stand) y leer las observaciones/comentarios detallados de los jurados."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200/70 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Asignadas</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#094e8f] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">{stats.total}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Evaluaciones registradas</p>
        </div>

        {/* Confirmadas */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200/70 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Confirmadas</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{stats.confirmadas}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.pctConfirmadas}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{stats.pctConfirmadas}%</span>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200/70 shadow-xs hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Pendientes</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight">{stats.pendientes}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">En espera de calificación</p>
        </div>

        {/* Promedio General */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200/70 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">Promedio Gral.</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">
              {stats.promedio > 0 ? stats.promedio.toFixed(2) : '—'}
            </p>
            {stats.promedio > 0 && <span className="text-xs font-bold text-slate-400">/ 100</span>}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Calificaciones enviadas</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/70 shadow-xs overflow-hidden">
        {/* Search and Filters Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por proyecto, código, docente o carrera..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094e8f] focus:ring-2 focus:ring-[#094e8f]/10 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category and Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px]">
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                className="w-full appearance-none pl-4 pr-9 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#094e8f] transition-all shadow-2xs cursor-pointer"
              >
                <option value="todas">Todas las Categorías</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Pills */}
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === 'todos'
                    ? 'bg-[#094e8f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({evaluaciones.length})
              </button>
              <button
                onClick={() => setFiltroEstado('confirmadas')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroEstado === 'confirmadas'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${filtroEstado === 'confirmadas' ? 'bg-white' : 'bg-emerald-500'}`} />
                Confirmadas ({stats.confirmadas})
              </button>
              <button
                onClick={() => setFiltroEstado('pendientes')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroEstado === 'pendientes'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${filtroEstado === 'pendientes' ? 'bg-white' : 'bg-amber-500'}`} />
                Pendientes ({stats.pendientes})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Proyecto</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Jurado Evaluador</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">Bloque 1 (Doc)</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">Bloque 2 (Exp)</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">Nota Final</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">Desglose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-[#094e8f] animate-spin mx-auto mb-3" />
                    <p className="text-slate-600 font-bold text-sm">Cargando evaluaciones...</p>
                    <p className="text-slate-400 font-medium text-xs mt-0.5">Obteniendo datos de jurados y puntajes</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-3.5 text-slate-400">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    <p className="text-slate-700 font-black text-base">No se encontraron evaluaciones</p>
                    <p className="text-slate-400 font-medium text-xs mt-1 max-w-sm mx-auto">
                      {searchTerm || filtroEstado !== 'todos' || filtroCategoria !== 'todas'
                        ? 'Intente modificar los filtros o el término de búsqueda.'
                        : 'Aún no se han generado evaluaciones o asignaciones de jurados.'}
                    </p>
                    {(searchTerm || filtroEstado !== 'todos' || filtroCategoria !== 'todas') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFiltroEstado('todos');
                          setFiltroCategoria('todas');
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Restablecer Filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(e => {
                  const isExpanded = expandedId === e.idEvaluacion;
                  const carreraCfg = getCarreraConfig(e.proyectoCarrera);

                  return (
                    <Fragment key={e.idEvaluacion}>
                      <tr
                        className={`group transition-colors ${
                          isExpanded ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Proyecto */}
                        <td className="px-6 py-4.5 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-block text-xs font-bold font-mono bg-[#094e8f] text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs">
                              {e.proyectoCodigo}
                            </span>
                            <p className="text-sm font-bold text-slate-800 leading-snug max-w-[260px] line-clamp-2">
                              {e.proyectoNombre}
                            </p>
                            {e.proyectoCarrera && (
                              <span
                                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap"
                                style={{
                                  backgroundColor: carreraCfg.bg,
                                  color: carreraCfg.text,
                                  borderColor: carreraCfg.border,
                                }}
                              >
                                {e.proyectoCarrera}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Jurado */}
                        <td className="px-6 py-4.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-[#094e8f] flex items-center justify-center font-black text-xs shrink-0">
                              {e.docenteNombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{e.docenteNombre}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{e.docenteMateria}</p>
                            </div>
                          </div>
                        </td>

                        {/* Bloque 1 */}
                        <td className="px-6 py-4.5 text-center align-middle">
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-slate-800">
                                {e.confirmada ? e.bloque1Total.toFixed(2) : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">/ 30</span>
                            </div>
                            {e.confirmada && (
                              <div className="w-16 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${Math.min(100, (e.bloque1Total / 30) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Bloque 2 */}
                        <td className="px-6 py-4.5 text-center align-middle">
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-slate-800">
                                {e.confirmada ? e.bloque2Total.toFixed(2) : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">/ 70</span>
                            </div>
                            {e.confirmada && (
                              <div className="w-16 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${Math.min(100, (e.bloque2Total / 70) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Nota Final */}
                        <td className="px-6 py-4.5 text-center align-middle">
                          {e.confirmada && e.notaFinal > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[#162748] font-black text-base tracking-tight shadow-2xs">
                              {e.notaFinal.toFixed(2)}
                              <span className="text-[10px] font-bold text-slate-400 ml-1">pts</span>
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-slate-300">—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4.5 text-center align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              e.confirmada
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            }`}
                          >
                            {e.confirmada ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            {e.confirmada ? 'Confirmada' : 'Pendiente'}
                          </span>
                        </td>

                        {/* Detalle Toggle */}
                        <td className="px-6 py-4.5 text-center align-middle">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : e.idEvaluacion)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-[#094e8f] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            <span>{isExpanded ? 'Cerrar' : 'Criterios'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Criteria Breakdown */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${e.idEvaluacion}-detail`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50/70"
                          >
                            <td colSpan={7} className="px-6 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Bloque 1: Documentación */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#094e8f] flex items-center justify-center font-black text-xs">
                                        B1
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-slate-800">Bloque 1: Documento / Proyecto</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Revisión formal y metodológica</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                                        Subtotal: {e.bloque1Total.toFixed(2)} / 30 pts
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {CRITERIOS_DOC.map(c => {
                                      const val = (e as unknown as Record<string, number>)[c.key] ?? 0;
                                      return (
                                        <div
                                          key={c.key}
                                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors"
                                        >
                                          <div>
                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                              <span className="text-[10px] font-mono font-black text-[#094e8f] bg-blue-50 px-1.5 py-0.5 rounded">
                                                {c.num}
                                              </span>
                                              {c.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium ml-6">{c.sub}</p>
                                          </div>
                                          <div className="text-right pl-3">
                                            <span className="text-xs font-black text-[#162748] px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                                              {val} pts
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Bloque 2: Exposición + Observaciones */}
                                <div className="space-y-4">
                                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#094e8f] flex items-center justify-center font-black text-xs">
                                          B2
                                        </div>
                                        <div>
                                          <p className="text-xs font-black text-slate-800">Bloque 2: Exposición en Stand</p>
                                          <p className="text-[10px] text-slate-400 font-medium">Defensa y calidad de recursos</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-black text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                                          Subtotal: {e.bloque2Total.toFixed(2)} / 70 pts
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      {CRITERIOS_EXP.map(c => {
                                        const val = (e as unknown as Record<string, number>)[c.key] ?? 0;
                                        return (
                                          <div
                                            key={c.key}
                                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors"
                                          >
                                            <div>
                                              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono font-black text-[#094e8f] bg-blue-50 px-1.5 py-0.5 rounded">
                                                  {c.num}
                                                </span>
                                                {c.label}
                                              </p>
                                              <p className="text-[10px] text-slate-400 font-medium ml-6">{c.sub}</p>
                                            </div>
                                            <div className="text-right pl-3">
                                              <span className="text-xs font-black text-[#162748] px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                                                {val} pts
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Observaciones */}
                                  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-[#094e8f]" />
                                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                        Observaciones del Jurado
                                      </p>
                                    </div>
                                    {e.observaciones ? (
                                      <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        &ldquo;{e.observaciones}&rdquo;
                                      </p>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">
                                        Sin observaciones adicionales registradas por el jurado.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              Mostrando <span className="font-bold text-slate-800">{filtered.length}</span> de{' '}
              <span className="font-bold text-slate-800">{evaluaciones.length}</span> evaluaciones totales
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {stats.confirmadas} Calificadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {stats.pendientes} Pendientes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 right-8 p-5 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border ${
              message.type === 'success'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p className="text-sm font-bold">{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect, Fragment } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchEvaluacionesDetalle, type EvaluacionDetalle } from '@/lib/db';
import HelpBanner from '@/components/HelpBanner';

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'confirmadas' | 'pendientes'>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await fetchEvaluacionesDetalle();
    setEvaluaciones(data);
    setLoading(false);
  }

  const filtered = evaluaciones.filter(e => {
    const matchSearch =
      e.proyectoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.proyectoCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'confirmadas' && e.confirmada) ||
      (filtroEstado === 'pendientes' && !e.confirmada);
    return matchSearch && matchEstado;
  });

  const stats = {
    total: evaluaciones.length,
    confirmadas: evaluaciones.filter(e => e.confirmada).length,
    pendientes: evaluaciones.filter(e => !e.confirmada).length,
    promedio: evaluaciones.filter(e => e.confirmada && e.notaFinal > 0).length > 0
      ? evaluaciones
          .filter(e => e.confirmada && e.notaFinal > 0)
          .reduce((sum, e) => sum + e.notaFinal, 0) /
        evaluaciones.filter(e => e.confirmada && e.notaFinal > 0).length
      : 0,
  };



  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#162748] tracking-tight">Evaluaciones</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Notas, observaciones y resumen de evaluación por jurado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="evaluaciones"
        title="Guía del Módulo: Historial de Evaluaciones"
        description="Examine el desglose de las calificaciones enviadas por cada docente. Expanda cualquier fila para revisar los puntajes individuales asignados a los criterios de los bloques (Bloque 1: Documentación y Bloque 2: Exposición de stand) y leer las observaciones/comentarios detallados de los jurados."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total</p>
          <p className="text-3xl font-black text-[#162748]">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmadas</p>
          <p className="text-3xl font-black text-emerald-600">{stats.confirmadas}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendientes</p>
          <p className="text-3xl font-black text-amber-500">{stats.pendientes}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Promedio Gral.</p>
          <p className="text-3xl font-black text-[#162748]">
            {stats.promedio > 0 ? stats.promedio.toFixed(2) : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row items-center gap-3 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por proyecto, código o docente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600/30 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['todos', 'confirmadas', 'pendientes'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filtroEstado === f
                    ? 'bg-[#162748] text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'confirmadas' ? 'Confirmadas' : 'Pendientes'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Jurado</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 1</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque 2</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota Final</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">Cargando evaluaciones...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">No se encontraron evaluaciones.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(e => (
                  <Fragment key={e.idEvaluacion}>
                    <tr
                      key={e.idEvaluacion}
                      className="group hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-block text-[10px] font-black bg-[#162748] text-white px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                          {e.proyectoCodigo}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-snug max-w-[220px] truncate">
                          {e.proyectoNombre}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-800">{e.docenteNombre}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{e.docenteMateria}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-slate-700">{e.bloque1Total.toFixed(2)}</span>
                        <p className="text-[10px] text-slate-400 font-medium">/ 30</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-slate-700">{e.bloque2Total.toFixed(2)}</span>
                        <p className="text-[10px] text-slate-400 font-medium">/ 70</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xl font-black text-[#162748]">
                          {e.notaFinal > 0 ? e.notaFinal.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          e.confirmada
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {e.confirmada ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {e.confirmada ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setExpandedId(expandedId === e.idEvaluacion ? null : e.idEvaluacion)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                        >
                          {expandedId === e.idEvaluacion
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedId === e.idEvaluacion && (
                        <motion.tr
                          key={`${e.idEvaluacion}-detail`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={7} className="px-6 pb-5 bg-slate-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                              {/* Indicadores Bloque 1 */}
                              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                  Bloque 1 — Documento / Proyecto
                                </p>
                                <div className="space-y-1.5">
                                  {([1,2,3,4,5,6,7] as const).map(i => (
                                    <div key={i} className="flex items-center justify-between">
                                      <p className="text-xs text-slate-500 font-medium">Indicador D{i}</p>
                                      <span className="text-xs font-black text-[#162748]">
                                        {(e as unknown as Record<string, number>)[`doc_ind${i}`] ?? 0}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between">
                                    <p className="text-xs font-black text-slate-700">Subtotal B1</p>
                                    <span className="text-sm font-black text-emerald-600">{e.bloque1Total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Indicadores Bloque 2 + Observaciones */}
                              <div className="space-y-3">
                                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Bloque 2 — Exposición
                                  </p>
                                  <div className="space-y-1.5">
                                    {([1,2,3,4,5,6,7] as const).map(i => (
                                      <div key={i} className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 font-medium">Indicador E{i}</p>
                                        <span className="text-xs font-black text-[#162748]">
                                          {(e as unknown as Record<string, number>)[`exp_ind${i}`] ?? 0}
                                        </span>
                                      </div>
                                    ))}
                                    <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between">
                                      <p className="text-xs font-black text-slate-700">Subtotal B2</p>
                                      <span className="text-sm font-black text-emerald-600">{e.bloque2Total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {e.observaciones ? (
                                  <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</p>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{e.observaciones}</p>
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-center">
                                    <p className="text-xs text-slate-400 font-medium">Sin observaciones registradas.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30">
            <p className="text-xs text-slate-400 font-medium">
              Mostrando {filtered.length} de {evaluaciones.length} evaluaciones
            </p>
          </div>
        )}
      </div>

      {/* Notification */}
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

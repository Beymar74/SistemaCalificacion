'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  MessageSquare,
  CheckCircle2,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { fetchComputoProyectos, sincronizarTodosLosResultados, type ProyectoComputo } from '@/lib/db';
import {
  CATEGORIAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

export default function ComputoPage() {
  const [proyectos, setProyectos] = useState<ProyectoComputo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterCarrera, setFilterCarrera] = useState('all');

  const cargarDatos = async () => {
    setLoading(true);
    const data = await fetchComputoProyectos();
    setProyectos(data);
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    await sincronizarTodosLosResultados();
    await cargarDatos();
    setSyncing(false);
    setMessage({ text: 'Cómputo sincronizado correctamente.', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredProyectos = useMemo(() => {
    return proyectos.filter(p => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.carrera || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = filterCategoria === 'all' || (p.categoria || 'Categoría 1') === filterCategoria;
      const matchesCar = filterCarrera === 'all' || (p.carrera || '') === filterCarrera;
      return matchesSearch && matchesCat && matchesCar;
    });
  }, [proyectos, searchTerm, filterCategoria, filterCarrera]);

  const evaluados = filteredProyectos.filter(p => p.evaluacionesConfirmadas >= 3);
  const enProceso = filteredProyectos.filter(p => p.evaluacionesConfirmadas > 0 && p.evaluacionesConfirmadas < 3);
  const pendientes = filteredProyectos.filter(p => p.evaluacionesConfirmadas === 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Calculando cómputo...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Calculator className="w-4 h-4" />
            <span>Cómputo de Evaluaciones</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">Cómputo General</h1>
          <p className="text-slate-500 font-medium mt-1">
            Detalle completo de evaluaciones, notas y observaciones por proyecto, categoría y carrera.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            syncing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#162748] text-white hover:bg-blue-600 shadow-blue-900/10'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Cómputo'}
        </button>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="computo"
        title="Guía de Auditoría: Cómputo de Calificaciones"
        description="Revise la distribución de notas finales y promedios detallados para auditar el proceso de calificación. Filtre por Categoría y Carrera para evaluar el avance específico en cada área."
      />

      {/* Filtros */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros de Búsqueda y Segmentación</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoría</label>
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition-all"
            >
              <option value="all">Todas las Categorías</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Carrera</label>
            <select
              value={filterCarrera}
              onChange={e => setFilterCarrera(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition-all"
            >
              <option value="all">Todas las Carreras</option>
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
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Completados</span>
          </div>
          <p className="text-3xl font-black text-emerald-700">{evaluados.length}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">proyectos con 3/3 evaluaciones</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">En Proceso</span>
          </div>
          <p className="text-3xl font-black text-amber-700">{enProceso.length}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">proyectos con evaluaciones parciales</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendientes</span>
          </div>
          <p className="text-3xl font-black text-slate-600">{pendientes.length}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">proyectos sin evaluaciones</p>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-3">
        {filteredProyectos.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
            <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No hay proyectos para los filtros seleccionados.</p>
            <p className="text-slate-300 text-sm mt-1">Ajuste los filtros o presione &quot;Sincronizar Cómputo&quot;.</p>
          </div>
        ) : filteredProyectos.map((p, idx) => {
          const isExpanded = expandedId === p.id;
          const statusColor = p.evaluacionesConfirmadas >= 3
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : p.evaluacionesConfirmadas > 0
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-slate-50 text-slate-500 border-slate-100';

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
              >
                {/* Ranking badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  p.ranking === 1 ? 'bg-amber-100 text-amber-600' :
                  p.ranking === 2 ? 'bg-slate-100 text-slate-600' :
                  p.ranking === 3 ? 'bg-orange-100 text-orange-600' :
                  p.ranking > 0 ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-300'
                }`}>
                  {p.ranking > 0 ? `#${p.ranking}` : '—'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{p.codigo}</span>
                    <p className="text-sm font-bold text-slate-800 truncate">{p.nombre}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {p.categoria || 'Categoría 1'}
                    </span>
                    {p.carrera && (
                      <CarreraBadge carrera={p.carrera} size="xs" />
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluaciones</p>
                    <p className="text-lg font-black text-[#162748]">{p.evaluacionesConfirmadas}/3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio</p>
                    <p className="text-2xl font-black text-blue-600">{p.promedio > 0 ? p.promedio.toFixed(2) : '—'}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                    {p.evaluacionesConfirmadas >= 3 ? 'Completo' : p.evaluacionesConfirmadas > 0 ? `${p.evaluacionesConfirmadas}/3` : 'Pendiente'}
                  </span>
                </div>

                <div className="flex-shrink-0 text-slate-300">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-50 overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {p.evaluadores.length === 0 ? (
                        <p className="text-slate-400 text-sm font-medium text-center py-4">
                          Sin evaluaciones registradas aún.
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {p.evaluadores.map((ev, i) => (
                              <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-black text-slate-700">{ev.docente}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Jurado {i + 1}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Nota</p>
                                    <p className="text-2xl font-black text-[#162748]">{ev.nota.toFixed(2)}</p>
                                  </div>
                                </div>
                                {ev.observaciones && (
                                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="w-3 h-3 text-slate-400" />
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{ev.observaciones}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="bg-[#162748] rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Award className="w-5 h-5 text-blue-300" />
                              <span className="text-sm font-black text-white uppercase tracking-widest">Promedio Final</span>
                            </div>
                            <span className="text-3xl font-black text-white">{p.promedio > 0 ? p.promedio.toFixed(2) : '—'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] border ${
              message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest mb-1">Notificación</p>
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Award, Medal, RefreshCw, Trophy, MessageSquare, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import HelpBanner from '@/components/HelpBanner';
import { fetchResultadosTop, fetchDetalleConObservaciones } from '@/lib/db';
import type { ResultadoTop } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CATEGORIAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
  getCarreraConfig,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

const YEAR = new Date().getFullYear();

interface ResultadoConPosicion extends ResultadoTop {
  posicionRelativa: number;
}

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoTop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [detalles, setDetalles] = useState<Record<string, Awaited<ReturnType<typeof fetchDetalleConObservaciones>>>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<string | null>(null);

  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('all');

  const cargarDatos = () => {
    setLoading(true);
    setError('');
    fetchResultadosTop(100)
      .then(setResultados)
      .catch(() => setError('No se pudo cargar los resultados.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredResultados: ResultadoConPosicion[] = useMemo(() => {
    const list = resultados.filter(r => {
      if (selectedCategoria !== 'all' && r.categoria !== selectedCategoria) return false;
      if (selectedCarrera !== 'all' && (r.carrera || '') !== selectedCarrera) return false;
      return true;
    });

    return list.map((item, index) => ({
      ...item,
      posicionRelativa: index + 1,
    }));
  }, [resultados, selectedCategoria, selectedCarrera]);

  const handleToggleDetalle = async (r: ResultadoConPosicion) => {
    const key = r.id || r.posicionRelativa.toString();
    if (expandedId === key) {
      setExpandedId(null);
      return;
    }
    setExpandedId(key);
    if (!detalles[key]) {
      setLoadingDetalle(key);
      const data = await fetchDetalleConObservaciones(r.id || '');
      setDetalles(prev => ({ ...prev, [key]: data }));
      setLoadingDetalle(null);
    }
  };

  if (loading) return (
    <div className="p-8 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#162748]/20 border-t-[#162748] rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Calculando resultados...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-rose-500 font-bold">{error}</p>
        <button onClick={cargarDatos} className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  );

  const top3 = filteredResultados.filter(r => r.posicionRelativa <= 3);
  const honor = filteredResultados.filter(r => r.posicionRelativa > 3);
  const podium = [
    top3.find(r => r.posicionRelativa === 2),
    top3.find(r => r.posicionRelativa === 1),
    top3.find(r => r.posicionRelativa === 3),
  ].filter(Boolean) as ResultadoConPosicion[];

  return (
    <div className="p-8 bg-white min-h-screen space-y-8 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 shadow-sm uppercase tracking-widest">
          <Award className="w-3.5 h-3.5" />
          GALA DE PREMIACIÓN UICYT {YEAR}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={cargarDatos} className="flex items-center gap-2 border border-slate-300 bg-white text-slate-600 text-sm px-4 py-2 rounded-xl hover:bg-slate-50 shadow-sm font-bold">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-[#162748]">Resultados y Rankings Dinámicos</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
          Filtre por categoría, carrera o combinación de ambas para visualizar la tabla de posiciones y podio recalculado en tiempo real.
        </p>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="resultados"
        title="Guía del Módulo: Clasificación Dinámica y Podio"
        description="Consulte las posiciones finales y el podio de los ganadores. Seleccione una Categoría y/o Carrera para calcular el ranking relativo de los participantes en ese segmento."
      />

      {/* Filtros Dinámicos */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros de Ranking</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Filtrar por Categoría
            </label>
            <select
              value={selectedCategoria}
              onChange={e => setSelectedCategoria(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 shadow-sm transition-all"
            >
              <option value="all">Todas las Categorías (General)</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Filtrar por Carrera
            </label>
            <select
              value={selectedCarrera}
              onChange={e => setSelectedCarrera(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 shadow-sm transition-all"
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

        {(selectedCategoria !== 'all' || selectedCarrera !== 'all') && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filtros activos:</span>
              {selectedCategoria !== 'all' && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                  {selectedCategoria}
                </span>
              )}
              {selectedCarrera !== 'all' && (
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                  {selectedCarrera}
                </span>
              )}
            </div>
            <button
              onClick={() => { setSelectedCategoria('all'); setSelectedCarrera('all'); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {filteredResultados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Trophy className="w-14 h-14 text-slate-200" />
          <h2 className="text-lg font-bold text-slate-700">No hay proyectos para los filtros seleccionados</h2>
          <p className="text-slate-400 text-xs max-w-sm">Pruebe cambiando o restableciendo los filtros de categoría y carrera.</p>
        </div>
      ) : (
        <>
          {/* Podio */}
          {podium.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Podio — Top 3
                {selectedCategoria !== 'all' && <span className="text-blue-600">· {selectedCategoria}</span>}
                {selectedCarrera !== 'all' && <span className="text-indigo-600">· {selectedCarrera}</span>}
              </h2>
              <div className="flex items-end justify-center gap-4 flex-wrap">
                {podium.map(r => {
                  const isFirst = r.posicionRelativa === 1;
                  return (
                    <div
                      key={r.id || r.posicionRelativa}
                      className={`relative rounded-[2.5rem] p-6 text-center transition-all duration-300 ${
                        isFirst ? 'bg-[#094e8f] text-white w-72 py-9 shadow-2xl shadow-blue-900/30 z-10' : 'bg-white text-slate-800 w-56 border border-slate-200/80 shadow-sm'
                      }`}
                    >
                      <div 
                        className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black shadow-md"
                        style={{
                          backgroundColor: isFirst ? '#f0d114' : '#FFFFFF',
                          color: isFirst ? '#094e8f' : '#64748B',
                          borderColor: isFirst ? '#FFFFFF' : '#E2E8F0',
                        }}
                      >
                        {r.posicionRelativa}
                      </div>
                      <Medal className="w-9 h-9 mx-auto mb-3 mt-1" style={{ color: isFirst ? '#f0d114' : '#94A3B8' }} />
                      <h3 className={`text-sm font-bold mb-1.5 leading-snug ${isFirst ? 'text-white' : 'text-slate-800'}`}>
                        {r.nombre.length > 38 ? r.nombre.slice(0, 38) + '...' : r.nombre}
                      </h3>
                      {r.carrera && (
                        <div className="mb-2 flex justify-center">
                          <CarreraBadge carrera={r.carrera} size="xs" />
                        </div>
                      )}
                      {r.categoria && (
                        <span 
                          className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 border ${
                            isFirst ? 'bg-white/15 text-white border-white/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {r.categoria}
                        </span>
                      )}
                      {isFirst && <p className="text-xs text-[#f0d114] font-black uppercase tracking-wider mb-1">★ 1ER LUGAR ★</p>}
                      <p className={`text-4xl font-black mb-1 ${isFirst ? 'text-white' : 'text-[#094e8f]'}`}>
                        {r.puntajeFinal.toFixed(2)}
                      </p>
                      <p className={`text-xs ${isFirst ? 'text-blue-100' : 'text-slate-500'}`}>
                        {r.evaluaciones > 0 ? `${r.evaluaciones} evaluaciones` : '3 evaluaciones'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cuadro de Honor */}
          {honor.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  Cuadro de Honor
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Posiciones {top3.length + 1}–{filteredResultados.length}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {honor.map(r => {
                  const key = r.id || r.posicionRelativa.toString();
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => handleToggleDetalle(r)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                          {r.posicionRelativa}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{r.nombre}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {r.categoria && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {r.categoria}
                              </span>
                            )}
                            {r.carrera && (
                              <CarreraBadge carrera={r.carrera} size="xs" />
                            )}
                            <span className="text-xs text-slate-400 font-medium">· {r.puntajeFinal.toFixed(2)} pts</span>
                          </div>
                        </div>
                        {expandedId === key ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </button>

                      <AnimatePresence>
                        {expandedId === key && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {loadingDetalle === key ? (
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando detalle...
                                </div>
                              ) : detalles[key]?.length === 0 ? (
                                <p className="text-slate-400 text-xs">Sin evaluaciones registradas.</p>
                              ) : (
                                detalles[key]?.map((d, i) => (
                                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-black text-slate-700">{d.docente}</p>
                                      <span className="text-sm font-black text-[#162748]">{d.puntaje?.toFixed(2) ?? '—'}</span>
                                    </div>
                                    {d.observaciones && (
                                      <div className="flex items-start gap-1.5 mt-2">
                                        <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-slate-500 leading-relaxed">{d.observaciones}</p>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tabla completa */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-700">Tabla Completa de Posiciones</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto / Carrera</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Evals</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResultados.map(r => {
                    const key = r.id || r.posicionRelativa.toString();
                    return (
                      <Fragment key={key}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                              r.posicionRelativa === 1 ? 'bg-amber-100 text-amber-600' :
                              r.posicionRelativa === 2 ? 'bg-slate-100 text-slate-600' :
                              r.posicionRelativa === 3 ? 'bg-orange-100 text-orange-600' :
                              'bg-slate-50 text-slate-400'
                            }`}>
                              {r.posicionRelativa}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">{r.nombre}</p>
                            {r.carrera && (
                              <div className="mt-1">
                                <CarreraBadge carrera={r.carrera} size="xs" />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                              {r.categoria}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`text-xs font-black ${r.evaluaciones >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {r.evaluaciones}/3
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-lg font-black text-[#162748]">{r.puntajeFinal.toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => handleToggleDetalle(r)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                            >
                              {expandedId === key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedId === key && (
                            <motion.tr
                              key={`${key}-detail`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td colSpan={6} className="px-5 pb-4 bg-slate-50/50">
                                {loadingDetalle === key ? (
                                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando...
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                    {detalles[key]?.map((d, i) => (
                                      <div key={i} className="bg-white rounded-xl p-3 border border-slate-100">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-xs font-black text-slate-700">{d.docente}</p>
                                          <span className="text-sm font-black text-[#162748]">{d.puntaje?.toFixed(2) ?? '—'}</span>
                                        </div>
                                        {d.observaciones && (
                                          <div className="flex items-start gap-1.5 mt-2">
                                            <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-[11px] text-slate-500 leading-relaxed">{d.observaciones}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

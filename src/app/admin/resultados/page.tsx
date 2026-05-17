'use client';

import { useState, useEffect, Fragment } from 'react';
import { Award, Medal, RefreshCw, Trophy, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import HelpBanner from '@/components/HelpBanner';
import { fetchResultadosTop, fetchDetalleConObservaciones } from '@/lib/db';
import type { ResultadoTop } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';

const YEAR = new Date().getFullYear();

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoTop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<Record<number, Awaited<ReturnType<typeof fetchDetalleConObservaciones>>>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<number | null>(null);

  const cargarDatos = () => {
    setLoading(true);
    setError('');
    fetchResultadosTop(20)
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

  const handleToggleDetalle = async (r: ResultadoTop) => {
    if (expandedId === r.posicion) {
      setExpandedId(null);
      return;
    }
    setExpandedId(r.posicion);
    if (!detalles[r.posicion]) {
      setLoadingDetalle(r.posicion);
      const data = await fetchDetalleConObservaciones(r.id || '');
      setDetalles(prev => ({ ...prev, [r.posicion]: data }));
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

  if (resultados.length === 0) return (
    <div className="p-8 min-h-screen">
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <Trophy className="w-16 h-16 text-slate-200" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">Aún no hay resultados</h2>
          <p className="text-slate-500 text-sm">Los resultados se calculan automáticamente al completar evaluaciones.</p>
          <button onClick={cargarDatos} className="mt-4 inline-flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>
    </div>
  );

  const top3 = resultados.filter(r => r.posicion <= 3);
  const honor = resultados.filter(r => r.posicion > 3);
  const podium = [
    top3.find(r => r.posicion === 2),
    top3.find(r => r.posicion === 1),
    top3.find(r => r.posicion === 3),
  ].filter(Boolean) as ResultadoTop[];

  return (
    <div className="p-8 bg-white min-h-screen space-y-10 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 shadow-sm uppercase tracking-widest">
          <Award className="w-3.5 h-3.5" />
          GALA DE PREMIACIÓN SCEITII {YEAR}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={cargarDatos} className="flex items-center gap-2 border border-slate-300 bg-white text-slate-600 text-sm px-4 py-2 rounded-xl hover:bg-slate-50 shadow-sm font-bold">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-[#162748]">Resultados Finales</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
          Clasificación final por puntaje promedio de {resultados.length} proyecto{resultados.length !== 1 ? 's' : ''} evaluados.
        </p>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="resultados"
        title="Guía del Módulo: Clasificación y Podio Final"
        description="Consulte las posiciones finales y el podio de los ganadores de la feria. Los puntajes se ponderan automáticamente de acuerdo con los pesos de la rúbrica activa. Expanda cada fila para verificar qué jurados evaluaron y qué observaciones registraron."
      />

      {/* Podio */}
      {podium.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Podio — Top 3
          </h2>
          <div className="flex items-end justify-center gap-4 flex-wrap">
            {podium.map(r => {
              const isFirst = r.posicion === 1;
              return (
                <div
                  key={r.posicion}
                  className={`relative rounded-[2rem] p-6 text-center ${
                    isFirst ? 'bg-[#162748] text-white w-72 py-8 shadow-2xl z-10' : 'bg-white text-slate-800 w-56 border border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    isFirst ? 'bg-[#162748] text-white border-white' : 'bg-white text-slate-700 border-slate-300'
                  }`}>
                    {r.posicion}
                  </div>
                  <Medal className={`w-8 h-8 mx-auto mb-3 mt-2 ${isFirst ? 'text-yellow-300' : 'text-slate-400'}`} />
                  <h3 className={`text-sm font-bold mb-2 leading-snug ${isFirst ? 'text-white' : 'text-slate-800'}`}>
                    {r.nombre.length > 38 ? r.nombre.slice(0, 38) + '...' : r.nombre}
                  </h3>
                  {isFirst && <p className="text-xs text-blue-300 font-black uppercase tracking-wider mb-1">Gran Ganador</p>}
                  <p className={`text-4xl font-black mb-1 ${isFirst ? 'text-white' : 'text-[#162748]'}`}>{r.puntajeFinal}</p>
                  <p className={`text-xs ${isFirst ? 'text-slate-300' : 'text-slate-500'}`}>
                    {r.evaluaciones > 0 ? `${r.evaluaciones} evaluaciones` : 'Sin evaluaciones confirmadas'}
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posiciones {top3.length + 1}–{resultados.length}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {honor.map(r => (
              <div key={r.posicion} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => handleToggleDetalle(r)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                    {r.posicion}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{r.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.puntajeFinal} pts · {r.evaluaciones} evals</p>
                  </div>
                  {expandedId === r.posicion ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                </button>

                <AnimatePresence>
                  {expandedId === r.posicion && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {loadingDetalle === r.posicion ? (
                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando detalle...
                          </div>
                        ) : detalles[r.posicion]?.length === 0 ? (
                          <p className="text-slate-400 text-xs">Sin evaluaciones registradas.</p>
                        ) : (
                          detalles[r.posicion]?.map((d, i) => (
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
            ))}
          </div>
        </section>
      )}

      {/* Tabla completa con observaciones */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-700">Tabla Completa</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Evals</th>
                <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultados.map(r => (
                <Fragment key={r.posicion}>
                  <tr key={r.posicion} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        r.posicion === 1 ? 'bg-amber-100 text-amber-600' :
                        r.posicion === 2 ? 'bg-slate-100 text-slate-600' :
                        r.posicion === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {r.posicion}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-800">{r.nombre}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-black ${r.evaluaciones >= 4 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.evaluaciones}/4
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-lg font-black text-[#162748]">{r.puntajeFinal}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleDetalle(r)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                      >
                        {expandedId === r.posicion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === r.posicion && (
                      <motion.tr
                        key={`${r.posicion}-detail`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="px-5 pb-4 bg-slate-50/50">
                          {loadingDetalle === r.posicion ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando...
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                              {detalles[r.posicion]?.map((d, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

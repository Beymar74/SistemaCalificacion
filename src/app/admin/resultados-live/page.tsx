'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Radio,
  RefreshCw,
  Trophy,
  Medal,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchResultadosLive, sincronizarTodosLosResultados, type ResultadoLive } from '@/lib/db';

const REFRESH_INTERVAL = 15000; // 15 segundos

export default function ResultadosLivePage() {
  const [resultados, setResultados] = useState<ResultadoLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarDatos = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const data = await fetchResultadosLive();
    setResultados(data);
    setLastUpdate(new Date());
    setCountdown(REFRESH_INTERVAL / 1000);
    if (showLoader) setLoading(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await sincronizarTodosLosResultados();
    await cargarDatos(false);
    setSyncing(false);
  };

  useEffect(() => {
    cargarDatos(true);

    intervalRef.current = setInterval(() => cargarDatos(false), REFRESH_INTERVAL);
    countdownRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const YEAR = new Date().getFullYear();

  const medalColors: Record<number, { bg: string; text: string; border: string; icon: string }> = {
    1: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🥇' },
    2: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '🥈' },
    3: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🥉' },
  };

  const top3 = resultados.filter(r => r.posicion <= 3);
  const resto = resultados.filter(r => r.posicion > 3);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-black uppercase tracking-[0.3em]">En Vivo</span>
              <Wifi className="w-4 h-4 text-green-400" />
            </div>
            <h1 className="text-4xl font-black text-[#162748] tracking-tight">
              Resultados en Tiempo Real
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              SCEITII · Feria de Innovación EMI {YEAR}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-center min-w-[120px] shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próx. actualización</p>
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: `${REFRESH_INTERVAL / 1000}s` }} />
                <span className="text-2xl font-black text-[#162748]">{countdown}s</span>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#162748] hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Recalcular'}
            </button>
          </div>
        </div>

        {lastUpdate && (
          <p className="text-slate-400 text-xs font-medium mb-6 text-right uppercase tracking-widest">
            Última actualización: {lastUpdate.toLocaleTimeString('es-BO')}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Cargando resultados...</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <Trophy className="w-16 h-16 text-slate-100" />
            <div>
              <p className="text-[#162748] font-bold text-xl mb-2">Sin resultados disponibles</p>
              <p className="text-slate-500 text-sm font-medium max-w-sm">
                Los resultados aparecerán aquí cuando los docentes completen sus evaluaciones. Presiona &quot;Recalcular&quot; para actualizar.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Podio Top 3 */}
            {top3.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Podio — Top 3
                </h2>
                <div className="flex items-end justify-center gap-4 flex-wrap">
                  {[
                    top3.find(r => r.posicion === 2),
                    top3.find(r => r.posicion === 1),
                    top3.find(r => r.posicion === 3),
                  ].filter(Boolean).map(r => {
                    if (!r) return null;
                    const isFirst = r.posicion === 1;
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-[2rem] p-6 text-center shadow-sm border ${
                          isFirst
                            ? 'bg-[#162748] text-white w-72 py-8 shadow-2xl shadow-blue-900/20 z-10 border-transparent'
                            : 'bg-white border-slate-100 w-56'
                        }`}
                      >
                        <div className="text-3xl mb-2">{medalColors[r.posicion]?.icon || `#${r.posicion}`}</div>
                        <h3 className={`text-sm font-bold mb-3 leading-snug ${isFirst ? 'text-white' : 'text-[#162748]'}`}>
                          {r.nombre.length > 40 ? r.nombre.slice(0, 40) + '...' : r.nombre}
                        </h3>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isFirst ? 'text-blue-200' : 'text-slate-400'}`}>
                          {r.codigo} · {r.categoria}
                        </p>
                        <p className={`text-4xl font-black mb-1 ${isFirst ? 'text-white' : 'text-[#162748]'}`}>
                          {r.promedio.toFixed(2)}
                        </p>
                        <p className={`text-xs ${isFirst ? 'text-blue-100' : 'text-slate-500'}`}>
                          {r.evaluacionesConfirmadas} evaluación{r.evaluacionesConfirmadas !== 1 ? 'es' : ''} confirmada{r.evaluacionesConfirmadas !== 1 ? 's' : ''}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabla completa */}
            {resultados.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Clasificación Completa — {resultados.length} proyecto{resultados.length !== 1 ? 's' : ''}
                </h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Evals</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="sync">
                          {resultados.map((r, idx) => (
                            <motion.tr
                              key={r.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`hover:bg-slate-50 transition-colors ${r.posicion <= 3 ? 'bg-blue-50/30' : ''}`}
                            >
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                  r.posicion === 1 ? 'bg-amber-100 text-amber-600' :
                                  r.posicion === 2 ? 'bg-slate-100 text-slate-500' :
                                  r.posicion === 3 ? 'bg-orange-100 text-orange-600' :
                                  'bg-slate-50 text-slate-400'
                                }`}>
                                  {r.posicion}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-800 leading-snug">{r.nombre}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{r.codigo}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                                  {r.categoria}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-sm font-black ${r.evaluacionesConfirmadas >= 4 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {r.evaluacionesConfirmadas}/4
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-2xl font-black text-[#162748]">{r.promedio.toFixed(2)}</span>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            SCEITII · Sistema de Calificación EMI Ingeniería Industrial · {YEAR}
          </p>
        </div>
      </div>
    </div>
  );
}

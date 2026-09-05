'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  RefreshCw,
  Trophy,
  Medal,
  TrendingUp,
  Wifi,
  Filter,
  Sparkles,
  Crown,
  Star,
  RotateCcw,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { fetchResultadosLive, sincronizarTodosLosResultados, type ResultadoLive } from '@/lib/db';
import {
  CATEGORIAS,
  CARRERAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
  CARRERA_CATEGORIA_MAP,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

const REFRESH_INTERVAL = 15000; // 15 segundos

interface ResultadoLiveConPosicion extends ResultadoLive {
  posicionRelativa: number;
}

export default function ResultadosLivePage() {
  const [resultados, setResultados] = useState<ResultadoLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('all');

  const cargarDatos = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await fetchResultadosLive();
      setResultados(data);
      setLastUpdate(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
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

  const availableCarreras = useMemo(() => {
    if (selectedCategoria === 'all') return CARRERAS;
    return CARRERAS.filter(c => CARRERA_CATEGORIA_MAP[c] === selectedCategoria);
  }, [selectedCategoria]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategoria(cat);
    if (cat !== 'all' && selectedCarrera !== 'all') {
      if (CARRERA_CATEGORIA_MAP[selectedCarrera] !== cat) {
        setSelectedCarrera('all');
      }
    }
  };

  const filteredResultados: ResultadoLiveConPosicion[] = useMemo(() => {
    const list = resultados.filter(r => {
      if (selectedCategoria !== 'all' && r.categoria !== selectedCategoria) return false;
      if (selectedCarrera !== 'all' && (r.carrera || '') !== selectedCarrera) return false;
      return true;
    });

    return list.map((item, idx) => ({
      ...item,
      posicionRelativa: idx + 1,
    }));
  }, [resultados, selectedCategoria, selectedCarrera]);

  const top3 = filteredResultados.filter(r => r.posicionRelativa <= 3);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Wifi className="w-3 h-3" /> Transmisión en Vivo · UICYT {YEAR}
              </span>
            </div>
            <h1 className="text-4xl font-black text-[#162748] tracking-tight">
              Resultados en Tiempo Real
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Unidad de Investigación Ciencia y Tecnología
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-center min-w-[130px] shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#094e8f] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto-Sync</p>
                <p className="text-lg font-black text-[#162748] leading-tight mt-0.5">{countdown}s</p>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#094e8f] hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Recalcular'}</span>
            </button>
          </div>
        </header>

        <HelpBanner
          storageKey="resultados-live"
          title="Guía de Visualización: Tabla de Posiciones en Vivo"
          description="Pantalla optimizada para proyección pública o monitoreo continuo en salas de espera. Se actualiza automáticamente cada 15 segundos con los últimos promedios consolidados. Use los selectores de categoría y carrera para filtrar la tabla y el podio en tiempo real."
        />

        <div className="bg-white border border-slate-100 rounded-[2.2rem] p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
              1. Filtrar por Categoría Oficial
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
                  selectedCategoria === 'all'
                    ? 'bg-[#094e8f] text-white shadow-md shadow-blue-900/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                Todas las Categorías
              </button>
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
                    selectedCategoria === cat
                      ? 'bg-[#094e8f] text-white shadow-md shadow-blue-900/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                2. Filtrar por Carrera
              </label>
              <select
                value={selectedCarrera}
                onChange={e => setSelectedCarrera(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f] focus:bg-white shadow-sm transition-all"
              >
                <option value="all">Todas las Carreras ({availableCarreras.length})</option>
                {selectedCategoria === 'all' ? (
                  <>
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
                  </>
                ) : (
                  availableCarreras.map(car => (
                    <option key={car} value={car}>{car}</option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado de Sincronización</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-700">En línea · Monitoreo activo</span>
                </div>
              </div>

              {(selectedCategoria !== 'all' || selectedCarrera !== 'all') && (
                <button
                  onClick={() => { setSelectedCategoria('all'); setSelectedCarrera('all'); }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-12 h-12 border-4 border-[#094e8f]/20 border-t-[#094e8f] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando resultados en tiempo real...</p>
          </div>
        ) : filteredResultados.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-black text-[#162748]">Sin resultados disponibles</h2>
            <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              No se encontraron proyectos con evaluaciones registradas para los filtros seleccionados. Presione &quot;Recalcular&quot; o restablezca los filtros.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={handleManualSync}
                className="inline-flex items-center gap-2 bg-[#094e8f] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-blue-800 shadow-md active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Recalcular Cómputo
              </button>
              <button
                onClick={() => { setSelectedCategoria('all'); setSelectedCarrera('all'); }}
                className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Ver Todos
              </button>
            </div>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f0d114]" />
                    <span>Podio Oficial en Vivo — Top 3</span>
                    {selectedCategoria !== 'all' && <span className="text-[#094e8f]">· {selectedCategoria}</span>}
                    {selectedCarrera !== 'all' && <span className="text-indigo-600">· {selectedCarrera}</span>}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {[
                    top3.find(r => r.posicionRelativa === 2),
                    top3.find(r => r.posicionRelativa === 1),
                    top3.find(r => r.posicionRelativa === 3),
                  ].filter(Boolean).map(r => {
                    if (!r) return null;
                    const isFirst = r.posicionRelativa === 1;
                    const isSecond = r.posicionRelativa === 2;

                    return (
                      <motion.div
                        key={r.id || r.posicionRelativa}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.2 }}
                        className={`relative rounded-[2.5rem] p-7 text-center transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                          isFirst
                            ? 'bg-gradient-to-b from-[#094e8f] to-[#073663] text-white py-10 shadow-2xl shadow-blue-900/40 border-2 border-[#f0d114]/40 md:order-2 md:-translate-y-2'
                            : isSecond
                            ? 'bg-white text-slate-800 border border-slate-200/80 shadow-md md:order-1'
                            : 'bg-white text-slate-800 border border-slate-200/80 shadow-md md:order-3'
                        }`}
                      >
                        <div 
                          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border-2 flex items-center gap-1.5 text-xs font-black shadow-lg ${
                            isFirst 
                              ? 'bg-[#f0d114] text-[#094e8f] border-white' 
                              : isSecond
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isFirst && <Crown className="w-3.5 h-3.5 text-[#094e8f]" />}
                          <span>{r.posicionRelativa}° LUGAR</span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <Medal 
                            className="w-10 h-10 mx-auto" 
                            style={{ 
                              color: isFirst ? '#f0d114' : isSecond ? '#94A3B8' : '#D97706' 
                            }} 
                          />
                          
                          <div>
                            <h3 className={`text-base font-black leading-snug line-clamp-2 ${isFirst ? 'text-white' : 'text-[#162748]'}`}>
                              {r.nombre}
                            </h3>
                          </div>

                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                              isFirst ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#094e8f]'
                            }`}>
                              {r.codigo}
                            </span>
                            {r.carrera && (
                              <CarreraBadge carrera={r.carrera} size="xs" />
                            )}
                          </div>

                          {r.categoria && (
                            <span 
                              className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                isFirst ? 'bg-white/15 text-white border-white/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {r.categoria}
                            </span>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                          {isFirst && (
                            <p className="text-[10px] text-[#f0d114] font-black uppercase tracking-widest mb-1">
                              ★ 1ER LUGAR EN VIVO ★
                            </p>
                          )}
                          <p className={`text-4xl font-black tracking-tight ${isFirst ? 'text-[#f0d114]' : 'text-[#094e8f]'}`}>
                            {r.promedio.toFixed(2)}
                          </p>
                          <p className={`text-[11px] font-semibold mt-0.5 ${isFirst ? 'text-blue-200' : 'text-slate-400'}`}>
                            {r.evaluacionesConfirmadas} evaluación{r.evaluacionesConfirmadas !== 1 ? 'es' : ''} confirmada{r.evaluacionesConfirmadas !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {filteredResultados.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#162748] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#094e8f]" />
                    <span>Tabla General en Vivo</span>
                    <span className="text-xs font-bold text-slate-400">({filteredResultados.length} proyectos)</span>
                  </h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrera</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Evals</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <AnimatePresence mode="sync">
                          {filteredResultados.map((r, idx) => (
                            <motion.tr
                              key={r.id || r.posicionRelativa}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className={`hover:bg-slate-50/80 transition-colors ${r.posicionRelativa <= 3 ? 'bg-blue-50/20' : ''}`}
                            >
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${
                                  r.posicionRelativa === 1 ? 'bg-[#f0d114] text-[#094e8f]' :
                                  r.posicionRelativa === 2 ? 'bg-slate-200 text-slate-700' :
                                  r.posicionRelativa === 3 ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-50 text-slate-500 border border-slate-200/60'
                                }`}>
                                  {r.posicionRelativa}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-black text-[#162748] leading-snug">{r.nombre}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-[#094e8f] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-bold font-mono uppercase">
                                    {r.codigo}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {r.carrera ? (
                                  <CarreraBadge carrera={r.carrera} size="xs" />
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200/60">
                                  {r.categoria}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                  r.evaluacionesConfirmadas >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {r.evaluacionesConfirmadas}/3
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xl font-black text-[#094e8f]">{r.promedio.toFixed(2)}</span>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <div className="pt-6 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            UICYT · Sistema Oficial de Calificaciones · Gestión {YEAR}
          </p>
        </div>
      </div>
    </div>
  );
}

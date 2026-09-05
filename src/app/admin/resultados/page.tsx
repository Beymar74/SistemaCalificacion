'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { 
  Award, 
  Medal, 
  RefreshCw, 
  Trophy, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Sparkles, 
  Radio, 
  Search, 
  Layers, 
  Crown, 
  Star,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import HelpBanner from '@/components/HelpBanner';
import LoadingScreen from '@/components/LoadingScreen';
import { fetchResultadosTop, fetchDetalleConObservaciones } from '@/lib/db';
import type { ResultadoTop } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CATEGORIAS,
  CARRERAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
  CARRERA_CATEGORIA_MAP,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

const YEAR = new Date().getFullYear();

interface ResultadoConPosicion extends ResultadoTop {
  posicionRelativa: number;
}

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoTop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [detalles, setDetalles]     = useState<Record<string, Awaited<ReturnType<typeof fetchDetalleConObservaciones>>>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<string | null>(null);

  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedCarrera, setSelectedCarrera]     = useState<string>('all');
  const [searchQuery, setSearchQuery]             = useState<string>('');

  const cargarDatos = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    fetchResultadosTop(100)
      .then(setResultados)
      .catch(() => setError('No se pudo cargar los resultados.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filter careers according to selected category
  const availableCarreras = useMemo(() => {
    if (selectedCategoria === 'all') return CARRERAS;
    return CARRERAS.filter(c => CARRERA_CATEGORIA_MAP[c] === selectedCategoria);
  }, [selectedCategoria]);

  // If selected category changes and career is no longer valid, reset career
  const handleCategorySelect = (cat: string) => {
    setSelectedCategoria(cat);
    if (cat !== 'all' && selectedCarrera !== 'all') {
      if (CARRERA_CATEGORIA_MAP[selectedCarrera] !== cat) {
        setSelectedCarrera('all');
      }
    }
  };

  const filteredResultados: ResultadoConPosicion[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = resultados.filter(r => {
      if (selectedCategoria !== 'all' && r.categoria !== selectedCategoria) return false;
      if (selectedCarrera !== 'all' && (r.carrera || '') !== selectedCarrera) return false;
      if (query) {
        const matchName = r.nombre.toLowerCase().includes(query);
        const matchCar = (r.carrera || '').toLowerCase().includes(query);
        const matchCat = (r.categoria || '').toLowerCase().includes(query);
        if (!matchName && !matchCar && !matchCat) return false;
      }
      return true;
    });

    return list.map((item, index) => ({
      ...item,
      posicionRelativa: index + 1,
    }));
  }, [resultados, selectedCategoria, selectedCarrera, searchQuery]);

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

  // Stats computed from filtered results
  const stats = useMemo(() => {
    const total = filteredResultados.length;
    const maxScore = total > 0 ? Math.max(...filteredResultados.map(r => r.puntajeFinal)) : 0;
    const avgScore = total > 0 
      ? filteredResultados.reduce((acc, r) => acc + r.puntajeFinal, 0) / total 
      : 0;
    return { total, maxScore, avgScore };
  }, [filteredResultados]);

  if (loading) return (
    <LoadingScreen
      message="Calculando resultados oficiales..."
      submessage="Procesando cómputo, promedios ponderados y podio"
      fullScreen={false}
    />
  );

  if (error) return (
    <div className="p-8 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-3xl border border-rose-100 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Trophy className="w-6 h-6" />
        </div>
        <p className="text-rose-600 font-bold">{error}</p>
        <button 
          onClick={() => cargarDatos()} 
          className="inline-flex items-center gap-2 bg-[#094e8f] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-blue-800 shadow-md active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Reintentar Carga
        </button>
      </div>
    </div>
  );

  const top3 = filteredResultados.filter(r => r.posicionRelativa <= 3);
  const honor = filteredResultados.filter(r => r.posicionRelativa > 3);
  
  // Visual podium order: 2nd place (left), 1st place (center), 3rd place (right)
  const podium = [
    top3.find(r => r.posicionRelativa === 2),
    top3.find(r => r.posicionRelativa === 1),
    top3.find(r => r.posicionRelativa === 3),
  ].filter(Boolean) as ResultadoConPosicion[];

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#094e8f] font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Trophy className="w-4 h-4 text-[#f0d114]" />
            <span>Gala de Premiación UICYT · Gestión {YEAR}</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">Resultados y Rankings Dinámicos</h1>
          <p className="text-slate-500 font-medium mt-1">
            Filtre por categoría, carrera o combinación de ambas para visualizar la tabla de posiciones y podio recalculado en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/resultados-live"
            target="_blank"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Pantalla Live</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </Link>

          <button 
            onClick={() => cargarDatos(true)} 
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-slate-50 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#094e8f]' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Proyectos Clasificados</p>
            <h3 className="text-2xl font-black text-[#162748] mt-1">{stats.total}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">En este segmento</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#094e8f] flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Máximo Puntaje</p>
            <h3 className="text-2xl font-black text-[#094e8f] mt-1">
              {stats.maxScore > 0 ? stats.maxScore.toFixed(2) : '—'}
            </h3>
            <span className="text-[10px] text-amber-600 font-bold">1er Lugar Registrado</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#f0d114] flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Promedio General</p>
            <h3 className="text-2xl font-black text-[#162748] mt-1">
              {stats.avgScore > 0 ? stats.avgScore.toFixed(2) : '—'}
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold">Base sobre 100 pts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="resultados"
        title="Guía del Módulo: Clasificación Dinámica y Podio"
        description="Consulte las posiciones finales y el podio de los ganadores. Seleccione una Categoría y/o Carrera para calcular el ranking relativo de los participantes en ese segmento."
      />

      {/* Filtros Dinámicos Card */}
      <div className="bg-white border border-slate-100 rounded-[2.2rem] p-6 shadow-sm space-y-5">
        {/* Quick Category Tabs */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            1. Categoría Oficial UICYT
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

        {/* Carrera & Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              2. Filtrar por Carrera
            </label>
            <div className="relative">
              <select
                value={selectedCarrera}
                onChange={e => setSelectedCarrera(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f] focus:bg-white shadow-sm transition-all appearance-none cursor-pointer"
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
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              3. Buscar Proyecto o Código
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, código..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f] focus:bg-white shadow-sm transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(selectedCategoria !== 'all' || selectedCarrera !== 'all' || searchQuery) && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Filtros:</span>
              {selectedCategoria !== 'all' && (
                <span className="px-2.5 py-1 bg-blue-50 text-[#094e8f] border border-blue-100 rounded-lg text-xs font-black">
                  {selectedCategoria}
                </span>
              )}
              {selectedCarrera !== 'all' && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-black">
                  {selectedCarrera}
                </span>
              )}
              {searchQuery && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-black">
                  Búsqueda: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>
            <button
              onClick={() => { 
                setSelectedCategoria('all'); 
                setSelectedCarrera('all'); 
                setSearchQuery(''); 
              }}
              className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        )}
      </div>

      {filteredResultados.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-black text-[#162748]">No hay proyectos para los filtros seleccionados</h2>
          <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
            No se encontraron calificaciones registradas que coincidan con la categoría o carrera seleccionada. Intente restablecer los filtros o actualizar la información.
          </p>
          <button
            onClick={() => { 
              setSelectedCategoria('all'); 
              setSelectedCarrera('all'); 
              setSearchQuery(''); 
            }}
            className="mt-6 inline-flex items-center gap-2 bg-[#094e8f] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-blue-800 shadow-md active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Ver Todos los Resultados
          </button>
        </div>
      ) : (
        <>
          {/* Podio — Top 3 */}
          {podium.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f0d114]" />
                  <span>Podio Oficial — Top 3</span>
                  {selectedCategoria !== 'all' && <span className="text-[#094e8f]">· {selectedCategoria}</span>}
                  {selectedCarrera !== 'all' && <span className="text-indigo-600">· {selectedCarrera}</span>}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {podium.map(r => {
                  const isFirst = r.posicionRelativa === 1;
                  const isSecond = r.posicionRelativa === 2;
                  const isThird = r.posicionRelativa === 3;

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
                      {/* Top Rank Badge */}
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

                        {r.carrera && (
                          <div className="flex justify-center">
                            <CarreraBadge carrera={r.carrera} size="xs" />
                          </div>
                        )}

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
                            ★ CAMPEÓN DEL SEGMENTO ★
                          </p>
                        )}
                        <p className={`text-4xl font-black tracking-tight ${isFirst ? 'text-[#f0d114]' : 'text-[#094e8f]'}`}>
                          {r.puntajeFinal.toFixed(2)}
                        </p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${isFirst ? 'text-blue-200' : 'text-slate-400'}`}>
                          {r.evaluaciones > 0 ? `${r.evaluaciones} evaluaciones registradas` : '3 evaluaciones'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cuadro de Honor */}
          {honor.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#162748] flex items-center gap-2">
                  <span>Cuadro de Honor</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    (Posiciones {top3.length + 1} a {filteredResultados.length})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {honor.map(r => {
                  const key = r.id || r.posicionRelativa.toString();
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <button
                        onClick={() => handleToggleDetalle(r)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 font-black text-slate-700 flex items-center justify-center text-sm flex-shrink-0">
                          #{r.posicionRelativa}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#162748] truncate">{r.nombre}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {r.carrera && <CarreraBadge carrera={r.carrera} size="xs" />}
                            {r.categoria && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {r.categoria}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-base font-black text-[#094e8f]">{r.puntajeFinal.toFixed(2)}</span>
                          <p className="text-[10px] text-slate-400 font-semibold">{r.evaluaciones} evals</p>
                        </div>
                        <div className="text-slate-400">
                          {expandedId === key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedId === key && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 bg-slate-50/50"
                          >
                            <div className="p-4 space-y-2.5">
                              {loadingDetalle === key ? (
                                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando detalle de jurados...
                                </div>
                              ) : detalles[key]?.length === 0 ? (
                                <p className="text-slate-400 text-xs">Sin evaluaciones detalladas registradas.</p>
                              ) : (
                                detalles[key]?.map((d, i) => (
                                  <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-black text-slate-700">{d.docente}</p>
                                      <span className="text-xs font-black text-[#094e8f]">{d.puntaje?.toFixed(2) ?? '—'} pts</span>
                                    </div>
                                    {d.observaciones && (
                                      <div className="flex items-start gap-1.5 mt-1.5 pt-1.5 border-t border-slate-50">
                                        <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic">&ldquo;{d.observaciones}&rdquo;</p>
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

          {/* Tabla Completa de Posiciones */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#162748]">Tabla Completa de Posiciones</h2>
              <span className="text-xs font-bold text-slate-400">Total: {filteredResultados.length} proyectos</span>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrera</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                      <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Evals</th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                      <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResultados.map(r => {
                      const key = r.id || r.posicionRelativa.toString();
                      return (
                        <Fragment key={key}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                                r.posicionRelativa === 1 ? 'bg-[#f0d114] text-[#094e8f]' :
                                r.posicionRelativa === 2 ? 'bg-slate-200 text-slate-700' :
                                r.posicionRelativa === 3 ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-50 text-slate-500 border border-slate-200/60'
                              }`}>
                                {r.posicionRelativa}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-black text-[#162748]">{r.nombre}</p>
                            </td>
                            <td className="px-5 py-4">
                              {r.carrera ? (
                                <CarreraBadge carrera={r.carrera} size="xs" />
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200/60">
                                {r.categoria}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                r.evaluaciones >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {r.evaluaciones} evals
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-base font-black text-[#094e8f]">{r.puntajeFinal.toFixed(2)}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleToggleDetalle(r)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#094e8f] transition-all"
                              >
                                {expandedId === key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          <AnimatePresence>
                            {expandedId === key && (
                              <motion.tr
                                key={`${key}-detail-row`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <td colSpan={7} className="px-5 pb-4 bg-slate-50/80">
                                  {loadingDetalle === key ? (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs py-3">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#094e8f]" /> Cargando desglose de jurados...
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                      {detalles[key]?.map((d, i) => (
                                        <div key={i} className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-xs font-black text-slate-800">{d.docente}</p>
                                            <span className="text-xs font-black text-[#094e8f] bg-blue-50 px-2 py-0.5 rounded-md">
                                              {d.puntaje?.toFixed(2) ?? '—'} pts
                                            </span>
                                          </div>
                                          {d.observaciones && (
                                            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-slate-100">
                                              <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                              <p className="text-[11px] text-slate-500 leading-relaxed italic">&ldquo;{d.observaciones}&rdquo;</p>
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}


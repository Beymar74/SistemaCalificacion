'use client';

import { useState, useEffect } from 'react';
import { Download, Award, Medal, RefreshCw, Trophy } from 'lucide-react';
import { fetchResultadosTop } from '@/lib/db';
import type { ResultadoTop } from '@/lib/data';

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoTop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const cargarDatos = () => {
    setLoading(true);
    setError('');
    fetchResultadosTop(6)
      .then(setResultados)
      .catch(() => setError('No se pudo cargar los resultados.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const top3 = resultados.filter(r => r.posicion <= 3);
  const honor = resultados.filter(r => r.posicion > 3);

  const podium = [
    top3.find(r => r.posicion === 2),
    top3.find(r => r.posicion === 1),
    top3.find(r => r.posicion === 3),
  ].filter(Boolean) as ResultadoTop[];

  if (loading) return (
    <div className="p-8 bg-slate-100 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#162748]/20 border-t-[#162748] rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Calculando resultados...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 bg-slate-100 min-h-screen flex items-center justify-center">
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

  // Sin datos aún
  if (resultados.length === 0) return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
          <Award className="w-3.5 h-3.5" />
          GALA DE PREMIACIÓN 2024
        </span>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 border border-slate-300 bg-white text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
          <Trophy className="w-10 h-10 text-slate-300" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">Aún no hay resultados</h2>
          <p className="text-slate-500 text-sm max-w-sm">
            Los resultados se calcularán automáticamente una vez que los docentes completen sus evaluaciones.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
          <Award className="w-3.5 h-3.5" />
          GALA DE PREMIACIÓN 2024
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 border border-slate-300 bg-white text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 border border-slate-300 bg-white text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exportando...' : 'Exportar Resultados'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#162748]">Resultados Finales: Top {resultados.length}</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
          Los proyectos con mayor puntaje promedio, evaluados por el panel de jurados en rigor técnico, innovación y viabilidad.
        </p>
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {podium.map(r => {
            const isFirst = r.posicion === 1;
            return (
              <div
                key={r.posicion}
                className={`relative rounded-2xl p-5 text-center ${
                  isFirst
                    ? 'bg-[#162748] text-white w-72 py-8 shadow-2xl z-10'
                    : 'bg-white text-slate-800 w-56 border border-slate-200 shadow-sm'
                }`}
              >
                {/* Position badge */}
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    isFirst ? 'bg-[#162748] text-white border-white' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {r.posicion}
                </div>

                <Medal
                  className={`w-8 h-8 mx-auto mb-3 mt-2 ${isFirst ? 'text-yellow-300' : 'text-slate-400'}`}
                />

                <h3
                  className={`text-sm font-bold mb-3 leading-snug ${
                    isFirst ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {r.nombre.length > 38 ? r.nombre.slice(0, 38) + '...' : r.nombre}
                </h3>

                {isFirst && (
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">
                    Gran Ganador
                  </p>
                )}

                <p
                  className={`text-4xl font-bold mb-1 ${isFirst ? 'text-white' : 'text-[#162748]'}`}
                >
                  {r.puntajeFinal}
                </p>
                <p className={`text-xs mb-4 ${isFirst ? 'text-slate-300' : 'text-slate-500'}`}>
                  {r.evaluaciones} evaluaciones completadas
                </p>

                {r.criterios?.map(c => (
                  <div key={c.nombre} className="mb-2 text-left">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isFirst ? 'text-slate-300' : 'text-slate-500'}>{c.nombre}</span>
                      <span className={`font-semibold ${isFirst ? 'text-white' : 'text-slate-700'}`}>
                        {c.puntaje}/100
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isFirst ? 'bg-white/20' : 'bg-slate-200'}`}>
                      <div
                        className={`h-1.5 rounded-full ${isFirst ? 'bg-blue-300' : 'bg-[#162748]'}`}
                        style={{ width: `${c.puntaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Honor roll */}
      {honor.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4">
            Cuadro de Honor (Posiciones 4 al {resultados.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {honor.map(r => (
              <div key={r.posicion} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {r.posicion}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.nombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.puntajeFinal} pts · {r.evaluaciones} evals
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

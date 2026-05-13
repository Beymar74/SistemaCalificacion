'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, AlertTriangle, PenLine, AlignLeft } from 'lucide-react';
import { proyectosDetalle, proyectosAsignados, criteriosEval } from '@/lib/data';

type Step = 1 | 2 | 3;

export default function EvaluarProyecto() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [scores, setScores] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [observations, setObservations] = useState('');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const proyecto =
    proyectosDetalle.find(p => p.id === id) ??
    (() => {
      const a = proyectosAsignados.find(p => p.id === id);
      if (!a) return null;
      return {
        id: a.id,
        nombre: a.nombre,
        stand: a.stand,
        categoria: a.categoria,
        equipo: 'Equipo Asignado',
        descripcion: 'Proyecto presentado en la Feria Tecnológica Universitaria.',
      };
    })();

  const puntajeTotal = criteriosEval.reduce(
    (sum, c) => sum + (scores[c.id] * c.peso) / 100,
    0
  );

  if (!proyecto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Proyecto no encontrado.</p>
      </div>
    );
  }

  /* ── STEP 1 ── */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.push('/docente')}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase">Proyecto {id}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{proyecto.nombre}</p>
          </div>
          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex-shrink-0">
            {formatTime(seconds)}
          </span>
        </header>

        <div className="px-4 py-6 max-w-lg mx-auto">
          {/* Step bar */}
          <div className="flex gap-2 mb-5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-[#162748]' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PASO 1 DE 3</p>
          <h1 className="text-lg font-bold text-[#162748] mt-0.5 mb-5">INFORMACIÓN DEL PROYECTO</h1>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {proyecto.stand} · {proyecto.categoria}
            </p>
            <h2 className="text-base font-bold text-slate-800 mb-2">{proyecto.nombre}</h2>
            <p className="text-xs text-slate-500 mb-3">👥 {proyecto.equipo}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{proyecto.descripcion}</p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-[#1e3460] text-white py-3.5 rounded-xl font-medium transition-colors"
          >
            Comenzar Evaluación →
          </button>
        </div>
      </div>
    );
  }

  /* ── STEP 2 ── */
  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setStep(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase">Proyecto {id}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {proyecto.nombre.slice(0, 32)}…
            </p>
          </div>
          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex-shrink-0">
            {formatTime(seconds)}
          </span>
        </header>

        <div className="px-4 py-5 max-w-lg mx-auto">
          {/* Step bar */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-[#162748]' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PASO 2 DE 3</p>
          <h1 className="text-lg font-bold text-[#162748] mt-0.5 mb-1">MÓDULO — EVALUACIÓN DE CRITERIOS</h1>
          <p className="text-sm text-slate-500 mb-5">
            Ajuste el deslizador para asignar una puntuación de 0 a 100 para cada criterio basándose en la rúbrica establecida.
          </p>

          {/* Criteria */}
          <div className="space-y-4">
            {criteriosEval.map(c => {
              const val = scores[c.id];
              const sliderBg = `linear-gradient(to right, #162748 0%, #162748 ${val}%, #e2e8f0 ${val}%, #e2e8f0 100%)`;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-800">
                      {c.id}. {c.nombre}
                    </h3>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg flex-shrink-0">
                      Peso: {c.peso}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">{c.descripcion}</p>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-end justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-base">↔</span>
                        <span className="text-xs">Deslice para calificar</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-0.5">Valor seleccionado:</p>
                        <p className="text-3xl font-bold text-[#162748] leading-none">
                          {val}
                          <span className="text-sm font-normal text-slate-500 ml-0.5">pts</span>
                        </p>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      onChange={e =>
                        setScores(prev => ({ ...prev, [c.id]: Number(e.target.value) }))
                      }
                      style={{ background: sliderBg }}
                    />

                    <div className="flex justify-between mt-1.5">
                      {[0, 35, 50, 75, 100].map(t => (
                        <span key={t} className="text-xs text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observations */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Observaciones
            </h3>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder={`"Excelente presentación visual. El modelo de IA muestra gran potencial para reducir costos logísticos, aunque sería recomendable profundizar más en el análisis de riesgos de implementación en entornos reales."`}
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Fixed CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-10">
          <button
            onClick={() => setStep(3)}
            className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-[#1e3460] text-white py-3.5 rounded-xl font-medium max-w-lg mx-auto transition-colors"
          >
            Finalizar Evaluación →
          </button>
        </div>
      </div>
    );
  }

  /* ── STEP 3 ── */
  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => setStep(2)}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <p className="text-sm font-semibold text-slate-800">Resumen de Evaluación</p>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-[#162748] text-center mb-1">Resumen de Evaluación</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          Por favor, revisa los puntajes antes de confirmar.
        </p>

        {/* Project card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-600 mb-1">ID: {id}</p>
              <h3 className="text-base font-bold text-slate-800 leading-snug">{proyecto.nombre}</h3>
              <p className="text-xs text-slate-500 mt-1">🎓 {proyecto.equipo}</p>
            </div>
            <div className="bg-[#162748] text-white text-xs font-bold px-3 py-2 rounded-xl text-center flex-shrink-0">
              <p>STAND</p>
              <p>{proyecto.stand.replace('STAND ', '')}</p>
            </div>
          </div>
        </div>

        {/* Criteria detail */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">⁼≡ Detalle de Criterios</h3>
          <div className="divide-y divide-slate-50">
            {criteriosEval.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">
                  {i + 1}. {c.nombre}
                </span>
                <span className="text-sm font-bold text-[#162748]">{scores[c.id]}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-[#162748] rounded-2xl p-5 mb-4 text-center text-white">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Puntaje Total
          </p>
          <p className="text-5xl font-bold mb-1">{puntajeTotal.toFixed(1)}</p>
          <p className="text-sm text-slate-300">
            Promedio ponderado: {puntajeTotal.toFixed(1)} / 100
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Atención</p>
            <p className="text-xs text-red-600 mt-0.5">
              Una vez confirmada la evaluación, no podrá modificarse posteriormente.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-700 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Editar Evaluación
          </button>
          <button
            onClick={() => router.push('/docente/completado')}
            className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-[#1e3460] text-white py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

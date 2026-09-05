'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, AlignLeft, AlertTriangle, Pencil, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sincronizarResultadosProyecto } from '@/lib/db';
import LoadingScreen from '@/components/LoadingScreen';

type Step = 1 | 2 | 3;

const BLOQUE1 = [
  { key: 'doc_ind1', criterio: 'Originalidad del Trabajo I', label: 'Existe innovación.' },
  { key: 'doc_ind2', criterio: 'Originalidad del Trabajo II', label: 'Contrasta y argumenta con revisión bibliográfica.' },
  { key: 'doc_ind3', criterio: 'Enfoque Científico I', label: 'Aporte al análisis metodológico, conocimiento, ciencia y cultura.' },
  { key: 'doc_ind4', criterio: 'Enfoque Científico II', label: 'Aporte a la solución del problema específico.' },
  { key: 'doc_ind5', criterio: 'Interpretación y Aplicación de Resultados I', label: 'Coherencia de los objetivos con los resultados obtenidos.' },
  { key: 'doc_ind6', criterio: 'Interpretación y Aplicación de Resultados II', label: 'Existe orientación a nuevos estudios.' },
];

const BLOQUE2 = [
  { key: 'exp_ind1', criterio: 'Interpretación y Aplicación de Resultados I', label: 'Coherencia de los objetivos con los resultados obtenidos.' },
  { key: 'exp_ind2', criterio: 'Interpretación y Aplicación de Resultados II', label: 'Sugiere aplicaciones de los resultados obtenidos.' },
  { key: 'exp_ind3', criterio: 'Utilización Eficiente de los Recursos', label: 'Montaje del material de apoyo en la exposición.' },
  { key: 'exp_ind4', criterio: 'Calidad de la Presentación I', label: 'Precisión en el lenguaje científico tecnológico.' },
  { key: 'exp_ind5', criterio: 'Calidad de la Presentación II', label: 'Calidad de exposición, apoyos audiovisuales.' },
  { key: 'exp_ind6', criterio: 'Defensa del Proyecto I', label: 'Dominio del tema.' },
  { key: 'exp_ind7', criterio: 'Defensa del Proyecto II', label: 'Calidad de respuestas.' },
];

const NIVELES = ['Deficiente', 'Malo', 'Regular', 'Bueno', 'Excelente'];

type Scores = Record<string, number>;

interface Proyecto { id: string; codigo_proyecto: string; nombre_proyecto: string; }

function SliderCard({
  ind, value, onChange, accentColor, trackEmptyColor = '#e2e8f0', valores
}: {
  ind: { key: string; criterio: string; label: string };
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  trackEmptyColor?: string;
  valores: number[];
}) {
  const currentIndex = Math.max(0, valores.indexOf(value));
  const fillPct = (currentIndex / (valores.length - 1)) * 100;
  const nivelLabel = NIVELES[currentIndex] || NIVELES[0];
  const maxVal = valores[valores.length - 1];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 sm:p-6 mb-4 sm:mb-5 transition-shadow hover:shadow-md lg:flex lg:gap-8 lg:items-center group">
      {/* Texto de Criterio */}
      <div className="flex-1 mb-5 lg:mb-0 lg:pr-4">
        <p className="text-[13px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">{ind.criterio}</p>
        <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug group-hover:text-[#162748] transition-colors">{ind.label}</p>
      </div>

      {/* Control Interactivo */}
      <div className="bg-slate-50 rounded-[1.5rem] border border-slate-100/80 px-4 sm:px-6 py-4 sm:py-5 lg:w-[380px] flex-shrink-0 flex flex-col justify-center">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <span className="text-sm font-black text-slate-400 lg:hidden">≡</span>
              <span className="text-sm font-black text-slate-400 hidden lg:block">✓</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none lg:hidden">Desliza para</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none hidden lg:block">Selecciona</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">Calificar</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Puntaje</p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl sm:text-5xl font-black leading-none tracking-tighter" style={{ color: accentColor }}>
                {value}
              </span>
              <span className="text-sm font-bold text-slate-400">/ {maxVal}</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: accentColor }}>{nivelLabel}</p>
          </div>
        </div>

        {/* Versión Mobile: Slider */}
        <div className="lg:hidden">
          <div className="relative h-10">
            <div
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2.5 rounded-full pointer-events-none overflow-hidden"
              style={{ background: trackEmptyColor }}
            >
              <div
                className="h-full rounded-full transition-all duration-200 ease-out"
                style={{ width: `${fillPct}%`, background: accentColor }}
              />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg pointer-events-none transition-all duration-200 ease-out border-4 border-white"
              style={{ left: `calc(${fillPct}% - ${fillPct * 0.32}px)`, background: accentColor }}
            />
            <input
              type="range"
              min={0}
              max={valores.length - 1}
              step={1}
              value={currentIndex}
              onChange={e => onChange(valores[Number(e.target.value)])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0 p-0"
              style={{ touchAction: 'none' }}
            />
          </div>
          <div className="flex justify-between mt-3 px-1">
            {valores.map((v, i) => (
              <span
                key={v}
                className="text-[11px] sm:text-xs w-8 text-center transition-colors"
                style={{ color: i <= currentIndex ? accentColor : '#94a3b8', fontWeight: i <= currentIndex ? 800 : 500 }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Versión Desktop: Botones */}
        <div className="hidden lg:flex gap-1.5 xl:gap-2">
          {valores.map((v, i) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`flex-1 h-12 rounded-xl text-base font-black transition-all ${
                value === v 
                  ? 'text-white shadow-md scale-105' 
                  : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600'
              }`}
              style={value === v ? { background: accentColor, borderColor: accentColor } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Steps indicator ──────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className="flex-1 h-1.5 rounded-full transition-all duration-300"
          style={{ background: s <= current ? '#162748' : '#e2e8f0' }}
        />
      ))}
    </div>
  );
}

// ── AppHeader ────────────────────────────────────────────────────────────────
function AppHeader({
  onBack, title, codigoProyecto, nombreProyecto, timer
}: {
  onBack: () => void;
  title?: string;
  codigoProyecto?: string;
  nombreProyecto?: string;
  timer: string;
}) {
  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200/80 px-4 sm:px-6 py-3 sm:py-4 flex items-center sticky top-0 z-50">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0 border border-slate-200/60 shadow-sm"
          aria-label="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        {title ? (
          <p className="text-base sm:text-lg font-black text-[#162748] truncate">{title}</p>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">
              {codigoProyecto}
            </p>
            <p className="text-sm sm:text-base font-bold text-slate-800 truncate leading-tight">
              {nombreProyecto}
            </p>
          </div>
        )}

        <div className="ml-auto flex flex-col items-end">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 hidden sm:block">Tiempo Transcurrido</span>
          <span className="text-xs sm:text-sm font-black font-mono text-[#162748] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            {timer}
          </span>
        </div>
      </div>
    </header>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function EvaluarProyecto() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [idDocente, setIdDocente] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>(() => {
    const init: Scores = {};
    BLOQUE1.forEach(i => { init[i.key] = 1; });
    BLOQUE2.forEach(i => { init[i.key] = 2; });
    return init;
  });
  const [observations, setObservations] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    const cargar = async () => {
      const { data: proy } = await supabase
        .from('proyectos')
        .select('id, codigo_proyecto, nombre_proyecto')
        .eq('id', id)
        .single();
      setProyecto(proy);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIdDocente(user.id);

      setLoading(false);
    };
    cargar();
  }, [id]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Cálculos: suma directa según Anexo C (sin ponderación, ya viene incorporada en la escala) ──
  const total_bloque1 = BLOQUE1.reduce((sum, i) => sum + scores[i.key], 0);
  const total_bloque2 = BLOQUE2.reduce((sum, i) => sum + scores[i.key], 0);
  const puntaje_final = total_bloque1 + total_bloque2;

  const setScore = (key: string, val: number) => setScores(prev => ({ ...prev, [key]: val }));

  const handleConfirmar = async () => {
    if (!idDocente) return;
    setSaving(true);
    setSaveError('');

    // 1. Insertar evaluación
    const { error: evalError } = await supabase.from('evaluaciones').insert([{
      id_proyecto: id,
      id_docente: idDocente,
      doc_ind1: scores.doc_ind1,
      doc_ind2: scores.doc_ind2,
      doc_ind3: scores.doc_ind3,
      doc_ind4: scores.doc_ind4,
      doc_ind5: scores.doc_ind5,
      doc_ind6: scores.doc_ind6,
      doc_ind7: 0,
      exp_ind1: scores.exp_ind1,
      exp_ind2: scores.exp_ind2,
      exp_ind3: scores.exp_ind3,
      exp_ind4: scores.exp_ind4,
      exp_ind5: scores.exp_ind5,
      exp_ind6: scores.exp_ind6,
      exp_ind7: scores.exp_ind7,
      nota_final: parseFloat(puntaje_final.toFixed(2)),
      observaciones: observations,
      confirmada: true,
      fecha_registro: new Date().toISOString(),
    }]);

    if (evalError) {
      console.error('Error evaluaciones:', evalError.message);
      setSaveError('Error al guardar: ' + evalError.message);
      setSaving(false);
      return;
    }

    // 2. Sincronizar resultados (promedios y ranking)
    await sincronizarResultadosProyecto(id);

    setSaving(false);
    router.push('/docente/completado');
  };

  const timer = formatTime(seconds);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <LoadingScreen
      message="Cargando rúbrica y datos del proyecto..."
      submessage="Instrumento Oficial de Evaluación · UICYT"
      fullScreen={true}
    />
  );

  if (!proyecto) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <p className="text-slate-400 text-sm font-medium">Proyecto no encontrado.</p>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 1 — Información del Proyecto
  // ═══════════════════════════════════════════════════════════
  if (step === 1) return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AppHeader
        onBack={() => router.push('/docente')}
        codigoProyecto={proyecto.codigo_proyecto}
        nombreProyecto={proyecto.nombre_proyecto}
        timer={timer}
      />

      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-3xl xl:max-w-4xl mx-auto">
        <Steps current={1} />

        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
            Paso 1 de 3
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] leading-tight">
            Información del Proyecto
          </h1>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 sm:p-10 mb-8 sm:mb-10 relative overflow-hidden">
          {/* Adorno decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent opacity-50 pointer-events-none" />
          
          <div className="inline-block px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-xl mb-4 relative z-10">
            {proyecto.codigo_proyecto}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 leading-snug relative z-10">
            {proyecto.nombre_proyecto}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium relative z-10">
            Proyecto presentado en la Feria de Tecnología, Emprendimiento e Innovación Industrial 2026.
          </p>
        </div>

        <button
          onClick={() => setStep(2)}
          className="w-full bg-[#162748] text-white rounded-[1.5rem] px-6 py-4 sm:py-5 text-sm sm:text-base font-black hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-900/20 transition-all active:scale-[0.98] min-h-[56px] flex items-center justify-center gap-3 group"
        >
          Comenzar Evaluación
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 2 — Evaluación de criterios
  // ═══════════════════════════════════════════════════════════
  if (step === 2) return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <AppHeader
        onBack={() => setStep(1)}
        codigoProyecto={proyecto.codigo_proyecto}
        nombreProyecto={proyecto.nombre_proyecto}
        timer={timer}
      />

      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl xl:max-w-5xl mx-auto">
        <Steps current={2} />

        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
            Paso 2 de 3
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] mb-2 leading-tight">
            Módulo de Criterios
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Ajuste el deslizador para asignar el puntaje según Deficiente, Malo, Regular, Bueno o Excelente.
          </p>
        </div>

        {/* Bloque 1 */}
        <div className="flex items-center justify-between bg-[#162748] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 mb-5 shadow-lg shadow-blue-900/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white font-black">1</span>
            </div>
            <p className="text-white text-sm sm:text-base font-black uppercase tracking-wider">
              Evaluación del Documento
            </p>
          </div>
          <span className="bg-blue-900 text-blue-100 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border border-blue-800">30 pts max</span>
        </div>

        <div className="space-y-4">
          {BLOQUE1.map(ind => (
            <SliderCard
              key={ind.key}
              ind={ind}
              value={scores[ind.key]}
              onChange={v => setScore(ind.key, v)}
              accentColor="#162748"
              trackEmptyColor="#e2e8f0"
              valores={[1, 2, 3, 4, 5]}
            />
          ))}
        </div>

        {/* Bloque 2 */}
        <div className="flex items-center justify-between bg-blue-600 rounded-2xl px-5 sm:px-6 py-4 sm:py-5 mb-5 mt-10 shadow-lg shadow-blue-600/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-black">2</span>
            </div>
            <p className="text-white text-sm sm:text-base font-black uppercase tracking-wider">
              Exposición y Defensa Final
            </p>
          </div>
          <span className="bg-blue-700 text-blue-100 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border border-blue-500">70 pts max</span>
        </div>

        <div className="space-y-4">
          {BLOQUE2.map(ind => (
            <SliderCard
              key={ind.key}
              ind={ind}
              value={scores[ind.key]}
              onChange={v => setScore(ind.key, v)}
              accentColor="#2563eb"
              trackEmptyColor="#bfdbfe"
              valores={[2, 4, 6, 8, 10]}
            />
          ))}
        </div>

        {/* Observaciones (Formulario) */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <AlignLeft className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-slate-800">Observaciones Finales</p>
              <p className="text-xs text-slate-400 font-medium">Opcional: Añade comentarios sobre la evaluación</p>
            </div>
          </div>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Escriba sus observaciones sobre el proyecto aquí..."
            rows={4}
            className="w-full border-2 border-slate-100 rounded-2xl px-5 sm:px-6 py-4 text-sm text-slate-700 resize-none outline-none leading-relaxed bg-slate-50 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>
      
      {/* Botón inferior estático */}
      <div className="px-4 sm:px-6 max-w-4xl xl:max-w-5xl mx-auto pb-10 flex items-center justify-end mt-4 sm:mt-6">
        <button
          onClick={() => setStep(3)}
          className="w-full sm:w-auto bg-[#162748] text-white rounded-2xl px-10 py-4 text-sm sm:text-base font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-900/20 transition-all active:scale-[0.98] min-h-[56px] flex items-center justify-center gap-3"
        >
          Siguiente Paso →
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 3 — Resumen y confirmación
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <AppHeader
        onBack={() => setStep(2)}
        title="Resumen de Evaluación"
        timer={timer}
      />

      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-[1400px] mx-auto">

        <div className="text-center mb-10 sm:mb-12">
          <p className="text-[11px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
            Paso 3 de 3
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] mb-2 leading-tight">
            Resumen de Evaluación
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Revisa detenidamente los puntajes antes de enviar la evaluación definitiva.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-8 xl:gap-12">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-8">
            {/* Card del proyecto */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Proyecto Evaluado
                </p>
                <p className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                  {proyecto.nombre_proyecto}
                </p>
              </div>
              <span className="inline-flex items-center justify-center px-5 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black uppercase tracking-widest rounded-xl flex-shrink-0 whitespace-nowrap">
                {proyecto.codigo_proyecto}
              </span>
            </div>

            {/* Título de desglose */}
            <div className="flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Desglose de Calificaciones</span>
            </div>

            {/* Resúmenes en Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bloque 1 resumen */}
              <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-black text-[#162748]">
                    Bloque 1 — Documento
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">30 pts max</span>
                </div>
                <div className="space-y-2 mb-6 flex-1">
                  {BLOQUE1.map((ind, i) => (
                    <div key={ind.key} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0 group">
                      <span className="text-[10px] font-bold text-slate-400 w-10 flex-shrink-0 group-hover:text-slate-600 transition-colors">Ind. {i + 1}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#162748] transition-all duration-500 ease-out"
                          style={{ width: `${(scores[ind.key] / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-[#162748] w-8 text-right flex-shrink-0">
                        {scores[ind.key]}/5
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100 mt-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                  <span className="text-lg font-black text-[#162748]">
                    {total_bloque1.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bloque 2 resumen */}
              <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-black text-blue-600">
                    Bloque 2 — Exposición
                  </p>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-1 rounded-lg">70 pts max</span>
                </div>
                <div className="space-y-2 mb-6 flex-1">
                  {BLOQUE2.map((ind, i) => (
                    <div key={ind.key} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0 group">
                      <span className="text-[10px] font-bold text-slate-400 w-10 flex-shrink-0 group-hover:text-blue-400 transition-colors">Ind. {i + 1}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-blue-50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                          style={{ width: `${(scores[ind.key] / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-blue-600 w-8 text-right flex-shrink-0">
                        {scores[ind.key]}/10
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100 mt-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                  <span className="text-lg font-black text-blue-600">
                    {total_bloque2.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">
            
            {/* Observaciones (Lectura en Resumen) */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <AlignLeft className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800">Observaciones Finales</p>
                  <p className="text-[10px] text-slate-400 font-medium">Comentarios registrados en la evaluación</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl px-5 py-4 text-sm text-slate-700 border border-slate-100 min-h-[80px]">
                {observations.trim() ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{observations}</p>
                ) : (
                  <p className="italic text-slate-400">Sin observaciones registradas.</p>
                )}
              </div>
            </div>

            {/* Puntaje final */}
            <div className="bg-gradient-to-br from-[#162748] to-[#1e3460] rounded-[2rem] p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 opacity-10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center sm:text-left relative z-10 flex-1">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1.5">
                  Puntaje Final
                </p>
                <h2 className="text-xl font-black text-white mb-1.5 leading-tight">Evaluación Completa</h2>
                <p className="text-xs text-blue-200/80 font-medium">
                  Consolidado total.
                </p>
              </div>

              <div className="text-center relative z-10 bg-black/20 rounded-2xl px-6 py-4 border border-white/10 backdrop-blur-sm flex-shrink-0">
                <p className="text-5xl font-black text-white leading-none tracking-tighter">
                  {puntaje_final.toFixed(0)}
                  <span className="text-2xl text-blue-300">{(puntaje_final % 1).toFixed(2).substring(1)}</span>
                </p>
                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider mt-1.5">Sobre 100 pts</p>
              </div>
            </div>

            {/* Aviso irreversible */}
            <div className="bg-red-50 border border-red-200/80 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-red-700 mb-1">Acción Irreversible</p>
                <p className="text-xs text-red-600/90 font-medium leading-relaxed">
                  Los resultados serán definitivos y no podrán modificarse.
                </p>
                {saveError && (
                  <div className="mt-3 bg-white rounded-xl border border-red-200 px-3 py-2 flex items-center justify-center sm:justify-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <p className="text-[10px] font-bold text-red-600">{saveError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white text-slate-600 border-2 border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
              >
                <Pencil className="w-4 h-4" />
                Modificar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={saving}
                className="flex-1 bg-[#162748] text-white rounded-2xl px-4 py-4 text-sm font-black hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                }
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
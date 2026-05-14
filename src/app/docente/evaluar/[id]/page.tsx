'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, AlignLeft, AlertTriangle, Pencil, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sincronizarResultadosProyecto } from '@/lib/db';

type Step = 1 | 2 | 3;

const BLOQUE1 = [
  { key: 'doc_ind1', label: 'Ind. 1 — Cap. I · Calidad del Documento', peso: '10%', desc: 'Presenta claramente la introducción (problema, objetivo y resultados esperados); contextualiza los antecedentes con bibliografía actualizada e identifica vacíos en el estado del arte.' },
  { key: 'doc_ind2', label: 'Ind. 2 — Cap. I · Formulación del Problema', peso: '10%', desc: 'Formula el problema mediante análisis causa-efecto; define objetivos con estructura verbo+objeto+finalidad y establece el alcance temático, geográfico y temporal.' },
  { key: 'doc_ind3', label: 'Ind. 3 — Cap. II · Innovación y Creatividad', peso: '20%', desc: 'Justifica el proyecto en los niveles técnico-científico, social y económico; señala beneficiarios, novedad, originalidad e impacto potencial.' },
  { key: 'doc_ind4', label: 'Ind. 4 — Cap. II · Calidad del Documento', peso: '10%', desc: 'Desarrolla los conceptos y definiciones necesarios con contenido conciso, bien citado y de fácil interpretación.' },
  { key: 'doc_ind5', label: 'Ind. 5 — Cap. III · Innovación y Creatividad', peso: '20%', desc: 'Describe la metodología con rigor: universo de estudio, tipo de investigación, instrumentos y plan de trabajo.' },
  { key: 'doc_ind6', label: 'Ind. 6 — Cap. III · Innovación y Creatividad', peso: '20%', desc: 'Desarrolla cada objetivo específico de forma coherente, evidenciando que el conjunto alcanza el objetivo general con resultados validados.' },
  { key: 'doc_ind7', label: 'Ind. 7 — Cap. IV · Calidad del Documento', peso: '10%', desc: 'Presenta conclusiones y recomendaciones acordes a los resultados.' },
];

const BLOQUE2 = [
  { key: 'exp_ind1', label: 'Ind. 1 — Dominio del Tema · Funcionalidad Técnica', peso: '20%', desc: 'Sustenta con solidez el conocimiento del tema; maneja con precisión la terminología técnica industrial.' },
  { key: 'exp_ind2', label: 'Ind. 2 — Dominio del Tema · Claridad Metodológica', peso: '20%', desc: 'Explica con claridad la metodología científica empleada y justifica la selección de métodos y herramientas.' },
  { key: 'exp_ind3', label: 'Ind. 3 — Calidad de la Exposición · Presentación', peso: '20%', desc: 'Expone con coherencia, fluidez y precisión; organiza el tiempo de forma eficiente.' },
  { key: 'exp_ind4', label: 'Ind. 4 — Calidad de la Exposición · Recursos', peso: '20%', desc: 'Utiliza eficientemente los recursos de apoyo; el stand refleja planificación y señalética clara.' },
  { key: 'exp_ind5', label: 'Ind. 5 — Impacto Industrial', peso: '20%', desc: 'Vincula los resultados con su impacto en procesos industriales y argumenta la viabilidad económica.' },
  { key: 'exp_ind6', label: 'Ind. 6 — Análisis Técnico', peso: '20%', desc: 'Efectúa análisis crítico de los resultados e identifica elementos con potencial de patente.' },
  { key: 'exp_ind7', label: 'Ind. 7 — Defensa del Proyecto', peso: '10%', desc: 'Responde con solvencia las preguntas técnicas del evaluador; demuestra dominio integral del proyecto.' },
];

const LABELS: Record<number, string> = { 0: 'No presenta', 1: 'Deficiente', 2: 'Regular', 3: 'Bueno', 4: 'Muy Bueno', 5: 'Excelente' };

type Scores = Record<string, number>;

interface Proyecto { id: string; codigo_proyecto: string; nombre_proyecto: string; }

function SliderCard({ ind, value, onChange, accentColor, trackEmptyColor = '#e2e8f0' }: {
  ind: { key: string; label: string; peso: string; desc: string };
  value: number; onChange: (v: number) => void;
  accentColor: string; trackEmptyColor?: string;
}) {
  const fillPct = (value / 5) * 100;
  const thumbOffset = 11 - (fillPct / 100) * 22;
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>{ind.label}</p>
        <span style={{ background: '#f1f5f9', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>Peso: {ind.peso}</span>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '10px 0 18px' }}>{ind.desc}</p>
      <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e8eaf0', padding: '14px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, color: '#94a3b8' }}>≡</span>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Deslice para</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>calificar</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Valor seleccionado:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>/ 5</span>
            </div>
            <p style={{ fontSize: 12, color: accentColor, fontWeight: 600, margin: '2px 0 0' }}>{LABELS[value]}</p>
          </div>
        </div>
        <div style={{ position: 'relative', height: 32 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', height: 8, borderRadius: 999, background: trackEmptyColor, pointerEvents: 'none' }}>
            <div style={{ width: `${fillPct}%`, height: '100%', background: accentColor, borderRadius: 999, transition: 'width 0.12s ease' }} />
          </div>
          <div style={{ position: 'absolute', top: '50%', left: `calc(${fillPct}% + ${thumbOffset}px)`, transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: accentColor, boxShadow: '0 1px 5px rgba(0,0,0,0.25)', pointerEvents: 'none', transition: 'left 0.12s ease' }} />
          <input type="range" min={0} max={5} step={1} value={value} onChange={e => onChange(Number(e.target.value))} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0, zIndex: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {[0, 1, 2, 3, 4, 5].map(v => (
            <span key={v} style={{ fontSize: 11, color: v <= value ? accentColor : '#94a3b8', fontWeight: v <= value ? 700 : 400, width: 16, textAlign: 'center' }}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EvaluarProyecto() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [idDocente, setIdDocente] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>(() => {
    const init: Scores = {};
    [...BLOQUE1, ...BLOQUE2].forEach(i => { init[i.key] = 0; });
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

  // ─── Cálculos según diccionario ───────────────────────────────────────────
  const doc_innov = (scores.doc_ind3 + scores.doc_ind5 + scores.doc_ind6) * (20 / 15);
  const doc_calidad = (scores.doc_ind1 + scores.doc_ind2 + scores.doc_ind4 + scores.doc_ind7) * (10 / 20);
  const total_bloque1 = doc_innov + doc_calidad;
  const exp_dominio = (scores.exp_ind1 + scores.exp_ind2) * 2;
  const exp_calidad = (scores.exp_ind3 + scores.exp_ind4) * 2;
  const exp_impacto = (scores.exp_ind5 + scores.exp_ind6) * 2;
  const exp_defensa = scores.exp_ind7 * 2;
  const total_bloque2 = exp_dominio + exp_calidad + exp_impacto + exp_defensa;
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
      doc_ind7: scores.doc_ind7,
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '4px solid #162748', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!proyecto) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#94a3b8' }}>Proyecto no encontrado.</p>
    </div>
  );

  const AppHeader = ({ onBack, title }: { onBack: () => void; title?: string }) => (
    <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <ChevronLeft size={20} color="#64748b" />
      </button>
      {title ? (
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</p>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{proyecto.codigo_proyecto}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proyecto.nombre_proyecto}</p>
        </div>
      )}
      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, marginLeft: 'auto', flexShrink: 0 }}>
        {formatTime(seconds)}
      </span>
    </header>
  );

  const Steps = ({ current }: { current: number }) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: s <= current ? '#162748' : '#e2e8f0' }} />
      ))}
    </div>
  );

  /* ─── STEP 1 ─── */
  if (step === 1) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppHeader onBack={() => router.push('/docente')} />
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <Steps current={1} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>PASO 1 DE 3</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#162748', margin: '4px 0 24px' }}>INFORMACIÓN DEL PROYECTO</h1>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{proyecto.codigo_proyecto}</p>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: '0 0 12px' }}>{proyecto.nombre_proyecto}</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Proyecto presentado en la Feria de Tecnología, Emprendimiento e Innovación Industrial 2026.
          </p>
        </div>
        <button onClick={() => setStep(2)} style={{ width: '100%', background: '#162748', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Comenzar Evaluación →
        </button>
      </div>
    </div>
  );

  /* ─── STEP 2 ─── */
  if (step === 2) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <AppHeader onBack={() => setStep(1)} />
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <Steps current={2} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>PASO 2 DE 3</p>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#162748', margin: '4px 0 2px' }}>MÓDULO — EVALUACIÓN DE CRITERIOS</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
          Ajuste el deslizador para asignar una puntuación de 0 a 5 para cada criterio.
        </p>

        <div style={{ background: '#162748', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Bloque 1 — Evaluación del Documento</p>
          <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}>30 pts</span>
        </div>
        {BLOQUE1.map(ind => (
          <SliderCard key={ind.key} ind={ind} value={scores[ind.key]} onChange={v => setScore(ind.key, v)} accentColor="#162748" trackEmptyColor="#cbd5e1" />
        ))}

        <div style={{ background: '#2563eb', borderRadius: 12, padding: '10px 16px', marginBottom: 16, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Bloque 2 — Exposición y Defensa Final</p>
          <span style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 700 }}>70 pts</span>
        </div>
        {BLOQUE2.map(ind => (
          <SliderCard key={ind.key} ind={ind} value={scores[ind.key]} onChange={v => setScore(ind.key, v)} accentColor="#2563eb" trackEmptyColor="#bfdbfe" />
        ))}

        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: 20, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlignLeft size={16} color="#64748b" />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Observaciones</p>
          </div>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Escriba sus observaciones sobre el proyecto..."
            rows={5}
            style={{ width: '100%', border: '1px solid #e8eaf0', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#334155', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', background: '#f8fafc' }}
          />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8eaf0', padding: '16px', zIndex: 10 }}>
        <button onClick={() => setStep(3)} style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: '#162748', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Finalizar Evaluación →
        </button>
      </div>
    </div>
  );

  /* ─── STEP 3 ─── */
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 32 }}>
      <AppHeader onBack={() => setStep(2)} title="Resumen de Evaluación" />
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#162748', textAlign: 'center', margin: '0 0 4px' }}>Resumen de Evaluación</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '0 0 24px' }}>Revisa los puntajes antes de confirmar.</p>

        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', margin: '0 0 4px', textTransform: 'uppercase' }}>{proyecto.codigo_proyecto}</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{proyecto.nombre_proyecto}</p>
        </div>

        {/* Bloque 1 */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#162748', margin: '0 0 12px' }}>Bloque 1 — Documento (30 pts)</p>
          {BLOQUE1.map((ind, i) => (
            <div key={ind.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#64748b', minWidth: 44 }}>Ind. {i + 1}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                <div style={{ width: `${(scores[ind.key] / 5) * 100}%`, height: '100%', background: '#162748', borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#162748', minWidth: 28, textAlign: 'right' }}>{scores[ind.key]}/5</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#162748' }}>{total_bloque1.toFixed(2)}/30</span>
          </div>
        </div>

        {/* Bloque 2 */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8eaf0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', margin: '0 0 12px' }}>Bloque 2 — Exposición (70 pts)</p>
          {BLOQUE2.map((ind, i) => (
            <div key={ind.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#64748b', minWidth: 44 }}>Ind. {i + 1}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#dbeafe', overflow: 'hidden' }}>
                <div style={{ width: `${(scores[ind.key] / 5) * 100}%`, height: '100%', background: '#2563eb', borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', minWidth: 28, textAlign: 'right' }}>{scores[ind.key]}/5</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>{total_bloque2.toFixed(2)}/70</span>
          </div>
        </div>

        {/* Puntaje final */}
        <div style={{ background: '#162748', borderRadius: 20, padding: 24, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Puntaje Final</p>
          <p style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>{puntaje_final.toFixed(2)}</p>
          <p style={{ fontSize: 13, color: '#93c5fd', margin: 0 }}>sobre 100 puntos</p>
        </div>

        {saveError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{saveError}</p>
          </div>
        )}

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', margin: '0 0 2px' }}>Atención</p>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>Una vez confirmada la evaluación, no podrá modificarse.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setStep(2)} style={{ width: '100%', background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Pencil size={15} color="#475569" strokeWidth={2} /> Editar Evaluación
          </button>
          <button onClick={handleConfirmar} disabled={saving} style={{ width: '100%', background: saving ? '#94a3b8' : '#162748', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving
              ? <Loader2 size={17} color="#fff" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Check size={17} color="#fff" strokeWidth={2.5} />
            }
            {saving ? 'Guardando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
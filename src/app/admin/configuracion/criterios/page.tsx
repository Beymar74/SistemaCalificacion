'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  Info, 
  GripVertical,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { fetchCriterios, upsertCriterio, eliminarCriterio, type Criterio } from '@/lib/db';

export default function CriteriosPage() {
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCriterios();
  }, []);

  async function loadCriterios() {
    setIsLoading(true);
    const data = await fetchCriterios();
    setCriterios(data);
    setIsLoading(false);
  }

  const handleAdd = () => {
    const newCriterio: Criterio = {
      id: crypto.randomUUID(),
      nombre: '',
      descripcion: '',
      peso: 0
    };
    setCriterios([newCriterio, ...criterios]);
    setEditingId(newCriterio.id);
  };

  const handleSave = async (c: Criterio) => {
    if (!c.nombre || c.peso <= 0) {
      setMessage({ text: 'El nombre y un peso mayor a 0 son obligatorios.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const { error } = await upsertCriterio(c);
    setIsSaving(false);

    if (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    } else {
      setMessage({ text: 'Criterio guardado correctamente.', type: 'success' });
      setEditingId(null);
      loadCriterios();
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este criterio?')) return;

    const { error } = await eliminarCriterio(id);
    if (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    } else {
      setMessage({ text: 'Criterio eliminado.', type: 'success' });
      loadCriterios();
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const totalPeso = criterios.reduce((acc, c) => acc + c.peso, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">
            Rúbrica de Evaluación
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Defina los criterios y pesos porcentuales para calificar los proyectos.
          </p>
        </div>
        
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-900/10 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Criterio</span>
        </button>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="criterios"
        title="Guía del Módulo: Configuración de la Rúbrica"
        description="Especifique los criterios, descripciones y pesos porcentuales con los que los docentes calificarán cada proyecto. Para garantizar la consistencia matemática, es indispensable que el peso acumulado sume exactamente el 100%. Las modificaciones aquí afectarán solo a las evaluaciones futuras."
      />

      {/* Warning/Info Banner */}
      <div className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
        totalPeso === 100 
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}>
        <div className={`p-2 rounded-xl ${totalPeso === 100 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {totalPeso === 100 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">
            Peso Total de la Rúbrica: <span className="text-lg">{totalPeso}%</span>
          </p>
          <p className="text-xs opacity-80 font-medium">
            {totalPeso === 100 
              ? 'La configuración es óptima. Los pesos suman el 100%.' 
              : `Ajuste los pesos para que sumen exactamente 100% (Faltan/Sobran ${Math.abs(100 - totalPeso)}%).`}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl text-sm font-bold text-center ${
              message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Criteria List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando rúbrica...</p>
          </div>
        ) : (
          criterios.map((c) => (
            <motion.div
              layout
              key={c.id}
              className={`bg-white rounded-[2rem] p-6 border transition-all ${
                editingId === c.id ? 'border-indigo-600 ring-4 ring-indigo-600/5 shadow-xl' : 'border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="hidden md:flex items-center text-slate-300">
                  <GripVertical className="w-6 h-6 cursor-grab active:cursor-grabbing" />
                </div>
                
                <div className="flex-1 space-y-4">
                  {editingId === c.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre del Criterio</label>
                        <input
                          type="text"
                          value={c.nombre}
                          onChange={(e) => setCriterios(criterios.map(i => i.id === c.id ? { ...i, nombre: e.target.value } : i))}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-600/10 focus:bg-white transition-all font-bold text-slate-800"
                          placeholder="Ej: Calidad Técnica"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Peso (%)</label>
                        <input
                          type="number"
                          value={c.peso}
                          onChange={(e) => setCriterios(criterios.map(i => i.id === c.id ? { ...i, peso: Number(e.target.value) } : i))}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-600/10 focus:bg-white transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descripción / Indicadores</label>
                        <textarea
                          value={c.descripcion}
                          onChange={(e) => setCriterios(criterios.map(i => i.id === c.id ? { ...i, descripcion: e.target.value } : i))}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-600/10 focus:bg-white transition-all font-medium text-slate-700 min-h-[100px]"
                          placeholder="Describa qué se evalúa en este punto..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-[#162748] mb-1">{c.nombre}</h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2">{c.descripcion || 'Sin descripción.'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-5 py-2 bg-indigo-50 rounded-2xl text-indigo-700 font-black text-lg">
                          {c.peso}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => handleSave(c)}
                        disabled={isSaving}
                        className="flex-1 md:flex-none p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
                      >
                        <Save className="w-5 h-5 mx-auto" />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); loadCriterios(); }}
                        className="flex-1 md:flex-none p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5 mx-auto" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingId(c.id)}
                        className="flex-1 md:flex-none p-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                      >
                        <Settings className="w-5 h-5 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex-1 md:flex-none p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex items-start gap-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Sobre la Rúbrica</p>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
            Los cambios en la rúbrica afectarán únicamente a las evaluaciones que se realicen a partir de este momento. 
            Asegúrese de que el peso sume 100% para evitar inconsistencias en el cálculo del puntaje final.
          </p>
        </div>
      </div>
    </div>
  );
}

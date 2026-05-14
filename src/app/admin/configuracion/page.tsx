'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Calendar, 
  Eye, 
  Lock, 
  Save, 
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchConfiguracion, updateConfiguracion, type ConfigSistema } from '@/lib/db';

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigSistema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setIsLoading(true);
    const data = await fetchConfiguracion();
    setConfig(data);
    setIsLoading(false);
  }

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    const { error } = await updateConfiguracion(config);
    setIsSaving(false);

    if (error) {
      setMessage({ text: `Error al guardar: ${error}`, type: 'error' });
    } else {
      setMessage({ text: 'Configuración actualizada correctamente.', type: 'success' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando configuración...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-800 font-bold">No se encontró la configuración del sistema.</p>
        <p className="text-slate-500 text-sm">Asegúrese de que la tabla `configuracion_sistema` tenga al menos un registro.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Shield className="w-4 h-4" />
            <span>Sistema</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">
            Control de Fases
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Administre el estado global de la feria y los periodos académicos.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-[#162748] hover:bg-black text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-70"
        >
          {isSaving ? (
            <RefreshCcw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>Guardar Cambios</span>
        </button>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Academic Period */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-[#162748]">Periodo Académico</h3>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Año / Semestre Activo</label>
            <input
              type="text"
              value={config.periodo_activo}
              onChange={(e) => setConfig({ ...config, periodo_activo: e.target.value })}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-600/10 focus:bg-white transition-all font-bold text-slate-800"
              placeholder="Ej: 2026 - Semestre I"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Este nombre aparecerá en todos los reportes, certificados y encabezados del sistema para este periodo.
          </p>
        </div>

        {/* Global Evaluation Switch */}
        <div className={`bg-white rounded-[2.5rem] p-8 border transition-all shadow-sm flex flex-col justify-between ${
          config.evaluacion_abierta ? 'border-emerald-100 ring-4 ring-emerald-500/5' : 'border-slate-100'
        }`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${config.evaluacion_abierta ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  {config.evaluacion_abierta ? <Lock className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-slate-400" />}
                </div>
                <h3 className="text-lg font-black text-[#162748]">Estado de Evaluación</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.evaluacion_abierta}
                  onChange={(e) => setConfig({ ...config, evaluacion_abierta: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <p className="text-sm font-medium text-slate-500">
              {config.evaluacion_abierta 
                ? 'El sistema está ABIERTO. Los docentes pueden ingresar calificaciones y comentarios en tiempo real.' 
                : 'El sistema está CERRADO. Los docentes NO pueden realizar evaluaciones ni modificar puntajes.'}
            </p>
          </div>

          <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${config.evaluacion_abierta ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
            <div className={`w-2 h-2 rounded-full ${config.evaluacion_abierta ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {config.evaluacion_abierta ? 'Evaluación Activa' : 'Fase Bloqueada'}
            </span>
          </div>
        </div>

        {/* Results Visibility */}
        <div className={`bg-white rounded-[2.5rem] p-8 border transition-all shadow-sm flex flex-col justify-between ${
          config.mostrar_resultados ? 'border-blue-100 ring-4 ring-blue-500/5' : 'border-slate-100'
        }`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${config.mostrar_resultados ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <Eye className={`w-5 h-5 ${config.mostrar_resultados ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <h3 className="text-lg font-black text-[#162748]">Visibilidad de Resultados</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.mostrar_resultados}
                  onChange={(e) => setConfig({ ...config, mostrar_resultados: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <p className="text-sm font-medium text-slate-500">
              Si está activo, los resultados finales y rankings serán visibles para todos los usuarios autorizados.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#f8fafc] rounded-[2.5rem] p-8 border border-slate-200/50 flex flex-col justify-center gap-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Accesos Directos</h3>
          
          <button className="flex items-center justify-between w-full p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-700">Configurar Rúbricas</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center justify-between w-full p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <ExternalLink className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-700">Ver Portal de Jurados</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Audit Log / Danger Zone */}
      <div className="bg-red-50/50 rounded-[2.5rem] p-8 border border-red-100 mt-12">
        <h3 className="text-lg font-black text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zona de Peligro
        </h3>
        <p className="text-sm text-red-700 font-medium mb-6">
          Las siguientes acciones son irreversibles y afectan la integridad de los datos históricos.
        </p>
        <button className="bg-white hover:bg-red-500 hover:text-white text-red-600 border border-red-200 px-6 py-3 rounded-xl text-sm font-bold transition-all">
          Reiniciar Todas las Calificaciones (Reset)
        </button>
      </div>
    </div>
  );
}

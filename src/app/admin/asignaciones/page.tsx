'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  UserPlus, 
  X,
  UserCheck,
  FileWarning,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAuditoriaAsignaciones, eliminarAsignacion } from '@/lib/db';

export default function AsignacionesAuditPage() {
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await fetchAuditoriaAsignaciones();
    setAsignaciones(data);
    setLoading(false);
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const { error } = await eliminarAsignacion(deleteConfirm);
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Asignación eliminada con éxito', type: 'success' });
      loadData();
    }
    setDeleteConfirm(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = asignaciones.filter(a => 
    a.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.proyectoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.proyectoCodigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: asignaciones.length,
    invalid: asignaciones.filter(a => a.proyectoNombre.includes('ELIMINADO') || a.docenteNombre.includes('INVÁLIDO')).length,
    valid: asignaciones.filter(a => !a.proyectoNombre.includes('ELIMINADO') && !a.docenteNombre.includes('INVÁLIDO')).length
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#162748] tracking-tight">Revisión de Jurados</h1>
          <p className="text-slate-500 font-medium">Lista de todos los jurados y sus proyectos asignados para detectar errores.</p>
        </div>
        <button 
          onClick={loadData}
          className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Asignaciones</p>
          </div>
          <p className="text-2xl font-black text-[#162748]">{stats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignaciones Correctas</p>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.valid}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <FileWarning className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculos con Errores</p>
          </div>
          <p className="text-2xl font-black text-red-600">{stats.invalid}</p>
        </div>
      </div>

      {/* Alert if orphans found */}
      {stats.invalid > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="text-amber-900 font-black text-sm uppercase tracking-wider">Atención: Vínculos sin Proyecto Detectados</h4>
            <p className="text-amber-700 text-xs mt-1 font-medium leading-relaxed">
              Se han encontrado {stats.invalid} asignaciones que apuntan a proyectos que ya no existen. 
              Estos registros pueden causar errores en el conteo de los docentes. Se recomienda eliminarlos.
            </p>
          </div>
        </motion.div>
      )}

      {/* Audit Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por docente, código o proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600/30 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Jurado / Docente</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto Asignado</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Cargando auditoría...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Search className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">No se encontraron asignaciones con ese criterio.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const isOrphan = a.proyectoNombre.includes('ELIMINADO') || a.docenteNombre.includes('INVÁLIDO');
                  return (
                    <tr key={a.id} className={`group transition-all hover:bg-slate-50/50 ${isOrphan ? 'bg-red-50/20' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isOrphan ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {a.docenteNombre.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-sm font-black ${isOrphan ? 'text-red-700' : 'text-slate-800'}`}>{a.docenteNombre}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{a.docenteMateria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-[#162748] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {a.proyectoCodigo}
                            </span>
                            <p className={`text-sm font-bold ${isOrphan ? 'text-red-700' : 'text-slate-600'} line-clamp-1`}>
                              {a.proyectoNombre}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isOrphan ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {isOrphan ? 'Huérfano' : 'Correcto'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setDeleteConfirm(a.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar asignación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-[#162748]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#162748] mb-2 tracking-tight">¿Eliminar asignación?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Esta acción desvinculará al jurado del proyecto. El contador de asignaciones se actualizará al instante.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-900/20 text-xs uppercase tracking-widest"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border ${
              message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <div>
              <p className="text-sm font-black uppercase tracking-widest">Notificación</p>
              <p className="text-xs font-medium opacity-90">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="ml-4 p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

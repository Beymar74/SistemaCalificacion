'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  UserCheck, 
  Briefcase, 
  Mail, 
  Download, 
  ArrowUpRight, 
  UserPlus, 
  RefreshCw,
  X,
  Save,
  Trash2,
  Edit3,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDocentesAdmin, upsertDocente, eliminarDocente, type DocenteAdmin } from '@/lib/db';

const PAGE_SIZE = 8;

const StatCard = ({ title, value, icon: Icon, color, delay }: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
  >
    <div className={`p-3.5 rounded-2xl ${color} text-white shadow-lg shadow-blue-900/10`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-[#162748]">{value}</p>
    </div>
  </motion.div>
);

export default function DocentesPage() {
  const [docentesData, setDocentesData] = useState<DocenteAdmin[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<Partial<DocenteAdmin> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'assigned' | 'unassigned' | 'saturated'>('all');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await fetchDocentesAdmin();
      setDocentesData(data);
    } catch (err) {
      setError('No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocente?.nombre || !selectedDocente?.email) return;

    setIsSaving(true);
    const payload = {
      id_usuario: selectedDocente.id || crypto.randomUUID(),
      nombre_completo: selectedDocente.nombre,
      email: selectedDocente.email,
      username: selectedDocente.codigo,
      materia: selectedDocente.departamento,
      grado: selectedDocente.especialidad,
      estado: selectedDocente.estado === 'Activo'
    };

    const { error } = await upsertDocente(payload);
    setIsSaving(false);

    if (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    } else {
      setMessage({ text: 'Docente guardado correctamente', type: 'success' });
      setModalOpen(false);
      cargarDatos();
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este docente?')) return;
    const { error } = await eliminarDocente(id);
    if (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    } else {
      setMessage({ text: 'Docente eliminado', type: 'success' });
      cargarDatos();
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = useMemo(() => {
    return docentesData.filter(d => {
      const matchesSearch = 
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo.toLowerCase().includes(search.toLowerCase()) ||
        d.especialidad.toLowerCase().includes(search.toLowerCase());
      
      const matchesWorkload = 
        filterWorkload === 'all' ? true :
        filterWorkload === 'assigned' ? d.proyectosAsignados > 0 :
        filterWorkload === 'unassigned' ? d.proyectosAsignados === 0 :
        filterWorkload === 'saturated' ? d.proyectosAsignados >= 5 : true;

      return matchesSearch && matchesWorkload;
    });
  }, [docentesData, search, filterWorkload]);

  const stats = useMemo(() => {
    const total = docentesData.length;
    const activos = docentesData.filter(d => d.estado === 'Activo').length;
    const totalProyectos = docentesData.reduce((acc, d) => acc + d.proyectosAsignados, 0);
    return { total, activos, totalProyectos };
  }, [docentesData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Users className="w-4 h-4" />
            <span>Docentes</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">
            Gestión de Evaluadores
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Administre las cuentas de los docentes y sus especialidades.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setSelectedDocente({ estado: 'Activo' }); setModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[#162748] hover:bg-black text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>Agregar Docente</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Docentes" value={stats.total} icon={Users} color="bg-blue-600" delay={0.1} />
        <StatCard title="Docentes Activos" value={stats.activos} icon={UserCheck} color="bg-emerald-500" delay={0.2} />
        <StatCard title="Carga Global" value={stats.totalProyectos} icon={Briefcase} color="bg-indigo-500" delay={0.3} />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-wrap items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o especialidad..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600/30 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Todos', icon: Users },
              { id: 'assigned', label: 'Con Carga', icon: Briefcase },
              { id: 'unassigned', label: 'Disponibles', icon: UserCheck },
              { id: 'saturated', label: 'Saturados (5/5)', icon: AlertTriangle }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterWorkload(f.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-none ${
                  filterWorkload === f.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando datos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-red-500 font-bold text-sm">{error}</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay docentes registrados.</p>
                  </td>
                </tr>
              ) : paginated.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">
                        {d.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{d.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{d.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {d.especialidad}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${
                          d.proyectosAsignados >= 5 ? 'text-red-600' : 
                          d.proyectosAsignados >= 3 ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {d.proyectosAsignados} / 5 Proyectos
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {d.proyectosAsignados >= 5 ? 'COMPLETO' : d.proyectosAsignados >= 3 ? 'MEDIO' : 'LIGERO'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-none ${
                            d.proyectosAsignados >= 5 ? 'bg-red-600' : 
                            d.proyectosAsignados >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.min((d.proyectosAsignados / 5) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      d.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedDocente(d); setModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Mostrando {filtered.length} evaluadores
        </p>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                page === i + 1 ? 'bg-[#162748] text-white shadow-xl shadow-blue-900/20' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-[#162748]">
                    {selectedDocente?.id ? 'Editar Docente' : 'Nuevo Docente'}
                  </h2>
                  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                    <input 
                      required type="text" placeholder="Ej: Dr. Juan Pérez"
                      value={selectedDocente?.nombre || ''}
                      onChange={e => setSelectedDocente({...selectedDocente, nombre: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                      <input 
                        required type="email" placeholder="juan@example.com"
                        value={selectedDocente?.email || ''}
                        onChange={e => setSelectedDocente({...selectedDocente, email: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código</label>
                      <input 
                        type="text" placeholder="DOC-001"
                        value={selectedDocente?.codigo || ''}
                        onChange={e => setSelectedDocente({...selectedDocente, codigo: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Especialidad</label>
                      <input 
                        type="text" placeholder="IA, Software, etc."
                        value={selectedDocente?.especialidad || ''}
                        onChange={e => setSelectedDocente({...selectedDocente, especialidad: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado</label>
                      <select 
                        value={selectedDocente?.estado || 'Activo'}
                        onChange={e => setSelectedDocente({...selectedDocente, estado: e.target.value as any})}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all appearance-none"
                      >
                        <option value="Activo">Activo</option>
                        <option value="En Receso">En Receso</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      disabled={isSaving}
                      className="w-full bg-[#162748] hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span className="uppercase tracking-widest text-xs">Guardar Evaluador</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] border ${
              message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest">Notificación</p>
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

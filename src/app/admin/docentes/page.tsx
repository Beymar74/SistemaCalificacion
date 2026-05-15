'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  UserCheck,
  Briefcase,
  RefreshCw,
  X,
  Save,
  Edit3,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDocentesAdmin, upsertDocente, deshabilitarDocente, type DocenteAdmin } from '@/lib/db';

const PAGE_SIZE = 8;
const DEFAULT_PASSWORD = 'EMI2026*';
const PREFIJOS = new Set(['Dr.', 'Dra.', 'Ing.', 'MSc.', 'Lic.', 'Mgr.', 'Prof.']);

function normalizarTexto(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function generarUsername(nombre: string): string {
  const palabras = nombre.split(' ').filter(w => w.length > 0 && !PREFIJOS.has(w));
  if (palabras.length === 0) return 'usuario';
  if (palabras.length === 1) return normalizarTexto(palabras[0]);
  const inicial = normalizarTexto(palabras[0])[0] || 'u';
  const apellido = normalizarTexto(palabras[1]);
  return inicial + apellido;
}

const StatCard = ({ title, value, icon: Icon, color, delay }: {
  title: string; value: number | string; icon: React.ElementType; color: string; delay: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<Partial<DocenteAdmin> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'assigned' | 'unassigned' | 'saturated'>('all');
  const [showConfirmDisable, setShowConfirmDisable] = useState<DocenteAdmin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await fetchDocentesAdmin();
      setDocentesData(data);
    } catch {
      setError('No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleNombreChange = (nombre: string) => {
    setSelectedDocente(prev => ({ ...prev, nombre }));
    if (!selectedDocente?.id) {
      setGeneratedUsername(generarUsername(nombre));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocente?.nombre || !selectedDocente?.email) return;

    setIsSaving(true);
    const isNew = !selectedDocente.id;
    const username = generatedUsername || selectedDocente.codigo || '';
    let userId = selectedDocente.id;

    // 1. Si es nuevo, primero creamos el usuario en Auth para obtener el ID real
    if (isNew) {
      try {
        const res = await fetch('/api/crear-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: selectedDocente.email, nombre: selectedDocente.nombre, username })
        });
        const json = await res.json();
        
        if (!res.ok) {
          setMessage({ text: `Error al crear acceso: ${json.error}`, type: 'error' });
          setIsSaving(false);
          setTimeout(() => setMessage(null), 5000);
          return;
        }
        userId = json.id;
      } catch (err) {
        setMessage({ text: 'Error de conexión al crear el usuario.', type: 'error' });
        setIsSaving(false);
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    }

    // 2. Ahora guardamos en la tabla personas (sea nuevo o actualización)
    const payload = {
      id_usuario: userId,
      nombre_completo: selectedDocente.nombre,
      email: selectedDocente.email,
      username,
      materia: selectedDocente.departamento,
      grado: selectedDocente.especialidad,
      estado: selectedDocente.estado === 'Activo'
    };

    const { error: dbErr } = await upsertDocente(payload);

    if (dbErr) {
      const errorMsg = (dbErr as any).message || JSON.stringify(dbErr);
      setMessage({ text: `Error al guardar en BD: ${errorMsg}`, type: 'error' });
      setIsSaving(false);
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    // Éxito
    if (isNew) {
      setMessage({ text: `Docente creado. Usuario: ${username} | Contraseña: ${DEFAULT_PASSWORD}`, type: 'success' });
    } else {
      setMessage({ text: 'Docente actualizado correctamente.', type: 'success' });
    }

    setIsSaving(false);
    setModalOpen(false);
    cargarDatos();
    setTimeout(() => setMessage(null), 6000);
  };

  const handleDisable = async (docente: DocenteAdmin) => {
    const { error } = await deshabilitarDocente(docente.id);
    setShowConfirmDisable(null);
    if (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } else {
      setMessage({ text: `${docente.nombre} fue dado de baja.`, type: 'success' });
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
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Users className="w-4 h-4" />
            <span>Docentes / Jurados</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">Gestión de Evaluadores</h1>
          <p className="text-slate-500 font-medium mt-1">
            Administre las cuentas de los docentes. La contraseña por defecto es <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-black">{DEFAULT_PASSWORD}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={cargarDatos} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setSelectedDocente({ estado: 'Activo' }); setGeneratedUsername(''); setModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[#162748] hover:bg-black text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>Agregar Docente</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Docentes" value={stats.total} icon={Users} color="bg-blue-600" delay={0.1} />
        <StatCard title="Docentes Activos" value={stats.activos} icon={UserCheck} color="bg-emerald-500" delay={0.2} />
        <StatCard title="Carga Global" value={stats.totalProyectos} icon={Briefcase} color="bg-indigo-500" delay={0.3} />
      </div>

      {/* Table */}
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
              { id: 'saturated', label: 'Saturados', icon: AlertTriangle }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterWorkload(f.id as 'all' | 'assigned' | 'unassigned' | 'saturated')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-none ${
                  filterWorkload === f.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
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
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario / Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando datos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center"><p className="text-red-500 font-bold text-sm">{error}</p></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay docentes registrados.</p></td></tr>
              ) : paginated.map(d => (
                <tr key={d.id} className={`hover:bg-slate-50/80 transition-colors group ${d.estado !== 'Activo' ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">
                        {d.initials}
                      </div>
                      <p className="text-sm font-bold text-slate-800">{d.nombre}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-slate-700 uppercase">{d.codigo || '—'}</p>
                    <p className="text-[10px] text-slate-400">{d.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {d.especialidad}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <span className={`text-[10px] font-black uppercase tracking-tight ${
                        d.proyectosAsignados >= 5 ? 'text-red-600' : d.proyectosAsignados >= 3 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {d.proyectosAsignados} / 5 Proyectos
                      </span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${d.proyectosAsignados >= 5 ? 'bg-red-600' : d.proyectosAsignados >= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((d.proyectosAsignados / 5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      d.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button
                      onClick={() => { setSelectedDocente(d); setGeneratedUsername(d.codigo || ''); setModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {d.estado === 'Activo' && (
                      <button
                        onClick={() => setShowConfirmDisable(d)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Dar de baja"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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

      {/* Modal Agregar / Editar */}
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
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-7 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-[#162748]">
                    {selectedDocente?.id ? 'Editar Docente' : 'Nuevo Docente'}
                  </h2>
                  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {!selectedDocente?.id && (
                  <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <Key className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Contraseña por defecto</p>
                      <p className="text-sm font-bold text-blue-900">{DEFAULT_PASSWORD}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
                    <input
                      required type="text" placeholder="Ej: Ing. María López"
                      value={selectedDocente?.nombre || ''}
                      onChange={e => handleNombreChange(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                    <input
                      required type="email" placeholder="docente@emi.edu.bo"
                      value={selectedDocente?.email || ''}
                      onChange={e => setSelectedDocente({ ...selectedDocente, email: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Usuario (auto)
                      </label>
                      <input
                        type="text" placeholder="Auto"
                        value={selectedDocente?.id ? (selectedDocente.codigo || '') : generatedUsername}
                        onChange={e => {
                          if (selectedDocente?.id) setSelectedDocente({ ...selectedDocente, codigo: e.target.value });
                          else setGeneratedUsername(e.target.value);
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-black text-sm outline-none transition-all text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado</label>
                      <select
                        value={selectedDocente?.estado || 'Activo'}
                        onChange={e => setSelectedDocente({ ...selectedDocente, estado: e.target.value as 'Activo' | 'Inactivo' })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all appearance-none"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Materia / Área</label>
                      <input
                        type="text" placeholder="Ej: Sistemas"
                        value={selectedDocente?.departamento || ''}
                        onChange={e => setSelectedDocente({ ...selectedDocente, departamento: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grado / Especialidad</label>
                      <input
                        type="text" placeholder="Ej: Mg."
                        value={selectedDocente?.especialidad || ''}
                        onChange={e => setSelectedDocente({ ...selectedDocente, especialidad: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  {!selectedDocente?.id && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credenciales asignadas</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          User: <span className="text-indigo-600">{generatedUsername || '—'}</span>
                          {' '}· Pass: <span className="text-indigo-600">{DEFAULT_PASSWORD}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      disabled={isSaving}
                      className="w-full bg-[#162748] hover:bg-black text-white font-black py-3.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span className="uppercase tracking-widest text-xs">
                        {selectedDocente?.id ? 'Actualizar' : 'Crear Docente'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Disable Modal */}
      <AnimatePresence>
        {showConfirmDisable && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConfirmDisable(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserMinus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#162748] mb-2">¿Dar de baja?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Se desactivará la cuenta de <strong>{showConfirmDisable.nombre}</strong>. No se eliminará permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDisable(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDisable(showConfirmDisable)}
                  className="flex-1 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg text-xs uppercase tracking-widest"
                >
                  Dar de Baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] border max-w-sm ${
              message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest mb-1">Notificación</p>
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

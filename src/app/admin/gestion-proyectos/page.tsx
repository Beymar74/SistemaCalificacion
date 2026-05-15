'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit3,
  UserPlus,
  Users,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  Layers,
  PowerOff,
  Power,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchProyectosParaGestion,
  fetchEvaluadoresDisponibles,
  crearAsignacion,
  actualizarProyecto,
  deshabilitarProyecto,
  habilitarProyecto,
  cambiarAsistenciaProyecto,
  eliminarAsignacion,
  type EvaluadorDisponible,
} from '@/lib/db';
import { supabase } from '../../../lib/supabase';
import type { ProyectoGestion } from '../../../lib/data';

export default function GestionProyectosPage() {
  const [proyectos, setProyectos] = useState<ProyectoGestion[]>([]);
  const [evaluadores, setEvaluadores] = useState<EvaluadorDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [assignModal, setAssignModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [selected, setSelected] = useState<ProyectoGestion | null>(null);
  const [selectedEval, setSelectedEval] = useState('');
  const [assignedDocenteIds, setAssignedDocenteIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'present' | 'absent'>('all');
  const [filterAssignment, setFilterAssignment] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const [projectForm, setProjectForm] = useState({
    codigo: '',
    nombre: '',
    categoria: 'General',
    sociedad: '',
    gestion: new Date().getFullYear().toString()
  });

  const handleOpenAssign = async (p: ProyectoGestion) => {
    setSelected(p);
    setAssignModal(true);
    setSelectedEval('');
    const { data } = await supabase
      .from('asignaciones')
      .select('id_docente')
      .eq('id_proyecto', p.id);
    if (data) setAssignedDocenteIds(data.map((a: { id_docente: string }) => a.id_docente));
  };

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([fetchProyectosParaGestion(), fetchEvaluadoresDisponibles()]);
      setProyectos(p);
      setEvaluadores(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const notify = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    let res;
    if (isEditing && selected) {
      res = await actualizarProyecto(selected.id, projectForm);
    } else {
      res = await supabase.from('proyectos').insert([{
        codigo_proyecto: projectForm.codigo,
        nombre_proyecto: projectForm.nombre,
        categoria: projectForm.categoria,
        sociedad: projectForm.sociedad,
        gestion: projectForm.gestion
      }]);
    }
    setConfirming(false);
    if (res.error) {
      notify(`Error: ${res.error.message}`, 'error');
    } else {
      notify(isEditing ? 'Proyecto actualizado' : 'Proyecto creado', 'success');
      setProjectModal(false);
      setProjectForm({ codigo: '', nombre: '', categoria: 'General', sociedad: '', gestion: new Date().getFullYear().toString() });
      loadData();
    }
  };

  const handleEditClick = (p: ProyectoGestion) => {
    setSelected(p);
    setProjectForm({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.sector || 'General',
      sociedad: (p as any).sociedad || '',
      gestion: new Date().getFullYear().toString()
    });
    setIsEditing(true);
    setProjectModal(true);
  };

  const handleToggleAttendance = async (p: ProyectoGestion) => {
    const { error } = await cambiarAsistenciaProyecto(p.id, !p.asistio);
    if (error) notify(error.message, 'error');
    else loadData();
  };

  const handleToggleHabilitado = async (p: ProyectoGestion) => {
    const estaHabilitado = (p as any).habilitado !== false;
    const { error } = estaHabilitado
      ? await deshabilitarProyecto(p.id)
      : await habilitarProyecto(p.id);
    if (error) notify((error as any).message || 'Error', 'error');
    else {
      notify(estaHabilitado ? 'Proyecto deshabilitado' : 'Proyecto habilitado', 'success');
      loadData();
    }
  };

  const handleAssign = async () => {
    if (!selected || !selectedEval) return;
    setConfirming(true);
    const { error } = await crearAsignacion(selected.id, selectedEval);
    setConfirming(false);
    if (error) notify(error.message, 'error');
    else { notify('Asignación exitosa', 'success'); setAssignModal(false); loadData(); }
  };

  const handleRemoveAssignment = async (idAsignacion: string) => {
    if (!confirm('¿Seguro que desea eliminar esta asignación?')) return;
    const { error } = await eliminarAsignacion(idAsignacion);
    if (error) notify(error.message, 'error');
    else { notify('Asignación eliminada', 'success'); loadData(); }
  };

  const filteredProyectos = proyectos.filter(p => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAttendance =
      filterAttendance === 'all' ? true :
      filterAttendance === 'present' ? p.asistio : !p.asistio;
    const matchesAssignment =
      filterAssignment === 'all' ? true :
      filterAssignment === 'assigned' ? p.evaluadores.length > 0 : p.evaluadores.length === 0;
    return matchesSearch && matchesAttendance && matchesAssignment;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Layers className="w-4 h-4" />
            <span>Administración</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">Gestión de Proyectos</h1>
          <p className="text-slate-500 font-medium mt-1">Gestione proyectos, jurados, asignaciones y asistencia.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setIsEditing(false); setProjectForm({ codigo: '', nombre: '', categoria: 'General', sociedad: '', gestion: new Date().getFullYear().toString() }); setProjectModal(true); }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Proyectos</p>
          <p className="text-2xl font-black text-[#162748]">{proyectos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jurados Disponibles</p>
          <p className="text-2xl font-black text-[#162748]">{evaluadores.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gestión Activa</p>
          <p className="text-2xl font-black text-blue-600">{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-blue-600/10 focus:bg-white transition-all font-medium"
            />
          </div>
          <button
            onClick={() => {
              const cycle: Record<string, 'all' | 'present' | 'absent'> = { all: 'present', present: 'absent', absent: 'all' };
              setFilterAttendance(cycle[filterAttendance]);
            }}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 border-2 ${
              filterAttendance !== 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest px-1">
              {filterAttendance === 'all' ? 'Asistencia: Todos' : filterAttendance === 'present' ? 'Solo Presentes' : 'Solo Ausentes'}
            </span>
          </button>
          <button
            onClick={() => {
              const cycle: Record<string, 'all' | 'assigned' | 'unassigned'> = { all: 'assigned', assigned: 'unassigned', unassigned: 'all' };
              setFilterAssignment(cycle[filterAssignment]);
            }}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 border-2 ${
              filterAssignment !== 'all' ? 'bg-[#162748] border-[#162748] text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest px-1">
              {filterAssignment === 'all' ? 'Asignación: Todos' : filterAssignment === 'assigned' ? 'Con Jurado' : 'Sin Jurado'}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto / Sociedad</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Asistencia</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Actualizando lista...</p>
                  </td>
                </tr>
              ) : filteredProyectos.map(p => {
                const estaHabilitado = (p as any).habilitado !== false;
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors group ${!estaHabilitado ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-6 py-5">
                      <span className="font-black text-[#162748] text-sm">{p.codigo}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-800 leading-tight">{p.nombre}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0 ${
                            p.evaluadores.length >= 4 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {p.evaluadores.length}/4
                          </span>
                        </div>
                        {(p as any).sociedad && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">{(p as any).sociedad}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {p.evaluadores.length > 0 ? p.evaluadores.map(ev => (
                            <div
                              key={ev.idAsignacion}
                              className="group/tag flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg transition-all hover:border-blue-200 hover:bg-white"
                            >
                              <span className="text-[10px] font-bold text-slate-500 group-hover/tag:text-blue-600">{ev.nombre}</span>
                              <button onClick={() => handleRemoveAssignment(ev.idAsignacion)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )) : (
                            <span className="text-[10px] text-slate-300 font-medium italic">Sin docentes asignados</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleAttendance(p)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                          p.asistio
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {p.asistio ? '✓ Presente' : '✗ Ausente'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        estaHabilitado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {estaHabilitado ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAssign(p)}
                          disabled={p.evaluadores.length >= 4 || !estaHabilitado}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#162748] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          title={p.evaluadores.length >= 4 ? 'Cupo completo: 4/4 docentes asignados' : 'Asignar docente'}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{p.evaluadores.length >= 4 ? 'Completo' : 'Asignar'}</span>
                        </button>
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleHabilitado(p)}
                          className={`p-2.5 rounded-xl transition-all ${
                            estaHabilitado
                              ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={estaHabilitado ? 'Deshabilitar proyecto' : 'Habilitar proyecto'}
                        >
                          {estaHabilitado ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Form Modal */}
      <AnimatePresence>
        {projectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setProjectModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-[#162748]">{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
                  <button onClick={() => setProjectModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleSaveProject} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código</label>
                      <input
                        required type="text" placeholder="Ej: P-19"
                        value={projectForm.codigo}
                        onChange={e => setProjectForm({ ...projectForm, codigo: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gestión</label>
                      <input
                        required type="text"
                        value={projectForm.gestion}
                        onChange={e => setProjectForm({ ...projectForm, gestion: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Proyecto</label>
                    <input
                      required type="text" placeholder="Nombre completo del proyecto"
                      value={projectForm.nombre}
                      onChange={e => setProjectForm({ ...projectForm, nombre: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-600/10 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                      <input
                        required type="text" placeholder="Ej: Tecnología"
                        value={projectForm.categoria}
                        onChange={e => setProjectForm({ ...projectForm, categoria: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sociedad</label>
                      <input
                        type="text" placeholder="Ej: Soc. Científica"
                        value={projectForm.sociedad}
                        onChange={e => setProjectForm({ ...projectForm, sociedad: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-600/10 font-bold text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      disabled={confirming}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-2"
                    >
                      {confirming ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span className="uppercase tracking-widest text-xs">{isEditing ? 'Actualizar' : 'Guardar'} Proyecto</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAssignModal(false)}
              className="absolute inset-0 bg-[#162748]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-[#162748]">Asignar Evaluador</h2>
                  <button onClick={() => setAssignModal(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Proyecto Seleccionado</p>
                  <h3 className="text-base font-black text-[#162748] leading-tight">{selected.nombre}</h3>
                  <p className="text-xs text-blue-600 font-bold mt-0.5 uppercase tracking-tight">{selected.codigo} · {selected.sector}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                {selected.evaluadores.length >= 4 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#162748]">Cupo completo (4/4)</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Elimina una asignación antes de agregar otra.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Seleccionar Docente</label>
                    {evaluadores.filter(ev => !assignedDocenteIds.includes(ev.id)).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEval(ev.id)}
                        className={`w-full flex items-center gap-5 p-4 rounded-3xl border-2 transition-all text-left group ${
                          selectedEval === ev.id
                            ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-900/10'
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 transition-all ${
                          selectedEval === ev.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-300 border border-slate-100'
                        }`}>
                          {ev.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black transition-colors ${selectedEval === ev.id ? 'text-blue-700' : 'text-slate-800'}`}>
                            {ev.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{ev.departamento}</p>
                        </div>
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
                          (ev.asignaciones || 0) >= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ev.asignaciones || 0}/5
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 pt-6 bg-white border-t border-slate-50">
                <button
                  onClick={handleAssign}
                  disabled={confirming || !selectedEval}
                  className="w-full bg-[#162748] hover:bg-black disabled:bg-slate-200 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {confirming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {confirming ? 'Procesando...' : 'Confirmar Asignación'}
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border ${
              message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
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

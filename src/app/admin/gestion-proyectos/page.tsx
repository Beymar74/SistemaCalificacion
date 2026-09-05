'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Users,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  PowerOff,
  Power,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import {
  fetchProyectosParaGestion,
  fetchEvaluadoresDisponibles,
  crearAsignacion,
  autoAsignarDocentes,
  actualizarProyecto,
  deshabilitarProyecto,
  habilitarProyecto,
  cambiarAsistenciaProyecto,
  eliminarAsignacion,
  type EvaluadorDisponible,
} from '@/lib/db';
import { supabase } from '../../../lib/supabase';
import type { ProyectoGestion } from '../../../lib/data';
import {
  CATEGORIAS,
  CARRERAS,
  CARRERAS_INGENIERIAS,
  CARRERAS_TECNICOS,
  CATEGORIA_DEFAULT,
  CARRERA_DEFAULT,
  getCategoriaPorCarrera,
} from '@/lib/constants';
import CarreraBadge from '@/components/CarreraBadge';

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
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('active');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterCarrera, setFilterCarrera] = useState<string>('all');

  const [quickFilterIncomplete, setQuickFilterIncomplete] = useState(false);
  const [evalSearchTerm, setEvalSearchTerm] = useState('');

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingEvalName, setDeletingEvalName] = useState<string>('');
  const [confirmAutoAssign, setConfirmAutoAssign] = useState(false);

  // ── NUEVO: modal de código duplicado ──
  const [duplicateCodeModal, setDuplicateCodeModal] = useState(false);

  const [projectForm, setProjectForm] = useState({
    codigo: '',
    nombre: '',
    categoria: CATEGORIA_DEFAULT as string,
    carrera: CARRERA_DEFAULT as string,
    sociedad: '',
    gestion: new Date().getFullYear().toString()
  });

  const carrerasDisponiblesPorCategoria = useMemo(() => {
    const cat = projectForm.categoria;
    if (!cat) return CARRERAS;
    const filtradas = CARRERAS.filter(c => getCategoriaPorCarrera(c) === cat);
    return filtradas.length > 0 ? filtradas : CARRERAS;
  }, [projectForm.categoria]);

  const handleOpenAssign = async (p: ProyectoGestion) => {
    setSelected(p);
    setAssignModal(true);
    setSelectedEval('');
    setEvalSearchTerm('');
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

    // ── NUEVO: validación de código duplicado al crear ──
    if (!isEditing) {
      const codigoNormalizado = projectForm.codigo.trim().toLowerCase();
      const existe = proyectos.some(
        p => p.codigo.trim().toLowerCase() === codigoNormalizado
      );
      if (existe) {
        setDuplicateCodeModal(true);
        return;
      }
    }

    setConfirming(true);
    let res;
    if (isEditing && selected) {
      res = await actualizarProyecto(selected.id, projectForm);
    } else {
      res = await supabase.from('proyectos').insert([{
        codigo_proyecto: projectForm.codigo,
        nombre_proyecto: projectForm.nombre,
        categoria: projectForm.categoria,
        sociedad: projectForm.carrera || projectForm.sociedad,
        gestion: projectForm.gestion
      }]);
    }
    setConfirming(false);
    if (res.error) {
      notify(`Error: ${res.error.message}`, 'error');
    } else {
      notify(isEditing ? 'Proyecto actualizado' : 'Proyecto creado', 'success');
      setProjectModal(false);
      setProjectForm({ codigo: '', nombre: '', categoria: CATEGORIA_DEFAULT, carrera: CARRERA_DEFAULT, sociedad: '', gestion: new Date().getFullYear().toString() });
      loadData();
    }
  };

  const handleEditClick = (p: ProyectoGestion) => {
    setSelected(p);
    setProjectForm({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.sector || CATEGORIA_DEFAULT,
      carrera: p.carrera || p.sociedad || CARRERA_DEFAULT,
      sociedad: p.sociedad || '',
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
    const estaHabilitado = p.habilitado !== false;
    const { error } = estaHabilitado
      ? await deshabilitarProyecto(p.id)
      : await habilitarProyecto(p.id);
    if (error) notify(error.message || 'Error', 'error');
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

  const handleRemoveAssignment = (idAsignacion: string, nombre?: string) => {
    setPendingDeleteId(idAsignacion);
    setDeletingEvalName(nombre || 'este docente');
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setConfirming(true);
    const { error } = await eliminarAsignacion(pendingDeleteId);
    setConfirming(false);
    setConfirmDeleteModal(false);
    setPendingDeleteId(null);
    setDeletingEvalName('');
    if (error) notify(error.message, 'error');
    else { notify('Asignación eliminada', 'success'); loadData(); }
  };

  const handleAutoAssignConfirm = async () => {
    setConfirming(true);
    const { success, count, error } = await autoAsignarDocentes();
    setConfirming(false);
    setConfirmAutoAssign(false);
    if (!success) {
      notify(error || 'Error en la asignación automática', 'error');
    } else {
      notify(`Se realizaron ${count} asignaciones automáticas exitosamente.`, 'success');
      loadData();
    }
  };

  const incompletos = proyectos.filter(p => p.habilitado !== false && p.evaluadores.length < 3).length;

  const filteredProyectos = proyectos.filter(p => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.carrera || p.sociedad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.evaluadores.some(ev => ev.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAttendance =
      filterAttendance === 'all' ? true :
        filterAttendance === 'present' ? p.asistio : !p.asistio;
    const matchesAssignment =
      filterAssignment === 'all' ? true :
        filterAssignment === 'assigned' ? p.evaluadores.length > 0 : p.evaluadores.length === 0;
    const matchesState =
      filterState === 'all' ? true :
        filterState === 'active' ? (p.habilitado !== false) : (p.habilitado === false);
    const matchesCategoria =
      filterCategoria === 'all' ? true : p.sector === filterCategoria;
    const matchesCarrera =
      filterCarrera === 'all' ? true : (p.carrera || p.sociedad) === filterCarrera;
    const matchesIncomplete = quickFilterIncomplete
      ? p.habilitado !== false && p.evaluadores.length < 3
      : true;
    return matchesSearch && matchesAttendance && matchesAssignment && matchesState && matchesCategoria && matchesCarrera && matchesIncomplete;
  }).sort((a, b) => {
    const numA = parseInt(a.codigo.replace(/\D/g, ''), 10);
    const numB = parseInt(b.codigo.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  const filteredEvaluadores = evaluadores
    .filter(ev => !assignedDocenteIds.includes(ev.id))
    .filter(ev =>
      ev.nombre.toLowerCase().includes(evalSearchTerm.toLowerCase())
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#094e8f] font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Layers className="w-4 h-4" />
            <span>Administración</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#162748] tracking-tight">Gestión de Proyectos</h1>
          <p className="text-slate-500 font-medium mt-1">Gestione proyectos, jurados, asignaciones y asistencia.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer" title="Actualizar datos">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setIsEditing(false); setProjectForm({ codigo: '', nombre: '', categoria: CATEGORIA_DEFAULT, carrera: CARRERA_DEFAULT, sociedad: '', gestion: new Date().getFullYear().toString() }); setProjectModal(true); }}
            className="flex items-center justify-center gap-2 bg-[#094e8f] hover:bg-[#073b6d] text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-900/15 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="gestion-proyectos"
        title="Guía de Operaciones: Gestión y Asignación de Proyectos"
        description="Configure el núcleo de la feria. Desde esta pantalla puede registrar nuevos proyectos, controlar la asistencia de los grupos en los stands (Presente/Ausente) y asignar jurados evaluadores por cada proyecto basándose en su disponibilidad. Si es necesario, puede dar de baja proyectos o remover asignaciones."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Proyectos</p>
            <p className="text-2xl font-black text-[#162748]">{proyectos.length}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-[#094e8f] rounded-2xl flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jurados Disponibles</p>
            <p className="text-2xl font-black text-[#162748]">{evaluadores.length}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gestión Activa</p>
            <p className="text-2xl font-black text-[#094e8f]">{new Date().getFullYear()}</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <button
          onClick={() => setQuickFilterIncomplete(prev => !prev)}
          className={`p-5 rounded-[2rem] border-2 shadow-sm text-left transition-all active:scale-95 flex items-center justify-between cursor-pointer ${
            quickFilterIncomplete
              ? 'bg-amber-500 border-amber-400 shadow-amber-900/10 text-white'
              : incompletos > 0
              ? 'bg-white border-amber-200 hover:border-amber-300 hover:bg-amber-50/40'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${quickFilterIncomplete ? 'text-amber-100' : 'text-slate-400'}`}>
              Sin Completar
            </p>
            <p className={`text-2xl font-black ${quickFilterIncomplete ? 'text-white' : incompletos > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
              {incompletos}
            </p>
            <p className={`text-[10px] font-bold mt-0.5 ${quickFilterIncomplete ? 'text-amber-100' : 'text-slate-400'}`}>
              {quickFilterIncomplete ? 'Mostrando incompletos' : 'proyectos sin 3 jurados'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            quickFilterIncomplete ? 'bg-amber-600 text-white' : incompletos > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Banner filtro rápido */}
      <AnimatePresence>
        {quickFilterIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700">
                Mostrando solo los <span className="font-black">{incompletos}</span> proyectos habilitados con menos de 3 jurados asignados.
              </p>
            </div>
            <button
              onClick={() => setQuickFilterIncomplete(false)}
              className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-800 uppercase tracking-widest transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Quitar filtro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 flex-wrap bg-slate-50/40">
          {/* Buscar */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Buscar</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o docente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#094e8f]/40 focus:ring-2 focus:ring-[#094e8f]/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Categoría</span>
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f]/40 cursor-pointer transition-colors"
            >
              <option value="all">Todas las Categorías</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Carrera */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Carrera</span>
            <select
              value={filterCarrera}
              onChange={e => setFilterCarrera(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f]/40 cursor-pointer transition-colors"
            >
              <option value="all">Todas las Carreras</option>
              <optgroup label="Ingenierías">
                {CARRERAS_INGENIERIAS.map(car => (
                  <option key={car} value={car}>{car}</option>
                ))}
              </optgroup>
              <optgroup label="Técnicos Superiores">
                {CARRERAS_TECNICOS.map(car => (
                  <option key={car} value={car}>{car}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Asistencia */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Asistencia</span>
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterAttendance('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAttendance === 'all'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterAttendance('present')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAttendance === 'present'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Presentes
              </button>
              <button
                type="button"
                onClick={() => setFilterAttendance('absent')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAttendance === 'absent'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Ausentes
              </button>
            </div>
          </div>

          {/* Asignación */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Asignación de Jurados</span>
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterAssignment('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAssignment === 'all'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterAssignment('assigned')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAssignment === 'assigned'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Con Jurado
              </button>
              <button
                type="button"
                onClick={() => setFilterAssignment('unassigned')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterAssignment === 'unassigned'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Sin Jurado
              </button>
            </div>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Estado de Proyecto</span>
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterState('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterState === 'all'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterState('active')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterState === 'active'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Habilitados
              </button>
              <button
                type="button"
                onClick={() => setFilterState('inactive')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterState === 'inactive'
                  ? 'bg-[#094e8f] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Inhabilitados
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto / Carrera</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Asistencia</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Actualizando lista...</p>
                  </td>
                </tr>
              ) : filteredProyectos.map(p => {
                const estaHabilitado = p.habilitado !== false;
                const carreraNombre = p.carrera || p.sociedad;
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors group ${!estaHabilitado ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-slate-100 text-[#094e8f] border border-slate-200/80 whitespace-nowrap tracking-wide">
                        {p.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-black text-slate-800 leading-tight">{p.nombre}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0 ${p.evaluadores.length >= 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                            {p.evaluadores.length}/3
                          </span>
                        </div>
                        {carreraNombre && (
                          <div className="mb-2">
                            <CarreraBadge carrera={carreraNombre} size="xs" />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {p.evaluadores.map(ev => (
                            <div
                              key={ev.idAsignacion}
                              className="group/tag flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg transition-all hover:border-red-200 hover:bg-red-50/40"
                            >
                              <span className="text-[10px] font-bold text-slate-500 group-hover/tag:text-red-500">{ev.nombre}</span>
                              <button onClick={() => handleRemoveAssignment(ev.idAsignacion, ev.nombre)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {p.evaluadores.length < 3 && estaHabilitado ? (
                            <button
                              onClick={() => handleOpenAssign(p)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                              title="Asignar jurado"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Asignar</span>
                            </button>
                          ) : p.evaluadores.length === 0 ? (
                            <span className="text-[10px] text-slate-300 font-medium italic">Sin docentes asignados</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-[#094e8f] font-bold text-xs rounded-lg border border-blue-200/60 whitespace-nowrap inline-flex items-center shadow-2xs">
                        {p.sector}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(p)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${p.asistio
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100'
                          }`}
                        title="Clic para alternar asistencia"
                      >
                        {p.asistio ? '✓ Presente' : '✗ Ausente'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleHabilitado(p)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${estaHabilitado
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        title={estaHabilitado ? 'Clic para inhabilitar' : 'Clic para habilitar'}
                      >
                        <span className={`w-2 h-2 rounded-full ${estaHabilitado ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                        <span>{estaHabilitado ? 'Activo' : 'Baja'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleHabilitado(p)}
                          className={`p-2.5 rounded-xl transition-all ${estaHabilitado
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
                        required type="text" placeholder="Ej: P-38"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría *</label>
                      <select
                        required
                        value={projectForm.categoria}
                        onChange={e => {
                          const nuevaCat = e.target.value;
                          const validas = CARRERAS.filter(c => getCategoriaPorCarrera(c) === nuevaCat);
                          setProjectForm({ 
                            ...projectForm, 
                            categoria: nuevaCat,
                            carrera: validas.includes(projectForm.carrera as any) ? projectForm.carrera : (validas[0] || CARRERA_DEFAULT)
                          });
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#094e8f]/30 font-bold text-sm outline-none transition-all"
                      >
                        {CATEGORIAS.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Carrera *</label>
                      <select
                        required
                        value={projectForm.carrera}
                        onChange={e => {
                          const newCar = e.target.value;
                          setProjectForm({ 
                            ...projectForm, 
                            carrera: newCar,
                            categoria: getCategoriaPorCarrera(newCar)
                          });
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#094e8f]/30 font-bold text-sm outline-none transition-all"
                      >
                        {carrerasDisponiblesPorCategoria.map(car => (
                          <option key={car} value={car}>{car}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      disabled={confirming}
                      className="w-full bg-[#094e8f] hover:bg-[#073b6d] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/15 transition-all flex items-center justify-center gap-2"
                    >
                      {confirming ? <RefreshCw className="w-5 h-5 animate-spin text-[#f0d114]" /> : <CheckCircle2 className="w-5 h-5 text-[#f0d114]" />}
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

                {selected.evaluadores.length < 3 && (
                  <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar docente por nombre..."
                      value={evalSearchTerm}
                      onChange={e => { setEvalSearchTerm(e.target.value); setSelectedEval(''); }}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:border-blue-600/10 focus:bg-white transition-all font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                {selected.evaluadores.length >= 3 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#162748]">Cupo completo (3/3)</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Elimina una asignación antes de agregar otra.</p>
                    </div>
                  </div>
                ) : filteredEvaluadores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <Search className="w-8 h-8 text-slate-200" />
                    <p className="text-sm font-black text-slate-400">Sin resultados</p>
                    <p className="text-xs text-slate-300 font-medium">Intenta con otro nombre.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Seleccionar Docente</label>
                    {filteredEvaluadores.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEval(ev.id)}
                        className={`w-full flex items-center gap-5 p-4 rounded-3xl border-2 transition-all text-left group ${selectedEval === ev.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-900/10'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 transition-all ${selectedEval === ev.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-300 border border-slate-100'
                          }`}>
                          {ev.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black transition-colors ${selectedEval === ev.id ? 'text-blue-700' : 'text-slate-800'}`}>
                            {ev.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{ev.departamento}</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-blue-50 text-[#094e8f] border border-blue-100/80 whitespace-nowrap shadow-2xs">
                          {ev.asignaciones || 0} {ev.asignaciones === 1 ? 'proy.' : 'proys.'}
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

      {/* Modal de confirmación para eliminar asignación */}
      <AnimatePresence>
        {confirmDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setConfirmDeleteModal(false); setPendingDeleteId(null); }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-[#162748] mb-2">Eliminar Asignación</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    ¿Seguro que desea quitar a{' '}
                    <span className="font-black text-slate-700">{deletingEvalName}</span>{' '}
                    de este proyecto?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setConfirmDeleteModal(false); setPendingDeleteId(null); }}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={confirming}
                    className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {confirming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {confirming ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación para asignación automática */}
      <AnimatePresence>
        {confirmAutoAssign && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmAutoAssign(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-[#162748] mb-2">Asignación Automática</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    ¿Deseas asignar automáticamente <strong className="text-slate-800">3 jurados evaluadores</strong> a todos los proyectos habilitados que falten?
                  </p>
                  <p className="text-[11px] text-indigo-500 font-bold mt-2 leading-relaxed">
                    La carga de proyectos se distribuirá equitativamente entre los docentes activos. Las asignaciones existentes no se alterarán.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmAutoAssign(false)}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAutoAssignConfirm}
                    disabled={confirming}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {confirming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {confirming ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NUEVO: Modal de código duplicado ── */}
      <AnimatePresence>
        {duplicateCodeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDuplicateCodeModal(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-amber-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-[#162748] mb-2">Código ya registrado</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    El código{' '}
                    <span className="font-black text-[#162748] bg-slate-100 px-2 py-0.5 rounded-lg">
                      {projectForm.codigo}
                    </span>{' '}
                    ya pertenece a otro proyecto. Por favor ingrese un código diferente.
                  </p>
                </div>
                <button
                  onClick={() => setDuplicateCodeModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-[#162748] hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
                >
                  Entendido, cambiar código
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
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border ${message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
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
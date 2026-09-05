'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  UserCheck,
  UserX,
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
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { fetchDocentesAdmin, fetchAsignacionesDocente, upsertDocente, deshabilitarDocente, habilitarDocente, type DocenteAdmin } from '@/lib/db';
import type { ProyectoAsignado } from '@/lib/data';
import CarreraBadge from '@/components/CarreraBadge';

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

const StatCard = ({ title, value, icon: Icon, theme, subtext }: {
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  theme: 'blue' | 'emerald' | 'indigo'; 
  subtext: string;
}) => {
  const themes = {
    blue: {
      bubble: 'bg-blue-50 text-[#094e8f]',
      borderHover: 'hover:border-blue-200'
    },
    emerald: {
      bubble: 'bg-emerald-50 text-emerald-600',
      borderHover: 'hover:border-emerald-200'
    },
    indigo: {
      bubble: 'bg-indigo-50 text-indigo-600',
      borderHover: 'hover:border-indigo-200'
    }
  };

  const current = themes[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 sm:p-6 rounded-[2.2rem] border border-slate-200/80 shadow-xs flex items-start gap-4 hover:shadow-md ${current.borderHover} transition-all group`}
    >
      <div className={`w-11 h-11 rounded-2xl ${current.bubble} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtext}</p>
      </div>
    </motion.div>
  );
};

export default function DocentesPage() {
  const [activeTab, setActiveTab] = useState<'cuentas' | 'progreso'>('cuentas');
  const [docentesData, setDocentesData] = useState<DocenteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<Partial<DocenteAdmin> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'assigned' | 'unassigned' | 'saturated' | 'inactive' | 'visitors'>('all');
  const [showConfirmDisable, setShowConfirmDisable] = useState<DocenteAdmin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  // ── NUEVO: modal de correo duplicado ──
  const [duplicateEmailModal, setDuplicateEmailModal] = useState(false);

  // ── NUEVO: modal de proyectos asignados al docente ──
  const [proyectosModalDocente, setProyectosModalDocente] = useState<DocenteAdmin | null>(null);
  const [proyectosDocente, setProyectosDocente] = useState<ProyectoAsignado[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);

  const handleOpenProyectosModal = async (docente: DocenteAdmin) => {
    setProyectosModalDocente(docente);
    setLoadingProyectos(true);
    try {
      const proys = await fetchAsignacionesDocente(docente.id);
      setProyectosDocente(proys);
    } catch {
      setProyectosDocente([]);
    } finally {
      setLoadingProyectos(false);
    }
  };

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
    setGeneratedUsername(generarUsername(nombre));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocente?.nombre || !selectedDocente?.email) return;

    setIsSaving(true);
    const isNew = !selectedDocente.id;
    const username = generatedUsername || selectedDocente.codigo || '';
    let userId = selectedDocente.id;

    // ── Validación: email ya registrado en docentes existentes ──
    if (isNew) {
      const emailYaExiste = docentesData.some(
        d => d.email.toLowerCase().trim() === (selectedDocente.email || '').toLowerCase().trim()
      );
      if (emailYaExiste) {
        setIsSaving(false);
        setDuplicateEmailModal(true); // ── NUEVO: abre modal en lugar de notify ──
        return;
      }
    }

    // 1. Si es nuevo, crear usuario en Auth; si es edición y cambió el email, actualizar Auth
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
      } catch {
        setMessage({ text: 'Error de conexión al crear el usuario.', type: 'error' });
        setIsSaving(false);
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    } else if (selectedDocente.email?.toLowerCase().trim() !== originalEmail.toLowerCase().trim()) {
      // Email cambió en edición — sincronizar con Supabase Auth
      try {
        const res = await fetch('/api/actualizar-usuario', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_usuario: userId, email: selectedDocente.email })
        });
        const json = await res.json();
        if (!res.ok) {
          setMessage({ text: `Error al actualizar email en Auth: ${json.error}`, type: 'error' });
          setIsSaving(false);
          setTimeout(() => setMessage(null), 5000);
          return;
        }
      } catch {
        setMessage({ text: 'Error de conexión al actualizar el usuario.', type: 'error' });
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
      estado: selectedDocente.estado === 'Activo' ? true : selectedDocente.estado === 'Inactivo' ? false : null
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

  const handleEnable = async (docente: DocenteAdmin) => {
    const { error } = await habilitarDocente(docente.id);
    if (error) {
      setMessage({ text: `Error al activar: ${error.message}`, type: 'error' });
    } else {
      setMessage({ text: `${docente.nombre} fue activado correctamente.`, type: 'success' });
      cargarDatos();
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const filtered = useMemo(() => {
    return docentesData.filter(d => {
      const matchesSearch =
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo.toLowerCase().includes(search.toLowerCase()) ||
        d.especialidad.toLowerCase().includes(search.toLowerCase());
      const matchesWorkload =
        filterWorkload === 'all' ? (d.estado === 'Activo' || d.estado === 'Visitante') :
          filterWorkload === 'assigned' ? ((d.estado === 'Activo' || d.estado === 'Visitante') && d.proyectosAsignados > 0) :
            filterWorkload === 'unassigned' ? ((d.estado === 'Activo' || d.estado === 'Visitante') && d.proyectosAsignados === 0) :
              filterWorkload === 'saturated' ? ((d.estado === 'Activo' || d.estado === 'Visitante') && d.proyectosAsignados >= 10) :
                filterWorkload === 'inactive' ? d.estado === 'Inactivo' :
                  filterWorkload === 'visitors' ? d.estado === 'Visitante' : true;
      return matchesSearch && matchesWorkload;
    });
  }, [docentesData, search, filterWorkload]);

  const stats = useMemo(() => {
    const total = docentesData.length;
    const activos = docentesData.filter(d => d.estado === 'Activo' || d.estado === 'Visitante').length;
    const totalProyectos = docentesData.reduce((acc, d) => acc + d.proyectosAsignados, 0);
    return { total, activos, totalProyectos };
  }, [docentesData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#094e8f] border border-blue-100 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#094e8f]" />
              Docentes / Jurados Evaluadores
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#162748] tracking-tight">Gestión de Evaluadores</h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
            Administre las cuentas de los docentes jurados. La contraseña por defecto es <code className="bg-slate-100 px-2 py-0.5 rounded-md text-[#094e8f] font-bold font-mono text-xs">{DEFAULT_PASSWORD}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={cargarDatos} 
            title="Recargar evaluadores"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#094e8f] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => { setSelectedDocente({ estado: 'Activo' }); setGeneratedUsername(''); setModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[#094e8f] hover:bg-[#073c6e] text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-blue-900/10 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Docente</span>
          </button>
        </div>
      </div>

      {/* Help Banner */}
      <HelpBanner
        storageKey="docentes"
        title="Guía del Módulo: Cuentas de Docentes"
        description="Administre los accesos y especialidades de los docentes que actúan como jurados evaluadores. Puede dar de alta nuevos docentes, editar sus datos o inhabilitar cuentas. Recuerde que la contraseña por defecto para nuevas cuentas es EMI2026* y que cada jurado puede tener múltiples proyectos asignados según la necesidad de la feria."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard title="Total Docentes" value={stats.total} icon={Users} theme="blue" subtext="Docentes registrados" />
        <StatCard title="Docentes Activos" value={stats.activos} icon={UserCheck} theme="emerald" subtext="Habilitados para evaluar" />
        <StatCard title="Carga Global" value={stats.totalProyectos} icon={Briefcase} theme="indigo" subtext="Asignaciones totales" />
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-xs">
        <button
          onClick={() => setActiveTab('cuentas')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cuentas'
              ? 'bg-[#094e8f] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Gestión de Cuentas
        </button>
        <button
          onClick={() => setActiveTab('progreso')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'progreso'
              ? 'bg-[#094e8f] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Seguimiento de Evaluaciones
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o especialidad..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094e8f] focus:ring-2 focus:ring-[#094e8f]/10 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="inline-flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos', icon: Users },
              { id: 'assigned', label: 'Con Proyectos', icon: Briefcase },
              { id: 'unassigned', label: 'Disponibles', icon: UserCheck },
              { id: 'visitors', label: 'Visitantes', icon: Users },
              { id: 'inactive', label: 'Inactivos', icon: UserX }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterWorkload(f.id as 'all' | 'assigned' | 'unassigned' | 'saturated' | 'inactive' | 'visitors')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterWorkload === f.id
                    ? 'bg-[#094e8f] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              {activeTab === 'cuentas' ? (
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario / Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos Asignados</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos Evaluados</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos Pendientes</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso de Evaluación</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'cuentas' ? 6 : 6} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando datos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan={activeTab === 'cuentas' ? 6 : 6} className="px-6 py-20 text-center"><p className="text-red-500 font-bold text-sm">{error}</p></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={activeTab === 'cuentas' ? 6 : 6} className="px-6 py-20 text-center"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay docentes registrados.</p></td></tr>
              ) : activeTab === 'cuentas' ? (
                paginated.map(d => (
                  <tr key={d.id} className={`hover:bg-slate-50/80 transition-colors group ${d.estado === 'Inactivo' ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-bold font-mono text-indigo-700 border border-indigo-100 shadow-2xs flex-shrink-0">
                          {d.initials}
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-snug">{d.nombre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold font-mono text-slate-800 uppercase tracking-tight">{d.codigo || '—'}</p>
                      <p className="text-xs text-slate-400">{d.email}</p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100/80 whitespace-nowrap shadow-2xs">
                        {d.especialidad}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {d.proyectosAsignados > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenProyectosModal(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 active:scale-95 text-[#094e8f] border border-blue-200/80 hover:border-blue-300 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xs transition-all cursor-pointer group/btn"
                          title="Clic para ver proyectos asignados"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-[#094e8f] group-hover/btn:scale-110 transition-transform" />
                          <span>{d.proyectosAsignados} {d.proyectosAsignados === 1 ? 'Proyecto' : 'Proyectos'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200/60 rounded-xl text-xs font-medium whitespace-nowrap">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sin proyectos</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (d.estado === 'Inactivo') {
                            handleEnable(d);
                          } else {
                            setShowConfirmDisable(d);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                          d.estado === 'Activo' ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/70' :
                          d.estado === 'Visitante' ? 'bg-purple-50 hover:bg-purple-100/80 text-purple-700 border-purple-200/70' :
                          'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/70'
                        }`}
                        title={d.estado === 'Inactivo' ? 'Clic para activar cuenta' : 'Clic para dar de baja'}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          d.estado === 'Activo' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                          d.estado === 'Visitante' ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]' : 'bg-slate-400'
                        }`} />
                        <span>{d.estado}</span>
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedDocente(d); setGeneratedUsername(d.codigo || ''); setOriginalEmail(d.email || ''); setModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {d.estado !== 'Inactivo' ? (
                        <button
                          onClick={() => setShowConfirmDisable(d)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Dar de baja"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnable(d)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Activar de nuevo"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                paginated.map(d => (
                  <tr key={d.id} className={`hover:bg-slate-50/80 transition-colors group ${d.estado === 'Inactivo' ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">
                          {d.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{d.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{d.departamento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-[#162748]">{d.proyectosAsignados}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-emerald-600">{d.proyectosEvaluados}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-amber-500">{d.proyectosPendientes}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="text-xs font-black text-slate-600 w-9 text-right">{d.avancePorcentaje}%</span>
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              d.avancePorcentaje === 100 
                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                : d.avancePorcentaje > 0 
                                ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${d.avancePorcentaje}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        d.proyectosAsignados === 0 
                          ? 'bg-slate-100 text-slate-400 border-slate-200' 
                          : d.estadoEvaluacion === 'Completado' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : d.estadoEvaluacion === 'En Progreso' 
                          ? 'bg-blue-50 text-blue-600 border-blue-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {d.proyectosAsignados === 0 ? 'Sin Proyectos' : d.estadoEvaluacion}
                      </span>
                    </td>
                  </tr>
                ))
              )}
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
              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-[#162748] text-white shadow-xl shadow-blue-900/20' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
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

                <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <Key className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Contraseña por defecto</p>
                    <p className="text-sm font-bold text-blue-900">{DEFAULT_PASSWORD}</p>
                  </div>
                </div>

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
                        value={generatedUsername}
                        onChange={e => setGeneratedUsername(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-black text-sm outline-none transition-all text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado</label>
                      <select
                        value={selectedDocente?.estado || 'Activo'}
                        onChange={e => setSelectedDocente({ ...selectedDocente, estado: e.target.value as 'Activo' | 'Inactivo' | 'Visitante' })}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2.5 focus:bg-white focus:border-indigo-600/10 font-bold text-sm outline-none transition-all appearance-none"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Visitante">Visitante</option>
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

      {/* ── NUEVO: Modal de correo duplicado ── */}
      <AnimatePresence>
        {duplicateEmailModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDuplicateEmailModal(false)}
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
                  <h3 className="text-xl font-black text-[#162748] mb-2">Correo ya registrado</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    El correo{' '}
                    <span className="font-black text-[#162748] bg-slate-100 px-2 py-0.5 rounded-lg break-all">
                      {selectedDocente?.email}
                    </span>{' '}
                    ya pertenece a otro docente. Por favor ingrese un correo diferente.
                  </p>
                </div>
                <button
                  onClick={() => setDuplicateEmailModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-[#162748] hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
                >
                  Entendido, cambiar correo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NUEVO: Modal de Proyectos Asignados al Docente ── */}
      <AnimatePresence>
        {proyectosModalDocente && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProyectosModalDocente(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              {/* Header del Modal */}
              <div className="p-6 md:p-8 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-sm font-bold font-mono text-[#094e8f] border border-indigo-100 shadow-sm flex-shrink-0">
                      {proyectosModalDocente.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {proyectosModalDocente.especialidad}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                          {proyectosModalDocente.codigo}
                        </span>
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-[#162748] truncate leading-tight">
                        {proyectosModalDocente.nombre}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setProyectosModalDocente(null)}
                    className="p-2.5 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700 transition-all flex-shrink-0 cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200/60">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#094e8f]" />
                    <span>Proyectos Asignados:</span>
                    <span className="font-black text-[#162748]">{proyectosDocente.length}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {proyectosDocente.filter(p => p.estado === 'Calificado').length} Evaluados
                    </span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {proyectosDocente.filter(p => p.estado === 'Pendiente').length} Pendientes
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Proyectos */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3.5">
                {loadingProyectos ? (
                  <div className="py-16 text-center flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-[#094e8f] rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando proyectos...</p>
                  </div>
                ) : proyectosDocente.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-2">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Sin proyectos asignados</p>
                    <p className="text-xs text-slate-400">Este docente aún no tiene proyectos asignados como jurado evaluador.</p>
                  </div>
                ) : (
                  proyectosDocente.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-4 bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 rounded-2xl transition-all flex items-start justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="px-2.5 py-1 text-xs font-bold font-mono bg-white text-[#094e8f] rounded-lg border border-slate-200/90 shadow-2xs whitespace-nowrap mt-0.5">
                          {p.stand}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-[#094e8f] transition-colors line-clamp-2">
                            {p.nombre}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {p.carrera && (
                              <CarreraBadge carrera={p.carrera} size="xs" />
                            )}
                            {p.categoria && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#094e8f] rounded-md border border-blue-100 whitespace-nowrap">
                                {p.categoria}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          p.estado === 'Calificado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80'
                        }`}>
                          {p.estado === 'Calificado' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {p.estado}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer del Modal */}
              <div className="p-4 md:p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setProyectosModalDocente(null)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Cerrar
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
            className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl z-[100] border max-w-sm ${message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
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
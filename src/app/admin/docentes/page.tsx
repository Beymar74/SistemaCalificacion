'use client';

import { useState, useMemo } from 'react';
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
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { docentes, EstadoDocente } from '@/lib/data';

const estadoConfig: Record<EstadoDocente, { bg: string; text: string; dot: string; glow: string }> = {
  Activo: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]'
  },
  'En Receso': { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-500', 
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  },
};

const StatCard = ({ title, value, icon: Icon, color, delay }: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color: string; 
  delay: number 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/70 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
  >
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowUpRight className="w-4 h-4 text-slate-400" />
    </div>
  </motion.div>
);

export default function DocentesPage() {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  const filtered = useMemo(() => {
    return docentes.filter(
      d =>
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo.toLowerCase().includes(search.toLowerCase()) ||
        d.especialidad.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const stats = useMemo(() => {
    const total = docentes.length;
    const activos = docentes.filter(d => d.estado === 'Activo').length;
    const totalProyectos = docentes.reduce((acc, d) => acc + d.proyectosAsignados, 0);
    return { total, activos, totalProyectos };
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-[#162748] tracking-tight"
          >
            Gestión de Docentes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mt-1 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Panel central de evaluadores y especialistas académicos.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="flex items-center gap-2 bg-[#162748] text-white px-5 py-2.5 rounded-xl hover:bg-[#1e3460] transition-all font-medium text-sm shadow-lg shadow-blue-900/20 active:scale-95">
            <UserPlus className="w-4 h-4" />
            Agregar Docente
          </button>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Docentes" 
          value={stats.total} 
          icon={Users} 
          color="bg-blue-600" 
          delay={0.1}
        />
        <StatCard 
          title="Docentes Activos" 
          value={stats.activos} 
          icon={UserCheck} 
          color="bg-emerald-500" 
          delay={0.2}
        />
        <StatCard 
          title="Carga de Proyectos" 
          value={stats.totalProyectos} 
          icon={Briefcase} 
          color="bg-indigo-500" 
          delay={0.3}
        />
      </div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="p-5 flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={() => setFilterActive(!filterActive)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              filterActive ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros Avanzados
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['ID / Código', 'Nombre del Docente', 'Departamento', 'Especialidad', 'Capacidad', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((d, index) => {
                    const cfg = estadoConfig[d.estado];
                    const pct = (d.proyectosAsignados / d.proyectosTotal) * 100;
                    const isOverloaded = pct >= 100;
                    
                    return (
                      <motion.tr 
                        key={d.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                            {d.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-700 shadow-inner group-hover:scale-110 transition-transform">
                                {d.initials}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${cfg.dot} ${cfg.glow}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{d.nombre}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-[11px] text-slate-500">contacto@u-industrial.edu</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {d.departamento}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                            {d.especialidad}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold ${isOverloaded ? 'text-rose-500' : 'text-slate-700'}`}>
                                {d.proyectosAsignados} / {d.proyectosTotal} <span className="text-slate-400 font-normal">Proyectos</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{Math.round(pct)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(pct, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-1.5 rounded-full ${
                                  isOverloaded ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                            {d.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <Search className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-medium">No se encontraron docentes con ese criterio.</p>
                        <button 
                          onClick={() => setSearch('')}
                          className="text-blue-500 text-sm font-bold hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500">
            Mostrando <span className="text-slate-800 font-bold">{filtered.length}</span> de <span className="text-slate-800 font-bold">24</span> docentes registrados
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 disabled:opacity-30 transition-all border border-transparent hover:border-slate-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    n === 1 
                    ? 'bg-[#162748] text-white shadow-lg shadow-blue-900/20' 
                    : 'hover:bg-white text-slate-500 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-slate-300 px-1 text-xs">•••</span>
              <button className="w-9 h-9 rounded-xl text-xs font-bold hover:bg-white text-slate-500 border border-transparent hover:border-slate-200">
                6
              </button>
            </div>
            <button className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all border border-transparent hover:border-slate-200">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { proyectosGestion, evaluadoresDisponibles, ProyectoGestion } from '@/lib/data';

export default function GestionProyectosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ProyectoGestion | null>(null);
  const [selectedEval, setSelectedEval] = useState('1');
  const [searchEval, setSearchEval] = useState('');

  const openModal = (p: ProyectoGestion) => {
    setSelected(p);
    setSelectedEval('1');
    setSearchEval('');
    setModalOpen(true);
  };

  const filteredEvals = evaluadoresDisponibles.filter(
    e =>
      e.nombre.toLowerCase().includes(searchEval.toLowerCase()) ||
      e.departamento.toLowerCase().includes(searchEval.toLowerCase())
  );

  const accionStyle: Record<string, string> = {
    Reasignar: 'bg-[#162748] text-white hover:bg-[#1e3460]',
    Cambiar: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
    Asignar: 'bg-[#162748] text-white hover:bg-[#1e3460]',
  };

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#162748]">Reasignación de Docentes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Administre y reasigne evaluadores a los proyectos en caso de ausencias o conflictos de horario.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Toolbar */}
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID de proyecto o nombre..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none">
            <option>Todos los Docentes</option>
          </select>
          <button className="flex items-center gap-2 border border-slate-300 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Proyecto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre del Proyecto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {proyectosGestion.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 text-sm font-bold text-slate-700">{p.codigo}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                  <p className="text-xs text-slate-500">{p.sector}</p>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => openModal(p)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${accionStyle[p.accion]}`}
                  >
                    {p.accion}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Mostrando 1 a 4 de 24 proyectos</p>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs">&lt;</button>
            <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs">&gt;</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Reasignar Docente</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Project info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Proyecto Actual</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#e8eef5] rounded-lg flex items-center justify-center text-sm font-bold text-[#162748] flex-shrink-0">
                    {selected.codigo.replace('PRJ-', '')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selected.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>👤</span>
                      Docente actual ausente: Dr. Carlos Mendoza
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <p className="text-sm font-semibold text-slate-700 mb-3">Seleccionar nuevo evaluador</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o departamento..."
                  value={searchEval}
                  onChange={e => setSearchEval(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Evaluator list */}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {filteredEvals.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEval(ev.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                      selectedEval === ev.id
                        ? 'border-[#162748] bg-[#162748]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        selectedEval === ev.id ? 'bg-[#162748] text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ev.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{ev.nombre}</p>
                      <p className="text-xs text-slate-500">{ev.departamento} · {ev.asignaciones} asig.</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedEval === ev.id ? 'border-[#162748] bg-[#162748]' : 'border-slate-300'
                      }`}
                    >
                      {selectedEval === ev.id && (
                        <span className="text-white text-xs leading-none">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#162748] hover:bg-[#1e3460] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  Confirmar Reasignación ⇌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

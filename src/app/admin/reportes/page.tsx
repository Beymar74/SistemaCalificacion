'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileText,
  Trophy,
  CheckSquare,
  FileX,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  FileSignature,
  Search,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { exportToExcel, exportToPDF, exportAnexoCPDF, ANEXO_C_BLOQUE1_DEF, ANEXO_C_BLOQUE2_DEF, type AnexoCEvaluacion } from '@/lib/export';
import { fetchComputoProyectos, fetchDocentesAdmin, fetchProyectosParaGestion, fetchEvaluacionesDetalle } from '@/lib/db';
import { CATEGORIAS } from '@/lib/constants';

interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  onDownloadExcel: () => Promise<void>;
  onDownloadPDF: () => Promise<void>;
  loadingReport: string | null;
}

function ReportCard({
  id,
  title,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  onDownloadExcel,
  onDownloadPDF,
  loadingReport
}: ReportCardProps) {
  const isExcelLoading = loadingReport === `${id}_excel`;
  const isPdfLoading = loadingReport === `${id}_pdf`;
  const isAnyLoading = !!loadingReport;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
      <div className="space-y-4">
        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${bgColor} flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="font-black text-[#162748] text-base leading-tight tracking-tight">{title}</h3>
        </div>
        <p className="text-slate-500 font-medium text-xs leading-relaxed">{description}</p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-50">
        <button
          onClick={onDownloadExcel}
          disabled={isAnyLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isExcelLoading
              ? 'bg-blue-50 text-blue-600'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          {isExcelLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Excel</span>
        </button>

        <button
          onClick={onDownloadPDF}
          disabled={isAnyLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isPdfLoading
              ? 'bg-blue-50 text-blue-600'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          {isPdfLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}

// ─── Tarjeta especial: Respaldo de Firma por Jurado (Anexo C) ────────────────
interface DocenteOpcion {
  nombre: string;
  materia: string;
}

function RespaldoFirmaCard({ notify }: { notify: (text: string, type: 'success' | 'error') => void }) {
  const [docentes, setDocentes] = useState<DocenteOpcion[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocentesAdmin().then(data => {
      setDocentes(data.map(d => ({ nombre: d.nombre, materia: d.departamento })));
    });
  }, []);

  const sugerencias = useMemo(() => {
    if (!search.trim() || selected) return [];
    const term = search.toLowerCase();
    return docentes.filter(d => d.nombre.toLowerCase().includes(term)).slice(0, 6);
  }, [search, docentes, selected]);

  const handleDescargar = async () => {
    const nombreDocente = selected || search.trim();
    if (!nombreDocente) {
      notify('Escribe o selecciona el nombre de un jurado.', 'error');
      return;
    }

    setLoading(true);
    try {
      const evals = await fetchEvaluacionesDetalle();
      const propias = evals.filter(e => e.docenteNombre === nombreDocente && e.confirmada);

      if (propias.length === 0) {
        notify('Ese jurado no tiene evaluaciones confirmadas todavía.', 'error');
        setLoading(false);
        return;
      }

      const payload: AnexoCEvaluacion[] = propias.map(e => ({
        proyectoCodigo: e.proyectoCodigo,
        proyectoNombre: e.proyectoNombre,
        docenteNombre: e.docenteNombre,
        observaciones: e.observaciones,
        bloque1: ANEXO_C_BLOQUE1_DEF.map(def => ({
          aspecto: def.aspecto,
          criterio: def.aspecto,
          label: def.label,
          valor: (e as unknown as Record<string, number>)[def.key] ?? 0,
        })),
        bloque2: ANEXO_C_BLOQUE2_DEF.map(def => ({
          aspecto: def.aspecto,
          criterio: def.aspecto,
          label: def.label,
          valor: (e as unknown as Record<string, number>)[def.key] ?? 0,
        })),
      }));

      exportAnexoCPDF(payload, nombreDocente);
      notify(`Respaldo generado: ${propias.length} planilla(s) de ${nombreDocente}.`, 'success');
    } catch (err) {
      console.error(err);
      notify('Error al generar el respaldo del jurado.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all md:col-span-2 lg:col-span-1">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 flex-shrink-0">
            <FileSignature className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-black text-[#162748] text-base leading-tight tracking-tight">Respaldo de Firma por Jurado</h3>
        </div>
        <p className="text-slate-500 font-medium text-xs leading-relaxed">
          Busca a un docente y descarga en PDF todas sus evaluaciones confirmadas ya llenadas en el formato oficial Anexo &quot;C&quot;, listas para imprimir y firmar como respaldo físico.
        </p>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Nombre del jurado..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600/40 focus:bg-white transition-all"
          />
          {sugerencias.length > 0 && (
            <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {sugerencias.map(d => (
                <button
                  key={d.nombre}
                  onClick={() => { setSelected(d.nombre); setSearch(d.nombre); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{d.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{d.materia}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <button
          onClick={handleDescargar}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Descargar Respaldo PDF</span>
        </button>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');

  const notify = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDownload = async (id: string, format: 'excel' | 'pdf', fetchAndGenerate: () => Promise<void>) => {
    const actKey = `${id}_${format}`;
    setLoadingReport(actKey);
    try {
      await fetchAndGenerate();
      notify('Reporte generado y descargado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      notify('Error al generar el reporte solicitado.', 'error');
    } finally {
      setLoadingReport(null);
    }
  };

  const sufijoCategoria = () =>
    selectedCategoria === 'all' ? 'General' : selectedCategoria.replace(/\s+/g, '_');

  const tituloCategoria = () =>
    selectedCategoria === 'all' ? '' : ` — ${selectedCategoria}`;

  // 1. Reporte General de Calificaciones
  const dlGeneralExcel = () => handleDownload('general', 'excel', async () => {
    const raw = await fetchComputoProyectos();
    const data = selectedCategoria === 'all' ? raw : raw.filter(p => p.categoria === selectedCategoria);

    const rows: Record<string, string | number>[] = [];
    data.forEach(p => {
      if (p.evaluadores.length === 0) {
        rows.push({
          'Código Proyecto': p.codigo,
          'Nombre del Proyecto': p.nombre,
          'Carrera': p.carrera || '—',
          'Categoría': p.categoria,
          'Jurado Evaluador': '—',
          'Nota Otorgada': '—',
          'Observaciones': '—',
          'Promedio Final': p.promedio || '—',
          'Ranking Posición': p.ranking || '—',
        });
      } else {
        p.evaluadores.forEach(ev => {
          rows.push({
            'Código Proyecto': p.codigo,
            'Nombre del Proyecto': p.nombre,
            'Carrera': p.carrera || '—',
            'Categoría': p.categoria,
            'Jurado Evaluador': ev.docente,
            'Nota Otorgada': ev.nota,
            'Observaciones': ev.observaciones || '—',
            'Promedio Final': p.promedio,
            'Ranking Posición': p.ranking,
          });
        });
      }
    });
    await exportToExcel(rows, `UICYT_Reporte_General_Calificaciones_${sufijoCategoria()}_${new Date().toISOString().split('T')[0]}`);
  });

  const dlGeneralPDF = () => handleDownload('general', 'pdf', async () => {
    const raw = await fetchComputoProyectos();
    const data = selectedCategoria === 'all' ? raw : raw.filter(p => p.categoria === selectedCategoria);

    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.carrera || '—',
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio > 0 ? p.promedio.toFixed(2) : '0.00',
      p.ranking > 0 ? p.ranking.toString() : '—'
    ]);
    await exportToPDF(
      `UICYT - Reporte General de Calificaciones${tituloCategoria()}`,
      ['Código', 'Proyecto', 'Carrera', 'Categoría', 'Evals', 'Promedio', 'Ranking'],
      pdfRows,
      `UICYT_Reporte_General_${sufijoCategoria()}_${new Date().toISOString().split('T')[0]}`
    );
  });

  // 2. Cuadro de Honor y Resultados (Rankings)
  const dlHonorExcel = () => handleDownload('honor', 'excel', async () => {
    const raw = await fetchComputoProyectos();
    const data = selectedCategoria === 'all' ? raw : raw.filter(p => p.categoria === selectedCategoria);

    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => a.ranking - b.ranking);

    const rows = evaluated.map(p => ({
      'Posición / Ranking': p.ranking,
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Carrera': p.carrera || '—',
      'Categoría': p.categoria,
      'Evaluaciones Recibidas': p.evaluacionesConfirmadas,
      'Puntaje Acumulado': p.puntajeAcumulado,
      'Promedio Final': p.promedio
    }));
    await exportToExcel(rows, `UICYT_Cuadro_Honor_y_Clasificaciones_${sufijoCategoria()}_${new Date().getFullYear()}`);
  });

  const dlHonorPDF = () => handleDownload('honor', 'pdf', async () => {
    const raw = await fetchComputoProyectos();
    const data = selectedCategoria === 'all' ? raw : raw.filter(p => p.categoria === selectedCategoria);

    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => a.ranking - b.ranking);

    const pdfRows = evaluated.map(p => [
      p.ranking.toString(),
      p.codigo,
      p.nombre,
      p.carrera || '—',
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio.toFixed(2)
    ]);
    await exportToPDF(
      `UICYT - Cuadro de Honor y Clasificaciones${tituloCategoria()}`,
      ['Posición', 'Código', 'Proyecto', 'Carrera', 'Categoría', 'Evals', 'Promedio Final'],
      pdfRows,
      `UICYT_Cuadro_Honor_${sufijoCategoria()}_${new Date().getFullYear()}`
    );
  });

  // 3. Stands y Asistencia (sin filtro de categoría: no aplica)
  const dlStandsExcel = () => handleDownload('stands', 'excel', async () => {
    const data = await fetchProyectosParaGestion();
    const rows = data.map(p => ({
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Carrera': p.carrera || p.sociedad || '—',
      'Categoría': p.sector,
      'Estado Asistencia': p.asistio ? 'Presente en Stand' : 'Ausente / Pendiente',
      'Estado de Proyecto': p.habilitado !== false ? 'Habilitado para Calificar' : 'Inhabilitado'
    }));
    await exportToExcel(rows, `UICYT_Planilla_Control_Asistencia_y_Stands_${new Date().getFullYear()}`);
  });

  const dlStandsPDF = () => handleDownload('stands', 'pdf', async () => {
    const data = await fetchProyectosParaGestion();
    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.carrera || p.sociedad || '—',
      p.sector,
      p.asistio ? 'Presente' : 'Ausente',
      p.habilitado !== false ? 'Habilitado' : 'Inhabilitado'
    ]);
    await exportToPDF(
      'UICYT - Planilla de Control de Stands y Asistencia',
      ['Código', 'Proyecto', 'Carrera', 'Categoría', 'Asistencia', 'Habilitado'],
      pdfRows,
      `UICYT_Control_Stands_${new Date().getFullYear()}`
    );
  });

  // 4. Auditoría de Proyectos Inhabilitados (sin filtro de categoría: no aplica)
  const dlInactivosExcel = () => handleDownload('inactivos', 'excel', async () => {
    const data = await fetchProyectosParaGestion();
    const inactivos = data.filter(p => p.habilitado === false);
    const rows = inactivos.map(p => ({
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Categoría Sector': p.sector,
      'Sociedad': p.sociedad || '—',
      'Estado de Calificación': 'Inhabilitado para Evaluaciones',
      'Registro Auditoría': 'Dado de baja administrativa'
    }));
    await exportToExcel(rows, `UICYT_Auditoria_Proyectos_Inhabilitados_${new Date().getFullYear()}`);
  });

  const dlInactivosPDF = () => handleDownload('inactivos', 'pdf', async () => {
    const data = await fetchProyectosParaGestion();
    const inactivos = data.filter(p => p.habilitado === false);
    const pdfRows = inactivos.map(p => [
      p.codigo,
      p.nombre,
      p.sector,
      p.sociedad || '—',
      'Inhabilitado'
    ]);
    await exportToPDF(
      'UICYT - Reporte de Proyectos Inhabilitados',
      ['Código', 'Proyecto', 'Categoría', 'Sociedad', 'Calificación'],
      pdfRows,
      `UICYT_Proyectos_Inhabilitados_${new Date().getFullYear()}`
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <Layers className="w-4 h-4" />
            <span>Auditoría & Descargas</span>
          </div>
          <h1 className="text-4xl font-black text-[#162748] tracking-tight">Centro de Reportes</h1>
          <p className="text-slate-500 font-medium mt-1">Consolide, visualice y descargue toda la información de la feria en un solo lugar.</p>
        </div>
      </header>

      {/* Help Banner */}
      <HelpBanner
        storageKey="reportes-admin"
        title="Guía Operativa: Centro de Descarga de Planillas y Reportes Oficiales"
        description="Este panel reúne toda la logística e información de calificaciones del certamen. Cada reporte cuenta con formatos automatizados en Excel (.xlsx) y PDF (.pdf). El Reporte General y el Cuadro de Honor respetan el filtro de categoría. La tarjeta de Respaldo de Firma genera, por cada jurado, la Planilla Anexo 'C' ya llenada con sus notas y observaciones, lista para imprimir y firmar."
      />

      {/* Filtro de Categoría */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtro de Categoría (aplica al Reporte General y al Cuadro de Honor)</span>
        </div>
        <select
          value={selectedCategoria}
          onChange={e => setSelectedCategoria(e.target.value)}
          className="w-full md:w-96 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 shadow-sm transition-all"
        >
          <option value="all">Todas las Categorías (General)</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {selectedCategoria !== 'all' && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filtro activo:</span>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                {selectedCategoria}
              </span>
            </div>
            <button
              onClick={() => setSelectedCategoria('all')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Restablecer filtro
            </button>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          id="general"
          title="Reporte General de Calificaciones"
          description="Planilla completa y detallada de todas las evaluaciones emitidas por jurado, incluyendo notas, observaciones individuales, promedios finales y rankings de posición."
          icon={FileText}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          onDownloadExcel={dlGeneralExcel}
          onDownloadPDF={dlGeneralPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="honor"
          title="Cuadro de Honor y Resultados"
          description="Listado oficial jerárquico de todos los proyectos con calificaciones, clasificados y ordenados de mayor a menor por su promedio final acumulado. Ideal para publicaciones."
          icon={Trophy}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          onDownloadExcel={dlHonorExcel}
          onDownloadPDF={dlHonorPDF}
          loadingReport={loadingReport}
        />

        {/* Reemplaza a "Carga Evaluadora de Jurados" */}
        <RespaldoFirmaCard notify={notify} />

        <ReportCard
          id="stands"
          title="Planilla de Control y Stands"
          description="Planilla logística orientada al control físico de los stands y la asistencia oficial (Presentes/Ausentes) de los grupos y proyectos de la feria."
          icon={CheckSquare}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          onDownloadExcel={dlStandsExcel}
          onDownloadPDF={dlStandsPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="inactivos"
          title="Auditoría de Inhabilitados"
          description="Listado y control administrativo de proyectos dados de baja o inhabilitados para recibir evaluaciones durante el desarrollo del certamen."
          icon={FileX}
          iconColor="text-rose-600"
          bgColor="bg-rose-50"
          onDownloadExcel={dlInactivosExcel}
          onDownloadPDF={dlInactivosPDF}
          loadingReport={loadingReport}
        />
      </div>
    </div>
  );
}
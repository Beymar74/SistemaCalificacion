'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  FileText, 
  Trophy, 
  Users, 
  CheckSquare, 
  FileX, 
  Layers, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  Printer,
  FileSignature,
  Search,
  User,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { 
  exportToExcel, 
  exportToPDF, 
  exportAnexoCPDF, 
  AnexoCEvaluacion, 
  ANEXO_C_BLOQUE1_DEF, 
  ANEXO_C_BLOQUE2_DEF 
} from '@/lib/export';
import { 
  fetchComputoProyectos, 
  fetchDocentesAdmin, 
  fetchProyectosParaGestion, 
  fetchEvaluacionesDetalle 
} from '@/lib/db';
import { CATEGORIAS } from '@/lib/constants';

interface ReportCardProps {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  gradientBar: string;
  onDownloadExcel: () => Promise<void>;
  onDownloadPDF: () => Promise<void>;
  loadingReport: string | null;
}

function ReportCard({
  id,
  badge,
  badgeColor,
  title,
  description,
  features,
  icon: Icon,
  iconColor,
  iconBg,
  gradientBar,
  onDownloadExcel,
  onDownloadPDF,
  loadingReport
}: ReportCardProps) {
  const isExcelLoading = loadingReport === `${id}_excel`;
  const isPdfLoading = loadingReport === `${id}_pdf`;
  const isAnyLoading = !!loadingReport;

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
    >
      {/* Accent Gradient Top Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${gradientBar}`} />

      <div className="space-y-3">
        {/* Top Header: Icon + Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
            <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
            {badge}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-black text-slate-800 text-sm sm:text-base leading-snug tracking-tight group-hover:text-[#094e8f] transition-colors">
            {title}
          </h3>
          <p className="text-slate-500 font-medium text-xs leading-relaxed mt-1 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Mini Feature Chips */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {features.map((feat, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={onDownloadExcel}
          disabled={isAnyLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black tracking-wide transition-all shadow-2xs ${
            isExcelLoading 
              ? 'bg-blue-50 text-blue-600'
              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          {isExcelLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          <span>Excel</span>
        </button>

        <button
          onClick={onDownloadPDF}
          disabled={isAnyLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black tracking-wide transition-all shadow-2xs ${
            isPdfLoading 
              ? 'bg-blue-50 text-blue-600'
              : 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          {isPdfLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5" />
          )}
          <span>PDF</span>
        </button>
      </div>
    </motion.div>
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
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
    >
      {/* Accent Gradient Top Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <FileSignature className="w-4.5 h-4.5" />
          </div>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            Anexo &quot;C&quot;
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-black text-slate-800 text-sm sm:text-base leading-snug tracking-tight group-hover:text-[#094e8f] transition-colors">
            Respaldo de Firma por Jurado
          </h3>
          <p className="text-slate-500 font-medium text-xs leading-relaxed mt-1 line-clamp-2">
            Planilla Oficial Anexo &quot;C&quot; en PDF rellenada con rúbricas (30 y 70 pts) y observaciones para firma física.
          </p>
        </div>

        {/* Search input with autocomplete */}
        <div className="relative pt-0.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Buscar jurado..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:bg-white transition-all shadow-2xs"
          />
          {sugerencias.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto">
              {sugerencias.map(d => (
                <button
                  key={d.nombre}
                  onClick={() => { setSelected(d.nombre); setSearch(d.nombre); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-indigo-50/70 transition-colors border-b border-slate-50 last:border-0"
                >
                  <User className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{d.nombre}</p>
                    <p className="text-[9px] text-slate-400 truncate">{d.materia}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={handleDescargar}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black tracking-wide bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-2xs"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Descargar Planilla Anexo C</span>
        </button>
      </div>
    </motion.div>
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

  // 1. Reporte General de Calificaciones (con soporte a filtro de categoría)
  const dlGeneralExcel = () => handleDownload('general', 'excel', async () => {
    let data = await fetchComputoProyectos();
    if (selectedCategoria !== 'all') {
      data = data.filter(p => p.categoria === selectedCategoria);
    }

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

    const catSuffix = selectedCategoria !== 'all' ? `_${selectedCategoria.replace(/\s+/g, '_')}` : '';
    await exportToExcel(rows, `UICYT_Reporte_General_Calificaciones${catSuffix}_${new Date().toISOString().split('T')[0]}`);
  });

  const dlGeneralPDF = () => handleDownload('general', 'pdf', async () => {
    let data = await fetchComputoProyectos();
    if (selectedCategoria !== 'all') {
      data = data.filter(p => p.categoria === selectedCategoria);
    }

    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.carrera || '—',
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio > 0 ? p.promedio.toFixed(2) : '0.00',
      p.ranking > 0 ? p.ranking.toString() : '—'
    ]);

    const titleSuffix = selectedCategoria !== 'all' ? ` (${selectedCategoria})` : '';
    const fileSuffix = selectedCategoria !== 'all' ? `_${selectedCategoria.replace(/\s+/g, '_')}` : '';

    await exportToPDF(
      `UICYT - Reporte General de Calificaciones${titleSuffix}`,
      ['Código', 'Proyecto', 'Carrera', 'Categoría', 'Evals', 'Promedio', 'Ranking'],
      pdfRows,
      `UICYT_Reporte_General${fileSuffix}_${new Date().toISOString().split('T')[0]}`
    );
  });

  // 2. Cuadro de Honor y Resultados (Rankings con filtro de categoría opcional)
  const dlHonorExcel = () => handleDownload('honor', 'excel', async () => {
    let data = await fetchComputoProyectos();
    if (selectedCategoria !== 'all') {
      data = data.filter(p => p.categoria === selectedCategoria);
    }

    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => b.promedio - a.promedio);

    const rows = evaluated.map((p, idx) => ({
      'Posición / Ranking': idx + 1,
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Carrera': p.carrera || '—',
      'Categoría': p.categoria,
      'Evaluaciones Recibidas': p.evaluacionesConfirmadas,
      'Puntaje Acumulado': p.puntajeAcumulado,
      'Promedio Final': p.promedio
    }));

    const catSuffix = selectedCategoria !== 'all' ? `_${selectedCategoria.replace(/\s+/g, '_')}` : '';
    await exportToExcel(rows, `UICYT_Cuadro_Honor${catSuffix}_${new Date().getFullYear()}`);
  });

  const dlHonorPDF = () => handleDownload('honor', 'pdf', async () => {
    let data = await fetchComputoProyectos();
    if (selectedCategoria !== 'all') {
      data = data.filter(p => p.categoria === selectedCategoria);
    }

    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => b.promedio - a.promedio);

    const pdfRows = evaluated.map((p, idx) => [
      (idx + 1).toString(),
      p.codigo,
      p.nombre,
      p.carrera || '—',
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio.toFixed(2)
    ]);

    const titleSuffix = selectedCategoria !== 'all' ? ` - ${selectedCategoria}` : '';
    const fileSuffix = selectedCategoria !== 'all' ? `_${selectedCategoria.replace(/\s+/g, '_')}` : '';

    await exportToPDF(
      `UICYT - Cuadro de Honor y Clasificaciones${titleSuffix}`,
      ['Posición', 'Código', 'Proyecto', 'Carrera', 'Categoría', 'Evals', 'Promedio Final'],
      pdfRows,
      `UICYT_Cuadro_Honor${fileSuffix}_${new Date().getFullYear()}`
    );
  });

  // 3. Registro de Jurados y Carga
  const dlDocentesExcel = () => handleDownload('docentes', 'excel', async () => {
    const data = await fetchDocentesAdmin();
    const rows = data.map(d => ({
      'Código Usuario': d.codigo,
      'Nombre Completo': d.nombre,
      'Correo Electrónico': d.email,
      'Materia / Área': d.departamento,
      'Grado Académico': d.especialidad,
      'Proyectos Asignados': d.proyectosAsignados,
      'Estado del Docente': d.estado
    }));
    await exportToExcel(rows, `UICYT_Registro_Jurados_Carga_${new Date().getFullYear()}`);
  });

  const dlDocentesPDF = () => handleDownload('docentes', 'pdf', async () => {
    const data = await fetchDocentesAdmin();
    const pdfRows = data.map(d => [
      d.codigo,
      d.nombre,
      d.departamento,
      d.especialidad,
      d.proyectosAsignados.toString(),
      d.estado
    ]);
    await exportToPDF(
      'UICYT - Registro de Jurados y Carga Evaluadora',
      ['Código', 'Nombre Completo', 'Materia/Área', 'Grado', 'Asignados', 'Estado'],
      pdfRows,
      `UICYT_Registro_Jurados_${new Date().getFullYear()}`
    );
  });

  // 4. Stands y Asistencia
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

  // 5. Auditoría de Proyectos Inhabilitados
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

  // 6. Resumen de Categorías y Carreras
  const dlCategoriasExcel = () => handleDownload('categorias', 'excel', async () => {
    const data = await fetchComputoProyectos();
    const rows = data.map(p => ({
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Categoría Oficial': p.categoria,
      'Carrera / Especialidad': p.carrera || '—',
      'Evaluaciones Completadas': p.evaluacionesConfirmadas,
      'Promedio Registrado': p.promedio > 0 ? p.promedio : 'Pendiente',
      'Estado General': p.promedio > 0 ? 'Evaluado' : 'En Proceso'
    }));
    await exportToExcel(rows, `UICYT_Distribucion_Categorias_y_Carreras_${new Date().getFullYear()}`);
  });

  const dlCategoriasPDF = () => handleDownload('categorias', 'pdf', async () => {
    const data = await fetchComputoProyectos();
    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.categoria,
      p.carrera || '—',
      p.evaluacionesConfirmadas.toString(),
      p.promedio > 0 ? p.promedio.toFixed(2) : '—'
    ]);
    await exportToPDF(
      'UICYT - Distribución de Proyectos por Categoría y Carrera',
      ['Código', 'Proyecto', 'Categoría', 'Carrera', 'Evals', 'Promedio'],
      pdfRows,
      `UICYT_Categorias_Carreras_${new Date().getFullYear()}`
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
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
              feedback.type === 'success'
                ? 'bg-emerald-500/95 border-emerald-400 text-white'
                : 'bg-rose-500/95 border-rose-400 text-white'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Minimalista */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[#094e8f] font-black text-[10px] uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0d114]" />
            <span>Auditoría & Descargas Oficiales · 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Centro de Reportes</h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Genera y descarga planillas consolidadas, cuadros de honor y actas oficiales.</p>
        </div>
      </header>

      {/* Filtro de Categoría Compacto */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
          <Filter className="w-3.5 h-3.5 text-[#094e8f]" />
          <span>Filtrar por Categoría:</span>
        </div>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <select
            value={selectedCategoria}
            onChange={e => setSelectedCategoria(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#094e8f] focus:bg-white shadow-2xs transition-all cursor-pointer"
          >
            <option value="all">Todas las Categorías (General Consolidado)</option>
            {CATEGORIAS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {selectedCategoria !== 'all' && (
            <button
              onClick={() => setSelectedCategoria('all')}
              className="text-xs font-bold text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <ReportCard
          id="general"
          badge="Calificaciones"
          badgeColor="bg-blue-50 text-blue-700 border border-blue-100"
          title="Reporte General de Calificaciones"
          description="Planilla completa y detallada de todas las evaluaciones emitidas por jurado, incluyendo notas, observaciones individuales, promedios finales y rankings de posición."
          features={['✓ Notas de Jurados', '✓ Observaciones', '✓ Promedios']}
          icon={FileText}
          iconColor="text-[#094e8f]"
          iconBg="bg-blue-50"
          gradientBar="bg-gradient-to-r from-[#094e8f] to-blue-500"
          onDownloadExcel={dlGeneralExcel}
          onDownloadPDF={dlGeneralPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="honor"
          badge="Podios & Rankings"
          badgeColor="bg-amber-50 text-amber-700 border border-amber-100"
          title="Cuadro de Honor y Resultados"
          description="Listado oficial jerárquico de todos los proyectos con calificaciones, clasificados y ordenados de mayor a menor por su promedio final acumulado. Ideal para publicaciones."
          features={['✓ Orden Jerárquico', '✓ Top Rankings', '✓ Aprobados']}
          icon={Trophy}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          gradientBar="bg-gradient-to-r from-amber-400 to-[#f0d114]"
          onDownloadExcel={dlHonorExcel}
          onDownloadPDF={dlHonorPDF}
          loadingReport={loadingReport}
        />

        {/* Respaldo de Firma por Jurado (Planilla Anexo "C") */}
        <RespaldoFirmaCard notify={notify} />

        <ReportCard
          id="docentes"
          badge="Jurados"
          badgeColor="bg-indigo-50 text-indigo-700 border border-indigo-100"
          title="Carga Evaluadora de Jurados"
          description="Estadística y registro académico de docentes jurados. Permite auditar la cantidad de proyectos asignados, carga de calificaciones y su estado de actividad."
          features={['✓ Carga por Jurado', '✓ Contactos', '✓ Estado']}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          gradientBar="bg-gradient-to-r from-indigo-500 to-purple-600"
          onDownloadExcel={dlDocentesExcel}
          onDownloadPDF={dlDocentesPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="stands"
          badge="Logística"
          badgeColor="bg-emerald-50 text-emerald-700 border border-emerald-100"
          title="Planilla de Control y Stands"
          description="Planilla logística orientada al control físico de los stands y la asistencia oficial (Presentes/Ausentes) de los grupos y proyectos de la feria."
          features={['✓ Control de Stands', '✓ Asistencia', '✓ Ubicaciones']}
          icon={CheckSquare}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          gradientBar="bg-gradient-to-r from-emerald-500 to-teal-500"
          onDownloadExcel={dlStandsExcel}
          onDownloadPDF={dlStandsPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="inactivos"
          badge="Control & Bajas"
          badgeColor="bg-rose-50 text-rose-700 border border-rose-100"
          title="Auditoría de Inhabilitados"
          description="Listado y control administrativo de proyectos dados de baja o inhabilitados para recibir evaluaciones durante el desarrollo del certamen."
          features={['✓ Proyectos de Baja', '✓ Motivo', '✓ Trazabilidad']}
          icon={FileX}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          gradientBar="bg-gradient-to-r from-rose-500 to-red-600"
          onDownloadExcel={dlInactivosExcel}
          onDownloadPDF={dlInactivosPDF}
          loadingReport={loadingReport}
        />

        <ReportCard
          id="categorias"
          badge="Distribución"
          badgeColor="bg-sky-50 text-sky-700 border border-sky-100"
          title="Categorías y Carreras UICYT"
          description="Consolidado de proyectos clasificados por las 6 categorías oficiales y 18 carreras, facilitando el análisis de participación académica general."
          features={['✓ 6 Categorías', '✓ 18 Carreras', '✓ Avance']}
          icon={BarChart3}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          gradientBar="bg-gradient-to-r from-sky-500 to-blue-600"
          onDownloadExcel={dlCategoriasExcel}
          onDownloadPDF={dlCategoriasPDF}
          loadingReport={loadingReport}
        />
      </div>
    </div>
  );
}


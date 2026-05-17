'use client';

import { useState } from 'react';
import { 
  Download, 
  FileText, 
  Trophy, 
  Users, 
  CheckSquare, 
  FileX, 
  Layers, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpBanner from '@/components/HelpBanner';
import { exportToExcel, exportToPDF } from '@/lib/export';
import { fetchComputoProyectos, fetchDocentesAdmin, fetchProyectosParaGestion } from '@/lib/db';

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

export default function ReportesPage() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  // 1. Reporte General de Calificaciones
  const dlGeneralExcel = () => handleDownload('general', 'excel', async () => {
    const data = await fetchComputoProyectos();
    const rows: Record<string, string | number>[] = [];
    data.forEach(p => {
      if (p.evaluadores.length === 0) {
        rows.push({
          'Código Proyecto': p.codigo,
          'Nombre del Proyecto': p.nombre,
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
    await exportToExcel(rows, `SCEITII_Reporte_General_Calificaciones_${new Date().toISOString().split('T')[0]}`);
  });

  const dlGeneralPDF = () => handleDownload('general', 'pdf', async () => {
    const data = await fetchComputoProyectos();
    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio > 0 ? p.promedio.toFixed(2) : '0.00',
      p.ranking > 0 ? p.ranking.toString() : '—'
    ]);
    await exportToPDF(
      'SCEITII - Reporte General de Calificaciones',
      ['Código', 'Proyecto', 'Categoría', 'Evals', 'Promedio', 'Ranking'],
      pdfRows,
      `SCEITII_Reporte_General_${new Date().toISOString().split('T')[0]}`
    );
  });

  // 2. Cuadro de Honor y Resultados (Rankings)
  const dlHonorExcel = () => handleDownload('honor', 'excel', async () => {
    const data = await fetchComputoProyectos();
    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => a.ranking - b.ranking);

    const rows = evaluated.map(p => ({
      'Posición / Ranking': p.ranking,
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Categoría': p.categoria,
      'Evaluaciones Recibidas': p.evaluacionesConfirmadas,
      'Puntaje Acumulado': p.puntajeAcumulado,
      'Promedio Final': p.promedio
    }));
    await exportToExcel(rows, `SCEITII_Cuadro_Honor_y_Clasificaciones_${new Date().getFullYear()}`);
  });

  const dlHonorPDF = () => handleDownload('honor', 'pdf', async () => {
    const data = await fetchComputoProyectos();
    const evaluated = data
      .filter(p => p.promedio > 0)
      .sort((a, b) => a.ranking - b.ranking);

    const pdfRows = evaluated.map(p => [
      p.ranking.toString(),
      p.codigo,
      p.nombre,
      p.categoria,
      p.evaluacionesConfirmadas.toString(),
      p.promedio.toFixed(2)
    ]);
    await exportToPDF(
      'SCEITII - Cuadro de Honor y Clasificaciones',
      ['Posición', 'Código', 'Proyecto', 'Categoría', 'Evals', 'Promedio Final'],
      pdfRows,
      `SCEITII_Cuadro_Honor_${new Date().getFullYear()}`
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
    await exportToExcel(rows, `SCEITII_Registro_Jurados_Carga_${new Date().getFullYear()}`);
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
      'SCEITII - Registro de Jurados y Carga Evaluadora',
      ['Código', 'Nombre Completo', 'Materia/Área', 'Grado', 'Asignados', 'Estado'],
      pdfRows,
      `SCEITII_Registro_Jurados_${new Date().getFullYear()}`
    );
  });

  // 4. Stands y Asistencia
  const dlStandsExcel = () => handleDownload('stands', 'excel', async () => {
    const data = await fetchProyectosParaGestion();
    const rows = data.map(p => ({
      'Código Proyecto': p.codigo,
      'Nombre del Proyecto': p.nombre,
      'Categoría Sector': p.sector,
      'Sociedad': p.sociedad || 'Sin sociedad',
      'Estado Asistencia': p.asistio ? 'Presente en Stand' : 'Ausente / Pendiente',
      'Estado de Proyecto': p.habilitado !== false ? 'Habilitado para Calificar' : 'Inhabilitado'
    }));
    await exportToExcel(rows, `SCEITII_Planilla_Control_Asistencia_y_Stands_${new Date().getFullYear()}`);
  });

  const dlStandsPDF = () => handleDownload('stands', 'pdf', async () => {
    const data = await fetchProyectosParaGestion();
    const pdfRows = data.map(p => [
      p.codigo,
      p.nombre,
      p.sector,
      p.sociedad || '—',
      p.asistio ? 'Presente' : 'Ausente',
      p.habilitado !== false ? 'Habilitado' : 'Inhabilitado'
    ]);
    await exportToPDF(
      'SCEITII - Planilla de Control de Stands y Asistencia',
      ['Código', 'Proyecto', 'Categoría', 'Sociedad', 'Asistencia', 'Habilitado'],
      pdfRows,
      `SCEITII_Control_Stands_${new Date().getFullYear()}`
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
    await exportToExcel(rows, `SCEITII_Auditoria_Proyectos_Inhabilitados_${new Date().getFullYear()}`);
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
      'SCEITII - Reporte de Proyectos Inhabilitados',
      ['Código', 'Proyecto', 'Categoría', 'Sociedad', 'Calificación'],
      pdfRows,
      `SCEITII_Proyectos_Inhabilitados_${new Date().getFullYear()}`
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
        description="Este panel reúne toda la logística e información de calificaciones del certamen. Cada reporte cuenta con formatos automatizados en Excel (.xlsx) con diseño premium de celdas ajustadas, y PDF (.pdf) en grilla limpia para impresiones institucionales rápidas. Descargue reportes generales de notas, clasificaciones jerárquicas o auditorías de control docente según sea requerido."
      />

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

        <ReportCard
          id="docentes"
          title="Carga Evaluadora de Jurados"
          description="Estadística y registro académico de docentes jurados. Permite auditar la cantidad de proyectos asignados, carga de calificaciones y su estado de actividad."
          icon={Users}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          onDownloadExcel={dlDocentesExcel}
          onDownloadPDF={dlDocentesPDF}
          loadingReport={loadingReport}
        />

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

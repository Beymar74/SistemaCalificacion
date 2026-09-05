import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const modulo = (temp - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    temp = Math.floor((temp - modulo) / 26);
  }
  return letter || 'A';
}

export async function exportToExcel(data: ExportRow[], fileName: string) {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');

  // Habilitar líneas de cuadrícula para una visualización limpia
  worksheet.views = [{ showGridLines: true }];

  const headers = Object.keys(data[0]);
  const lastColLetter = getColumnLetter(headers.length);

  // 1. Banner Superior de Título Corporativo (Filas 2 y 3)
  worksheet.mergeCells(`A2:${lastColLetter}3`);
  const titleCell = worksheet.getCell('A2');
  titleCell.value = 'UICYT · UNIDAD DE INVESTIGACIÓN CIENCIA Y TECNOLOGÍA\nSISTEMA DE EVALUACIONES Y CALIFICACIONES · GESTIÓN 2026';
  titleCell.font = {
    name: 'Segoe UI',
    size: 13,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF094E8F' } // Azul UICYT
  };
  titleCell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true
  };

  // Altura del Banner de Título
  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).height = 24;

  // 2. Metadatos del Reporte (Fila 5)
  worksheet.mergeCells(`A5:${lastColLetter}5`);
  const metaCell = worksheet.getCell('A5');
  const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
  metaCell.value = `Reporte: ${fileName.replace(/_/g, ' ')}   |   Fecha de Emisión: ${dateStr}`;
  metaCell.font = {
    name: 'Segoe UI',
    size: 9.5,
    italic: true,
    color: { argb: 'FF475569' } // slate-600
  };
  metaCell.alignment = {
    vertical: 'middle',
    horizontal: 'left'
  };
  worksheet.getRow(5).height = 20;

  // 3. Encabezados de la Tabla (Fila 7)
  worksheet.getRow(7).values = headers;
  worksheet.getRow(7).height = 28;

  // Dar estilo a los Encabezados
  headers.forEach((_, colIndex) => {
    const cell = worksheet.getCell(7, colIndex + 1);
    cell.font = {
      name: 'Segoe UI',
      size: 10.5,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Azul Slate Premium
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // 4. Filas de Datos (a partir de la Fila 8)
  data.forEach((row, rowIndex) => {
    const excelRowIndex = rowIndex + 8;
    const rowValues = Object.values(row);
    worksheet.getRow(excelRowIndex).values = rowValues;
    worksheet.getRow(excelRowIndex).height = 22;

    headers.forEach((headerKey, colIndex) => {
      const cell = worksheet.getCell(excelRowIndex, colIndex + 1);
      const val = rowValues[colIndex];

      // Tipografía y Color general
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        color: { argb: 'FF1E293B' } // slate-800
      };

      // Celdas Cebras (Colores alternados para lectura ágil)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } // Blanco vs slate-50
      };

      // Bordes interiores sutiles
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Formato numérico y Alineaciones
      const headerLower = headerKey.toLowerCase();
      const isNumeric = typeof val === 'number' || 
                        (!isNaN(Number(val)) && val !== '' && val !== null && val !== undefined && typeof val !== 'boolean');

      if (isNumeric) {
        cell.numFmt = '0.00';
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'right'
        };
      } else if (
        headerLower.includes('código') || 
        headerLower.includes('codigo') || 
        headerLower.includes('posición') || 
        headerLower.includes('posicion') || 
        headerLower.includes('estado') || 
        headerLower.includes('ranking')
      ) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
      } else {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left'
        };
      }
    });
  });

  // 5. Ajuste Dinámico del Ancho de Columnas
  headers.forEach((headerKey, colIndex) => {
    let maxLength = headerKey.length;

    data.forEach(row => {
      const val = row[headerKey];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        if (strVal.length > maxLength) {
          maxLength = strVal.length;
        }
      }
    });

    // Agregar espacio para padding extra y delimitar entre 12 y 65 caracteres
    worksheet.getColumn(colIndex + 1).width = Math.min(65, Math.max(12, maxLength + 4));
  });

  // 6. Generación del Buffer y Descarga del Cliente
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function exportToPDF(title: string, columns: string[], data: (string | number)[][], fileName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.setTextColor(9, 78, 143); // #094e8f
  doc.text('UICYT · UNIDAD DE INVESTIGACIÓN CIENCIA Y TECNOLOGÍA', 14, 18);
  
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 26);
  
  doc.setFontSize(9.5);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 33);

  autoTable(doc, {
    startY: 40,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: '#094e8f', textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${fileName}.pdf`);
}

// ─── Planilla Anexo "C" — Hoja de Calificación Oficial ───────────────────────
export interface AnexoCIndicadorInput {
  aspecto: string;
  criterio: string;
  label: string;
  valor: number;
}

export interface AnexoCEvaluacion {
  proyectoCodigo: string;
  proyectoNombre: string;
  docenteNombre: string;
  bloque1: AnexoCIndicadorInput[];
  bloque2: AnexoCIndicadorInput[];
  observaciones: string;
}

export const ANEXO_C_BLOQUE1_DEF = [
  { key: 'doc_ind1', aspecto: 'Originalidad del trabajo', label: 'Existe innovación.' },
  { key: 'doc_ind2', aspecto: 'Originalidad del trabajo', label: 'Contrasta y argumenta con revisión bibliográfica.' },
  { key: 'doc_ind3', aspecto: 'Enfoque científico', label: 'Aporte al análisis metodológico, conocimiento, ciencia y cultura.' },
  { key: 'doc_ind4', aspecto: 'Enfoque científico', label: 'Aporte a la solución del problema específico.' },
  { key: 'doc_ind5', aspecto: 'Interpretación y aplicación de los resultados', label: 'Coherencia de los objetivos con los resultados obtenidos.' },
  { key: 'doc_ind6', aspecto: 'Interpretación y aplicación de los resultados', label: 'Existe orientación a nuevos estudios.' },
] as const;

export const ANEXO_C_BLOQUE2_DEF = [
  { key: 'exp_ind1', aspecto: 'Interpretación y aplicación de los resultados', label: 'Coherencia de los objetivos con los resultados obtenidos.' },
  { key: 'exp_ind2', aspecto: 'Interpretación y aplicación de los resultados', label: 'Sugiere aplicaciones de los resultados obtenidos.' },
  { key: 'exp_ind3', aspecto: 'Utilización eficiente de los recursos', label: 'Montaje del material de apoyo en la exposición.' },
  { key: 'exp_ind4', aspecto: 'Calidad de la presentación', label: 'Precisión en el lenguaje científico tecnológico.' },
  { key: 'exp_ind5', aspecto: 'Calidad de la presentación', label: 'Calidad de exposición, apoyos audiovisuales.' },
  { key: 'exp_ind6', aspecto: 'Defensa del proyecto', label: 'Dominio del tema.' },
  { key: 'exp_ind7', aspecto: 'Defensa del proyecto', label: 'Calidad de respuestas.' },
] as const;

const ESCALA_B1 = [1, 2, 3, 4, 5];
const ESCALA_B2 = [2, 4, 6, 8, 10];
const NIVELES = ['Deficiente', 'Malo', 'Regular', 'Bueno', 'Excelente'];

function dibujarBloque(
  doc: jsPDF,
  startY: number,
  tituloBloque: string,
  indicadores: AnexoCIndicadorInput[],
  escala: number[],
  totalMax: number,
  subtotal: number
): number {
  const headEscala = NIVELES.map((n, i) => `${n}\n(${escala[i]} pto${escala[i] > 1 ? 's' : ''})`);
  const head = [['ASPECTO', 'CRITERIO', 'INDICADORES', ...headEscala]];

  const body: any[] = [];
  let i = 0;
  while (i < indicadores.length) {
    let j = i;
    while (j < indicadores.length && indicadores[j].aspecto === indicadores[i].aspecto) j++;
    const groupSize = j - i;

    for (let k = i; k < j; k++) {
      const ind = indicadores[k];
      const row: any[] = [];

      if (k === 0) {
        row.push({
          content: tituloBloque,
          rowSpan: indicadores.length,
          styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 7.5, fillColor: '#ffffff' },
        });
      }

      if (k === i) {
        row.push({
          content: ind.aspecto,
          rowSpan: groupSize,
          styles: { fontStyle: 'bold', valign: 'middle', fontSize: 7.5, fillColor: '#ffffff' },
        });
      }

      row.push({ content: ind.label, styles: { fontSize: 7.5, fillColor: '#ffffff' } });

      // Celdas de escala: SOLO la "X", sin relleno de color (ahorro de tinta)
      escala.forEach(v => {
        const marcado = ind.valor === v;
        row.push({
          content: marcado ? 'X' : '',
          styles: { halign: 'center', fillColor: '#ffffff', fontStyle: marcado ? 'bold' : 'normal' },
        });
      });

      body.push(row);
    }
    i = j;
  }

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [30, 41, 59], lineWidth: 0.15 },
    headStyles: {
      fillColor: '#d9d9d9',
      textColor: '#1e293b',
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      lineColor: [30, 41, 59],
      lineWidth: 0.15,
    },
    footStyles: {
      fillColor: '#ffffff',
      textColor: '#000000',
      lineColor: [30, 41, 59],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 32 },
      2: { cellWidth: 47 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 15 },
    },
    foot: [[
      { content: `${tituloBloque} — TOTAL PARCIAL DE PUNTOS/${totalMax}`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8.5, fillColor: '#ffffff' } } as any,
      { content: subtotal.toFixed(2), styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: '#ffffff' } } as any,
    ]],
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error - jspdf-autotable adjunta lastAutoTable en la instancia de doc
  return doc.lastAutoTable.finalY as number;
}

export function exportAnexoCPDF(evaluaciones: AnexoCEvaluacion[], docenteNombreArchivo: string) {
  if (!evaluaciones || evaluaciones.length === 0) return;

  const doc = new jsPDF();
  const LABEL_X = 14;
  const VALUE_X = 62;
  const VALUE_WIDTH = 196 - VALUE_X; // ancho disponible hasta el margen derecho
  const LINE_HEIGHT = 5;

  evaluaciones.forEach((ev, idx) => {
    if (idx > 0) doc.addPage();

    const bloque1Total = ev.bloque1.reduce((s, i) => s + (i.valor || 0), 0);
    const bloque2Total = ev.bloque2.reduce((s, i) => s + (i.valor || 0), 0);
    const notaTotal = bloque1Total + bloque2Total;

    // Encabezado institucional — todo en negro/negrita, sin línea divisoria
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('UICYT · UNIDAD DE INVESTIGACIÓN CIENCIA Y TECNOLOGÍA', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('HOJA DE CALIFICACIÓN', 105, 22, { align: 'center' });

    doc.setFontSize(9.5);
    doc.text('EXPOCIENCIA REGIONAL EMI - UALP 2026', 105, 27, { align: 'center' });

    // Nombre del proyecto: se parte en tantas líneas como haga falta según el ancho disponible
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('NOMBRE DEL PROYECTO:', LABEL_X, 37);
    doc.setFont('helvetica', 'normal');
    const nombreProyectoTexto = `${ev.proyectoCodigo} — ${ev.proyectoNombre}`;
    const nombreProyectoLineas = doc.splitTextToSize(nombreProyectoTexto, VALUE_WIDTH);
    doc.text(nombreProyectoLineas, VALUE_X, 37);

    // La posición de JURADO (y todo lo que sigue) se ajusta según cuántas líneas ocupó el nombre
    const juradoY = 37 + (nombreProyectoLineas.length - 1) * LINE_HEIGHT + 7;
    doc.setFont('helvetica', 'bold');
    doc.text('JURADO:', LABEL_X, juradoY);
    doc.setFont('helvetica', 'normal');
    doc.text(ev.docenteNombre, 32, juradoY);

    const tablaStartY = juradoY + 6;

    let y = dibujarBloque(doc, tablaStartY, 'EVALUACIÓN DEL DOCUMENTO', ev.bloque1, ESCALA_B1, 30, bloque1Total);
    y = dibujarBloque(doc, y + 6, 'EXPOSICIÓN Y DEFENSA FINAL', ev.bloque2, ESCALA_B2, 70, bloque2Total);

    // Nota total
    doc.setDrawColor(9, 78, 143);
    doc.setLineWidth(0.4);
    doc.rect(140, y + 8, 56, 16);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('NOTA TOTAL / SOBRE 100%', 168, y + 13, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(9, 78, 143);
    doc.text(notaTotal.toFixed(2), 168, y + 21, { align: 'center' });

    // Observaciones
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('OBSERVACIONES:', 14, y + 13);
    doc.setFont('helvetica', 'normal');
    const obsTexto = ev.observaciones?.trim() ? ev.observaciones : 'Sin observaciones registradas.';
    const obsLineas = doc.splitTextToSize(obsTexto, 118);
    doc.text(obsLineas, 14, y + 19);

    // Firma
    const firmaY = y + 45;
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.2);
    doc.line(60, firmaY, 150, firmaY);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma del Jurado', 105, firmaY + 5, { align: 'center' });
  });

  doc.save(`UICYT_Hoja_Calificacion_${docenteNombreArchivo.replace(/\s+/g, '_')}.pdf`);
}

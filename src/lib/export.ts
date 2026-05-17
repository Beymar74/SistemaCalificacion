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
  titleCell.value = 'CARRERA DE INGENIERÍA INDUSTRIAL\nSISTEMA DE EVALUACIONES Y CALIFICACIONES';
  titleCell.font = {
    name: 'Segoe UI',
    size: 13,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF162748' } // Azul Marino Institucional
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
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: '#162748', textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${fileName}.pdf`);
}

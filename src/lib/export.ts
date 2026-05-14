import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Declaración para extender jsPDF con autotable si es necesario
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

export async function exportToExcel(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export async function exportToPDF(title: string, columns: string[], data: any[][], fileName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

  (doc as any).autoTable({
    startY: 40,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillBox: '#162748', textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${fileName}.pdf`);
}

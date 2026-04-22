import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente, Proveedor, Movimiento, CuentaCorriente } from '@/types';
import { formatCurrency, formatDateShort, formatConcepto, formatCUIT, formatCondicionIva } from './formatters';

interface EstadoCuentaData {
  entidad: Cliente | Proveedor;
  cuenta: CuentaCorriente;
  movimientos: Movimiento[];
  tipoEntidad: 'cliente' | 'proveedor';
}

export function generateEstadoCuentaPDF(data: EstadoCuentaData): void {
  const { entidad, cuenta, movimientos, tipoEntidad } = data;
  const doc = new jsPDF();

  // Configuración de colores
  const primaryColor: [number, number, number] = [41, 128, 185];
  const textColor: [number, number, number] = [44, 62, 80];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Control', 14, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Estado de Cuenta Corriente', 14, 30);

  // Fecha de emisión
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${formatDateShort(new Date())}`, 140, 20);

  // Datos de la entidad
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(tipoEntidad === 'cliente' ? 'CLIENTE' : 'PROVEEDOR', 14, 55);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(entidad.razonSocial, 14, 65);
  doc.text(`CUIT: ${formatCUIT(entidad.cuit)}`, 14, 72);
  doc.text(`Condición IVA: ${formatCondicionIva(entidad.condicionIva)}`, 14, 79);
  doc.text(`Dirección: ${entidad.direccion.calle}, ${entidad.direccion.ciudad}`, 14, 86);

  // Resumen de cuenta
  doc.setFillColor(245, 247, 250);
  doc.rect(120, 50, 76, 40, 'F');

  doc.setFontSize(10);
  doc.text('Saldo Actual:', 125, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  const saldoColor = cuenta.saldoActual > 0
    ? (tipoEntidad === 'cliente' ? [39, 174, 96] : [231, 76, 60])
    : [44, 62, 80];
  doc.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]);
  doc.text(formatCurrency(cuenta.saldoActual), 125, 75);

  if (tipoEntidad === 'cliente' && cuenta.limiteCredito) {
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Límite de Crédito: ${formatCurrency(cuenta.limiteCredito)}`, 125, 85);
  }

  // Tabla de movimientos
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Movimientos', 14, 105);

  const tableData = movimientos.map((mov) => [
    formatDateShort(mov.fecha),
    formatConcepto(mov.concepto),
    mov.descripcion,
    mov.tipo === 'debe' ? formatCurrency(mov.monto) : '-',
    mov.tipo === 'haber' ? formatCurrency(mov.monto) : '-',
    formatCurrency(mov.saldoPosterior),
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Fecha', 'Concepto', 'Descripción', 'Debe', 'Haber', 'Saldo']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por Account Control`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Descargar PDF
  const fileName = `estado_cuenta_${entidad.razonSocial.replace(/\s+/g, '_')}_${formatDateShort(new Date()).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

interface CuentasResumenData {
  cuentas: Array<{
    entidadNombre: string;
    saldoActual: number;
    tipoEntidad: 'cliente' | 'proveedor';
  }>;
  tipo: 'cobrar' | 'pagar';
}

export function generateCuentasResumenPDF(data: CuentasResumenData): void {
  const { cuentas, tipo } = data;
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = tipo === 'cobrar' ? [39, 174, 96] : [231, 76, 60];
  const textColor: [number, number, number] = [44, 62, 80];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Control', 14, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(tipo === 'cobrar' ? 'Listado de Cuentas por Cobrar' : 'Listado de Cuentas por Pagar', 14, 30);

  // Fecha
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${formatDateShort(new Date())}`, 140, 20);

  // Resumen
  const total = cuentas.reduce((sum, c) => sum + c.saldoActual, 0);

  doc.setTextColor(...textColor);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 50, 182, 25, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de ${tipo === 'cobrar' ? 'clientes' : 'proveedores'}: ${cuentas.length}`, 20, 68);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total a ${tipo === 'cobrar' ? 'Cobrar' : 'Pagar'}:`, 120, 60);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.text(formatCurrency(total), 120, 70);

  // Tabla
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(tipo === 'cobrar' ? 'Clientes con Saldo' : 'Proveedores Acreedores', 14, 90);

  const tableData = cuentas.map((c) => [
    c.entidadNombre,
    formatCurrency(c.saldoActual),
  ]);

  autoTable(doc, {
    startY: 95,
    head: [[tipo === 'cobrar' ? 'Cliente' : 'Proveedor', 'Saldo']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40, halign: 'right' },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    foot: [['TOTAL', formatCurrency(total)]],
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: textColor,
      fontStyle: 'bold',
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por Account Control`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Descargar
  const fileName = `cuentas_${tipo}_${formatDateShort(new Date()).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

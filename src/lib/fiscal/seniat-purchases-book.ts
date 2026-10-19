/**
 * KlikPOS Enterprise - Motor Fiscal SENIAT (Artículo 75 del Reglamento de la Ley del IVA)
 * Genera el Libro Especial de Compras mensual con desglose de Base Imponible, Exento,
 * Crédito Fiscal de IVA (16%), Retenciones practicadas y Número de Control.
 */

import { SupplierInvoiceRecord } from '@/lib/db/financial-db';
import { SYSTEM_DEFAULTS } from '@/lib/constants/defaults';

export interface SeniatPurchaseRecord {
  operacionNo: number;
  fecha: string;
  rifProveedor: string;
  nombreProveedor: string;
  nroFactura: string;
  nroControl: string;
  nroNotaDebito?: string;
  nroNotaCredito?: string;
  tipoTransaccion: '01-REG' | '02-COMPL' | '03-ANUL';
  totalComprasVES: number;
  totalComprasUSD: number;
  comprasExentasVES: number;
  comprasExentasUSD: number;
  baseImponibleVES: number;
  baseImponibleUSD: number;
  alicuotaIVA: number; // 16%
  creditoFiscalIVA: number; // VES
  creditoFiscalIVAUSD: number;
  ivaRetenidoVES: number;
  ivaRetenidoUSD: number;
  nroComprobanteRetencion?: string;
  tasaBCV: number;
}

export interface SeniatPurchasesBookSummary {
  cantidadOperaciones: number;
  totalComprasVES: number;
  totalComprasUSD: number;
  totalExentasVES: number;
  totalExentasUSD: number;
  totalBaseImponibleVES: number;
  totalBaseImponibleUSD: number;
  totalCreditoFiscalIVA: number;
  totalCreditoFiscalIVAUSD: number;
  totalIvaRetenidoVES: number;
  totalIvaRetenidoUSD: number;
}

/**
 * Procesa las facturas de proveedores y construye los registros reglamentarios del Libro de Compras
 */
export function buildSeniatPurchasesBook(
  invoices: SupplierInvoiceRecord[],
  options?: {
    startDate?: string;
    endDate?: string;
  }
): { records: SeniatPurchaseRecord[]; summary: SeniatPurchasesBookSummary } {
  // Ordenar cronológicamente (más antiguo primero para el libro)
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(a.dateIssued).getTime() - new Date(b.dateIssued).getTime()
  );

  const filtered = sortedInvoices.filter((inv) => {
    if (!inv.dateIssued) return false;
    if (options?.startDate && inv.dateIssued < options.startDate) return false;
    if (options?.endDate && inv.dateIssued > options.endDate) return false;
    return true;
  });

  const records: SeniatPurchaseRecord[] = [];

  let sumTotalComprasVES = 0;
  let sumTotalComprasUSD = 0;
  let sumExentasVES = 0;
  let sumExentasUSD = 0;
  let sumBaseImponibleVES = 0;
  let sumBaseImponibleUSD = 0;
  let sumCreditoFiscalIVA = 0;
  let sumCreditoFiscalIVAUSD = 0;
  let sumIvaRetenidoVES = 0;
  let sumIvaRetenidoUSD = 0;

  filtered.forEach((inv, index) => {
    const rate = inv.bcvRate || SYSTEM_DEFAULTS.DEFAULT_BCV_RATE;
    const totalUSD = inv.totalAmountUSD || 0;
    const totalVES = totalUSD * rate;

    // Si la factura tiene desglose explícito guardado, usarlo; de lo contrario calcular
    let exentoUSD = inv.taxExemptUSD || 0;
    let baseUSD = inv.taxableBaseUSD || 0;
    let ivaUSD = inv.taxUSD || 0;

    if (!inv.taxExemptUSD && !inv.taxableBaseUSD && !inv.taxUSD) {
      // Si no fue desglosado al crearse, asumir compra estándar gravada con IVA 16%
      baseUSD = Number((totalUSD / 1.16).toFixed(2));
      ivaUSD = Number((totalUSD - baseUSD).toFixed(2));
      exentoUSD = 0;
    }

    const exentoVES = Number((exentoUSD * rate).toFixed(2));
    const baseVES = Number((baseUSD * rate).toFixed(2));
    const ivaVES = Number((ivaUSD * rate).toFixed(2));

    const retencionUSD = inv.retentionIVAUSD || 0;
    const retencionVES = Number((retencionUSD * rate).toFixed(2));

    sumTotalComprasVES += totalVES;
    sumTotalComprasUSD += totalUSD;
    sumExentasVES += exentoVES;
    sumExentasUSD += exentoUSD;
    sumBaseImponibleVES += baseVES;
    sumBaseImponibleUSD += baseUSD;
    sumCreditoFiscalIVA += ivaVES;
    sumCreditoFiscalIVAUSD += ivaUSD;
    sumIvaRetenidoVES += retencionVES;
    sumIvaRetenidoUSD += retencionUSD;

    records.push({
      operacionNo: index + 1,
      fecha: inv.dateIssued,
      rifProveedor: inv.supplierRif || 'J-00000000-0',
      nombreProveedor: inv.supplierName || 'PROVEEDOR VARIOS',
      nroFactura: inv.invoiceNumber || 'S/N',
      nroControl: inv.controlNumber || `00-${String(index + 1).padStart(6, '0')}`,
      tipoTransaccion: '01-REG',
      totalComprasVES: Number(totalVES.toFixed(2)),
      totalComprasUSD: Number(totalUSD.toFixed(2)),
      comprasExentasVES: exentoVES,
      comprasExentasUSD: exentoUSD,
      baseImponibleVES: baseVES,
      baseImponibleUSD: baseUSD,
      alicuotaIVA: 16,
      creditoFiscalIVA: ivaVES,
      creditoFiscalIVAUSD: ivaUSD,
      ivaRetenidoVES: retencionVES,
      ivaRetenidoUSD: retencionUSD,
      nroComprobanteRetencion: inv.retentionReceiptNumber,
      tasaBCV: rate,
    });
  });

  const summary: SeniatPurchasesBookSummary = {
    cantidadOperaciones: records.length,
    totalComprasVES: Number(sumTotalComprasVES.toFixed(2)),
    totalComprasUSD: Number(sumTotalComprasUSD.toFixed(2)),
    totalExentasVES: Number(sumExentasVES.toFixed(2)),
    totalExentasUSD: Number(sumExentasUSD.toFixed(2)),
    totalBaseImponibleVES: Number(sumBaseImponibleVES.toFixed(2)),
    totalBaseImponibleUSD: Number(sumBaseImponibleUSD.toFixed(2)),
    totalCreditoFiscalIVA: Number(sumCreditoFiscalIVA.toFixed(2)),
    totalCreditoFiscalIVAUSD: Number(sumCreditoFiscalIVAUSD.toFixed(2)),
    totalIvaRetenidoVES: Number(sumIvaRetenidoVES.toFixed(2)),
    totalIvaRetenidoUSD: Number(sumIvaRetenidoUSD.toFixed(2)),
  };

  return { records, summary };
}

/**
 * Genera el archivo CSV oficial para el Contador con formato compatible con Excel (separador ;)
 */
export function exportSeniatPurchasesBookToCSV(
  records: SeniatPurchaseRecord[],
  summary: SeniatPurchasesBookSummary,
  storeRif: string = 'J-50000000-0',
  periodName: string = 'MES ACTUAL'
): string {
  const headers = [
    'Operación N°',
    'Fecha Emisión',
    'RIF Proveedor',
    'Nombre o Razón Social del Proveedor',
    'Número de Factura',
    'Número de Control SENIAT',
    'Tipo Transacción',
    'Total Compras Bs.',
    'Total Compras USD',
    'Compras Exentas Bs.',
    'Base Imponible (16%) Bs.',
    'Alícuota IVA %',
    'Crédito Fiscal IVA Bs.',
    'Crédito Fiscal IVA USD',
    'IVA Retenido Bs.',
    'Comprobante Retención',
    'Tasa BCV Aplicada',
  ];

  const lines: string[] = [];

  // Encabezado institucional del archivo
  lines.push(`"LIBRO ESPECIAL DE COMPRAS - SENIAT (Art. 75 Reglamento Ley del IVA)"`);
  lines.push(`"Contribuyente: ${storeRif}"`);
  lines.push(`"Período Fiscal: ${periodName}"`);
  lines.push(`"Fecha de Emisión del Reporte: ${new Date().toLocaleString('es-VE')}"`);
  lines.push('');
  lines.push(headers.map((h) => `"${h}"`).join(';'));

  records.forEach((r) => {
    const row = [
      r.operacionNo,
      r.fecha,
      r.rifProveedor,
      r.nombreProveedor.replace(/"/g, '""'),
      r.nroFactura,
      r.nroControl,
      r.tipoTransaccion,
      r.totalComprasVES.toFixed(2).replace('.', ','),
      r.totalComprasUSD.toFixed(2).replace('.', ','),
      r.comprasExentasVES.toFixed(2).replace('.', ','),
      r.baseImponibleVES.toFixed(2).replace('.', ','),
      `${r.alicuotaIVA}%`,
      r.creditoFiscalIVA.toFixed(2).replace('.', ','),
      r.creditoFiscalIVAUSD.toFixed(2).replace('.', ','),
      r.ivaRetenidoVES.toFixed(2).replace('.', ','),
      r.nroComprobanteRetencion || '',
      r.tasaBCV.toFixed(2).replace('.', ','),
    ];
    lines.push(row.map((val) => `"${val}"`).join(';'));
  });

  // Línea de totales
  lines.push('');
  const summaryRow = [
    '"TOTALES GENERALES"',
    '""',
    '""',
    `"${summary.cantidadOperaciones} Operaciones"`,
    '""',
    '""',
    '""',
    `"${summary.totalComprasVES.toFixed(2).replace('.', ',')}"`,
    `"${summary.totalComprasUSD.toFixed(2).replace('.', ',')}"`,
    `"${summary.totalExentasVES.toFixed(2).replace('.', ',')}"`,
    `"${summary.totalBaseImponibleVES.toFixed(2).replace('.', ',')}"`,
    '""',
    `"${summary.totalCreditoFiscalIVA.toFixed(2).replace('.', ',')}"`,
    `"${summary.totalCreditoFiscalIVAUSD.toFixed(2).replace('.', ',')}"`,
    `"${summary.totalIvaRetenidoVES.toFixed(2).replace('.', ',')}"`,
    '""',
    '""',
  ];
  lines.push(summaryRow.join(';'));

  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Venematic POS - Motor Fiscal SENIAT (Providencia SNAT/2011/00071)
 * Genera el Libro de Ventas mensual con desglose de IVA (16%) e IGTF (3%)
 */

import { LocalSale } from '@/lib/db';

export interface SeniatSaleRecord {
  operacionNo: number;
  fecha: string;
  rif: string;
  nombreCliente: string;
  nroFactura: string;
  nroControl: string;
  facturaAfectada: string;
  tipoTransaccion: string; // '01-REG' | '03-ANUL'
  totalVentasVES: number;
  ventasExentasVES: number;
  baseImponibleVES: number;
  alicuotaIVA: number; // 16%
  debitoFiscalIVA: number;
  baseIgtfVES: number;
  baseIgtfUSD: number;
  alicuotaIGTF: number; // 3%
  igtfPercibidoVES: number;
  igtfPercibidoUSD: number;
  totalVentaUSD: number;
  tasaBCV: number;
}

export interface SeniatSalesBookSummary {
  cantidadOperaciones: number;
  totalVentasVES: number;
  totalVentasUSD: number;
  totalExentasVES: number;
  totalBaseImponibleVES: number;
  totalDebitoFiscalIVA: number;
  totalBaseIgtfVES: number;
  totalBaseIgtfUSD: number;
  totalIgtfPercibidoVES: number;
  totalIgtfPercibidoUSD: number;
}

// Categorías que por ley gozan de exención de IVA en la canasta básica (alimentos frescos y medicinas)
const EXEMPT_CATEGORIES = [
  'Víveres',
  'Panadería',
  'Frutería / Verduras',
  'Carnicería',
  'Farmacia & Salud',
  'Canasta Básica',
];

/**
 * Procesa las ventas del período y construye los registros reglamentarios del Libro de Ventas
 */
export function buildSeniatSalesBook(
  sales: LocalSale[],
  options?: {
    startDate?: string;
    endDate?: string;
    forceAllTaxable?: boolean;
  }
): { records: SeniatSaleRecord[]; summary: SeniatSalesBookSummary } {
  // Ordenar cronológicamente (más antiguo primero para el libro)
  const sortedSales = [...sales].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const filtered = sortedSales.filter((s) => {
    if (!s.timestamp) return false;
    // Excluir ventas a crédito / fiado de la liquidación fiscal inmediata (no constituyen factura fiscal hasta su cobro definitivo)
    const isCredit = Array.isArray(s.payments) && s.payments.some((p) => p.method === 'credit');
    if (isCredit) return false;
    const saleDate = s.timestamp.split('T')[0];
    if (options?.startDate && saleDate < options.startDate) return false;
    if (options?.endDate && saleDate > options.endDate) return false;
    return true;
  });

  const records: SeniatSaleRecord[] = [];

  let sumTotalVentasVES = 0;
  let sumTotalVentasUSD = 0;
  let sumExentasVES = 0;
  let sumBaseImponibleVES = 0;
  let sumDebitoFiscalIVA = 0;
  let sumBaseIgtfVES = 0;
  let sumBaseIgtfUSD = 0;
  let sumIgtfVES = 0;
  let sumIgtfUSD = 0;

  filtered.forEach((sale, index) => {
    const isVoided = sale.status === 'voided' || sale.status === 'cancelled';
    const rate = sale.bcvRate || 848.55;
    const totalUSD = sale.totalUSD || 0;
    const totalVES = sale.totalVES || totalUSD * rate;

    // 1. Desglose de Exento vs Gravado
    let exentoUSD = 0;
    let gravadoConIvaUSD = 0;

    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item) => {
        // En Venezuela, productos marcados como exentos o alimentos esenciales están exentos de IVA
        const isExempt = item.isTaxExempt !== undefined
          ? Boolean(item.isTaxExempt)
          : (!options?.forceAllTaxable && EXEMPT_CATEGORIES.some((cat) => (item.name || '').toLowerCase().includes(cat.toLowerCase())));
        if (isExempt) {
          exentoUSD += item.totalUSD;
        } else {
          gravadoConIvaUSD += item.totalUSD;
        }
      });
    } else {
      // Fallback: 50% exento básico si no hay items detallados
      exentoUSD = totalUSD * 0.4;
      gravadoConIvaUSD = totalUSD * 0.6;
    }

    // Si la venta está anulada, sus montos fiscales son 0 o negativos en el reporte
    const multiplier = isVoided ? 0 : 1;

    // En Venezuela, el precio de venta en mostrador se fija normalmente con IVA incluido
    // Base imponible = Total Gravado / 1.16
    const baseGravadaUSD = (gravadoConIvaUSD / 1.16) * multiplier;
    const ivaUSD = (gravadoConIvaUSD - baseGravadaUSD) * multiplier;

    const baseImponibleVES = baseGravadaUSD * rate;
    const debitoFiscalIVA = ivaUSD * rate;
    const ventasExentasVES = exentoUSD * rate * multiplier;

    // 2. Cálculo del IGTF (3% sobre pagos en divisas / moneda extranjera)
    let divisaPaidUSD = 0;
    if (sale.payments && Array.isArray(sale.payments)) {
      sale.payments.forEach((p) => {
        if (p.method === 'cash_usd' || p.method === 'zelle') {
          divisaPaidUSD += p.amountUSD || 0;
        }
      });
    }

    // El IGTF aplica sobre el pago efectivamente liquidado en divisas
    const baseIgtfUSD = Math.min(divisaPaidUSD, totalUSD) * multiplier;
    const baseIgtfVES = baseIgtfUSD * rate;
    const igtfPercibidoUSD = baseIgtfUSD * 0.03;
    const igtfPercibidoVES = baseIgtfVES * 0.03;

    const effectiveTotalVES = isVoided ? 0 : (ventasExentasVES + baseImponibleVES + debitoFiscalIVA);

    // Formatear Fecha DD/MM/AAAA
    let fechaStr = '';
    try {
      const d = new Date(sale.timestamp);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      fechaStr = `${day}/${month}/${year}`;
    } catch {
      fechaStr = sale.timestamp.split('T')[0] || '';
    }

    // Nro de control correlativo (ej: 00-000123)
    const nroControl = `00-${String(sale.id || index + 1).padStart(6, '0')}`;
    const nroFactura = sale.receiptNumber || `TKT-${String(index + 1).padStart(5, '0')}`;

    const record: SeniatSaleRecord = {
      operacionNo: index + 1,
      fecha: fechaStr,
      rif: sale.customerDoc && sale.customerDoc.trim() !== '' ? sale.customerDoc.toUpperCase() : 'V-00000000',
      nombreCliente: sale.customerName && sale.customerName.trim() !== '' ? sale.customerName : 'CLIENTE DE CONTADO / CONSUMIDOR FINAL',
      nroFactura,
      nroControl,
      facturaAfectada: isVoided ? nroFactura : '',
      tipoTransaccion: isVoided ? '03-ANUL' : '01-REG',
      totalVentasVES: Number(effectiveTotalVES.toFixed(2)),
      ventasExentasVES: Number(ventasExentasVES.toFixed(2)),
      baseImponibleVES: Number(baseImponibleVES.toFixed(2)),
      alicuotaIVA: 16,
      debitoFiscalIVA: Number(debitoFiscalIVA.toFixed(2)),
      baseIgtfVES: Number(baseIgtfVES.toFixed(2)),
      baseIgtfUSD: Number(baseIgtfUSD.toFixed(2)),
      alicuotaIGTF: 3,
      igtfPercibidoVES: Number(igtfPercibidoVES.toFixed(2)),
      igtfPercibidoUSD: Number(igtfPercibidoUSD.toFixed(2)),
      totalVentaUSD: isVoided ? 0 : Number(totalUSD.toFixed(2)),
      tasaBCV: Number(rate.toFixed(2)),
    };

    records.push(record);

    if (!isVoided) {
      sumTotalVentasVES += effectiveTotalVES;
      sumTotalVentasUSD += totalUSD;
      sumExentasVES += ventasExentasVES;
      sumBaseImponibleVES += baseImponibleVES;
      sumDebitoFiscalIVA += debitoFiscalIVA;
      sumBaseIgtfVES += baseIgtfVES;
      sumBaseIgtfUSD += baseIgtfUSD;
      sumIgtfVES += igtfPercibidoVES;
      sumIgtfUSD += igtfPercibidoUSD;
    }
  });

  const summary: SeniatSalesBookSummary = {
    cantidadOperaciones: records.length,
    totalVentasVES: Number(sumTotalVentasVES.toFixed(2)),
    totalVentasUSD: Number(sumTotalVentasUSD.toFixed(2)),
    totalExentasVES: Number(sumExentasVES.toFixed(2)),
    totalBaseImponibleVES: Number(sumBaseImponibleVES.toFixed(2)),
    totalDebitoFiscalIVA: Number(sumDebitoFiscalIVA.toFixed(2)),
    totalBaseIgtfVES: Number(sumBaseIgtfVES.toFixed(2)),
    totalBaseIgtfUSD: Number(sumBaseIgtfUSD.toFixed(2)),
    totalIgtfPercibidoVES: Number(sumIgtfVES.toFixed(2)),
    totalIgtfPercibidoUSD: Number(sumIgtfUSD.toFixed(2)),
  };

  return { records, summary };
}

/**
 * Exporta el Libro de Ventas en formato CSV delimitado por punto y coma (;)
 * compatible nativamente con Excel en español, Saint y sistemas contables
 */
export function exportSeniatSalesBookToCSV(
  records: SeniatSaleRecord[],
  summary: SeniatSalesBookSummary,
  storeInfo: { name: string; rif: string },
  periodLabel: string
): void {
  if (typeof window === 'undefined') return;

  const sep = ';';
  const lines: string[] = [];

  // Encabezado Fiscal Exigido por Providencia 00071
  lines.push(`LIBRO DE VENTAS - FORMATO SENIAT PROVIDENCIA ADMINISTRATIVA SNAT/2011/00071`);
  lines.push(`EMPRESA: ${storeInfo.name}`);
  lines.push(`RIF: ${storeInfo.rif}`);
  lines.push(`PERÍODO FISCAL: ${periodLabel}`);
  lines.push(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}`);
  lines.push(``);

  // Columnas Reglamentarias
  const headers = [
    'Nro. Op.',
    'Fecha',
    'RIF / CI Comprador',
    'Nombre o Razón Social',
    'Nro. Factura / Ticket',
    'Nro. Control',
    'Factura Afectada',
    'Tipo Transacción',
    'Total Ventas Incl. IVA (VES)',
    'Ventas Exentas (VES)',
    'Base Imponible 16% (VES)',
    '% Alícuota',
    'Débito Fiscal IVA 16% (VES)',
    'Base Imponible IGTF (VES)',
    'Base IGTF (USD)',
    '% IGTF',
    'Impuesto IGTF 3% (VES)',
    'Impuesto IGTF 3% (USD)',
    'Total Ref ($ USD)',
    'Tasa BCV Oficial',
  ];

  lines.push(headers.join(sep));

  // Filas de Detalle
  records.forEach((r) => {
    const row = [
      r.operacionNo,
      r.fecha,
      r.rif,
      `"${r.nombreCliente.replace(/"/g, '""')}"`,
      r.nroFactura,
      r.nroControl,
      r.facturaAfectada || '-',
      r.tipoTransaccion,
      r.totalVentasVES.toFixed(2).replace('.', ','),
      r.ventasExentasVES.toFixed(2).replace('.', ','),
      r.baseImponibleVES.toFixed(2).replace('.', ','),
      '16%',
      r.debitoFiscalIVA.toFixed(2).replace('.', ','),
      r.baseIgtfVES.toFixed(2).replace('.', ','),
      r.baseIgtfUSD.toFixed(2).replace('.', ','),
      '3%',
      r.igtfPercibidoVES.toFixed(2).replace('.', ','),
      r.igtfPercibidoUSD.toFixed(2).replace('.', ','),
      r.totalVentaUSD.toFixed(2).replace('.', ','),
      r.tasaBCV.toFixed(2).replace('.', ','),
    ];
    lines.push(row.join(sep));
  });

  // Fila de Totales
  lines.push(``);
  const totalsRow = [
    'TOTALES GENERALES',
    '',
    '',
    `Total Operaciones: ${summary.cantidadOperaciones}`,
    '',
    '',
    '',
    '',
    summary.totalVentasVES.toFixed(2).replace('.', ','),
    summary.totalExentasVES.toFixed(2).replace('.', ','),
    summary.totalBaseImponibleVES.toFixed(2).replace('.', ','),
    '',
    summary.totalDebitoFiscalIVA.toFixed(2).replace('.', ','),
    summary.totalBaseIgtfVES.toFixed(2).replace('.', ','),
    summary.totalBaseIgtfUSD.toFixed(2).replace('.', ','),
    '',
    summary.totalIgtfPercibidoVES.toFixed(2).replace('.', ','),
    summary.totalIgtfPercibidoUSD.toFixed(2).replace('.', ','),
    summary.totalVentasUSD.toFixed(2).replace('.', ','),
    '',
  ];
  lines.push(totalsRow.join(sep));

  // Crear Blob UTF-8 con BOM para que Excel respete caracteres latinos (á, é, í, ó, ú, ñ)
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanRif = (storeInfo.rif || 'RIF').replace(/[^A-Z0-9]/gi, '_');
  const cleanPeriod = periodLabel.replace(/[^A-Z0-9]/gi, '_');
  a.download = `Libro_Ventas_SENIAT_${cleanRif}_${cleanPeriod}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

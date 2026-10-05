'use client';

import React from 'react';
import { X, Printer, Share2, CheckCircle2, AlertTriangle, Bike, Store, MapPin, User, Calendar, DollarSign } from 'lucide-react';
import { CompletedSaleTicket, CompanyInfo, PosOrder } from '@/types/tablet-pos';
import { LocalSale } from '@/lib/db';

interface SaleReceiptModalProps {
  completedSaleTicket: CompletedSaleTicket | null;
  onClose: () => void;
  onNewSale?: () => void;
  companyInfo: CompanyInfo;
  isLight: boolean;
  primaryColor?: string;
}

/**
 * Convierte un pedido (PosOrder) al formato de ticket de venta para previsualización e impresión
 */
export function orderToSaleTicket(order: PosOrder, bcvRate: number): CompletedSaleTicket {
  return {
    ticketNumber: order.orderNumber,
    timestamp: order.createdAt ? new Date(order.createdAt).toLocaleString('es-VE') : new Date().toLocaleString('es-VE'),
    items: order.items,
    subtotalUSD: order.totalUSD,
    totalUSD: order.totalUSD,
    totalVES: order.totalVES || order.totalUSD * bcvRate,
    bcvRate,
    paymentMethod: order.paymentMethod,
    customer: order.customer,
    table: order.table,
    orderType: order.type,
    paymentStatus: order.paymentStatus,
    driverName: order.driverName,
    deliveryAddress: order.deliveryAddress,
  };
}

/**
 * Convierte una venta local histórica (LocalSale de Dexie) a CompletedSaleTicket para previsualización e impresión
 */
export function localSaleToTicket(sale: LocalSale, defaultCompany?: CompanyInfo): CompletedSaleTicket {
  const methodLabel = sale.payments && sale.payments.length > 0
    ? sale.payments.map(p => p.method).join(' + ')
    : 'Efectivo';

  return {
    ticketNumber: sale.receiptNumber || String(sale.id || 'N/A'),
    timestamp: sale.timestamp ? new Date(sale.timestamp).toLocaleString('es-VE') : new Date().toLocaleString('es-VE'),
    items: (sale.items || []).map(it => ({
      id: String(it.productId || Math.random()),
      name: it.name,
      priceUSD: it.priceUSD,
      qty: it.qty,
      sku: it.barcode || '',
      category: 'General'
    })),
    subtotalUSD: sale.subtotalUSD || sale.totalUSD,
    totalUSD: sale.totalUSD,
    totalVES: sale.totalVES,
    bcvRate: sale.bcvRate || 1,
    paymentMethod: methodLabel,
    reference: sale.payments?.[0]?.reference,
    changeUSD: sale.changeUSD,
    changeVES: sale.changeVES,
    customer: {
      id: String(sale.customerDoc || sale.id || 'cust-1'),
      name: sale.customerName || 'Cliente Ocasional',
      docId: sale.customerDoc || 'V-00000000',
      phone: (sale as any).customerPhone || 'N/A',
      address: sale.deliveryAddress || ''
    },
    table: sale.table,
    orderType: sale.orderType || 'local',
    paymentStatus: sale.paymentStatus || (sale.status === 'pending' ? 'por_cobrar' : 'pagado'),
    driverName: sale.driverName,
    deliveryAddress: sale.deliveryAddress,
    cashierName: sale.cashierName
  };
}

export function SaleReceiptModal({
  completedSaleTicket,
  onClose,
  onNewSale,
  companyInfo,
  isLight,
  primaryColor = '#f59e0b',
}: SaleReceiptModalProps) {
  if (!completedSaleTicket) return null;

  const isDelivery = completedSaleTicket.orderType === 'delivery';
  const isPorCobrar = completedSaleTicket.paymentStatus === 'por_cobrar';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    let text = `🧾 *COMPROBANTE DE COMPRA - ${companyInfo.name}*\n` +
      `🏢 RIF: ${companyInfo.rif} | 📞 Tel: ${companyInfo.phone}\n` +
      `📍 ${companyInfo.address}\n` +
      `--------------------------------\n` +
      `🎫 *Ticket / Orden:* ${completedSaleTicket.ticketNumber}\n` +
      `📅 *Fecha:* ${completedSaleTicket.timestamp}\n` +
      `👤 *Cliente:* ${completedSaleTicket.customer.name} (${completedSaleTicket.customer.docId})\n`;

    if (isDelivery) {
      text += `🛵 *Modalidad:* DELIVERY\n`;
      if (completedSaleTicket.driverName) text += `🏍️ *Chofer:* ${completedSaleTicket.driverName}\n`;
      if (completedSaleTicket.deliveryAddress) text += `📍 *Dirección:* ${completedSaleTicket.deliveryAddress}\n`;
    } else {
      text += `🏪 *Ubicación:* ${completedSaleTicket.table || 'Mostrador / Salón'}\n`;
    }

    text += `💳 *Estado de Pago:* ${isPorCobrar ? '⚠️ POR COBRAR EN DESTINO' : '✓ PAGADO'}\n` +
      `💰 *Método:* ${completedSaleTicket.paymentMethod}\n` +
      `--------------------------------\n` +
      `*DETALLE DE PRODUCTOS:*\n`;

    completedSaleTicket.items.forEach(it => {
      text += `• ${it.qty}x ${it.name} - $${(it.priceUSD * it.qty).toFixed(2)}\n`;
    });

    text += `--------------------------------\n` +
      `💵 *TOTAL USD:* $${completedSaleTicket.totalUSD.toFixed(2)}\n` +
      `🇻🇪 *TOTAL BS (BCV):* Bs. ${completedSaleTicket.totalVES.toFixed(2)}\n` +
      `(Tasa Oficial: Bs. ${completedSaleTicket.bcvRate.toFixed(2)})\n`;

    if ((completedSaleTicket.changeUSD ?? 0) > 0.005 || (completedSaleTicket.changeVES ?? 0) > 0.05) {
      text += `💸 *Vuelto Entregado:* `;
      if ((completedSaleTicket.changeUSD ?? 0) > 0) text += `$${completedSaleTicket.changeUSD!.toFixed(2)} `;
      if ((completedSaleTicket.changeVES ?? 0) > 0) text += `Bs. ${completedSaleTicket.changeVES!.toFixed(2)}`;
      text += `\n`;
    }

    text += `\n"${companyInfo.footerMsg}"`;

    const encoded = encodeURIComponent(text);
    const phoneClean = (completedSaleTicket.customer.phone || '').replace(/[^0-9]/g, '');
    const waUrl = phoneClean.length >= 10
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  return (
    <>
      {/* Estilos CSS aislados de Impresión Térmica Oficial */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #thermal-printable-ticket, #thermal-printable-ticket * {
              visibility: visible !important;
            }
            #thermal-printable-ticket {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 80mm !important;
              margin: 0 auto !important;
              padding: 5mm 3mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              box-shadow: none !important;
              border: none !important;
              font-family: monospace !important;
              font-size: 11px !important;
              line-height: 1.25 !important;
              z-index: 9999999 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto no-print">
        <div className={`border rounded-3xl p-4 sm:p-5 max-w-md w-full space-y-3.5 shadow-2xl relative my-auto ${
          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0f172a] border-slate-800'
        }`}>
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 active:scale-90 cursor-pointer transition-all"
            title="Cerrar Previsualización"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner de Previsualización */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
              isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <Printer className="w-3.5 h-3.5" />
              <span>Previsualización de Ticket Térmico</span>
            </span>

            {isDelivery ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                <span>Local / Salón</span>
              </span>
            )}
          </div>

          {/* =================================================================== */}
          {/* CONTENEDOR DEL TICKET TÉRMICO (ESTO ES EXACTAMENTE LO QUE SE IMPRIME) */}
          {/* =================================================================== */}
          <div
            id="thermal-printable-ticket"
            className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-inner border border-slate-200 font-mono text-xs space-y-3"
          >
            {/* Header del Negocio */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2.5">
              <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">
                {companyInfo.name}
              </h2>
              <p className="text-[11px] font-semibold text-slate-600">
                RIF: {companyInfo.rif}
              </p>
              <p className="text-[10px] text-slate-500">
                Tel: {companyInfo.phone}
              </p>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                {companyInfo.address}
              </p>
            </div>

            {/* Metadatos de la Orden y Despacho */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold">
                <span>TICKET / ORDEN:</span>
                <span className="text-slate-950 font-black text-xs">#{completedSaleTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>FECHA Y HORA:</span>
                <span>{completedSaleTicket.timestamp}</span>
              </div>

              {/* Modalidad: Local o Delivery */}
              <div className="flex justify-between items-center pt-0.5 font-bold">
                <span>MODALIDAD:</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isDelivery ? 'bg-purple-100 text-purple-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {isDelivery ? '🛵 ENTREGA DELIVERY' : (completedSaleTicket.table ? `🏪 ${completedSaleTicket.table}` : '🏪 SALÓN / MOSTRADOR')}
                </span>
              </div>

              {/* Si es delivery, mostrar datos de despacho */}
              {isDelivery && (
                <div className="bg-slate-50 p-2 rounded-lg space-y-0.5 text-[10.5px] mt-1 border border-slate-200">
                  {completedSaleTicket.driverName && (
                    <div className="flex items-center gap-1 text-purple-900 font-bold">
                      <Bike className="w-3 h-3 shrink-0" />
                      <span>Chofer: {completedSaleTicket.driverName}</span>
                    </div>
                  )}
                  {completedSaleTicket.deliveryAddress && (
                    <div className="flex items-start gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                      <span className="leading-tight">{completedSaleTicket.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Estado de Cobro */}
              <div className="flex justify-between items-center pt-0.5 font-bold">
                <span>ESTADO PAGO:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isPorCobrar
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {isPorCobrar ? '⚠️ POR COBRAR EN DESTINO' : '✓ PAGADO'}
                </span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="space-y-0.5 text-[10.5px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500">CLIENTE:</span>
                <span className="font-bold text-slate-900">{completedSaleTicket.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CÉDULA / RIF:</span>
                <span className="font-semibold">{completedSaleTicket.customer.docId}</span>
              </div>
              {completedSaleTicket.customer.phone && (
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">TELÉFONO:</span>
                  <span>{completedSaleTicket.customer.phone}</span>
                </div>
              )}
            </div>

            {/* Lista Desglosada de Artículos */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2.5">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase pb-0.5 border-b border-slate-200">
                <span>CANT / ARTÍCULO</span>
                <span>TOTAL $</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                {completedSaleTicket.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-[11px]">
                    <div className="pr-2 leading-tight">
                      <span className="font-bold text-slate-950">{it.qty}x</span>{' '}
                      <span className="text-slate-800">{it.name}</span>
                      {it.notes && (
                        <span className="block text-[9px] italic text-slate-500 pl-3">
                          Nota: {it.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-950 shrink-0">
                      ${(it.priceUSD * it.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liquidación Económica Dual ($ y Bs BCV) */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL USD:</span>
                <span className="text-emerald-700 font-mono">
                  ${completedSaleTicket.totalUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>TOTAL BS (BCV):</span>
                <span>Bs. {completedSaleTicket.totalVES.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Tasa Oficial BCV:</span>
                <span>Bs. {completedSaleTicket.bcvRate.toFixed(2)} / $</span>
              </div>

              {/* Método de Pago */}
              <div className="flex justify-between text-[10.5px] pt-1 border-t border-slate-100">
                <span className="text-slate-500">Forma de Pago:</span>
                <span className="font-bold uppercase text-slate-800">
                  {completedSaleTicket.paymentMethod}
                </span>
              </div>

              {completedSaleTicket.reference && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Referencia / Aprob:</span>
                  <span className="font-bold font-mono">{completedSaleTicket.reference}</span>
                </div>
              )}

              {/* Desglose Pago Mixto si aplica */}
              {completedSaleTicket.mixedPayments && completedSaleTicket.mixedPayments.length > 0 && (
                <div className="py-1 px-2 bg-slate-50 rounded-lg space-y-0.5 border border-slate-200 my-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Detalle de Pagos:</span>
                  {completedSaleTicket.mixedPayments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span>{p.method.replace('_', ' ').toUpperCase()}:</span>
                      <span className="font-bold">
                        {p.currency === 'USD' ? `$${p.amount.toFixed(2)}` : `Bs. ${p.amount.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vuelto Entregado si aplica */}
              {((completedSaleTicket.changeUSD ?? 0) > 0.005 || (completedSaleTicket.changeVES ?? 0) > 0.05) && (
                <div className="flex justify-between text-emerald-700 font-bold text-[11px] pt-0.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <span>VUELTO ENTREGADO:</span>
                  <span>
                    {(completedSaleTicket.changeUSD ?? 0) > 0 ? `$${completedSaleTicket.changeUSD!.toFixed(2)}` : ''}
                    {(completedSaleTicket.changeUSD ?? 0) > 0 && (completedSaleTicket.changeVES ?? 0) > 0 ? ' / ' : ''}
                    {(completedSaleTicket.changeVES ?? 0) > 0 ? `Bs. ${completedSaleTicket.changeVES!.toFixed(2)}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Mensaje de Pie de Ticket */}
            <div className="text-center pt-2 text-[10px] text-slate-500 italic border-t border-dashed border-slate-300">
              "{companyInfo.footerMsg}"
            </div>
          </div>

          {/* =================================================================== */}
          {/* BOTONES DE ACCIÓN: IMPRIMIR, WHATSAPP, NUEVA VENTA / CERRAR         */}
          {/* =================================================================== */}
          <div className="grid grid-cols-2 gap-2 pt-1 no-print">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-2xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer transition-all border border-slate-700"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir Ticket</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {onNewSale ? (
            <button
              onClick={onNewSale}
              className="w-full py-2.5 text-slate-950 text-xs font-black rounded-2xl shadow-lg active:scale-95 cursor-pointer transition-all uppercase tracking-wider no-print"
              style={{ backgroundColor: primaryColor }}
            >
              Nueva Venta
            </button>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-2 text-xs font-black rounded-2xl active:scale-95 cursor-pointer transition-all no-print ${
                isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cerrar Previsualización
            </button>
          )}
        </div>
      </div>
    </>
  );
}
export default SaleReceiptModal;

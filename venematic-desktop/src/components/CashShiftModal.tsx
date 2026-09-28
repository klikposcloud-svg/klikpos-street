'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  db,
  LocalCashShift,
  CashDenominationBreakdown,
  CashMovement,
  LocalSale,
} from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { kickCashDrawer } from '@/lib/hardware/cash-drawer';
import { exportDatabaseBackup } from '@/lib/services/backup-service';
import { soundEffects } from '@/lib/utils/sound';
import {
  Banknote,
  DollarSign,
  Coins,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock,
  User,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'open' | 'close' | 'movement' | 'view_x';
  activeShift: LocalCashShift | null;
  bcvRate: number;
  onShiftUpdated: (shift: LocalCashShift | null) => void;
  storeInfo?: {
    name?: string;
    rif?: string;
    phone?: string;
    address?: string;
  };
}

const DEFAULT_USD_DENOMS: CashDenominationBreakdown = {
  usd_100: 0,
  usd_50: 0,
  usd_20: 0,
  usd_10: 0,
  usd_5: 0,
  usd_2: 0,
  usd_1: 0,
  usd_coins: 0,
  ves_100: 0,
  ves_50: 0,
  ves_20: 0,
  ves_10: 0,
  ves_5: 0,
  ves_coins: 0,
};

export default function CashShiftModal({
  isOpen,
  onClose,
  initialMode = 'open',
  activeShift,
  bcvRate,
  onShiftUpdated,
  storeInfo,
}: CashShiftModalProps) {
  const [mode, setMode] = useState<'open' | 'close' | 'movement' | 'view_x'>(initialMode);
  const [currencyTab, setCurrencyTab] = useState<'USD' | 'VES'>('USD');
  const [cashierName, setCashierName] = useState<string>('Cajero Principal');
  const [denominations, setDenominations] = useState<CashDenominationBreakdown>(DEFAULT_USD_DENOMS);
  const [notes, setNotes] = useState<string>('');
  const [salesInShift, setSalesInShift] = useState<LocalSale[]>([]);
  const [movementsInShift, setMovementsInShift] = useState<CashMovement[]>([]);

  // Estado para nuevo movimiento de caja (Entrada / Salida)
  const [movType, setMovType] = useState<'in' | 'out'>('in');
  const [movCurrency, setMovCurrency] = useState<'USD' | 'VES'>('USD');
  const [movAmount, setMovAmount] = useState<string>('');
  const [movReason, setMovReason] = useState<string>('Aporte Extra de Caja');
  const [movNotes, setMovNotes] = useState<string>('');

  // Vista previa de impresión
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCurrencyTab('USD');
      setShowPrintPreview(false);
      setNotes('');
      setDenominations({ ...DEFAULT_USD_DENOMS });

      // Cargar nombre de cajero si hay turno activo o de localStorage
      if (activeShift) {
        setCashierName(activeShift.cashierName || 'Cajero Principal');
      } else if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('venematic_user');
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            if (u.name) setCashierName(u.name);
          } catch {}
        }
      }

      // Si es cierre o vista previa, cargar ventas y movimientos del turno
      if (activeShift && (initialMode === 'close' || initialMode === 'view_x')) {
        loadShiftFinancials();
      }
    }
  }, [isOpen, initialMode, activeShift]);

  const loadShiftFinancials = async () => {
    if (!activeShift?.openedAt) return;
    try {
      const openTime = new Date(activeShift.openedAt).getTime();
      const salesSinceOpen = await db.sales.where('timestamp').aboveOrEqual(activeShift.openedAt).toArray();
      const filtered = salesSinceOpen.filter((s) => {
        if (s.status !== 'completed') return false;
        const sTime = new Date(s.timestamp).getTime();
        return sTime >= openTime;
      });
      setSalesInShift(filtered);

      if (activeShift.id) {
        const movs = await db.cashMovements.where('shiftId').equals(activeShift.id).toArray();
        setMovementsInShift(movs);
      }
    } catch (err) {
      console.error('Error cargando financieras de turno:', err);
    }
  };

  // Cálculo de totales denominacionales ingresados
  const countedUSD = useMemo(() => {
    const d = denominations;
    return (
      (d.usd_100 || 0) * 100 +
      (d.usd_50 || 0) * 50 +
      (d.usd_20 || 0) * 20 +
      (d.usd_10 || 0) * 10 +
      (d.usd_5 || 0) * 5 +
      (d.usd_2 || 0) * 2 +
      (d.usd_1 || 0) * 1 +
      (d.usd_coins || 0)
    );
  }, [denominations]);

  const countedVES = useMemo(() => {
    const d = denominations;
    return (
      (d.ves_100 || 0) * 100 +
      (d.ves_50 || 0) * 50 +
      (d.ves_20 || 0) * 20 +
      (d.ves_10 || 0) * 10 +
      (d.ves_5 || 0) * 5 +
      (d.ves_coins || 0)
    );
  }, [denominations]);

  // Cálculos del sistema durante el turno
  const systemSalesMetrics = useMemo(() => {
    let salesUSD = 0;
    let cashUSDReceived = 0;
    let changeUSDGiven = 0;
    let cashVESReceived = 0;
    let changeVESGiven = 0;
    let pagoMovilVES = 0;
    let cardVES = 0;
    let zelleUSD = 0;

    salesInShift.forEach((sale) => {
      salesUSD += sale.totalUSD || 0;
      if (Array.isArray(sale.payments)) {
        sale.payments.forEach((p) => {
          if (p.method === 'cash_usd') cashUSDReceived += p.amountUSD || 0;
          if (p.method === 'cash_ves') cashVESReceived += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          if (p.method === 'pago_movil') pagoMovilVES += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          if (p.method === 'card_debit') cardVES += p.amountVES || (p.amountUSD * (sale.bcvRate || bcvRate));
          if (p.method === 'zelle') zelleUSD += p.amountUSD || 0;
        });
      }
      changeUSDGiven += sale.changeUSD || 0;
      changeVESGiven += sale.changeVES || 0;
    });

    const netCashUSDInSales = cashUSDReceived - changeUSDGiven;
    const netCashVESInSales = cashVESReceived - changeVESGiven;

    let movInUSD = 0;
    let movOutUSD = 0;
    let movInVES = 0;
    let movOutVES = 0;

    movementsInShift.forEach((m) => {
      if (m.type === 'in') {
        movInUSD += m.amountUSD || 0;
        movInVES += m.amountVES || 0;
      } else {
        movOutUSD += m.amountUSD || 0;
        movOutVES += m.amountVES || 0;
      }
    });

    const initialUSD = activeShift?.initialCashUSD || 0;
    const initialVES = activeShift?.initialCashVES || 0;

    const expectedUSD = initialUSD + netCashUSDInSales + movInUSD - movOutUSD;
    const expectedVES = initialVES + netCashVESInSales + movInVES - movOutVES;

    return {
      salesUSD,
      netCashUSDInSales,
      netCashVESInSales,
      pagoMovilVES,
      cardVES,
      zelleUSD,
      movInUSD,
      movOutUSD,
      movInVES,
      movOutVES,
      expectedUSD,
      expectedVES,
      initialUSD,
      initialVES,
    };
  }, [salesInShift, movementsInShift, activeShift, bcvRate]);

  // Diferencia de Arqueo (Real vs Esperado)
  const diffUSD = countedUSD - systemSalesMetrics.expectedUSD;
  const diffVES = countedVES - systemSalesMetrics.expectedVES;

  const handleUpdateDenom = (field: keyof CashDenominationBreakdown, deltaOrVal: number, isAbsolute: boolean = false) => {
    setDenominations((prev) => {
      const current = prev[field] || 0;
      const next = isAbsolute ? Math.max(0, deltaOrVal) : Math.max(0, current + deltaOrVal);
      return {
        ...prev,
        [field]: next,
      };
    });
  };

  // 1. Confirmar Apertura de Caja
  const handleConfirmOpenShift = async () => {
    try {
      const newShiftId = await db.cashShifts.add({
        openedAt: new Date().toISOString(),
        cashierName: cashierName.trim() || 'Cajero Principal',
        initialCashUSD: countedUSD,
        initialCashVES: countedVES,
        initialDenominations: { ...denominations },
        totalSalesUSD: 0,
        totalCashUSD: 0,
        totalCashVES: 0,
        totalPagoMovilVES: 0,
        totalCardVES: 0,
        totalZelleUSD: 0,
        status: 'open',
        notes: notes.trim() || undefined,
      });

      const created = await db.cashShifts.get(newShiftId);
      if (created) onShiftUpdated(created);

      try {
        soundEffects.playCashRegister();
      } catch {}

      await kickCashDrawer();
      onClose();
    } catch (err: any) {
      console.error('Error al abrir turno:', err);
      alert('No se pudo abrir el turno: ' + (err?.message || 'Error desconocido'));
    }
  };

  // 2. Confirmar Cierre de Caja (Corte Z)
  const handleConfirmCloseShift = async () => {
    if (!activeShift?.id) return;

    const confirmMsg =
      `¿Confirmar el Cierre de Caja (Corte Z)?\n\n` +
      `Efectivo Esperado USD: ${formatUSD(systemSalesMetrics.expectedUSD)}\n` +
      `Efectivo Contado USD: ${formatUSD(countedUSD)}\n` +
      `Diferencia USD: ${diffUSD >= 0 ? '+' : ''}${formatUSD(diffUSD)}\n\n` +
      `Se emitirá el reporte de cierre y se abrirá la gaveta para el retiro.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const closeTime = new Date().toISOString();
      await db.cashShifts.update(activeShift.id, {
        closedAt: closeTime,
        totalSalesUSD: systemSalesMetrics.salesUSD,
        totalCashUSD: systemSalesMetrics.netCashUSDInSales,
        totalCashVES: systemSalesMetrics.netCashVESInSales,
        totalPagoMovilVES: systemSalesMetrics.pagoMovilVES,
        totalCardVES: systemSalesMetrics.cardVES,
        totalZelleUSD: systemSalesMetrics.zelleUSD,
        cashInUSD: systemSalesMetrics.movInUSD,
        cashOutUSD: systemSalesMetrics.movOutUSD,
        cashInVES: systemSalesMetrics.movInVES,
        cashOutVES: systemSalesMetrics.movOutVES,
        expectedCashUSD: systemSalesMetrics.expectedUSD,
        expectedCashVES: systemSalesMetrics.expectedVES,
        actualCashUSD: countedUSD,
        actualCashVES: countedVES,
        differenceUSD: diffUSD,
        differenceVES: diffVES,
        finalDenominations: { ...denominations },
        notes: notes.trim() || undefined,
        status: 'closed',
      });

      // Disparar apertura física de gaveta para retiro
      await kickCashDrawer();

      // Respaldo Automático Local al Emitir el Corte Z
      try {
        await exportDatabaseBackup('corte_z');
      } catch (e) {
        console.warn('Aviso en respaldo automático:', e);
      }

      onShiftUpdated(null);

      // Mostrar preview de impresión antes de cerrar modal
      setShowPrintPreview(true);
    } catch (err: any) {
      console.error('Error cerrando turno:', err);
      alert('Error cerrando caja: ' + (err?.message || 'Error desconocido'));
    }
  };

  // 3. Registrar Movimiento de Caja (Entrada / Salida)
  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift?.id) {
      alert('No hay un turno de caja activo.');
      return;
    }
    const val = parseFloat(movAmount);
    if (isNaN(val) || val <= 0) {
      alert('Ingrese un monto válido mayor a 0.');
      return;
    }

    try {
      await db.cashMovements.add({
        shiftId: activeShift.id,
        type: movType,
        amountUSD: movCurrency === 'USD' ? val : val / bcvRate,
        amountVES: movCurrency === 'VES' ? val : val * bcvRate,
        reason: movReason,
        performedBy: cashierName,
        timestamp: new Date().toISOString(),
        notes: movNotes.trim() || undefined,
      });

      await kickCashDrawer();
      alert(`✓ ${movType === 'in' ? 'Entrada' : 'Salida'} de efectivo registrada con éxito.`);
      setMovAmount('');
      setMovNotes('');
      await loadShiftFinancials();
      setMode('view_x');
    } catch (err: any) {
      alert('Error registrando movimiento: ' + (err?.message || 'Desconocido'));
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      {/* Contenedor del Modal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera Principal */}
        <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight text-white !text-white" style={{ color: '#ffffff' }}>
                {mode === 'open' && 'Apertura de Turno • Fondo de Caja (Base Inicial)'}
                {mode === 'close' && 'Cierre de Turno y Arqueo Físico (Corte Z)'}
                {mode === 'movement' && 'Movimiento de Efectivo en Caja'}
                {mode === 'view_x' && 'Arqueo Preliminar en Vivo (Corte X)'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'open' && 'Registre el desglose de billetes recibidos para iniciar operaciones en caja'}
                {mode === 'close' && 'Cuente los billetes físicos en gaveta para conciliar con el saldo del sistema'}
                {mode === 'movement' && 'Registre aportes adicionales o salidas de efectivo autorizadas'}
                {mode === 'view_x' && 'Consulta del estado financiero y balance del turno actual'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navegación rápida entre modos si el turno está abierto */}
            {activeShift && mode !== 'open' && (
              <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => setMode('view_x')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    mode === 'view_x' ? 'bg-[var(--brand-primary)] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Arqueo X
                </button>
                <button
                  type="button"
                  onClick={() => setMode('movement')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    mode === 'movement' ? 'bg-[var(--brand-primary)] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Movimiento
                </button>
                <button
                  type="button"
                  onClick={() => setMode('close')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    mode === 'close' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cierre Z
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* VISTA PREVIA DE TICKET IMPRESO */}
          {showPrintPreview ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      ¡Cierre de Turno Registrado con Éxito!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Se guardó la auditoría completa, se abrió la gaveta y se respaldó la base de datos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  <Printer className="w-4 h-4 text-white" />
                  Imprimir Ticket
                </button>
              </div>

              {/* Formato de Ticket Térmico 80mm */}
              <div className="bg-white text-slate-900 font-mono text-xs p-6 rounded-xl border border-slate-300 max-w-sm mx-auto shadow-md leading-tight print:shadow-none print:border-none print:m-0 print:p-0">
                <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
                  <p className="font-black text-sm uppercase">{storeInfo?.name || 'KLIKPOS ENTERPRISE'}</p>
                  <p className="text-[11px]">RIF: {storeInfo?.rif || 'J-50000000-0'}</p>
                  <p className="text-[10px] text-slate-600">{storeInfo?.address || 'Venezuela'}</p>
                  <p className="font-black text-[12px] pt-1">*** REPORTE CORTE Z (CIERRE) ***</p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p>Turno ID: #{activeShift?.id || '1'}</p>
                  <p>Cajero: {activeShift?.cashierName || cashierName}</p>
                  <p>Apertura: {activeShift?.openedAt ? new Date(activeShift.openedAt).toLocaleString('es-VE') : '--'}</p>
                  <p>Cierre: {new Date().toLocaleString('es-VE')}</p>
                  <p>Tasa BCV: {formatVES(bcvRate)}</p>
                </div>

                {/* Desglose Denominacional de Billetes */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p className="font-bold underline mb-1">ARQUEO FÍSICO DE GAVETA:</p>
                  <p className="font-semibold text-slate-700">Dólares ($ USD):</p>
                  {denominations.usd_100 ? <p className="flex justify-between"><span>$100 x {denominations.usd_100}</span><span>${(denominations.usd_100 * 100).toFixed(2)}</span></p> : null}
                  {denominations.usd_50 ? <p className="flex justify-between"><span>$50 x {denominations.usd_50}</span><span>${(denominations.usd_50 * 50).toFixed(2)}</span></p> : null}
                  {denominations.usd_20 ? <p className="flex justify-between"><span>$20 x {denominations.usd_20}</span><span>${(denominations.usd_20 * 20).toFixed(2)}</span></p> : null}
                  {denominations.usd_10 ? <p className="flex justify-between"><span>$10 x {denominations.usd_10}</span><span>${(denominations.usd_10 * 10).toFixed(2)}</span></p> : null}
                  {denominations.usd_5 ? <p className="flex justify-between"><span>$5 x {denominations.usd_5}</span><span>${(denominations.usd_5 * 5).toFixed(2)}</span></p> : null}
                  {denominations.usd_2 ? <p className="flex justify-between"><span>$2 x {denominations.usd_2}</span><span>${(denominations.usd_2 * 2).toFixed(2)}</span></p> : null}
                  {denominations.usd_1 ? <p className="flex justify-between"><span>$1 x {denominations.usd_1}</span><span>${(denominations.usd_1 * 1).toFixed(2)}</span></p> : null}
                  {denominations.usd_coins ? <p className="flex justify-between"><span>Monedas USD</span><span>${denominations.usd_coins.toFixed(2)}</span></p> : null}
                  <p className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>TOTAL FÍSICO USD:</span>
                    <span>{formatUSD(countedUSD)}</span>
                  </p>

                  <p className="font-semibold text-slate-700 pt-2">Bolívares (Bs. VES):</p>
                  {denominations.ves_100 ? <p className="flex justify-between"><span>Bs. 100 x {denominations.ves_100}</span><span>Bs. {(denominations.ves_100 * 100).toFixed(2)}</span></p> : null}
                  {denominations.ves_50 ? <p className="flex justify-between"><span>Bs. 50 x {denominations.ves_50}</span><span>Bs. {(denominations.ves_50 * 50).toFixed(2)}</span></p> : null}
                  {denominations.ves_20 ? <p className="flex justify-between"><span>Bs. 20 x {denominations.ves_20}</span><span>Bs. {(denominations.ves_20 * 20).toFixed(2)}</span></p> : null}
                  {denominations.ves_10 ? <p className="flex justify-between"><span>Bs. 10 x {denominations.ves_10}</span><span>Bs. {(denominations.ves_10 * 10).toFixed(2)}</span></p> : null}
                  {denominations.ves_5 ? <p className="flex justify-between"><span>Bs. 5 x {denominations.ves_5}</span><span>Bs. {(denominations.ves_5 * 5).toFixed(2)}</span></p> : null}
                  {denominations.ves_coins ? <p className="flex justify-between"><span>Monedas/Fracción</span><span>Bs. {denominations.ves_coins.toFixed(2)}</span></p> : null}
                  <p className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>TOTAL FÍSICO Bs:</span>
                    <span>{formatVES(countedVES)}</span>
                  </p>
                </div>

                {/* Resumen Financiero y Cuadre */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <p className="font-bold underline mb-1">CONCILIACIÓN CONTABLE:</p>
                  <p className="flex justify-between"><span>Ventas Totales:</span><span>{formatUSD(systemSalesMetrics.salesUSD)}</span></p>
                  <p className="flex justify-between"><span>Fondo Inicial USD:</span><span>{formatUSD(systemSalesMetrics.initialUSD)}</span></p>
                  <p className="flex justify-between"><span>Esperado USD:</span><span>{formatUSD(systemSalesMetrics.expectedUSD)}</span></p>
                  <p className="flex justify-between font-black">
                    <span>DIFERENCIA USD:</span>
                    <span className={diffUSD < 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {diffUSD >= 0 ? '+' : ''}{formatUSD(diffUSD)}
                    </span>
                  </p>
                  <p className="flex justify-between font-black pt-1">
                    <span>DIFERENCIA Bs:</span>
                    <span className={diffVES < 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {diffVES >= 0 ? '+' : ''}{formatVES(diffVES)}
                    </span>
                  </p>
                </div>

                {/* Firmas */}
                <div className="pt-6 pb-2 space-y-6 text-center text-[10px]">
                  <div>
                    <div className="w-3/4 mx-auto border-t border-slate-800" />
                    <p className="mt-1 font-bold">Firma del Cajero</p>
                  </div>
                  <div>
                    <div className="w-3/4 mx-auto border-t border-slate-800" />
                    <p className="mt-1 font-bold">Firma del Supervisor / Auditor</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  Finalizar y Salir
                </button>
              </div>
            </div>
          ) : mode === 'movement' ? (
            /* REGISTRO DE ENTRADA / SALIDA DE EFECTIVO */
            <form onSubmit={handleRegisterMovement} className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Movimiento:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMovType('in');
                      setMovReason('Aporte Extra de Caja');
                    }}
                    className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      movType === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                    style={movType === 'in' ? { color: '#ffffff' } : undefined}
                  >
                    <ArrowDownCircle className="w-5 h-5" />
                    Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovType('out');
                      setMovReason('Pago a Proveedor');
                    }}
                    className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      movType === 'out'
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                    style={movType === 'out' ? { color: '#ffffff' } : undefined}
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                    Salida (-)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Moneda:
                  </label>
                  <select
                    value={movCurrency}
                    onChange={(e) => setMovCurrency(e.target.value as 'USD' | 'VES')}
                    className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white"
                  >
                    <option value="USD">Dólares ($ USD)</option>
                    <option value="VES">Bolívares (Bs. VES)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monto:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={movAmount}
                    onChange={(e) => setMovAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-base text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Concepto:
                </label>
                <select
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {movType === 'in' ? (
                    <>
                      <option value="Aporte Extra de Caja">Aporte Extra de Caja</option>
                      <option value="Devolución de Vuelto">Devolución de Vuelto</option>
                      <option value="Ingreso Vario">Ingreso Vario</option>
                    </>
                  ) : (
                    <>
                      <option value="Pago a Proveedor">Pago a Proveedor</option>
                      <option value="Gasto Operativo Menor">Gasto Operativo Menor</option>
                      <option value="Retiro de Custodia / Excedente">Retiro de Custodia / Excedente</option>
                      <option value="Retiro de Socio">Retiro de Socio</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detalles / Observaciones:
                </label>
                <textarea
                  rows={2}
                  value={movNotes}
                  onChange={(e) => setMovNotes(e.target.value)}
                  placeholder="Ej: Factura Nº 142 de suministros..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMode('view_x')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          ) : mode === 'view_x' ? (
            /* CORTE X - ARQUEO PRELIMINAR EN TIEMPO REAL */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 font-bold uppercase">Fondo Inicial</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {formatUSD(systemSalesMetrics.initialUSD)}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold">{formatVES(systemSalesMetrics.initialVES)}</p>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase">Ventas Turno</p>
                  <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                    {formatUSD(systemSalesMetrics.salesUSD)}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold">{salesInShift.length} operaciones</p>
                </div>

                <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800">
                  <p className="text-xs text-sky-700 dark:text-sky-400 font-bold uppercase">Esperado en Gaveta</p>
                  <p className="text-xl font-black text-sky-800 dark:text-sky-300 mt-1">
                    {formatUSD(systemSalesMetrics.expectedUSD)}
                  </p>
                  <p className="text-xs text-sky-600 font-semibold">{formatVES(systemSalesMetrics.expectedVES)}</p>
                </div>
              </div>

              {/* Detalle por Métodos de Pago */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Desglose por Formas de Pago
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                    <span className="text-slate-500 block font-semibold">Efectivo USD Neto:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatUSD(systemSalesMetrics.netCashUSDInSales)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                    <span className="text-slate-500 block font-semibold">Efectivo Bs. Neto:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatVES(systemSalesMetrics.netCashVESInSales)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                    <span className="text-slate-500 block font-semibold">Pago Móvil:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatVES(systemSalesMetrics.pagoMovilVES)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                    <span className="text-slate-500 block font-semibold">Punto / Débito:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatVES(systemSalesMetrics.cardVES)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('movement')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-4 h-4" />
                    Registrar Entrada / Salida
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('close')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                    style={{ color: '#ffffff' }}
                  >
                    <Banknote className="w-4 h-4 text-white" />
                    Proceder al Cierre de Turno (Corte Z)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MODOS: 'open' (Apertura) Y 'close' (Arqueo Físico) */
            <div className="space-y-6">

              {/* Datos de Cabecera del Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nombre del Cajero:
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    disabled={mode === 'close'}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex-1">
                    <span className="text-slate-500 font-semibold block">Tasa BCV Referencial:</span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{formatVES(bcvRate)}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-500 font-semibold block">Fecha de Operación:</span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      {new Date().toLocaleDateString('es-VE')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Si es Cierre, mostrar comparación Esperado vs Físico */}
              {mode === 'close' && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Balance y Auditoría del Turno
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Estado de Cuadre:</span>
                      {Math.abs(diffUSD) < 0.05 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white">
                          ✓ Caja Cuadrada
                        </span>
                      ) : diffUSD > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-sky-500 text-white">
                          +{formatUSD(diffUSD)} Sobrante
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">
                          {formatUSD(diffUSD)} Faltante
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">Fondo Inicial:</span>
                      <span className="text-sm font-bold text-white">{formatUSD(systemSalesMetrics.initialUSD)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Esperado en Gaveta:</span>
                      <span className="text-sm font-bold text-amber-300">
                        {formatUSD(systemSalesMetrics.expectedUSD)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Conteo Físico Real:</span>
                      <span className="text-sm font-bold text-emerald-300">{formatUSD(countedUSD)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Diferencia USD:</span>
                      <span
                        className={`text-sm font-black ${
                          diffUSD < 0 ? 'text-red-400' : diffUSD > 0 ? 'text-sky-300' : 'text-emerald-400'
                        }`}
                      >
                        {diffUSD >= 0 ? '+' : ''}{formatUSD(diffUSD)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de Moneda para Desglose */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                      {mode === 'open' ? 'Desglose de Fondo Inicial:' : 'Arqueo Físico de Billetes en Gaveta:'}
                    </span>
                  </div>

                  {/* Tabs USD / VES */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCurrencyTab('USD')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        currencyTab === 'USD'
                          ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      style={currencyTab === 'USD' ? { color: '#ffffff' } : undefined}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Dólares ($ USD): {formatUSD(countedUSD)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyTab('VES')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        currencyTab === 'VES'
                          ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      style={currencyTab === 'VES' ? { color: '#ffffff' } : undefined}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Bolívares (Bs. VES): {formatVES(countedVES)}
                    </button>
                  </div>
                </div>

                {/* MATRIZ DENOMINACIONAL: DÓLARES */}
                {currencyTab === 'USD' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'usd_100', label: '$100', val: 100 },
                      { key: 'usd_50', label: '$50', val: 50 },
                      { key: 'usd_20', label: '$20', val: 20 },
                      { key: 'usd_10', label: '$10', val: 10 },
                      { key: 'usd_5', label: '$5', val: 5 },
                      { key: 'usd_2', label: '$2', val: 2 },
                      { key: 'usd_1', label: '$1', val: 1 },
                      { key: 'usd_coins', label: 'Monedas ($)', val: 1, isCoin: true },
                    ].map((item) => {
                      const count = denominations[item.key as keyof CashDenominationBreakdown] || 0;
                      const subtotal = item.isCoin ? count : count * item.val;

                      return (
                        <div
                          key={item.key}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-md font-black text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              {item.label}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {formatUSD(subtotal)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step={item.isCoin ? '0.01' : '1'}
                              value={count === 0 ? '' : count}
                              onChange={(e) =>
                                handleUpdateDenom(
                                  item.key as keyof CashDenominationBreakdown,
                                  parseFloat(e.target.value) || 0,
                                  true
                                )
                              }
                              placeholder="0"
                              className="w-full h-9 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-black text-center text-slate-900 dark:text-white"
                            />
                            {!item.isCoin && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDenom(item.key as keyof CashDenominationBreakdown, 1)
                                  }
                                  className="w-8 h-9 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold cursor-pointer"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDenom(item.key as keyof CashDenominationBreakdown, 5)
                                  }
                                  className="w-8 h-9 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold cursor-pointer"
                                >
                                  +5
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* MATRIZ DENOMINACIONAL: BOLÍVARES */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'ves_100', label: 'Bs. 100', val: 100 },
                      { key: 'ves_50', label: 'Bs. 50', val: 50 },
                      { key: 'ves_20', label: 'Bs. 20', val: 20 },
                      { key: 'ves_10', label: 'Bs. 10', val: 10 },
                      { key: 'ves_5', label: 'Bs. 5', val: 5 },
                      { key: 'ves_coins', label: 'Fracción / Monedas (Bs)', val: 1, isCoin: true },
                    ].map((item) => {
                      const count = denominations[item.key as keyof CashDenominationBreakdown] || 0;
                      const subtotal = item.isCoin ? count : count * item.val;

                      return (
                        <div
                          key={item.key}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-md font-black text-xs bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
                              {item.label}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {formatVES(subtotal)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step={item.isCoin ? '0.01' : '1'}
                              value={count === 0 ? '' : count}
                              onChange={(e) =>
                                handleUpdateDenom(
                                  item.key as keyof CashDenominationBreakdown,
                                  parseFloat(e.target.value) || 0,
                                  true
                                )
                              }
                              placeholder="0"
                              className="w-full h-9 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-black text-center text-slate-900 dark:text-white"
                            />
                            {!item.isCoin && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDenom(item.key as keyof CashDenominationBreakdown, 1)
                                  }
                                  className="w-8 h-9 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold cursor-pointer"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDenom(item.key as keyof CashDenominationBreakdown, 5)
                                  }
                                  className="w-8 h-9 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold cursor-pointer"
                                >
                                  +5
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tarjeta de Totales del Fondo / Arqueo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total en Efectivo Contado:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatUSD(countedUSD)}
                    </span>
                    <span className="text-base font-bold text-slate-600 dark:text-slate-300">
                      + {formatVES(countedVES)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Equivalente Total Consolidado:</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    ≈ {formatUSD(countedUSD + countedVES / (bcvRate || 1))}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observaciones del Arqueo:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Base autorizada por gerencia / Billetes en buen estado..."
                  className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Botón de Acción Principal */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>

                {mode === 'open' ? (
                  <button
                    type="button"
                    onClick={handleConfirmOpenShift}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md flex items-center gap-2 cursor-pointer"
                    style={{ color: '#ffffff' }}
                  >
                    <Banknote className="w-5 h-5 text-white" />
                    Abrir Caja e Iniciar Turno
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmCloseShift}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm shadow-md flex items-center gap-2 cursor-pointer"
                    style={{ color: '#ffffff' }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    Confirmar Cierre de Caja (Corte Z)
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

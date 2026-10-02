'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import { db, LocalProduct, LocalSale, SalePayment, LocalCustomer, LocalCashShift } from '@/lib/db';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import { soundEffects } from '@/lib/utils/sound';
import { SYSTEM_DEFAULTS } from '@/lib/constants/defaults';

// Hooks de dominio desacoplados
import { usePosCart } from '@/hooks/usePosCart';
import { usePosHardware } from '@/hooks/usePosHardware';
import { usePosHotkeys } from '@/hooks/usePosHotkeys';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

// Subcomponentes modulares de caja POS
import PosActionButtonsBar from '@/components/pos/PosActionButtonsBar';
import PosQuickAccessSlider from '@/components/pos/PosQuickAccessSlider';
import PosFunctionKeysBar from '@/components/pos/PosFunctionKeysBar';
import PosProductGrid, { PosViewMode } from '@/components/pos/PosProductGrid';
import PosCartTable from '@/components/pos/PosCartTable';
import PosTouchKeypad from '@/components/pos/PosTouchKeypad';
import PosPaymentModal from '@/components/pos/PosPaymentModal';
import PosReceiptModal from '@/components/pos/PosReceiptModal';
import PosScannerModal from '@/components/pos/PosScannerModal';
import ManualWeightModal from '@/components/ManualWeightModal';
import CashShiftModal from '@/components/CashShiftModal';
import PosQuickAccessSettings from '@/components/PosQuickAccessSettings';
import IconSelectorModal from '@/components/pos/IconSelectorModal';

import {
  Search,
  Scale,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  SlidersHorizontal,
  X,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { CloudSyncStatus } from '@/lib/firebase/cloud-sync-service';

export default function DesktopPosPage() {
  // Estado de catálogo y filtrado
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bcvRate, setBcvRate] = useState<number>(SYSTEM_DEFAULTS.DEFAULT_BCV_RATE);
  const [primaryCurrency, setPrimaryCurrency] = useState<'VES' | 'USD'>('VES');
  const [showImages] = useState<boolean>(true);

  // Modo de visualización del catálogo
  const [posViewMode, setPosViewMode] = useState<PosViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('klikpos_pos_view_mode') as PosViewMode;
      if (['grid', 'list', 'touch', 'fastfood', 'capsule'].includes(saved)) return saved;
    }
    return 'grid';
  });

  const [minimalistColorPalette, setMinimalistColorPalette] = useState<'category' | 'mono'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('venematic_pos_minimalist_colors');
      if (saved === 'mono' || saved === 'category') return saved;
    }
    return 'category';
  });

  const toggleMinimalistPalette = () => {
    const next = minimalistColorPalette === 'category' ? 'mono' : 'category';
    setMinimalistColorPalette(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_pos_minimalist_colors', next);
    }
  };

  const handleSetPosViewMode = (mode: PosViewMode) => {
    setPosViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('klikpos_pos_view_mode', mode);
    }
  };

  // Slider de accesos directos
  const [customSliderIds, setCustomSliderIds] = useState<number[]>([]);
  const [showQuickAccessModal, setShowQuickAccessModal] = useState<boolean>(false);
  const [isSliderCollapsed, setIsSliderCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('klikpos_slider_collapsed') === 'true';
    }
    return false;
  });

  const handleToggleSliderCollapsed = () => {
    setIsSliderCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('klikpos_slider_collapsed', String(next));
      }
      return next;
    });
  };

  // Notificaciones Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Estado de Sincronización en la Nube y App Dueño (KlikAdmin)
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => cloudSyncService.getCurrentStatus());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [terminalHwid, setTerminalHwid] = useState<string>('KLIK-PC-POS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hwid = localStorage.getItem('klikpos_terminal_hwid') || localStorage.getItem('venematic_terminal_hwid');
      if (!hwid) {
        hwid = 'KLIK-PC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('klikpos_terminal_hwid', hwid);
      }
      setTerminalHwid(hwid);
      cloudSyncService.setStoreId(hwid);
    }

    const unsub = cloudSyncService.onStatusChange((status) => {
      setCloudStatus(status);
    });
    return () => unsub();
  }, []);

  const handleManualCloudSync = async () => {
    setIsManualSyncing(true);
    showToast('☁️ Sincronizando con Google Cloud Firestore...', 'info');
    try {
      const res = await cloudSyncService.syncAll();
      showToast(`✓ Nube actualizada: ${res.sales} ventas y tasa BCV Bs. ${bcvRate.toFixed(2)} sincronizadas`, 'success');
    } catch {
      showToast('Aviso: Verifique conexión a internet para sincronizar con la nube', 'error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Modal de peso manual
  const [showManualWeightModal, setShowManualWeightModal] = useState<boolean>(false);
  const [manualWeightTargetProduct, setManualWeightTargetProduct] = useState<LocalProduct | null>(null);

  // Turno de caja
  const [activeShift, setActiveShift] = useState<LocalCashShift | null>(null);
  const [showCashShiftModal, setShowCashShiftModal] = useState<boolean>(false);
  const [cashShiftModalMode, setCashShiftModalMode] = useState<'open' | 'view_x' | 'close'>('open');
  const [shiftSales, setShiftSales] = useState<LocalSale[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'cart' | 'shift'>('cart');

  // Numpad táctil
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [numpadMode, setNumpadMode] = useState<'qty' | 'barcode' | 'cash'>('qty');

  // Modal de Cobro & Pagos
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [cashGivenVES, setCashGivenVES] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'binance' | 'mixed' | 'credit'
  >('cash_usd');
  const [pagoMovilRef, setPagoMovilRef] = useState<string>('');
  const [pagoMovilDuplicateAlert, setPagoMovilDuplicateAlert] = useState<{
    isDuplicate: boolean;
    receiptNumber?: string;
    date?: string;
    amountVES?: number;
  } | null>(null);
  const [cardDebitRef, setCardDebitRef] = useState<string>('');
  const [binanceRef, setBinanceRef] = useState<string>('');
  const [customersList, setCustomersList] = useState<LocalCustomer[]>([]);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<LocalCustomer | null>(null);
  const [mixedPayments, setMixedPayments] = useState<SalePayment[]>([]);

  // Modal de Ticket & Facturación
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<LocalSale | null>(null);
  const [receiptType, setReceiptType] = useState<'mixed' | 'fiscal_seniat'>('mixed');
  const [qrReceiptMode, setQrReceiptMode] = useState<'medium' | 'large' | 'none'>('medium');
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [iconSelectorProduct, setIconSelectorProduct] = useState<LocalProduct | null>(null);
  const [showIconSelector, setShowIconSelector] = useState<boolean>(false);

  const [storeInfo, setStoreInfo] = useState({
    name: 'COMERCIAL VENEMATIC C.A.',
    rif: 'J-50123456-7',
    address: 'Av. Principal, Edif. Venematic, Local 1',
    phone: '+58 412-1234567',
    logoUrl: '',
    showLogoOnReceipt: true,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsRef = useRef<LocalProduct[]>([]);
  productsRef.current = products;

  // 1. Hook de Hardware (Balanza, Escáner Móvil, Gaveta)
  const hardware = usePosHardware({
    productsRef,
    onAddToCart: (p, qty) => cartHook.addToCart(p, qty),
    onShowToast: showToast,
  });

  // 2. Hook del Carrito (Cálculos matemáticos, Totales, Multiplicadores de peso)
  const cartHook = usePosCart({
    bcvRate,
    scaleReading: hardware.scaleReading,
    scaleConnected: hardware.scaleConnected,
    onRequireManualWeight: (p) => {
      setManualWeightTargetProduct(p);
      setShowManualWeightModal(true);
    },
    onShowToast: showToast,
  });

  // Carga de base de datos
  const loadData = useCallback(async () => {
    await initializeDatabaseIfNeeded();
    const [allProducts, allCustomers, currentShift] = await Promise.all([
      db.products.toArray(),
      db.customers.toArray(),
      db.cashShifts.filter((s) => s.status === 'open').first(),
    ]);

    setProducts(allProducts);
    setCustomersList(allCustomers);
    setActiveShift(currentShift || null);

    const cats = ['Todos', ...Array.from(new Set(allProducts.map((p) => p.category || 'General')))];
    setCategories(cats);

    const bcvSetting = await db.settings.get('bcv_rate');
    if (bcvSetting && typeof bcvSetting.value === 'number') {
      setBcvRate(bcvSetting.value);
    }

    const sliderSetting = await db.settings.get('pos_quick_access_ids');
    if (sliderSetting && Array.isArray(sliderSetting.value)) {
      setCustomSliderIds(sliderSetting.value);
    }

    const storeSetting = await db.settings.get('store_info');
    if (storeSetting && storeSetting.value) {
      setStoreInfo((prev) => ({ ...prev, ...storeSetting.value }));
    }

    if (currentShift?.id) {
      const sales = await db.sales.where('shiftId').equals(currentShift.id).toArray();
      setShiftSales(sales);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Slider de favoritos
  const sliderProducts = useMemo(() => {
    if (customSliderIds.length > 0) {
      const customList = customSliderIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is LocalProduct => Boolean(p));
      if (selectedCategory !== 'Todos') {
        const catList = customList.filter((p) => p.category === selectedCategory);
        if (catList.length > 0) return catList;
        return products.filter((p) => p.category === selectedCategory).slice(0, 20);
      }
      return customList;
    }
    let list = products;
    if (selectedCategory !== 'Todos') {
      list = products.filter((p) => p.category === selectedCategory);
    }
    return list.slice(0, 20);
  }, [products, selectedCategory, customSliderIds]);

  // Numpad key handlers
  const handleNumpadKey = (key: string) => {
    if (key === 'C') {
      setNumpadValue('');
      cartHook.setPendingQuantity(null);
      return;
    }
    if (key === 'BACK') {
      setNumpadValue((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      setNumpadValue((prev) => (!prev.includes('.') ? (prev === '' ? '0.' : prev + '.') : prev));
      return;
    }
    setNumpadValue((prev) => prev + key);
  };

  const handleNumpadApply = () => {
    const rawVal = numpadValue;
    const val = parseFloat(rawVal);
    if (isNaN(val) || val <= 0) return;

    if (numpadMode === 'qty') {
      if (cartHook.cart.length > 0) {
        const target = cartHook.selectedCartItemId
          ? cartHook.cart.find((i) => i.productId === cartHook.selectedCartItemId) || cartHook.cart[cartHook.cart.length - 1]
          : cartHook.cart[cartHook.cart.length - 1];
        if (target) {
          cartHook.updateItemQty(target.productId, val);
          soundEffects.playBeep();
          showToast(`✓ Cantidad: ${val} × ${target.name}`, 'success');
        }
      } else {
        cartHook.setPendingQuantity(val);
        soundEffects.playBeep();
        showToast(`⚡ Cantidad fijada en ${val} para el siguiente producto`, 'info');
      }
    } else if (numpadMode === 'barcode') {
      hardware.processBarcodeScan(rawVal);
    }
    setNumpadValue('');
  };

  // Antifraude: chequeo de referencia duplicada
  const checkDuplicateReference = async (ref: string) => {
    const cleanRef = ref.trim();
    if (cleanRef.length < 4) {
      setPagoMovilDuplicateAlert(null);
      return;
    }
    try {
      const allSales = await db.sales.toArray();
      const match = allSales.find((s) =>
        s.payments?.some(
          (p) => p.method === 'pago_movil' && p.reference && p.reference.trim().toLowerCase() === cleanRef.toLowerCase()
        )
      );
      if (match) {
        setPagoMovilDuplicateAlert({
          isDuplicate: true,
          receiptNumber: match.receiptNumber,
          date: match.timestamp,
          amountVES: match.totalVES,
        });
        soundEffects.error();
      } else {
        setPagoMovilDuplicateAlert({ isDuplicate: false });
      }
    } catch {
      setPagoMovilDuplicateAlert(null);
    }
  };

  // Abrir Checkout Modal
  const openPaymentModal = useCallback(() => {
    if (!activeShift) {
      setCashShiftModalMode('open');
      setShowCashShiftModal(true);
      showToast('⚠️ Debes abrir la caja e ingresar el fondo inicial antes de cobrar.', 'error');
      return;
    }
    setCashGivenUSD(cartHook.totalUSD.toFixed(2));
    setCashGivenVES(cartHook.totalVES.toFixed(2));
    setMixedPayments([]);
    setSelectedPaymentMethod(primaryCurrency === 'VES' ? 'pago_movil' : 'cash_usd');
    setShowPaymentModal(true);
  }, [activeShift, cartHook.totalUSD, cartHook.totalVES, primaryCurrency, showToast]);

  // Finalizar Venta
  const handleCompleteSale = async () => {
    if (cartHook.cart.length === 0) return;

    const receiptNum = `TKT-${String(Date.now()).slice(-6)}`;
    const payments: SalePayment[] = [];

    if (selectedPaymentMethod === 'mixed') {
      mixedPayments.forEach((p) => payments.push(p));
    } else {
      payments.push({
        method: selectedPaymentMethod,
        amountUSD: cartHook.totalUSD,
        amountVES: cartHook.totalVES,
        reference: selectedPaymentMethod === 'pago_movil' ? pagoMovilRef : undefined,
      });
    }

    const newSale: LocalSale = {
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: cartHook.cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        barcode: i.barcode,
        qty: i.qty,
        priceUSD: i.priceUSD,
        totalUSD: i.totalUSD,
      })),
      subtotalUSD: cartHook.subtotalUSD,
      taxUSD: 0,
      totalUSD: cartHook.totalUSD,
      totalVES: cartHook.totalVES,
      bcvRate,
      payments,
      changeUSD: 0,
      changeVES: 0,
      cashierName: activeShift?.cashierName || 'Caja 1',
      customerName: selectedCreditCustomer?.name,
      shiftId: activeShift?.id,
      status: 'completed',
    };

    await db.transaction('rw', db.sales, db.products, db.customers, db.inventoryMovements, async () => {
      await db.sales.add(newSale);
      for (const item of cartHook.cart) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const nextStock = Math.max(0, +(prod.stock - item.qty).toFixed(3));
          await db.products.update(item.productId, { stock: nextStock, updatedAt: new Date().toISOString() });
          await db.inventoryMovements.add({
            productId: item.productId,
            productName: item.name,
            barcode: item.barcode,
            type: 'out',
            reason: 'sale',
            qtyDelta: -item.qty,
            previousStock: prod.stock,
            newStock: nextStock,
            timestamp: new Date().toISOString(),
            performedBy: activeShift?.cashierName || 'Caja 1',
            notes: `Venta #${receiptNum}`,
          });
        }
      }
    });

    if (payments.some((p) => p.method === 'cash_usd' || p.method === 'cash_ves')) {
      await hardware.handleKickCashDrawer();
    }

    setLastCompletedSale(newSale);
    setShowPaymentModal(false);
    cartHook.clearCart();
    loadData();

    try {
      const qrData = await QRCode.toDataURL(`RECEIPT:${newSale.receiptNumber}|VES:${newSale.totalVES}|USD:${newSale.totalUSD}`);
      setTicketQrDataUrl(qrData);
    } catch {}

    setShowReceiptModal(true);
    soundEffects.success();
    showToast(`✓ Venta #${receiptNum} registrada con éxito`, 'success');
    cloudSyncService.triggerFastSync();
  };

  // 3. Hook de Hotkeys Industriales (F1-F12)
  usePosHotkeys({
    onToggleCurrency: () => setPrimaryCurrency((prev) => (prev === 'VES' ? 'USD' : 'VES')),
    onFocusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onOpenCreditSale: () => {
      if (cartHook.cart.length > 0) {
        setSelectedPaymentMethod('credit');
        openPaymentModal();
      }
    },
    onOpenManualWeight: () => setShowManualWeightModal(true),
    onToggleNumpadMode: () => setNumpadMode((prev) => (prev === 'qty' ? 'barcode' : 'qty')),
    onClearCart: cartHook.clearCart,
    onOpenScannerModal: hardware.openScannerModal,
    onOpenShiftModal: () => setShowCashShiftModal(true),
    onKickDrawer: hardware.handleKickCashDrawer,
    onOpenPaymentModal: () => {
      if (cartHook.cart.length > 0) openPaymentModal();
      else showToast('Agrega productos al carrito antes de cobrar (F12)', 'error');
    },
  });

  return (
    <div className="flex h-screen max-h-screen bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 gap-2.5 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* COLUMNA IZQUIERDA: BUSCADOR, ACCESOS RÁPIDOS, CATÁLOGO Y BARRA F1-F12      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 h-full overflow-hidden">
        {/* BUSCADOR Y PILL DE TURNO */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por código, nombre, categoría... (F3)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (!q) return;
                  if (hardware.processBarcodeScan(q)) {
                    setSearchQuery('');
                  } else if (filteredProducts.length === 1) {
                    cartHook.addToCart(filteredProducts[0], 1);
                    setSearchQuery('');
                  }
                }
              }}
              className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 px-1 cursor-pointer">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 shrink-0">
            {/* BOTÓN VISUAL: ESTADO DE SINCRONIZACIÓN NUBE & APP DUEÑO */}
            <button
              type="button"
              onClick={handleManualCloudSync}
              title={`Sincronización en Tiempo Real con App Móvil / Firestore (${cloudStatus.storeId || terminalHwid}). Clic para forzar actualización ahora.`}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                cloudStatus.state === 'syncing' || isManualSyncing
                  ? 'bg-sky-50 text-sky-800 border-sky-300 animate-pulse dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700'
                  : cloudStatus.state === 'synced'
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudStatus.state === 'syncing' || isManualSyncing ? 'text-sky-600 animate-spin' : 'text-indigo-600'}`} />
              <span className="hidden md:inline font-mono text-[11px]">
                {cloudStatus.state === 'syncing' || isManualSyncing
                  ? 'Sincronizando...'
                  : `Nube: ${(cloudStatus.storeId || terminalHwid).slice(0, 14)}`}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  cloudStatus.state === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setCashShiftModalMode(activeShift ? 'view_x' : 'open');
                setShowCashShiftModal(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border ${
                activeShift
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">
                {activeShift ? `Turno #${activeShift.id} (${activeShift.cashierName})` : 'Abrir Turno'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualWeightModal(true)}
              title="Balanza (F5)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-200 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={hardware.handleKickCashDrawer}
              title="Abrir gaveta (F10)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-200 cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <PosActionButtonsBar
          posViewMode={posViewMode}
          phoneConnected={hardware.phoneConnected}
          phoneDeviceName={hardware.phoneDeviceName}
          scaleConnected={hardware.scaleConnected}
          scaleReading={hardware.scaleReading}
          activeShift={activeShift}
          onTriggerMobileScanner={hardware.openScannerModal}
          onOpenScannerModal={hardware.openScannerModal}
          onOpenManualWeightModal={() => setShowManualWeightModal(true)}
          onKickCashDrawer={hardware.handleKickCashDrawer}
          onOpenCashShiftModal={(mode) => {
            setCashShiftModalMode(mode);
            setShowCashShiftModal(true);
          }}
        />

        {/* BANDEJA DOCK: ACCESOS RÁPIDOS Y FAVORITOS */}
        {posViewMode !== 'touch' && !searchQuery.trim() && sliderProducts.length > 0 && posViewMode !== 'fastfood' && (
          <PosQuickAccessSlider
            sliderProducts={sliderProducts}
            isSliderCollapsed={isSliderCollapsed}
            onToggleCollapsed={handleToggleSliderCollapsed}
            onOpenQuickAccessModal={() => setShowQuickAccessModal(true)}
            onAddToCart={(p) => cartHook.addToCart(p, 1)}
            bcvRate={bcvRate}
            showImages={showImages}
          />
        )}

        {/* CATÁLOGO DE PRODUCTOS Y VISTAS */}
        <PosProductGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          filteredProducts={filteredProducts}
          posViewMode={posViewMode}
          onSetPosViewMode={handleSetPosViewMode}
          minimalistColorPalette={minimalistColorPalette}
          onToggleMinimalistPalette={toggleMinimalistPalette}
          bcvRate={bcvRate}
          showImages={showImages}
          onAddToCart={(p, qty) => cartHook.addToCart(p, qty || 1)}
          onOpenIconSelector={(p) => {
            setIconSelectorProduct(p);
            setShowIconSelector(true);
          }}
        />

        {/* BARRA INDUSTRIAL DE ATAJOS F2-F12 */}
        <PosFunctionKeysBar
          primaryCurrency={primaryCurrency}
          numpadMode={numpadMode}
          cartLength={cartHook.cart.length}
          onToggleCurrency={() => setPrimaryCurrency((prev) => (prev === 'VES' ? 'USD' : 'VES'))}
          onFocusSearch={() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
          }}
          onOpenCreditModal={() => {
            if (cartHook.cart.length > 0) {
              setSelectedPaymentMethod('credit');
              openPaymentModal();
            } else {
              showToast('Agrega productos al carrito para venta a crédito (F4)', 'info');
            }
          }}
          onOpenManualWeightModal={() => setShowManualWeightModal(true)}
          onToggleNumpadMode={() => setNumpadMode((prev) => (prev === 'qty' ? 'barcode' : 'qty'))}
          onClearCart={cartHook.clearCart}
          onOpenScannerModal={hardware.openScannerModal}
          onOpenCashShiftModal={() => setShowCashShiftModal(true)}
          onOpenPaymentModal={() => {
            if (cartHook.cart.length > 0) openPaymentModal();
            else showToast('Agrega productos al carrito antes de cobrar (F12)', 'error');
          }}
          onShowToast={showToast}
        />
      </div>

      {/* ========================================================================= */}
      {/* COLUMNA DERECHA: TICKET DE VENTA Y TECLADO TÁCTIL NUMÉRICO                */}
      {/* ========================================================================= */}
      <div className="w-[380px] lg:w-[410px] xl:w-[430px] h-full max-h-full min-h-0 flex flex-col gap-2.5 shrink-0 overflow-hidden">
        <PosCartTable
          rightPanelTab={rightPanelTab}
          onSetRightPanelTab={setRightPanelTab}
          cart={cartHook.cart}
          selectedCartItemId={cartHook.selectedCartItemId}
          onSelectCartItem={cartHook.setSelectedCartItemId}
          onUpdateQty={cartHook.updateItemQty}
          onRemoveItem={cartHook.removeItem}
          onClearCart={cartHook.clearCart}
          bcvRate={bcvRate}
          totalUSD={cartHook.totalUSD}
          totalVES={cartHook.totalVES}
          shiftSales={shiftSales}
          onOpenPaymentModal={openPaymentModal}
        />

        <PosTouchKeypad
          numpadMode={numpadMode}
          onSetNumpadMode={setNumpadMode}
          numpadValue={numpadValue}
          onNumpadKey={handleNumpadKey}
          onNumpadApply={handleNumpadApply}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODALES DEL SISTEMA                                                       */}
      {/* ========================================================================= */}
      <PosPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bcvRate={bcvRate}
        totalUSD={cartHook.totalUSD}
        totalVES={cartHook.totalVES}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectPaymentMethod={setSelectedPaymentMethod}
        cashGivenUSD={cashGivenUSD}
        setCashGivenUSD={setCashGivenUSD}
        cashGivenVES={cashGivenVES}
        setCashGivenVES={setCashGivenVES}
        cardDebitRef={cardDebitRef}
        setCardDebitRef={setCardDebitRef}
        binanceRef={binanceRef}
        setBinanceRef={setBinanceRef}
        pagoMovilRef={pagoMovilRef}
        setPagoMovilRef={setPagoMovilRef}
        pagoMovilDuplicateAlert={pagoMovilDuplicateAlert}
        onCheckDuplicateReference={checkDuplicateReference}
        pagoMovilAutoStatus="idle"
        pagoMovilAutoConfirmation={null}
        pagoMovilGmailConfigured={false}
        customersList={customersList}
        selectedCreditCustomer={selectedCreditCustomer}
        onSelectCreditCustomer={setSelectedCreditCustomer}
        mixedPayments={mixedPayments}
        onAddMixedPayment={(p) => setMixedPayments((prev) => [...prev, p])}
        onRemoveMixedPayment={(id) => setMixedPayments((prev) => prev.filter((p) => (p.id || '') !== id))}
        receiptType={receiptType}
        onSetReceiptType={setReceiptType}
        onCompleteSale={handleCompleteSale}
      />

      <PosReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        lastCompletedSale={lastCompletedSale}
        receiptType={receiptType}
        onSetReceiptType={setReceiptType}
        qrReceiptMode={qrReceiptMode}
        onSetQrReceiptMode={setQrReceiptMode}
        ticketQrDataUrl={ticketQrDataUrl}
        storeInfo={storeInfo}
        onPrintReceipt={() => window.print()}
      />

      <PosScannerModal
        isOpen={hardware.showScannerModal}
        onClose={() => hardware.setShowScannerModal(false)}
        qrCodeDataUrl={hardware.qrCodeDataUrl}
        phoneConnected={hardware.phoneConnected}
        phoneDeviceName={hardware.phoneDeviceName}
        scannerUrl={hardware.scannerUrl}
        onShowToast={showToast}
      />

      <ManualWeightModal
        isOpen={showManualWeightModal}
        onClose={() => {
          setShowManualWeightModal(false);
          setManualWeightTargetProduct(null);
        }}
        onApply={(weightInKg, multiplier, note, selectedProduct) => {
          const prod = selectedProduct || manualWeightTargetProduct;
          if (prod) {
            setManualWeightTargetProduct(null);
            cartHook.addToCart(prod, weightInKg);
            showToast(`⚖️ Peso aplicado: ${note || `${weightInKg.toFixed(3)} kg`}`, 'success');
          }
        }}
        targetProduct={manualWeightTargetProduct}
        availableProducts={products}
        bcvRate={bcvRate}
        initialWeightKg={hardware.scaleReading.weight > 0 ? hardware.scaleReading.weight : cartHook.pendingQuantity || 0}
      />

      <CashShiftModal
        isOpen={showCashShiftModal}
        onClose={() => setShowCashShiftModal(false)}
        initialMode={cashShiftModalMode}
        activeShift={activeShift}
        bcvRate={bcvRate}
        onShiftUpdated={(updated) => setActiveShift(updated)}
        storeInfo={storeInfo}
      />

      {showQuickAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121c29] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Configuración de Accesos Directos del Slider
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marca los artículos que deseas tener a un clic en la barra superior de caja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAccessModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <PosQuickAccessSettings />
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-bold pointer-events-auto ${
              toastMessage.type === 'success'
                ? 'bg-emerald-700 text-white border-emerald-600'
                : toastMessage.type === 'error'
                ? 'bg-rose-700 text-white border-rose-600'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'info' && <Smartphone className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <IconSelectorModal
        isOpen={showIconSelector}
        onClose={() => {
          setShowIconSelector(false);
          setIconSelectorProduct(null);
          loadData();
        }}
        product={iconSelectorProduct}
        onIconSelected={async () => {
          await loadData();
        }}
      />
    </div>
  );
}

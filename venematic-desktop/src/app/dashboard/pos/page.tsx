'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, LocalProduct, SaleItem, LocalSale, SalePayment } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import { soundEffects } from '@/lib/utils/sound';
import QRCode from 'qrcode';
import {
  Image as ImageIcon,
  Smartphone,
  Package,
  Wifi,
  QrCode as QrIcon,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Scale,
  Banknote,
  Users,
} from 'lucide-react';
import { scaleService, WeightReading } from '@/lib/hardware/scale';
import { kickCashDrawer } from '@/lib/hardware/cash-drawer';
import { LocalCustomer } from '@/lib/db';
import ManualWeightModal from '@/components/ManualWeightModal';
import { parseScaleBarcode, findProductByScalePLU } from '@/lib/hardware/scale-barcode';

interface CartItem extends SaleItem {
  stock: number;
}

export default function DesktopPosPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(848.55);

  // Toggle de visualización de fotos (persistente en localStorage)
  const [showImages, setShowImages] = useState<boolean>(true);

  // Modal de Escáner Celular y QR
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Balanza Digital Comercial
  const [scaleReading, setScaleReading] = useState<WeightReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  });
  const [scaleConnected, setScaleConnected] = useState<boolean>(false);

  // Modal de Balanza Manual (Gramos / Kilos) para Balanzas sin cable
  const [showManualWeightModal, setShowManualWeightModal] = useState<boolean>(false);
  const [manualWeightTargetProduct, setManualWeightTargetProduct] = useState<LocalProduct | null>(null);

  // Teclado numérico táctil / Entrada
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [numpadMode, setNumpadMode] = useState<'qty' | 'cash' | 'barcode'>('qty');
  const [selectedCartItemId, setSelectedCartItemId] = useState<number | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

  // Modal de Cobro
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [cashGivenVES, setCashGivenVES] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash_usd' | 'cash_ves' | 'pago_movil' | 'card_debit' | 'mixed' | 'credit'
  >('cash_usd');
  const [pagoMovilRef, setPagoMovilRef] = useState<string>('');
  const [customersList, setCustomersList] = useState<LocalCustomer[]>([]);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<LocalCustomer | null>(null);

  // Refs mutables para evitar cierres obsoletos (stale closures) en listeners de teclado físico
  const cartRef = useRef<CartItem[]>([]);
  cartRef.current = cart;
  const numpadValueRef = useRef<string>('');
  numpadValueRef.current = numpadValue;
  const numpadModeRef = useRef<'qty' | 'cash' | 'barcode'>('qty');
  numpadModeRef.current = numpadMode;
  const selectedCartItemIdRef = useRef<number | null>(null);
  selectedCartItemIdRef.current = selectedCartItemId;
  const pendingQuantityRef = useRef<number | null>(null);
  pendingQuantityRef.current = pendingQuantity;
  const processBarcodeScanRef = useRef<(code: string) => boolean>(() => false);

  // Paleta de colores distintiva por rubro/categoría (Badges sólidos de alto contraste)
  const getCategoryTheme = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase().trim();
    if (cat.includes('víveres') || cat.includes('viveres') || cat.includes('alimento') || cat.includes('grano')) {
      return {
        badge: 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-sm',
        cardBorder: 'border-l-4 border-l-amber-500 hover:border-amber-400',
        lightBg: 'bg-amber-50/40',
        accentText: 'text-amber-500',
      };
    }
    if (cat.includes('charcutería') || cat.includes('charcuteria') || cat.includes('queso') || cat.includes('carne') || cat.includes('pollo')) {
      return {
        badge: 'bg-rose-600 text-white font-black border-rose-400 shadow-sm',
        cardBorder: 'border-l-4 border-l-rose-500 hover:border-rose-400',
        lightBg: 'bg-rose-50/40',
        accentText: 'text-rose-500',
      };
    }
    if (cat.includes('bebida') || cat.includes('refresco') || cat.includes('jugo') || cat.includes('agua') || cat.includes('licor')) {
      return {
        badge: 'bg-sky-600 text-white font-black border-sky-400 shadow-sm',
        cardBorder: 'border-l-4 border-l-sky-500 hover:border-sky-400',
        lightBg: 'bg-sky-50/40',
        accentText: 'text-sky-400',
      };
    }
    if (cat.includes('limpieza') || cat.includes('hogar') || cat.includes('detergente')) {
      return {
        badge: 'bg-emerald-600 text-white font-black border-emerald-400 shadow-sm',
        cardBorder: 'border-l-4 border-l-emerald-500 hover:border-emerald-400',
        lightBg: 'bg-emerald-50/40',
        accentText: 'text-emerald-400',
      };
    }
    if (cat.includes('cuidado') || cat.includes('higiene') || cat.includes('personal') || cat.includes('salud') || cat.includes('farmacia')) {
      return {
        badge: 'bg-purple-600 text-white font-black border-purple-400 shadow-sm',
        cardBorder: 'border-l-4 border-l-purple-500 hover:border-purple-400',
        lightBg: 'bg-purple-50/40',
        accentText: 'text-purple-400',
      };
    }
    if (cat.includes('panadería') || cat.includes('panaderia') || cat.includes('dulce') || cat.includes('galleta') || cat.includes('snack')) {
      return {
        badge: 'bg-orange-500 text-white font-black border-orange-300 shadow-sm',
        cardBorder: 'border-l-4 border-l-orange-500 hover:border-orange-400',
        lightBg: 'bg-orange-50/40',
        accentText: 'text-orange-400',
      };
    }
    return {
      badge: 'bg-slate-700 text-white font-bold border-slate-500 shadow-sm',
      cardBorder: 'border-l-4 border-l-slate-400 hover:border-slate-400',
      lightBg: 'bg-slate-50/30',
      accentText: 'text-slate-300',
    };
  };

  // Ticket para Impresión
  const [lastCompletedSale, setLastCompletedSale] = useState<LocalSale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Ventas del Turno (en memoria, se acumulan durante la sesión)
  const [shiftSales, setShiftSales] = useState<LocalSale[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'cart' | 'shift'>('cart');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsRef = useRef<LocalProduct[]>([]);
  productsRef.current = products;

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toggleShowImages = () => {
    const next = !showImages;
    setShowImages(next);
    try {
      localStorage.setItem('venematic_pos_show_images', String(next));
    } catch {}
  };

  const openScannerModal = async () => {
    setShowScannerModal(true);
    try {
      const res = await fetch('/api/server-info');
      const data = await res.json();
      const url = data.scannerUrl || `http://${data.ip || 'localhost'}:${data.port || 3002}/scanner?session=caja-1`;
      setScannerUrl(url);

      const qr = await QRCode.toDataURL(url, {
        width: 280,
        margin: 1.5,
        color: { dark: '#0284c7', light: '#ffffff' },
      });
      setQrCodeDataUrl(qr);
    } catch (e) {
      console.warn('Error loading scanner info:', e);
    }
  };

  // Cargar productos, ventas de turno y tasa inicial
  const loadData = async () => {
    await initializeDatabaseIfNeeded();
    const prods = await db.products.toArray();
    setProducts(prods);

    const cats = Array.from(new Set(prods.map((p) => p.category)));
    setCategories(['Todos', ...cats]);

    const rateSetting = await db.settings.get('bcv_rate');
    const currentRate = rateSetting ? rateSetting.value : 848.55;
    if (rateSetting) setBcvRate(rateSetting.value);

    // Cargar ventas del turno (hoy) desde la base de datos local
    try {
      const allSales = await db.sales.orderBy('id').reverse().toArray();
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySales = allSales.filter((s) => s.timestamp && s.timestamp.startsWith(todayStr));
      setShiftSales(todaySales.length > 0 ? todaySales : allSales.slice(0, 50));
    } catch (e) {
      console.warn('Error cargando ventas de turno en POS:', e);
    }

    // Cargar directorio de clientes para ventas a crédito / fiado
    try {
      const custs = await db.customers.toArray();
      setCustomersList(custs);
    } catch (e) {
      console.warn('Error cargando clientes en POS:', e);
    }

    // Compartir automáticamente inventario y tasa BCV con la app móvil
    try {
      fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: prods.map(p => ({
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            category: p.category,
            priceUSD: p.priceUSD,
            stock: p.stock,
            image: p.image,
          })),
          bcvRate: currentRate,
        }),
      }).catch(() => {});
    } catch {}
  };

  // Procesar venta recibida desde el celular (por SSE o por sondeo de conciliación)
  const processMobileSaleIncoming = async (sale: any) => {
    if (!sale || !sale.receiptNumber) return;

    // Verificar si ya existe en IndexedDB para no duplicar
    const existing = await db.sales.where('receiptNumber').equals(sale.receiptNumber).first();
    if (existing) {
      try {
        await fetch('/api/scanner/sale', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
        });
      } catch {}
      return;
    }

    const saleToSave: LocalSale = {
      receiptNumber: sale.receiptNumber,
      timestamp: sale.timestamp || new Date().toISOString(),
      items: sale.items || [],
      subtotalUSD: Number(sale.subtotalUSD) || Number(sale.totalUSD) || 0,
      taxUSD: Number(sale.taxUSD) || 0,
      totalUSD: Number(sale.totalUSD) || 0,
      totalVES: Number(sale.totalVES) || 0,
      bcvRate: Number(sale.bcvRate) || bcvRate,
      payments: sale.payments || [
        {
          method: 'cash_usd',
          amountUSD: Number(sale.totalUSD) || 0,
          amountVES: Number(sale.totalVES) || 0,
        },
      ],
      changeUSD: Number(sale.changeUSD) || 0,
      changeVES: Number(sale.changeVES) || 0,
      cashierName: sale.cashierName || 'POS Celular (Contingencia)',
      status: 'completed',
      source: 'mobile',
    };

    await db.transaction('rw', db.sales, db.products, async () => {
      await db.sales.add(saleToSave);
      for (const item of saleToSave.items || []) {
        let prod = item.productId ? await db.products.get(Number(item.productId)) : undefined;
        if (!prod && item.barcode) {
          prod = await db.products.where('barcode').equals(item.barcode).first();
        }
        if (prod && prod.id) {
          await db.products.update(prod.id, {
            stock: Math.max(0, prod.stock - item.qty),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    try {
      await fetch('/api/scanner/sale', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
      });
    } catch {}

    const updatedProds = await db.products.toArray();
    setProducts(updatedProds);
    setShiftSales((prev) => [saleToSave, ...prev.filter((s) => s.receiptNumber !== saleToSave.receiptNumber)]);

    soundEffects.playBeep();
    showToast(`📲 Venta Móvil recibida en vivo: ${saleToSave.receiptNumber} ($${saleToSave.totalUSD.toFixed(2)})`, 'success');
  };

  useEffect(() => {
    loadData();

    // Cargar preferencia de fotos
    try {
      const saved = localStorage.getItem('venematic_pos_show_images');
      if (saved !== null) {
        setShowImages(saved === 'true');
      }
    } catch {}

    const handleBcvUpdate = (e: any) => {
      if (e.detail) setBcvRate(e.detail);
    };
    window.addEventListener('pos:bcv_updated', handleBcvUpdate);

    // Conectar a eventos del escáner celular en tiempo real (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/scanner/events?session=caja-1');

      eventSource.addEventListener('scan', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.barcode) return;
          const cleanCode = String(data.barcode).trim();
          const handled = processBarcodeScanRef.current(cleanCode);
          if (!handled) {
            soundEffects.playError();
            showToast(`Código no encontrado en inventario: ${cleanCode}`, 'error');
          }
        } catch (err) {
          console.error('SSE scan error:', err);
        }
      });

      eventSource.addEventListener('new_product', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.product) {
            const exists = await db.products.where('barcode').equals(data.product.barcode).first();
            if (exists) {
              await db.products.update(exists.id!, data.product);
            } else {
              await db.products.add(data.product);
            }
            await loadData();
            soundEffects.playBeep();
            showToast(`📸 Nuevo producto recibido desde el celular: ${data.product.name}`, 'success');
          }
        } catch (err) {
          console.error('SSE new product error:', err);
        }
      });

      eventSource.addEventListener('phone_status', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setPhoneConnected(Boolean(data.connected));
          if (data.deviceName) setPhoneDeviceName(data.deviceName);
        } catch {}
      });

      eventSource.addEventListener('mobile_sale_completed', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.sale) {
            await processMobileSaleIncoming(data.sale);
          }
        } catch (err) {
          console.error('Error procesando venta móvil via SSE:', err);
        }
      });

      // Cuando el celular abre la app y no hay inventario cacheado, el server pide que enviemos el catálogo
      eventSource.addEventListener('request_inventory', async () => {
        try {
          const prods = await db.products.toArray();
          const rateSetting = await db.settings?.get?.('bcv_rate').catch?.(() => null);
          const currentRate = rateSetting?.value || bcvRate;
          fetch('/api/scanner/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              products: prods.map((p) => ({
                id: p.id,
                barcode: p.barcode,
                name: p.name,
                category: p.category,
                priceUSD: p.priceUSD,
                stock: p.stock,
                image: p.image,
              })),
              bcvRate: currentRate,
            }),
          }).catch(() => {});
        } catch {}
      });
    } catch (err) {
      console.warn('SSE connection init error:', err);
    }

    // Foco automático en el buscador para pistolas lectoras de códigos de barras
    searchInputRef.current?.focus();

    // Atajos de teclado para POS y Teclado Numérico Físico (Numpad)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F3: Enfocar buscador
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      // F12: Cobrar
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartRef.current.length > 0) openPaymentModal();
        return;
      }
      // F10: Abrir Gaveta de Dinero (ESC/POS RJ11 Kick)
      if (e.key === 'F10') {
        e.preventDefault();
        kickCashDrawer().then((res) => {
          showToast(res.message, 'success');
        });
        return;
      }
      // Escape: Cerrar modales
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowReceiptModal(false);
        setShowScannerModal(false);
        return;
      }

      // Soporte directo para teclado numérico físico (Numpad)
      const target = e.target as HTMLElement;
      const isInputFocused = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Si el foco no está en un input de texto escribible, o si el usuario pulsa teclas del teclado numérico físico
      if (!isInputFocused) {
        if (e.code.startsWith('Numpad') || /^[0-9]$/.test(e.key)) {
          let numChar = e.key;
          if (e.code.startsWith('Numpad')) {
            numChar = e.code.replace('Numpad', '');
          }
          if (/^[0-9]$/.test(numChar)) {
            e.preventDefault();
            handleNumpadKey(numChar);
            return;
          }
        }
        if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
          e.preventDefault();
          handleNumpadKey('.');
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          handleNumpadKey('BACK');
          return;
        }
        if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleNumpadKey('C');
          return;
        }
        if (e.key === 'Enter' || e.code === 'NumpadEnter') {
          e.preventDefault();
          handleNumpadApply();
          return;
        }
      }
    };
    // Sondeo de conciliación cada 3.5s para no perder ninguna venta móvil incluso si SSE se reconecta
    const checkPendingMobileSales = async () => {
      try {
        const res = await fetch('/api/scanner/sale');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.pendingSales) && data.pendingSales.length > 0) {
            for (const sale of data.pendingSales) {
              await processMobileSaleIncoming(sale);
            }
          }
        }
      } catch {}
    };

    checkPendingMobileSales();
    const pollMobileTimer = setInterval(checkPendingMobileSales, 3500);

    // Conexión y escucha de Balanza Digital
    setScaleConnected(scaleService.isConnected());
    const unsubScale = scaleService.onWeightChange((reading) => {
      setScaleReading(reading);
      setScaleConnected(scaleService.isConnected());
    });

    return () => {
      window.removeEventListener('pos:bcv_updated', handleBcvUpdate);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(pollMobileTimer);
      unsubScale();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  // Aplicar peso ingresado manualmente (gramos o kilos) desde el modal
  const handleApplyManualWeight = (
    weightInKg: number,
    multiplier: number,
    note?: string,
    selectedProduct?: any
  ) => {
    const prod = selectedProduct || manualWeightTargetProduct;
    if (prod) {
      setManualWeightTargetProduct(null);

      const lineTotal = multiplier * prod.priceUSD;
      setCart((prev) => {
        const existing = prev.find((item) => item.productId === prod.id);
        if (existing) {
          const newQty = Number((existing.qty + weightInKg).toFixed(3));
          return prev.map((item) =>
            item.productId === prod.id
              ? { ...item, qty: newQty, totalUSD: existing.totalUSD + lineTotal }
              : item
          );
        } else {
          return [
            ...prev,
            {
              productId: prod.id!,
              name: prod.name,
              barcode: prod.barcode,
              qty: Number(weightInKg.toFixed(3)),
              priceUSD: prod.priceUSD,
              totalUSD: lineTotal,
              stock: prod.stock,
            },
          ];
        }
      });
      soundEffects.playBeep();
      showToast(`⚖️ Peso aplicado: ${note || `${weightInKg.toFixed(3)} kg`} (${prod.name})`, 'success');
      setSelectedCartItemId(prod.id!);
    } else {
      setPendingQuantity(weightInKg);
      soundEffects.playBeep();
      showToast(`⚡ Peso fijado en ${note || `${weightInKg.toFixed(3)} kg`} para el siguiente producto`, 'info');
    }
  };

  // Procesar código escaneado (reconoce etiquetas de balanza GS1 EAN-13 con prefijos 20-24 y códigos de barra estándar)
  const handleProcessBarcodeScan = (scannedCode: string): boolean => {
    const code = (scannedCode || '').trim();
    if (!code) return false;

    // 1. Verificar si es una etiqueta emitida por balanza etiquetadora (GS1 In-Store)
    const parsedScale = parseScaleBarcode(code);
    if (parsedScale) {
      const product = findProductByScalePLU(productsRef.current, parsedScale);
      if (product) {
        if (parsedScale.type === 'weight') {
          const weightKg = parsedScale.value;
          const lineTotal = weightKg * product.priceUSD;

          setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
              const newQty = Number((existing.qty + weightKg).toFixed(3));
              return prev.map((item) =>
                item.productId === product.id
                  ? { ...item, qty: newQty, totalUSD: existing.totalUSD + lineTotal }
                  : item
              );
            } else {
              return [
                ...prev,
                {
                  productId: product.id!,
                  name: `${product.name} (Balanza: ${parsedScale.formattedValue})`,
                  barcode: product.barcode,
                  qty: weightKg,
                  priceUSD: product.priceUSD,
                  totalUSD: lineTotal,
                  stock: product.stock,
                },
              ];
            }
          });
          soundEffects.playBeep();
          showToast(`⚖️ Balanza [${parsedScale.prefix}]: ${product.name} (${parsedScale.formattedValue} = $${lineTotal.toFixed(2)})`, 'success');
          setSelectedCartItemId(product.id!);
          return true;
        } else {
          // Importe / precio variable
          const totalUSD = parsedScale.value;
          const computedQty = product.priceUSD > 0 ? Number((totalUSD / product.priceUSD).toFixed(3)) : 1;
          setCart((prev) => [
            ...prev,
            {
              productId: product.id!,
              name: `${product.name} (Balanza: ${parsedScale.formattedValue})`,
              barcode: product.barcode,
              qty: computedQty,
              priceUSD: product.priceUSD,
              totalUSD: totalUSD,
              stock: product.stock,
            },
          ]);
          soundEffects.playBeep();
          showToast(`⚖️ Balanza [${parsedScale.prefix}]: ${product.name} (${parsedScale.formattedValue})`, 'success');
          setSelectedCartItemId(product.id!);
          return true;
        }
      } else {
        soundEffects.playError();
        showToast(`Etiqueta de balanza detectada (${code}), pero el producto con PLU "${parsedScale.plu}" no existe en inventario.`, 'error');
        return false;
      }
    }

    // 2. Búsqueda directa por código de barras tradicional
    const exact = productsRef.current.find(
      (p) => p.barcode.toLowerCase() === code.toLowerCase()
    );
    if (exact) {
      soundEffects.playBeep();
      addToCart(exact, 1);
      showToast(`✓ Agregado: ${exact.name}`, 'success');
      return true;
    }

    return false;
  };
  processBarcodeScanRef.current = handleProcessBarcodeScan;

  // Agregar al carrito
  const addToCart = (product: LocalProduct, customQty: number = 1) => {
    // Si el usuario tecleó una cantidad previamente o tiene pendingQuantity
    let qtyToAdd = pendingQuantityRef.current && pendingQuantityRef.current > 0
      ? pendingQuantityRef.current
      : customQty;

    // Si es un producto que se vende por peso (kg / gr)
    const isWeighed = (product.unit || '').toLowerCase().includes('kg') ||
                      (product.unit || '').toLowerCase().includes('kilo') ||
                      (product.unit || '').toLowerCase().includes('gr');

    const scaleCfg = scaleService.getConfig();
    if (isWeighed && scaleCfg.autoWeight && scaleReading.weight > 0 && pendingQuantityRef.current === null && customQty === 1) {
      qtyToAdd = scaleReading.weight;
      showToast(`⚖️ Balanza: ${scaleReading.weight.toFixed(3)} kg para ${product.name}`, 'info');
    } else if (isWeighed && scaleCfg.manualWeightPrompt && scaleReading.weight <= 0 && pendingQuantityRef.current === null && customQty === 1) {
      // Para comercios con balanzas normales de mostrador sin cable USB: abrir ingreso manual
      setManualWeightTargetProduct(product);
      setShowManualWeightModal(true);
      return;
    }

    // Resetear multiplicador pendiente
    if (pendingQuantityRef.current !== null) {
      setPendingQuantity(null);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.qty + qtyToAdd;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: Number(newQty.toFixed(3)), totalUSD: newQty * item.priceUSD }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id!,
            name: product.name,
            barcode: product.barcode,
            qty: Number(qtyToAdd.toFixed(3)),
            priceUSD: product.priceUSD,
            totalUSD: qtyToAdd * product.priceUSD,
            stock: product.stock,
          },
        ];
      }
    });
    setNumpadValue('');
    setSelectedCartItemId(product.id!);
  };

  // Modificar cantidad
  const updateItemQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, qty: newQty, totalUSD: newQty * item.priceUSD }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    if (selectedCartItemId === productId) {
      setSelectedCartItemId(null);
    }
  };

  const clearCart = () => {
    setCart([]);
    setNumpadValue('');
    setPendingQuantity(null);
    setSelectedCartItemId(null);
  };

  // Cálculos totales
  const subtotalUSD = cart.reduce((sum, item) => sum + item.totalUSD, 0);
  const totalUSD = subtotalUSD;
  const totalVES = totalUSD * bcvRate;

  // Manejo del Teclado Numérico Táctil
  const handleNumpadKey = (key: string) => {
    if (key === 'C') {
      setNumpadValue('');
      setPendingQuantity(null);
      return;
    }
    if (key === 'BACK') {
      setNumpadValue((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      setNumpadValue((prev) => {
        if (!prev.includes('.')) {
          return prev === '' ? '0.' : prev + '.';
        }
        return prev;
      });
      return;
    }

    setNumpadValue((prev) => prev + key);
  };

  // Aplicar acción del Numpad al item seleccionado, al último item, o como multiplicador pendiente
  const handleNumpadApply = () => {
    const rawVal = numpadValueRef.current;
    const val = parseFloat(rawVal);
    const currentMode = numpadModeRef.current;
    const currentCart = cartRef.current;
    const currentSelectedId = selectedCartItemIdRef.current;

    if (isNaN(val) || val <= 0) return;

    if (currentMode === 'qty') {
      if (currentCart.length > 0) {
        // Si hay un item seleccionado específicamente o tomamos el último
        const targetItem = currentSelectedId
          ? currentCart.find((i) => i.productId === currentSelectedId) || currentCart[currentCart.length - 1]
          : currentCart[currentCart.length - 1];

        if (targetItem) {
          updateItemQty(targetItem.productId, val);
          soundEffects.playBeep();
          showToast(`✓ Cantidad actualizada: ${val} × ${targetItem.name}`, 'success');
        }
      } else {
        // Si el carrito está vacío, activar como multiplicador para el siguiente producto que seleccione/escanee
        setPendingQuantity(val);
        soundEffects.playBeep();
        showToast(`⚡ Cantidad fijada en ${val} para el siguiente producto`, 'info');
      }
    } else if (currentMode === 'barcode') {
      // Buscar código directo o decodificar etiqueta de balanza
      const handled = handleProcessBarcodeScan(rawVal);
      if (!handled) {
        soundEffects.playError();
        showToast(`Producto con código ${rawVal} no encontrado`, 'error');
      }
    }

    setNumpadValue('');
  };

  // Búsqueda instantánea con pistola lectora o Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      const handled = handleProcessBarcodeScan(code);
      if (handled) {
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0], 1);
        setSearchQuery('');
      } else {
        soundEffects.playError();
        showToast(`Código o producto no encontrado: ${code}`, 'error');
      }
    }
  };

  // Abrir Modal de Cobro
  const openPaymentModal = () => {
    // Al abrir dejamos el monto entregado en blanco o con el exacto para que el cajero ingrese lo recibido
    setCashGivenUSD(totalUSD.toFixed(2));
    setCashGivenVES(totalVES.toFixed(2));
    setSelectedPaymentMethod('cash_usd');
    setShowPaymentModal(true);
  };

  // Cálculos de vuelto y diferencia en tiempo real
  const isVESPayment = selectedPaymentMethod === 'cash_ves' || selectedPaymentMethod === 'pago_movil';
  
  const givenUSD = parseFloat(String(cashGivenUSD).replace(',', '.')) || 0;
  const givenVES = parseFloat(String(cashGivenVES).replace(',', '.')) || 0;

  // Monto equivalente en la otra moneda en tiempo real
  const convertedGivenVES = isVESPayment ? givenVES : givenUSD * bcvRate;
  const convertedGivenUSD = isVESPayment ? (bcvRate > 0 ? givenVES / bcvRate : 0) : givenUSD;

  // Diferencia / Vuelto: Cuanto falta pagar o cuanto entregar de vuelto
  const rawDiffUSD = isVESPayment
    ? (bcvRate > 0 ? (givenVES - totalVES) / bcvRate : 0)
    : givenUSD - totalUSD;

  const rawDiffVES = isVESPayment
    ? givenVES - totalVES
    : (givenUSD - totalUSD) * bcvRate;

  const isCompletePayment = rawDiffUSD >= -0.001;
  const changeUSD = Math.max(0, rawDiffUSD);
  const changeVES = Math.max(0, rawDiffVES);
  const pendingUSD = Math.max(0, -rawDiffUSD);
  const pendingVES = Math.max(0, -rawDiffVES);


  // Registrar venta
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    let customerDoc: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    const receiptNum = `TKT-${String(Date.now()).slice(-6)}`;
    const payments: SalePayment[] = [];

    if (selectedPaymentMethod === 'cash_usd') {
      payments.push({
        method: 'cash_usd',
        amountUSD: totalUSD,
        amountVES: totalVES,
      });
    } else if (selectedPaymentMethod === 'cash_ves') {
      payments.push({
        method: 'cash_ves',
        amountUSD: totalUSD,
        amountVES: totalVES,
      });
    } else if (selectedPaymentMethod === 'pago_movil') {
      payments.push({
        method: 'pago_movil',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: pagoMovilRef,
      });
    } else if (selectedPaymentMethod === 'card_debit') {
      payments.push({
        method: 'card_debit',
        amountUSD: totalUSD,
        amountVES: totalVES,
      });
    } else if (selectedPaymentMethod === 'credit') {
      if (!selectedCreditCustomer) {
        showToast('Seleccione un cliente para la venta a crédito', 'error');
        return;
      }
      payments.push({
        method: 'credit',
        amountUSD: totalUSD,
        amountVES: totalVES,
        reference: 'Crédito / Fiado',
      });
      customerDoc = selectedCreditCustomer.docId;
      customerName = selectedCreditCustomer.name;
    }

    const newSale: LocalSale = {
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        barcode: i.barcode,
        qty: i.qty,
        priceUSD: i.priceUSD,
        totalUSD: i.totalUSD,
      })),
      subtotalUSD,
      taxUSD: 0,
      totalUSD,
      totalVES,
      bcvRate,
      payments,
      changeUSD: selectedPaymentMethod === 'credit' ? 0 : changeUSD,
      changeVES: selectedPaymentMethod === 'credit' ? 0 : changeVES,
      cashierName: 'Caja 1',
      customerDoc,
      customerName,
      status: 'completed',
    };

    // Guardar venta y descontar inventario (y sumar deuda al cliente si es crédito)
    await db.transaction('rw', db.sales, db.products, db.customers, async () => {
      await db.sales.add(newSale);
      for (const item of cart) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          await db.products.update(item.productId, {
            stock: Math.max(0, prod.stock - item.qty),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (selectedPaymentMethod === 'credit' && selectedCreditCustomer && selectedCreditCustomer.id) {
        const currentDebt = selectedCreditCustomer.currentDebtUSD || 0;
        await db.customers.update(selectedCreditCustomer.id, {
          currentDebtUSD: currentDebt + totalUSD,
        });
      }
    });

    // Abrir gaveta automáticamente si el pago fue en efectivo
    if (selectedPaymentMethod === 'cash_usd' || selectedPaymentMethod === 'cash_ves') {
      try {
        await kickCashDrawer();
      } catch {}
    }

    // Acumular en ventas del turno
    setShiftSales((prev) => [newSale, ...prev]);

    // Actualizar catálogo local
    await loadData();

    setLastCompletedSale(newSale);
    setShowPaymentModal(false);
    clearCart();
    setShowReceiptModal(true);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex overflow-hidden p-3 gap-3 bg-slate-100 font-sans">
      {/* ========================================================================= */}
      {/* PANEL IZQUIERDO: Buscador, Categorías y Cuadrícula de Productos           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        {/* Barra de Búsqueda de Alta Visibilidad & Acciones Rápidas */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escanear código de barras o escribir nombre (F3)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pos-search-input w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
            >
              Limpiar
            </button>
          )}

          {/* Widget de Balanza Digital Comercial & Fijar Peso Manual */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setManualWeightTargetProduct(null);
                setShowManualWeightModal(true);
              }}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
              title="Abrir ingreso manual de peso (Gramos o Kilos) para balanzas sin cable"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-black text-xs text-emerald-400 tabular-numbers">
                {scaleReading.weight.toFixed(3)} {scaleReading.unit}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${scaleReading.isStable ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}
                title={scaleReading.isStable ? 'Peso Estable' : 'Pesando...'}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                setManualWeightTargetProduct(null);
                setShowManualWeightModal(true);
              }}
              className="ml-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[10px] font-black text-slate-950 shadow-xs transition-colors flex items-center gap-1"
              title="Fijar peso manualmente en gramos o kilos (para balanzas convencionales)"
            >
              <Scale className="w-3 h-3 text-slate-950" />
              <span>Fijar Peso</span>
            </button>
          </div>

          {/* Botón Apertura Rápida de Gaveta RJ11 / ESC-POS (F10) */}
          <button
            type="button"
            onClick={async () => {
              const res = await kickCashDrawer();
              showToast(res.message, 'success');
            }}
            title="Abrir gaveta de dinero manualmente (F10)"
            className="pos-btn-gaveta px-2.5 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white hover:bg-amber-50 hover:border-amber-400 text-slate-700 hover:text-amber-900 flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Gaveta</span>
            <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
              F10
            </kbd>
          </button>

          {/* Toggle de Fotos */}
          <button
            type="button"
            onClick={toggleShowImages}
            title="Mostrar u ocultar fotos en el catálogo"
            className={`pos-header-btn-cream px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
              showImages
                ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{showImages ? 'Fotos ON' : 'Fotos OFF'}</span>
          </button>

          {/* Botón Vincular Celular */}
          <button
            type="button"
            onClick={openScannerModal}
            title="Vincular celular como lector de código de barras inalámbrico"
            className={`pos-header-btn-cream px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all shrink-0 ${
              phoneConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{phoneConnected ? 'Celular OK' : 'Celular Escáner'}</span>
            {phoneConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Categorías Rápidas */}
        <div className="pos-categories-bar px-3 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-75 select-none active:scale-[0.97] border ${
                  isSelected
                    ? 'pos-category-active brand-badge border-transparent shadow-xs font-bold'
                    : 'pos-category-inactive bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Cuadrícula de Productos (Con Fotos o Modo Compacto según showImages) */}
        <div
          className={`flex-1 p-4 overflow-y-auto content-start ${
            showImages
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5'
          }`}
        >
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStock;
            const theme = getCategoryTheme(p.category);

            // MODO CON FOTOS
            if (showImages) {
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p, 1)}
                  className={`pos-product-card h-48 p-2.5 bg-white border border-slate-300 ${theme.cardBorder} hover:shadow-lg rounded-xl text-left flex flex-col justify-between transition-all active:scale-[0.98] group overflow-hidden shadow-xs`}
                >
                  {/* Encabezado: Barcode + Categoría */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="pos-card-barcode text-[10px] font-mono font-semibold text-slate-400 truncate tracking-tight">
                      {p.barcode}
                    </span>
                    <span className={`pos-card-category-pill text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wide shrink-0 ${theme.badge}`}>
                      {p.category}
                    </span>
                  </div>

                  {/* Nombre */}
                  <h4 className="pos-product-title font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-sky-700 leading-tight">
                    {p.name}
                  </h4>

                  {/* Contenedor de Imagen */}
                  <div className="w-full h-20 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200/60 my-1">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Package className="w-7 h-7 stroke-1" />
                      </div>
                    )}
                  </div>

                  {/* Precios y Stock */}
                  <div className="flex items-end justify-between w-full pt-1">
                    <div>
                      <span className="pos-price-usd text-base font-black font-mono text-slate-900 tabular-numbers leading-none block">
                        {formatUSD(p.priceUSD)}
                      </span>
                      <span className="pos-price-ves text-xs font-bold text-slate-600 font-mono tabular-numbers block mt-0.5">
                        {formatVES(p.priceUSD * bcvRate)}
                      </span>
                    </div>
                    <span
                      className={`pos-card-stock-pill text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs shrink-0 ${
                        isLowStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.stock} {p.unit}
                    </span>
                  </div>
                </button>
              );
            }

            // MODO COMPACTO (Alta Densidad Textual con Separación Visual Impecable)
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p, 1)}
                className={`pos-product-card min-h-[135px] p-3 bg-white border border-slate-300 ${theme.cardBorder} hover:shadow-md hover:border-sky-400 rounded-xl text-left flex flex-col justify-between transition-all active:scale-[0.98] shadow-xs group relative overflow-hidden`}
              >
                <div className="space-y-1">
                  {/* Encabezado de la card: Código + Pastilla de Categoría */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="pos-card-barcode text-[10px] font-mono font-semibold text-slate-400 truncate tracking-tight">
                      {p.barcode}
                    </span>
                    <span className={`pos-card-category-pill text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wide shrink-0 ${theme.badge}`}>
                      {p.category}
                    </span>
                  </div>

                  {/* Nombre del Producto */}
                  <h4 className="pos-product-title font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-700 pt-0.5">
                    {p.name}
                  </h4>
                </div>

                {/* Pie de la card: Precios en USD y Bs + Pastilla de Existencia */}
                <div className="flex items-end justify-between pt-2 border-t border-slate-200/80 mt-2">
                  <div>
                    <span className="pos-price-usd text-base font-black font-mono text-slate-900 tabular-numbers leading-none block">
                      {formatUSD(p.priceUSD)}
                    </span>
                    <span className="pos-price-ves text-xs font-bold text-slate-600 font-mono tabular-numbers block mt-1">
                      {formatVES(p.priceUSD * bcvRate)}
                    </span>
                  </div>

                  <span
                    className={`pos-card-stock-pill text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs shrink-0 ${
                      isLowStock
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.stock} {p.unit}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              No se encontraron productos coincidentes.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL DERECHO: Ticket de Venta & Teclado Numérico Industrial */}
      {/* ========================================================================= */}
      <div className="pos-cart-panel w-[480px] flex flex-col gap-3 shrink-0">
        {/* Tabs: Ticket Activo | Ventas del Turno */}
        <div className="flex bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
          <button
            onClick={() => setRightPanelTab('cart')}
            className={`pos-tab-cart flex-1 py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 ${
              rightPanelTab === 'cart'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>&#128722;</span> Ticket Activo
            {cart.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">{cart.length}</span>
            )}
          </button>
          <button
            onClick={() => setRightPanelTab('shift')}
            className={`pos-tab-shift flex-1 py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 border-l border-slate-200 ${
              rightPanelTab === 'shift'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>&#128203;</span> Ventas del Turno
            {shiftSales.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-white text-[10px] font-black">{shiftSales.length}</span>
            )}
          </button>
        </div>

        {/* ---- TAB: TICKET ACTIVO ---- */}
        {rightPanelTab === 'cart' && (
        <div className="pos-cart-container flex-1 bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
          {/* Cabecera del Ticket */}
          <div className="p-3 border-b border-slate-200 bg-slate-100/95 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="pos-ticket-badge font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs border border-amber-500">
                Ticket Activo
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white border border-slate-700 text-[11px] font-mono font-bold shadow-2xs">
                {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de Artículos */}
          <div className="flex-1 p-2 overflow-y-auto divide-y divide-slate-100">
            {cart.map((item) => {
              const isSelected = selectedCartItemId === item.productId;
              return (
                <div
                  key={item.productId}
                  onClick={() => setSelectedCartItemId(item.productId)}
                  className={`py-2 px-2 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50/80 border border-sky-400 ring-2 ring-sky-400/30'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 animate-pulse"></span>
                      )}
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono font-medium">
                      {formatUSD(item.priceUSD)} c/u × {item.qty}
                    </p>
                  </div>

                {/* Controles de Cantidad */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateItemQty(item.productId, item.qty - 1)}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs tabular-numbers">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateItemQty(item.productId, item.qty + 1)}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Total por línea */}
                <div className="text-right min-w-[70px]">
                  <span className="text-xs font-mono font-black text-slate-900 block tabular-numbers">
                    {formatUSD(item.totalUSD)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 font-bold block tabular-numbers">
                    {formatVES(item.totalUSD * bcvRate)}
                  </span>
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-slate-300 hover:text-rose-600 px-1 text-sm font-bold"
                  title="Eliminar ítem"
                >
                  &times;
                </button>
              </div>
            );
          })}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 gap-2">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>El ticket está vacío. Escanee o seleccione productos.</span>
              </div>
            )}
          </div>

          {/* Gran Total del Ticket */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total a Cobrar:
              </span>
              <div className="text-right">
                <span className="pos-total-usd text-2xl font-black font-mono text-slate-900 block tabular-numbers">
                  {formatUSD(totalUSD)}
                </span>
                <span className="pos-total-ves text-xs font-bold font-mono text-sky-700 block tabular-numbers">
                  {formatVES(totalVES)}
                </span>
              </div>
            </div>

            {/* Botón Principal COBRAR (F12) */}
            <button
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              className="pos-btn-cobrar w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Cobrar Venta</span>
              <kbd className="bg-emerald-700 text-emerald-100 text-xs px-2 py-0.5 rounded font-mono font-bold">
                F12
              </kbd>
            </button>
          </div>
        </div>
        )} {/* fin tab cart */}

        {/* ---- TAB: VENTAS DEL TURNO ---- */}
        {rightPanelTab === 'shift' && (
          <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
            {/* Header del turno */}
            <div className="p-3 border-b border-slate-200 bg-emerald-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wide">Ventas del Turno</span>
                <p className="text-[10px] text-emerald-200">{shiftSales.length} ventas · Esta sesión</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 block">Total acumulado</span>
                <span className="font-mono font-black text-sm text-white tabular-numbers">
                  ${shiftSales.reduce((s, v) => s + v.totalUSD, 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de ventas */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {shiftSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <span className="text-3xl">📋</span>
                  <span className="text-xs font-medium">Sin ventas aún en este turno</span>
                </div>
              ) : (
                shiftSales.map((sale, idx) => {
                  const isMobile = (sale as any).source === 'mobile';
                  const saleTime = new Date(sale.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={sale.receiptNumber || idx} className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                          isMobile ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isMobile ? '📱' : '🖥️'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{sale.receiptNumber}</p>
                          <p className="text-[10px] text-slate-500">
                            {saleTime} · {sale.items.length} ítem{sale.items.length !== 1 ? 's' : ''}
                            {isMobile && <span className="ml-1 text-sky-600 font-bold">· Móvil</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-xs text-slate-900 block tabular-numbers">
                          ${sale.totalUSD.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block tabular-numbers">
                          Bs. {sale.totalVES.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumen total pie */}
            {shiftSales.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Ventas Desktop</p>
                  <p className="font-mono font-black text-slate-900 tabular-numbers">
                    ${shiftSales.filter((s) => !(s as any).source).reduce((a, s) => a + s.totalUSD, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-sky-200 text-center">
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wide">Ventas Móvil</p>
                  <p className="font-mono font-black text-sky-700 tabular-numbers">
                    ${shiftSales.filter((s) => (s as any).source === 'mobile').reduce((a, s) => a + s.totalUSD, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TECLADO NUMÉRICO TÁCTIL INDUSTRIAL                                       */}
        {/* ========================================================================= */}
        <div className="pos-numpad-container bg-white rounded-xl border border-slate-300 shadow-xs p-3 space-y-2">
          {/* Display & Selector de Modo */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setNumpadMode('qty')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  numpadMode === 'qty'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cantidad
              </button>
              <button
                onClick={() => setNumpadMode('barcode')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  numpadMode === 'barcode'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Código
              </button>
            </div>

            {/* Display del valor tecleado y contexto de acción */}
            <div className="h-9 px-3 bg-slate-100 text-slate-900 border border-slate-300 font-mono font-bold text-lg rounded-lg flex items-center justify-between flex-1 tabular-numbers">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 truncate max-w-[120px]">
                {pendingQuantity
                  ? `⚡ Próx: ×${pendingQuantity}`
                  : numpadMode === 'qty'
                  ? selectedCartItemId
                    ? `Item: ${cart.find((i) => i.productId === selectedCartItemId)?.name || 'Seleccionado'}`
                    : cart.length > 0
                    ? `Último: ${cart[cart.length - 1].name}`
                    : 'Próximo Producto'
                  : 'Buscar Código'}
              </span>
              <span className="text-sky-700 font-black">
                {numpadValue || '0'}
              </span>
            </div>
          </div>

          {/* Botonera 4x3 con respuesta táctil */}
          <div className="grid grid-cols-4 gap-1.5">
            {['7', '8', '9'].map((k) => (
              <button
                key={k}
                onClick={() => handleNumpadKey(k)}
                className="pos-numpad-key"
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => handleNumpadKey('BACK')}
              className="pos-numpad-action text-rose-600 font-bold"
              title="Borrar dígito"
            >
              ⌫
            </button>

            {['4', '5', '6'].map((k) => (
              <button
                key={k}
                onClick={() => handleNumpadKey(k)}
                className="pos-numpad-key"
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => handleNumpadKey('C')}
              className="pos-numpad-action text-slate-600"
              title="Limpiar"
            >
              C
            </button>

            {['1', '2', '3'].map((k) => (
              <button
                key={k}
                onClick={() => handleNumpadKey(k)}
                className="pos-numpad-key"
              >
                {k}
              </button>
            ))}
            <button
              onClick={handleNumpadApply}
              className="pos-numpad-enter pos-numpad-action row-span-2 bg-sky-700 hover:bg-sky-800 text-white font-bold border-sky-800 flex flex-col items-center justify-center text-xs"
            >
              <span>Enter</span>
              <span className="text-[10px] text-sky-200">Aplicar</span>
            </button>

            <button
              onClick={() => handleNumpadKey('0')}
              className="pos-numpad-key col-span-2"
            >
              0
            </button>
            <button
              onClick={() => handleNumpadKey('.')}
              className="pos-numpad-key"
            >
              .
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE LIQUIDACIÓN Y COBRO MULTIMONEDA (USD / BS)                       */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base uppercase tracking-wide text-slate-900">
                  Cobrar Venta
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tasa Oficial BCV: Bs. {bcvRate.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-emerald-700 block tabular-numbers">
                  {formatUSD(totalUSD)}
                </span>
                <span className="text-xs font-mono text-slate-600 block tabular-numbers">
                  {formatVES(totalVES)}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Métodos de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'cash_usd', label: 'Efectivo $' },
                    { id: 'cash_ves', label: 'Efectivo Bs' },
                    { id: 'pago_movil', label: 'Pago Móvil' },
                    { id: 'card_debit', label: 'Punto Débito' },
                    { id: 'credit', label: 'A Crédito / Fiado' },
                  ].map((m) => {
                    const isSelected = selectedPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(m.id as any)}
                        className={`h-11 rounded-lg border font-bold text-xs transition-colors ${
                          isSelected
                            ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Cliente si es A Crédito (Fiado) */}
              {selectedPaymentMethod === 'credit' && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-tight flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>Seleccionar Cliente para Venta a Crédito (Fiado)</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Crédito Comercial
                    </span>
                  </div>

                  <select
                    value={selectedCreditCustomer?.id || ''}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      const c = customersList.find((item) => item.id === cid) || null;
                      setSelectedCreditCustomer(c);
                    }}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Selecciona un cliente registrado --</option>
                    {customersList.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} ({cust.docId}) - Deuda: ${cust.currentDebtUSD || 0} / Límite: ${cust.creditLimitUSD || 100}
                      </option>
                    ))}
                  </select>

                  {selectedCreditCustomer && (
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs space-y-1">
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>Cliente:</span>
                        <strong className="text-slate-900">{selectedCreditCustomer.name}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Cédula / RIF:</span>
                        <span className="font-mono font-bold">{selectedCreditCustomer.docId}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Deuda Acumulada Actual:</span>
                        <span className="font-mono font-bold text-rose-600">${(selectedCreditCustomer.currentDebtUSD || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Límite de Crédito Autorizado:</span>
                        <span className="font-mono font-bold text-slate-800">${(selectedCreditCustomer.creditLimitUSD || 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-amber-100 font-bold">
                        <span>Crédito Disponible:</span>
                        <span className={`font-mono ${
                          Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)) >= totalUSD
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}>
                          ${Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)).toFixed(2)}
                        </span>
                      </div>

                      {totalUSD > Math.max(0, (selectedCreditCustomer.creditLimitUSD || 100) - (selectedCreditCustomer.currentDebtUSD || 0)) && (
                        <p className="text-[11px] font-bold text-rose-600 pt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>¡Advertencia! El total supera el límite de crédito disponible del cliente.</span>
                        </p>
                      )}
                    </div>
                  )}

                  {customersList.length === 0 && (
                    <p className="text-xs text-amber-800 font-medium">
                      No hay clientes registrados aún. Puedes registrarlos en el menú Clientes (F4).
                    </p>
                  )}
                </div>
              )}

              {/* Billetes Rápidos en USD */}
              {selectedPaymentMethod === 'cash_usd' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Billetes Rápidos ($):
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashGivenUSD(totalUSD.toFixed(2))}
                      className="py-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs"
                    >
                      Exacto
                    </button>
                    {['5', '10', '20', '50', '100'].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashGivenUSD(bill)}
                        className="py-1.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-mono font-bold text-xs text-slate-800"
                      >
                        ${bill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Billetes Rápidos en Bolívares */}
              {selectedPaymentMethod === 'cash_ves' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Monto Rápido en Bolívares (Bs):
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashGivenVES(totalVES.toFixed(2))}
                      className="py-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs"
                    >
                      Exacto
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashGivenVES(String(Math.ceil(totalVES)))}
                      className="py-1.5 rounded border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs"
                      title="Redondear al entero superior"
                    >
                      Redondo
                    </button>
                    {['500', '1000', '2000', '5000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGivenVES(amt)}
                        className="py-1.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-mono font-bold text-xs text-slate-800"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen del Monto a Cobrar */}
              <div className="p-3.5 bg-slate-900/90 dark:bg-slate-950 text-white rounded-xl border border-slate-700 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                    TOTAL A COBRAR
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    (Valor exacto de la cuenta)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-emerald-400 block tabular-numbers">
                    {formatUSD(totalUSD)}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300 block tabular-numbers">
                    {formatVES(totalVES)}
                  </span>
                </div>
              </div>

              {/* Campo de Monto Entregado por el Cliente con Conversor en Vivo */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight block">
                      {isVESPayment ? 'Monto Recibido del Cliente (Bs):' : 'Monto Recibido del Cliente ($):'}
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      {isVESPayment ? 'Ingresa los Bolívares que entrega el cliente' : 'Ingresa los Dólares que entrega el cliente'}
                    </span>
                  </div>

                  {isVESPayment ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Bs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={cashGivenVES}
                        onChange={(e) => setCashGivenVES(e.target.value)}
                        className="w-48 pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-right font-mono font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={cashGivenUSD}
                        onChange={(e) => setCashGivenUSD(e.target.value)}
                        className="w-40 pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-right font-mono font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Conversor en Tiempo Real: Muestra el equivalente en la otra moneda */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-xs">
                  <span className="text-sky-900 dark:text-sky-300 font-semibold flex items-center gap-1.5">
                    <span>💱</span>
                    <span>Equivalente en tiempo real:</span>
                  </span>
                  <span className="font-mono font-black text-sky-800 dark:text-sky-200 tabular-numbers">
                    {isVESPayment ? (
                      <>≈ {formatUSD(convertedGivenUSD)}</>
                    ) : (
                      <>≈ {formatVES(convertedGivenVES)}</>
                    )}
                  </span>
                </div>

                {/* Cuadro de Vuelto / Diferencia de Alto Contraste */}
                <div
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    isCompletePayment
                      ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-400 text-white shadow-lg'
                      : 'bg-rose-600 dark:bg-rose-700 border-rose-400 text-white shadow-lg'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-sm">
                      {isCompletePayment ? 'Vuelto a Entregar al Cliente:' : 'Monto Faltante por Pagar:'}
                    </span>
                    <span className="text-[11px] font-bold block text-white/90">
                      {isCompletePayment ? 'Diferencia a favor del cliente' : 'Aún no cubre el total de la cuenta'}
                    </span>
                  </div>

                  <div className="text-right">
                    {isCompletePayment ? (
                      <>
                        <span className="text-2xl font-black font-mono text-white block tabular-numbers leading-none drop-shadow-sm">
                          {isVESPayment ? formatVES(changeVES) : formatUSD(changeUSD)}
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-100 block tabular-numbers mt-1 drop-shadow-xs">
                          ≈ {isVESPayment ? formatUSD(changeUSD) : formatVES(changeVES)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-black font-mono text-white block tabular-numbers leading-none drop-shadow-sm">
                          Faltan {isVESPayment ? formatVES(pendingVES) : formatUSD(pendingUSD)}
                        </span>
                        <span className="text-xs font-bold font-mono text-rose-100 block tabular-numbers mt-1 drop-shadow-xs">
                          ≈ {isVESPayment ? formatUSD(pendingUSD) : formatVES(pendingVES)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>


              {/* Campo Opcional de Referencia si es Pago Móvil */}
              {selectedPaymentMethod === 'pago_movil' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Últimos 4 dígitos de Referencia:
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Ej: 4921"
                    value={pagoMovilRef}
                    onChange={(e) => setPagoMovilRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-11 border border-slate-300 rounded-lg font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancelar (Esc)
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={selectedPaymentMethod === 'credit' ? !selectedCreditCustomer : !isCompletePayment}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / VISTA PREVIA DE TICKET DE VENTA (IMPRESIÓN TÉRMICA)               */}
      {/* ========================================================================= */}
      {showReceiptModal && lastCompletedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-100 border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-800">Venta Registrada</span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Ticket Térmico 80mm */}
            <div className="p-4 bg-white font-mono text-xs text-slate-800 space-y-2 border-b border-slate-200 max-h-96 overflow-y-auto" id="thermal-receipt">
              <div className="text-center space-y-0.5">
                <h4 className="font-black text-sm text-slate-900 uppercase">
                  Comercial Mi Tienda C.A.
                </h4>
                <p className="text-[10px] text-slate-500">RIF: J-50123456-7</p>
                <p className="text-[10px] text-slate-500">Av. Principal, Local 4, Caracas</p>
                <p className="text-[10px] text-slate-500">Telf: 0414-1234567</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Ticket:</span>
                  <span className="font-bold">{lastCompletedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{new Date(lastCompletedSale.timestamp).toLocaleString('es-VE')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasa BCV:</span>
                  <span>Bs. {lastCompletedSale.bcvRate.toFixed(2)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 text-[11px]">
                {lastCompletedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[180px]">
                      {it.qty}x {it.name}
                    </span>
                    <span className="font-bold tabular-numbers">
                      {formatUSD(it.totalUSD)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL USD:</span>
                  <span>{formatUSD(lastCompletedSale.totalUSD)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-slate-600">
                  <span>TOTAL BS:</span>
                  <span>{formatVES(lastCompletedSale.totalVES)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Vuelto Entregado:</span>
                  <span>{formatUSD(lastCompletedSale.changeUSD)} (Bs. {lastCompletedSale.changeVES.toFixed(2)})</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-400">
                ¡Gracias por su compra!
              </div>
            </div>

            {/* Botones de Impresión */}
            <div className="p-3 bg-slate-50 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={printReceipt}
                className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VINCULAR CELULAR COMO ESCÁNER INALÁMBRICO & AGREGAR PRODUCTOS      */}
      {/* ========================================================================= */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">
                    Vincular Celular como Escáner
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pistola de código de barras y registro móvil con foto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {/* Código QR */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative group">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Escáner QR"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-700" />
                    <span className="text-xs font-semibold">Generando código QR...</span>
                  </div>
                )}
              </div>

              {/* Estado de Conexión */}
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  phoneConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    phoneConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span>
                  {phoneConnected
                    ? `¡Celular Conectado! (${phoneDeviceName || 'Móvil'})`
                    : 'Esperando escaneo del código QR...'}
                </span>
              </div>

              {/* Instrucciones Paso a Paso */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-slate-600">
                    Asegúrate de que tu celular esté conectado al <b>mismo Wi-Fi</b> que esta computadora.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-slate-600">
                    Abre la cámara del celular, apunta a este código QR y presiona el enlace.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-slate-600">
                    Verás un botón <b>"Instalar App"</b> para guardarla en la pantalla de inicio de tu celular, consultar inventario, precios en Bs/$ y escanear códigos al instante.
                  </span>
                </div>
              </div>

              {/* URL directa */}
              {scannerUrl && (
                <div className="w-full text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    O abre este enlace en el navegador de tu móvil:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={scannerUrl}
                      className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(scannerUrl);
                        showToast('Enlace copiado al portapapeles', 'info');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Listo, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ingreso Manual de Peso para Balanzas sin cable */}
      <ManualWeightModal
        isOpen={showManualWeightModal}
        onClose={() => {
          setShowManualWeightModal(false);
          setManualWeightTargetProduct(null);
        }}
        onApply={handleApplyManualWeight}
        targetProduct={manualWeightTargetProduct}
        availableProducts={products}
        bcvRate={bcvRate}
        initialWeightKg={scaleReading.weight > 0 ? scaleReading.weight : pendingQuantity || 0}
      />

      {/* ========================================================================= */}
      {/* TOAST FLOTANTE DE NOTIFICACIONES (ESCÁNER & EVENTOS)                       */}
      {/* ========================================================================= */}
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
    </div>
  );
}

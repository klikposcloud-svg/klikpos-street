'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  ScanLine,
  PackagePlus,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  DollarSign,
  Barcode,
  Image as ImageIcon,
  Send,
  Search,
  Download,
  ShoppingBag,
  Tag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Coins,
  Receipt,
} from 'lucide-react';
import { removeBackgroundToWhiteCanvas } from '@/lib/background-remover';

interface ScannedHistoryItem {
  barcode: string;
  timestamp: string;
  status: 'sent' | 'error';
}

interface MobileCatalogItem {
  id?: number | string;
  barcode: string;
  name: string;
  category: string;
  priceUSD: number;
  stock: number;
  image?: string;
}

interface MobileCartItem {
  productId: number | string;
  barcode: string;
  name: string;
  qty: number;
  priceUSD: number;
  totalUSD: number;
  image?: string;
}

export default function MobileScannerPage() {
  const [session, setSession] = useState('caja-1');
  const [activeTab, setActiveTab] = useState<'pos' | 'gun' | 'create' | 'inventory'>('pos');
  const [scannerActive, setScannerActive] = useState(false);
  const [history, setHistory] = useState<ScannedHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Listo para escanear');
  const [isSending, setIsSending] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Carrito de Venta Móvil (POS Autónomo en Celular)
  const [mobileCart, setMobileCart] = useState<MobileCartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedMobileCategory, setSelectedMobileCategory] = useState('Todos');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showMobilePaymentModal, setShowMobilePaymentModal] = useState(false);
  const [mobilePaymentMethod, setMobilePaymentMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil'>('cash_usd');
  const [mobileAmountGiven, setMobileAmountGiven] = useState('');
  const [mobilePagoMovilRef, setMobilePagoMovilRef] = useState('');
  const [isProcessingMobileSale, setIsProcessingMobileSale] = useState(false);
  const [mobileSaleSuccess, setMobileSaleSuccess] = useState<any | null>(null);
  const [offlinePendingSalesCount, setOfflinePendingSalesCount] = useState(0);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Inventario Móvil en Vivo
  const [inventoryList, setInventoryList] = useState<MobileCatalogItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryBcvRate, setInventoryBcvRate] = useState(848.55);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Form State for "Agregar Producto con Foto"
  const [prodPhoto, setProdPhoto] = useState<string | null>(null);
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Víveres');
  const [prodPriceUSD, setProdPriceUSD] = useState('');
  const [prodCostUSD, setProdCostUSD] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [isCreatingProd, setIsCreatingProd] = useState(false);
  const [createSuccessToast, setCreateSuccessToast] = useState(false);
  const [isSendingPhoto, setIsSendingPhoto] = useState(false);
  const [photoSentToast, setPhotoSentToast] = useState(false);
  const [isEnhancingMobileBg, setIsEnhancingMobileBg] = useState(false);
  const [isAnalyzingMobileAI, setIsAnalyzingMobileAI] = useState(false);
  const [aiDetectedToast, setAiDetectedToast] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeFileInputRef = useRef<HTMLInputElement>(null);
  const [cameraBlockedByHttp, setCameraBlockedByHttp] = useState(false);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);

  // Modal de Teclado Numérico Táctil (Numpad) para cantidades y precios
  const [numpadModal, setNumpadModal] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    allowDecimal: boolean;
    onConfirm: (val: number) => void;
  }>({
    isOpen: false,
    title: '',
    value: '',
    allowDecimal: false,
    onConfirm: () => {},
  });

  const openNumpad = (title: string, initialValue: number, allowDecimal: boolean, onConfirm: (val: number) => void) => {
    setNumpadModal({
      isOpen: true,
      title,
      value: initialValue > 0 ? String(initialValue) : '',
      allowDecimal,
      onConfirm,
    });
  };

  const numpadPress = (key: string) => {
    setNumpadModal((prev) => {
      let v = prev.value;
      if (key === 'C') return { ...prev, value: '' };
      if (key === '⌫') return { ...prev, value: v.slice(0, -1) };
      if (key === '.' && (!prev.allowDecimal || v.includes('.'))) return prev;
      if (key === '.' && v === '') return { ...prev, value: '0.' };
      if (v.length >= 8) return prev;
      return { ...prev, value: v + key };
    });
  };

  const confirmNumpad = () => {
    const val = parseFloat(numpadModal.value) || 0;
    numpadModal.onConfirm(val);
    setNumpadModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Audio Beep generator for mobile feedback
  const playMobileBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // Audio context might require user gesture
    }
  };

  // Get session from URL query and maintain heartbeat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('session') || 'caja-1';
      setSession(s);

      // Restaurar última foto tomada si el navegador móvil recargó
      try {
        const savedPhoto = localStorage.getItem('venematic_last_photo');
        if (savedPhoto) {
          setProdPhoto(savedPhoto);
        }
      } catch {}

      const deviceName = navigator.userAgent.includes('iPhone')
        ? 'iPhone'
        : navigator.userAgent.includes('iPad')
        ? 'iPad'
        : navigator.userAgent.includes('Android')
        ? 'Android Móvil'
        : 'Celular';

      // Notificar conexión inmediata al abrir
      const sendStatus = (connected: boolean) => {
        fetch('/api/scanner/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: s, connected, deviceName }),
          keepalive: true,
        }).catch(() => {});
      };

      sendStatus(true);

      // Latido constante cada 4 segundos para mantener el estado "Conectado" en vivo
      const pingTimer = setInterval(() => {
        sendStatus(true);
      }, 4000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          sendStatus(true);
        }
      };

      const handleUnload = () => {
        sendStatus(false);
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('beforeunload', handleUnload);

      // PWA beforeinstallprompt handler
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      return () => {
        clearInterval(pingTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        sendStatus(false);
      };
    }
  }, []);

  // Función para instalar la PWA
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar: Presiona el botón Compartir o Menú de tu navegador (⋮) y selecciona "Agregar a la pantalla de inicio".');
    }
  };

  // Cargar inventario desde la PC y guardarlo en caché local de contingencia
  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      // Primero, cargar caché local como respaldo instantáneo mientras llega la respuesta
      try {
        const cached = localStorage.getItem('venematic_offline_inventory');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.length > 0) setInventoryList(parsed);
        }
        const cachedBcv = localStorage.getItem('venematic_offline_bcv');
        if (cachedBcv) setInventoryBcvRate(parseFloat(cachedBcv));
      } catch {}

      const res = await fetch('/api/scanner/inventory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setInventoryList(data.products);
          try {
            localStorage.setItem('venematic_offline_inventory', JSON.stringify(data.products));
          } catch {}
        }
        if (typeof data.bcvRate === 'number') {
          setInventoryBcvRate(data.bcvRate);
          try {
            localStorage.setItem('venematic_offline_bcv', String(data.bcvRate));
          } catch {}
        }
        // Si el servidor dice que necesita sync, retornar false para reintento
        return !data.needsSync;
      }
    } catch (e) {
      console.warn('Error cargando inventario en móvil:', e);
    } finally {
      setIsLoadingInventory(false);
    }
    return false;
  };

  useEffect(() => {
    fetchInventory();
    checkOfflineSales();

    // Escuchar SSE para refrescar catálogo automáticamente cuando el escritorio actualice inventario
    let sseSource: EventSource | null = null;
    let retryInterval: NodeJS.Timeout | null = null;
    try {
      sseSource = new EventSource('/api/scanner/events?session=caja-1');
      sseSource.addEventListener('inventory_updated', () => {
        fetchInventory();
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      });
    } catch {}

    // Reintentar cada 4 segundos si el inventario sigue vacío (esperando que desktop responda)
    retryInterval = setInterval(async () => {
      const hasInventory = inventoryList.length > 0;
      if (hasInventory) {
        clearInterval(retryInterval!);
        retryInterval = null;
        return;
      }
      await fetchInventory();
    }, 4000);

    // Parar retry después de 60 segundos de todas formas
    const stopRetry = setTimeout(() => {
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
    }, 60000);

    return () => {
      sseSource?.close();
      if (retryInterval) clearInterval(retryInterval);
      clearTimeout(stopRetry);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'pos') {
      fetchInventory();
    }
  }, [activeTab]);

  // Verificar si hay ventas guardadas offline en el celular
  const checkOfflineSales = () => {
    try {
      const raw = localStorage.getItem('venematic_offline_sales_queue');
      const list = raw ? JSON.parse(raw) : [];
      setOfflinePendingSalesCount(list.length);
    } catch {
      setOfflinePendingSalesCount(0);
    }
  };

  // Intentar sincronizar ventas offline hacia la PC
  const syncOfflineSalesToPC = async () => {
    try {
      const raw = localStorage.getItem('venematic_offline_sales_queue');
      if (!raw) return;
      const sales: any[] = JSON.parse(raw);
      if (sales.length === 0) return;

      const remaining: any[] = [];
      for (const sale of sales) {
        try {
          const res = await fetch('/api/scanner/sale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sale }),
          });
          if (!res.ok) remaining.push(sale);
        } catch {
          remaining.push(sale);
        }
      }

      localStorage.setItem('venematic_offline_sales_queue', JSON.stringify(remaining));
      setOfflinePendingSalesCount(remaining.length);
      if (remaining.length === 0) {
        alert('¡Todas las ventas registradas offline fueron sincronizadas con éxito a la PC!');
      }
    } catch {}
  };

  // Acciones de Carrito de Venta Móvil (POS en Celular)
  const addToMobileCart = (product: MobileCatalogItem) => {
    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }

    setMobileCart((prev) => {
      const existing = prev.find((item) => item.barcode === product.barcode);
      if (existing) {
        return prev.map((item) =>
          item.barcode === product.barcode
            ? {
                ...item,
                qty: item.qty + 1,
                totalUSD: (item.qty + 1) * item.priceUSD,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id || Date.now(),
            barcode: product.barcode,
            name: product.name,
            qty: 1,
            priceUSD: product.priceUSD,
            totalUSD: product.priceUSD,
            image: product.image,
          },
        ];
      }
    });
  };

  const updateMobileCartQty = (barcode: string, delta: number) => {
    setMobileCart((prev) =>
      prev
        .map((item) => {
          if (item.barcode === barcode) {
            const newQty = item.qty + delta;
            return newQty > 0
              ? { ...item, qty: newQty, totalUSD: newQty * item.priceUSD }
              : null;
          }
          return item;
        })
        .filter(Boolean) as MobileCartItem[]
    );
  };

  const removeMobileCartItem = (barcode: string) => {
    setMobileCart((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  const clearMobileCart = () => {
    setMobileCart([]);
  };

  // Totales de la venta móvil
  const mobileSubtotalUSD = mobileCart.reduce((sum, i) => sum + i.totalUSD, 0);
  const mobileTotalUSD = mobileSubtotalUSD;
  const mobileTotalVES = mobileTotalUSD * inventoryBcvRate;

  // Procesar cobro móvil (Autónomo / Sin Luz)
  const handleProcessMobileSale = async () => {
    if (mobileCart.length === 0) return;
    setIsProcessingMobileSale(true);

    const numGiven = parseFloat(mobileAmountGiven) || 0;
    let finalChangeUSD = 0;
    let finalChangeVES = 0;
    if (mobilePaymentMethod === 'cash_usd') {
      if (numGiven > mobileTotalUSD) {
        finalChangeUSD = numGiven - mobileTotalUSD;
        finalChangeVES = finalChangeUSD * inventoryBcvRate;
      }
    } else if (mobilePaymentMethod === 'cash_ves') {
      if (numGiven > mobileTotalVES) {
        finalChangeVES = numGiven - mobileTotalVES;
        finalChangeUSD = inventoryBcvRate > 0 ? finalChangeVES / inventoryBcvRate : 0;
      }
    }

    const receiptNum = `CEL-${String(Date.now()).slice(-6)}`;
    const newSale = {
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: mobileCart.map((i) => ({
        productId: i.productId,
        name: i.name,
        barcode: i.barcode,
        qty: i.qty,
        priceUSD: i.priceUSD,
        totalUSD: i.totalUSD,
      })),
      subtotalUSD: mobileSubtotalUSD,
      taxUSD: 0,
      totalUSD: mobileTotalUSD,
      totalVES: mobileTotalVES,
      bcvRate: inventoryBcvRate,
      payments: [
        {
          method: mobilePaymentMethod,
          amountUSD: mobilePaymentMethod === 'cash_usd' && numGiven >= mobileTotalUSD ? numGiven : mobileTotalUSD,
          amountVES: mobilePaymentMethod === 'cash_ves' && numGiven >= mobileTotalVES ? numGiven : mobileTotalVES,
          reference: mobilePaymentMethod === 'pago_movil' ? mobilePagoMovilRef : undefined,
        },
      ],
      changeUSD: finalChangeUSD,
      changeVES: finalChangeVES,
      cashierName: 'POS Celular (Contingencia)',
      status: 'completed',
      source: 'mobile',
    };

    // 1. Intentar enviar a la PC por API
    let sentToPC = false;
    try {
      const res = await fetch('/api/scanner/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale: newSale }),
      });
      if (res.ok) {
        sentToPC = true;
      }
    } catch {
      sentToPC = false;
    }

    // 2. Si la PC está apagada o sin luz, guardar en la memoria del celular
    if (!sentToPC) {
      try {
        const raw = localStorage.getItem('venematic_offline_sales_queue');
        const sales = raw ? JSON.parse(raw) : [];
        sales.push(newSale);
        localStorage.setItem('venematic_offline_sales_queue', JSON.stringify(sales));
        setOfflinePendingSalesCount(sales.length);
      } catch {}
    }

    // Descontar inventario en la vista móvil del celular
    setInventoryList((prev) =>
      prev.map((prod) => {
        const cartItem = mobileCart.find((c) => c.barcode === prod.barcode);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.qty),
          };
        }
        return prod;
      })
    );

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setMobileSaleSuccess({
      receiptNumber: receiptNum,
      totalUSD: mobileTotalUSD,
      totalVES: mobileTotalVES,
      changeUSD: finalChangeUSD,
      changeVES: finalChangeVES,
      paymentMethod: mobilePaymentMethod,
      sentToPC,
      itemsCount: mobileCart.reduce((sum, i) => sum + i.qty, 0),
    });

    setMobileCart([]);
    setMobileAmountGiven('');
    setMobilePagoMovilRef('');
    setShowCartDrawer(false);
    setShowMobilePaymentModal(false);
    setIsProcessingMobileSale(false);
  };

  // Barcode scanner trigger
  const sendBarcodeToPC = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playMobileBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }

    setLastScanned(cleanCode);
    setStatusMessage(`Enviando ${cleanCode} a la PC...`);
    setIsSending(true);

    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, barcode: cleanCode }),
      });

      if (res.ok) {
        setStatusMessage(`✓ ¡Enviado a caja! (${cleanCode})`);
        setHistory((prev) => [
          { barcode: cleanCode, timestamp: new Date().toLocaleTimeString(), status: 'sent' },
          ...prev.slice(0, 19),
        ]);
      } else {
        setStatusMessage(`Error enviando código`);
        setHistory((prev) => [
          { barcode: cleanCode, timestamp: new Date().toLocaleTimeString(), status: 'error' },
          ...prev.slice(0, 19),
        ]);
      }
    } catch {
      setStatusMessage(`Sin conexión con la PC`);
    } finally {
      setIsSending(false);
    }
  };

  // Escanear código mediante foto nativa (100% compatible sin permisos de navegador / sin HTTPS)
  const handleScanFromPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);
    setStatusMessage('Analizando código de barras...');

    try {
      // 1. Intentar con Html5Qrcode.scanFile
      let qrScanner = html5QrCodeRef.current;
      if (!qrScanner) {
        qrScanner = new Html5Qrcode('mobile-camera-reader');
        html5QrCodeRef.current = qrScanner;
      }
      const decoded = await qrScanner.scanFile(file, false);
      if (decoded) {
        sendBarcodeToPC(decoded);
        setStatusMessage(`✓ ¡Código detectado: ${decoded}!`);
        setIsScanningPhoto(false);
        // Limpiar input para permitir tomar otra foto del mismo producto
        e.target.value = '';
        return;
      }
    } catch (err) {
      console.warn('scanFile no detectó en primer paso, probando detector nativo:', err);
    }

    // 2. Fallback de BarcodeDetector si está disponible en Chrome Android
    try {
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        const bitmap = await createImageBitmap(file);
        const detected = await barcodeDetector.detect(bitmap);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          sendBarcodeToPC(detected[0].rawValue);
          setStatusMessage(`✓ ¡Código detectado: ${detected[0].rawValue}!`);
          setIsScanningPhoto(false);
          e.target.value = '';
          return;
        }
      }
    } catch (e) {
      console.warn('BarcodeDetector fallback error:', e);
    }

    setStatusMessage('No se detectó código en la foto. Intenta enfocar más cerca.');
    setIsScanningPhoto(false);
    e.target.value = '';
  };

  // Initialize and clean up camera scanner
  const startScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const qrCode = new Html5Qrcode('mobile-camera-reader');
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          // Debounce same code 1.5s
          if (decodedText === lastScanned && now - lastScannedTimeRef.current < 1500) {
            return;
          }
          lastScannedTimeRef.current = now;
          sendBarcodeToPC(decodedText);
        },
        () => {
          // Ignore parse errors on each frame
        }
      );

      setScannerActive(true);
      setCameraBlockedByHttp(false);
      setStatusMessage('Cámara activa: Apunta al código de barras');
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setStatusMessage('Cámara bloqueada por el navegador. Usa el botón nativo.');
      setScannerActive(false);
      setCameraBlockedByHttp(true);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop camera error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    if (activeTab === 'gun') {
      startScanner();
    } else {
      // Detener cámara en segundo plano sin congelar la interfaz
      setTimeout(() => {
        stopScanner();
      }, 0);
    }

    return () => {
      stopScanner();
    };
  }, [activeTab]);

  // Handle Photo selection and compression with low memory footprint
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Usar FileReader directo para evitar pérdida en móviles al cerrar/cambiar tabs
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 640;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
              
              // 1. Guardar en estado y persistir en localStorage de inmediato
              setProdPhoto(compressedDataUrl);
              try {
                localStorage.setItem('venematic_last_photo', compressedDataUrl);
              } catch {}

              // 2. Auto-limpiar fondo a blanco puro
              setIsEnhancingMobileBg(true);
              removeBackgroundToWhiteCanvas(compressedDataUrl)
                .then((enhanced) => {
                  setProdPhoto(enhanced);
                  try {
                    localStorage.setItem('venematic_last_photo', enhanced);
                  } catch {}

                  // 3. ENVIAR FOTO MEJORADA A LA PC
                  setIsSendingPhoto(true);
                  return fetch('/api/scanner/upload-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      session: session || 'caja-1',
                      image: enhanced,
                      barcode: prodBarcode || undefined,
                    }),
                    keepalive: true,
                  });
                })
                .then((res) => {
                  if (res && res.ok) {
                    playMobileBeep();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate([100, 50, 100]);
                    }
                    setPhotoSentToast(true);
                    setTimeout(() => setPhotoSentToast(false), 4000);
                  }
                })
                .catch((err) => {
                  console.error('Error auto-procesando foto:', err);
                })
                .finally(() => {
                  setIsEnhancingMobileBg(false);
                  setIsSendingPhoto(false);
                });

              // 4. Auto-reconocimiento con IA (Google Vision / Gemini) si está configurado
              setIsAnalyzingMobileAI(true);
              fetch('/api/vision/analyze-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: compressedDataUrl }),
              })
                .then((r) => r.json())
                .then((json) => {
                  if (json.success && json.data) {
                    if (json.data.name && !prodName) setProdName(json.data.name);
                    if (json.data.category) setProdCategory(json.data.category);
                    if (json.data.barcode && !prodBarcode) setProdBarcode(json.data.barcode);
                    if (json.data.suggestedPriceUSD && !prodPriceUSD) {
                      setProdPriceUSD(json.data.suggestedPriceUSD.toString());
                    }
                    setAiDetectedToast(`¡Detectado: ${json.data.name || 'Producto'}!`);
                    setTimeout(() => setAiDetectedToast(null), 4500);
                  }
                })
                .catch(() => {})
                .finally(() => {
                  setIsAnalyzingMobileAI(false);
                });
            }
          } catch (err) {
            console.error('Error procesando imagen en canvas:', err);
            alert('No se pudo procesar la imagen. Intenta tomarla de nuevo.');
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error al capturar foto:', error);
      alert('Error de memoria al capturar foto.');
    }
  };

  // Submit new product with photo from phone
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodBarcode || !prodName || !prodPriceUSD) {
      alert('Por favor llena código, nombre y precio.');
      return;
    }

    setIsCreatingProd(true);
    try {
      const res = await fetch('/api/scanner/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          product: {
            barcode: prodBarcode,
            name: prodName,
            category: prodCategory,
            priceUSD: parseFloat(prodPriceUSD.replace(',', '.')),
            costUSD: parseFloat(prodCostUSD.replace(',', '.')) || 0,
            stock: parseInt(prodStock) || 1,
            unit: 'unidad',
            image: prodPhoto || undefined,
          },
        }),
      });

      if (res.ok) {
        playMobileBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        setCreateSuccessToast(true);
        // Reset form
        setProdPhoto(null);
        setProdBarcode('');
        setProdName('');
        setProdPriceUSD('');
        setProdCostUSD('');
        setProdStock('10');
        setTimeout(() => setCreateSuccessToast(false), 3000);
      } else {
        alert('Error al enviar el producto a la computadora.');
      }
    } catch (err) {
      alert('Sin conexión con la computadora local.');
    } finally {
      setIsCreatingProd(false);
    }
  };

  // Enviar SOLO la foto directamente al modal abierto en la PC
  const handleSendPhotoOnly = async () => {
    if (!prodPhoto) return;
    setIsSendingPhoto(true);
    try {
      const res = await fetch('/api/scanner/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          image: prodPhoto,
          barcode: prodBarcode || undefined,
        }),
      });

      if (res.ok) {
        playMobileBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(100);
        }
        setPhotoSentToast(true);
        setTimeout(() => setPhotoSentToast(false), 3000);
      } else {
        alert('Error al transferir la foto a la PC.');
      }
    } catch (err) {
      alert('Sin conexión con la computadora local.');
    } finally {
      setIsSendingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none pb-10">
      {/* Top Mobile Bar */}
      <header className="bg-white border-b border-slate-300 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-black text-sm">
            V
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight tracking-tight">
              Venematic Mobile
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Conectado a <b className="text-slate-800">{session}</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && !isInstalled && (
            <button
              onClick={handleInstallApp}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-[11px] font-black flex items-center gap-1 shadow-xs animate-bounce"
            >
              <Download className="w-3 h-3" />
              <span>Instalar App</span>
            </button>
          )}

          <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            <span>Wi-Fi OK</span>
          </div>
        </div>
      </header>

      {/* Banner de Instalación PWA si el usuario abre en navegador */}
      {!isInstalled && (
        <div className="bg-gradient-to-r from-sky-800 to-indigo-900 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📲</span>
            <div>
              <p className="text-xs font-black leading-tight">Instala Venematic en tu Celular</p>
              <p className="text-[10px] text-sky-200">Acceso directo como app nativa a pantalla completa</p>
            </div>
          </div>
          <button
            onClick={handleInstallApp}
            className="px-3 py-1.5 bg-white text-sky-900 rounded-lg text-xs font-black shadow-sm shrink-0 active:scale-95"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Banner de Ventas Pendientes Offline (Contingencia sin Luz) */}
      {offlinePendingSalesCount > 0 && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span>⚡</span>
            <span>{offlinePendingSalesCount} venta(s) guardadas en celular (Modo Contingencia)</span>
          </div>
          <button
            onClick={syncOfflineSalesToPC}
            className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-[11px] font-black shadow-xs active:scale-95"
          >
            Sincronizar a PC
          </button>
        </div>
      )}

      {/* Tabs Selector: 4 Pestañas (Venta Móvil, Pistola, + Foto, Inventario) */}
      <div className="p-2 bg-white border-b border-slate-200 grid grid-cols-4 gap-1.5 sticky top-12 z-40">
        <button
          onClick={() => setActiveTab('pos')}
          className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all relative ${
            activeTab === 'pos'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Venta Móvil</span>
          {mobileCart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
              {mobileCart.reduce((sum, i) => sum + i.qty, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gun')}
          className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all ${
            activeTab === 'gun'
              ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Pistola</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all ${
            activeTab === 'create'
              ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>+ Foto</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all ${
            activeTab === 'inventory'
              ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Inventario</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: VENTA MÓVIL (POS AUTÓNOMO EN CELULAR / CONTINGENCIA SIN LUZ)        */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* CABECERA FIJA SUPERIOR: Tasa BCV + Buscador + Filtros por Categoría */}
          <div className="p-3 bg-white border-b border-slate-200 shadow-2xs space-y-2 shrink-0">
            {/* Header y Tasa BCV */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Caja Móvil Venematic</h3>
                  <span className="text-[10px] text-emerald-700 font-bold">100% Autónomo con o sin Luz</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-500 block">Tasa BCV</span>
                <span className="text-xs font-mono font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Bs. {inventoryBcvRate.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Buscador Rápido de Productos para Venta */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {posSearch && (
                <button
                  onClick={() => setPosSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pastillas de Categorías Deslizables Horizontalmente */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              {['Todos', ...Array.from(new Set(inventoryList.map((p) => p.category).filter(Boolean)))].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMobileCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                    selectedMobileCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* CATÁLOGO DE PRODUCTOS (Ocupa el 100% del alto, scroll fluido y permanente) */}
          <div className="flex-1 overflow-y-auto px-3 pt-2 pb-28">
            <div className="flex items-center justify-between px-1 py-1 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Productos ({
                  inventoryList.filter((p) => {
                    const matchCategory = selectedMobileCategory === 'Todos' || p.category === selectedMobileCategory;
                    if (!matchCategory) return false;
                    if (!posSearch.trim()) return true;
                    const q = posSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.barcode.toLowerCase().includes(q) ||
                      (p.category && p.category.toLowerCase().includes(q))
                    );
                  }).length
                })
              </span>
              <span className="text-[10px] text-slate-400">Toca para agregar a la venta</span>
            </div>

            <div className="space-y-1.5">
              {inventoryList
                .filter((p) => {
                  const matchCategory = selectedMobileCategory === 'Todos' || p.category === selectedMobileCategory;
                  if (!matchCategory) return false;
                  if (!posSearch.trim()) return true;
                  const q = posSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q))
                  );
                })
                .map((p, idx) => {
                  const priceVES = p.priceUSD * inventoryBcvRate;
                  const inCart = mobileCart.find((c) => c.barcode === p.barcode);
                  return (
                    <div
                      key={p.id || idx}
                      onClick={() => addToMobileCart(p)}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 active:scale-[0.99] cursor-pointer ${
                        inCart
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                          : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      {/* Imagen o Ícono */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Tag className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Información de Producto */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400 truncate">{p.barcode}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Stock: {p.stock}</span>
                        </div>
                      </div>

                      {/* Precios */}
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-emerald-700 block tabular-numbers">
                          ${p.priceUSD.toFixed(2)}
                        </span>
                        <span className="font-mono font-bold text-[10px] text-slate-500 block tabular-numbers">
                          Bs. {priceVES.toFixed(2)}
                        </span>
                      </div>

                      {/* Control de Cantidad (+/- en la tarjeta o botón agregar) */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {inCart ? (
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-emerald-400 shadow-xs">
                            <button
                              onClick={() => updateMobileCartQty(p.barcode, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="min-w-[22px] text-center font-mono font-black text-xs text-emerald-800">
                              {inCart.qty}
                            </span>
                            <button
                              onClick={() => updateMobileCartQty(p.barcode, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToMobileCart(p)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 flex items-center justify-center transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {isLoadingInventory && inventoryList.length === 0 && (
                <div className="flex items-center justify-center py-12 gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Sincronizando catálogo con la PC...</span>
                </div>
              )}

              {!isLoadingInventory && inventoryList.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 mt-4">
                  <p className="text-3xl">📦</p>
                  <p className="text-xs font-bold text-slate-700">Sin productos cargados</p>
                  <p className="text-[11px] text-slate-500">Abre el POS en tu computadora para sincronizar.</p>
                  <button onClick={fetchInventory} className="px-4 py-2 bg-sky-700 text-white text-xs font-bold rounded-xl mt-2">
                    Cargar Catálogo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARRA FLOTANTE INFERIOR DE TICKET (Aparece cuando hay productos)          */}
          {/* ========================================================================= */}
          {mobileCart.length > 0 && (
            <div className="fixed bottom-3 inset-x-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
              <div
                onClick={() => setShowCartDrawer(true)}
                className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center border-2 border-slate-900">
                      {mobileCart.reduce((sum, i) => sum + i.qty, 0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-white tabular-numbers">
                        ${mobileTotalUSD.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold tabular-numbers">
                        ≈ Bs. {mobileTotalVES.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium block truncate">
                      Toca para ver ticket y cobrar
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobilePaymentModal(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <span>Cobrar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM SHEET: DETALLE COMPLETO DEL TICKET / CARRITO                      */}
      {/* ========================================================================= */}
      {showCartDrawer && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-end justify-center p-0"
          onClick={() => setShowCartDrawer(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tirador y Cabecera del Ticket */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Ticket de Venta ({mobileCart.reduce((sum, i) => sum + i.qty, 0)} artículos)
                  </h3>
                  <p className="text-[10px] text-slate-500">Revisa cantidades antes de cobrar</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearMobileCart}
                  className="px-2.5 py-1 text-[11px] text-rose-600 font-bold bg-rose-50 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vaciar</span>
                </button>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-base hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista de Artículos en el Carrito */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-1">
              {mobileCart.map((item) => (
                <div key={item.barcode} className="p-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      ${item.priceUSD.toFixed(2)} c/u ≈ Bs. {(item.priceUSD * inventoryBcvRate).toFixed(2)}
                    </p>
                  </div>

                  {/* Controles de Cantidad (+ / - y tap para Numpad) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                    <button
                      onClick={() => updateMobileCartQty(item.barcode, -1)}
                      className="w-6 h-6 rounded bg-white text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        openNumpad(
                          `Cantidad: ${item.name}`,
                          item.qty,
                          false,
                          (val) => {
                            const newQty = Math.max(1, Math.round(val));
                            setMobileCart((prev) =>
                              prev.map((c) =>
                                c.barcode === item.barcode
                                  ? { ...c, qty: newQty, totalUSD: newQty * c.priceUSD }
                                  : c
                              )
                            );
                          }
                        )
                      }
                      className="min-w-[28px] px-1.5 h-7 rounded-md bg-emerald-600/10 border border-emerald-400 text-emerald-800 font-black text-xs flex items-center justify-center active:scale-95"
                    >
                      {item.qty}
                    </button>
                    <button
                      onClick={() => updateMobileCartQty(item.barcode, 1)}
                      className="w-6 h-6 rounded bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total del ítem */}
                  <div className="text-right shrink-0 min-w-[65px]">
                    <span className="font-mono font-black text-xs text-slate-900 block tabular-numbers">
                      ${item.totalUSD.toFixed(2)}
                    </span>
                    <span className="font-mono font-bold text-[10px] text-slate-500 block tabular-numbers">
                      Bs. {(item.totalUSD * inventoryBcvRate).toFixed(2)}
                    </span>
                  </div>

                  {/* Eliminar ítem */}
                  <button
                    onClick={() => removeMobileCartItem(item.barcode)}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total y Botón de Cobro */}
            <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total a Cobrar</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Tasa: Bs. {inventoryBcvRate.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-emerald-400 block tabular-numbers">
                    ${mobileTotalUSD.toFixed(2)}
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-200 block tabular-numbers">
                    ≈ Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Seguir Agregando
                </button>
                <button
                  onClick={() => {
                    setShowCartDrawer(false);
                    setShowMobilePaymentModal(true);
                  }}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cobrar Venta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE COBRO MÓVIL CON CÁLCULO DE VUELTO ($ Y BS)                       */}
      {/* ========================================================================= */}
      {showMobilePaymentModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-2xs z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 space-y-3.5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Finalizar Cobro Móvil</h3>
                  <p className="text-[10px] text-slate-500">Calcula el vuelto y sincroniza con la PC</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMobilePaymentModal(false);
                  setMobileAmountGiven('');
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Total a Pagar Destacado */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de la Venta</span>
              <p className="font-mono font-black text-2xl text-emerald-400 tabular-numbers">
                ${mobileTotalUSD.toFixed(2)}
              </p>
              <p className="font-mono font-bold text-xs text-slate-300 tabular-numbers">
                ≈ Bs. {mobileTotalVES.toFixed(2)} (Tasa: {inventoryBcvRate.toFixed(2)})
              </p>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Forma de Pago:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('cash_usd');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'cash_usd'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Efectivo $</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('cash_ves');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'cash_ves'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Efectivo Bs.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePaymentMethod('pago_movil');
                    setMobileAmountGiven('');
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    mobilePaymentMethod === 'pago_movil'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pago Móvil</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CÁLCULO DE VUELTO: SI ES EFECTIVO $                                       */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'cash_usd' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paga con ($ USD):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileAmountGiven(String(mobileTotalUSD.toFixed(2)))}
                    className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md"
                  >
                    Exacto (${mobileTotalUSD.toFixed(2)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={mobileAmountGiven}
                    onChange={(e) => setMobileAmountGiven(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Botones rápidos de denominaciones en $ */}
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {[1, 5, 10, 20, 50, 100].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setMobileAmountGiven(String(bill))}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-mono font-black text-slate-800 shrink-0"
                    >
                      ${bill}
                    </button>
                  ))}
                </div>

                {/* Tarjeta de Vuelto Calculado */}
                {(() => {
                  const given = parseFloat(mobileAmountGiven) || 0;
                  if (given >= mobileTotalUSD) {
                    const diffUSD = given - mobileTotalUSD;
                    const diffVES = diffUSD * inventoryBcvRate;
                    return (
                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                          {diffUSD === 0 ? 'Pago Exacto (Sin Vuelto)' : 'Vuelto a Entregar al Cliente:'}
                        </span>
                        {diffUSD > 0 && (
                          <>
                            <p className="font-mono font-black text-lg text-emerald-800 leading-tight">
                              ${diffUSD.toFixed(2)} USD
                            </p>
                            <p className="font-mono font-bold text-xs text-emerald-700">
                              ≈ Bs. {diffVES.toFixed(2)} (al cambio)
                            </p>
                          </>
                        )}
                      </div>
                    );
                  } else if (given > 0 && given < mobileTotalUSD) {
                    const missing = mobileTotalUSD - given;
                    return (
                      <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-rose-700 uppercase block">Faltante:</span>
                        <p className="font-mono font-black text-base text-rose-800">
                          ${missing.toFixed(2)} USD (Bs. {(missing * inventoryBcvRate).toFixed(2)})
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* ========================================================================= */}
            {/* CÁLCULO DE VUELTO: SI ES EFECTIVO BS                                      */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'cash_ves' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paga con (Bs. VES):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileAmountGiven(String(mobileTotalVES.toFixed(2)))}
                    className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md"
                  >
                    Exacto (Bs. {mobileTotalVES.toFixed(2)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-xs text-slate-500">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={mobileAmountGiven}
                    onChange={(e) => setMobileAmountGiven(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Botones de aproximación en Bs */}
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {[
                    Math.ceil(mobileTotalVES / 10) * 10,
                    Math.ceil(mobileTotalVES / 50) * 50,
                    Math.ceil(mobileTotalVES / 100) * 100,
                  ]
                    .filter((v, i, a) => v > mobileTotalVES && a.indexOf(v) === i)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMobileAmountGiven(String(val))}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-mono font-black text-slate-800 shrink-0"
                      >
                        Bs. {val}
                      </button>
                    ))}
                </div>

                {/* Tarjeta de Vuelto Calculado en Bs */}
                {(() => {
                  const given = parseFloat(mobileAmountGiven) || 0;
                  if (given >= mobileTotalVES) {
                    const diffVES = given - mobileTotalVES;
                    const diffUSD = inventoryBcvRate > 0 ? diffVES / inventoryBcvRate : 0;
                    return (
                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                          {diffVES === 0 ? 'Pago Exacto (Sin Vuelto)' : 'Vuelto a Entregar al Cliente:'}
                        </span>
                        {diffVES > 0 && (
                          <>
                            <p className="font-mono font-black text-lg text-emerald-800 leading-tight">
                              Bs. {diffVES.toFixed(2)} VES
                            </p>
                            <p className="font-mono font-bold text-xs text-emerald-700">
                              ≈ ${diffUSD.toFixed(2)} USD (al cambio)
                            </p>
                          </>
                        )}
                      </div>
                    );
                  } else if (given > 0 && given < mobileTotalVES) {
                    const missing = mobileTotalVES - given;
                    return (
                      <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-rose-700 uppercase block">Faltante:</span>
                        <p className="font-mono font-black text-base text-rose-800">
                          Bs. {missing.toFixed(2)} (o ${(missing / inventoryBcvRate).toFixed(2)} USD)
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* ========================================================================= */}
            {/* REFERENCIA SI ES PAGO MÓVIL                                               */}
            {/* ========================================================================= */}
            {mobilePaymentMethod === 'pago_movil' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="bg-sky-50 border border-sky-200 p-2 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-sky-800 block">Monto exacto a transferir:</span>
                  <span className="font-mono font-black text-base text-sky-900">
                    Bs. {mobileTotalVES.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Últimos 4 dígitos o número de referencia:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 9842"
                    value={mobilePagoMovilRef}
                    onChange={(e) => setMobilePagoMovilRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Botón Confirmar Venta */}
            <button
              onClick={handleProcessMobileSale}
              disabled={isProcessingMobileSale}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isProcessingMobileSale ? 'Registrando y Sincronizando...' : 'Confirmar y Guardar Venta'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TOAST DE ÉXITO DE VENTA MÓVIL */}
      {mobileSaleSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 text-center space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">¡Venta Registrada!</h3>
              <p className="text-xs font-mono text-slate-500 font-bold">{mobileSaleSuccess.receiptNumber}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Monto $:</span>
                <span className="font-mono font-bold text-slate-900">${mobileSaleSuccess.totalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Bs.:</span>
                <span className="font-mono font-bold text-slate-900">Bs. {mobileSaleSuccess.totalVES.toFixed(2)}</span>
              </div>
              {mobileSaleSuccess.changeUSD > 0 && (
                <div className="flex justify-between bg-emerald-100/80 -mx-1 px-2 py-1 rounded-lg">
                  <span className="text-emerald-800 font-bold">Vuelto Entregado:</span>
                  <span className="font-mono font-black text-emerald-900">
                    ${mobileSaleSuccess.changeUSD.toFixed(2)} / Bs. {mobileSaleSuccess.changeVES.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Estado Sync:</span>
                <span className={`font-bold ${mobileSaleSuccess.sentToPC ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {mobileSaleSuccess.sentToPC ? '✓ Sincronizado a PC' : '⚡ Guardado en Celular'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileSaleSuccess(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-98"
            >
              Aceptar y Nueva Venta
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PISTOLA ESCÁNER DE CÓDIGO DE BARRAS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'gun' && (
        <main className="flex-1 flex flex-col p-3 gap-3">
          {/* Input oculto para cámara nativa móvil (funciona en HTTP sin permisos ni HTTPS) */}
          <input
            ref={barcodeFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleScanFromPhoto}
            className="hidden"
          />

          {/* Botón Principal de Alta Accesibilidad: Cámara Nativa Sin Permisos */}
          <button
            type="button"
            disabled={isScanningPhoto}
            onClick={() => barcodeFileInputRef.current?.click()}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span>{isScanningPhoto ? 'Analizando Código...' : '📸 Tomar Foto al Código (Cámara Nativa Sin Permisos)'}</span>
          </button>

          {/* Cámara Viewfinder */}
          <div className="bg-black rounded-2xl overflow-hidden relative shadow-md border-2 border-slate-800 min-h-[240px] flex items-center justify-center">
            <div id="mobile-camera-reader" className="w-full h-full min-h-[240px]"></div>

            {/* Overlaid Target Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-sky-400/80 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-sky-400 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-sky-400 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-sky-400 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-sky-400 -mb-1 -mr-1"></div>
                <div className="w-full h-0.5 bg-rose-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
              </div>
            </div>

            {/* Camera Controls Floating Overlay */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
              <button
                onClick={scannerActive ? stopScanner : startScanner}
                className="px-3 py-1.5 bg-black/75 backdrop-blur-md text-white border border-white/20 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scannerActive ? '' : 'text-amber-400'}`} />
                <span>{scannerActive ? 'Reiniciar Video' : 'Reintentar Video'}</span>
              </button>
            </div>
          </div>

          {/* Guía Automática si la cámara continua fue bloqueada por HTTP */}
          {cameraBlockedByHttp && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-black text-xs">Cámara Web Bloqueada por Navegador Móvil</p>
                  <p className="text-[11px] font-medium text-amber-800 leading-snug">
                    Los navegadores móviles exigen HTTPS para video continuo en red Wi-Fi. Puedes usar el botón verde arriba <b>"Tomar Foto al Código"</b> que abre la cámara nativa de tu teléfono y escanea directamente sin pedir permisos ni requerir HTTPS.
                  </p>
                </div>
              </div>

              <details className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <summary className="font-bold text-sky-800 cursor-pointer">
                  ⚙️ ¿Deseas video continuo en vivo en Chrome Android? (Opcional)
                </summary>
                <div className="pt-2 space-y-1.5 text-[10px] text-slate-600">
                  <p>1. En Chrome en tu celular, abre una pestaña y escribe:</p>
                  <code className="bg-slate-100 px-2 py-1 rounded font-mono text-[9px] block text-slate-800 select-all">
                    chrome://flags/#unsafely-treat-insecure-origin-as-secure
                  </code>
                  <p>2. Agrega la dirección IP de tu computadora POS:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 px-2 py-1 rounded font-mono text-[10px] font-black text-slate-900 flex-1 truncate">
                      {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : ''}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}`);
                          alert('¡Dirección copiada al portapapeles!');
                        }
                      }}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold shrink-0"
                    >
                      Copiar IP
                    </button>
                  </div>
                  <p>3. Cambia a <b>Enabled</b> y pulsa <b>Relaunch</b>. ¡Listo! La cámara de video en vivo quedará activa permanentemente.</p>
                </div>
              </details>
            </div>
          )}

          {/* Feedback Card */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isSending
                    ? 'bg-amber-100 text-amber-700 animate-spin'
                    : lastScanned
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {lastScanned ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Barcode className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Estado de Escaneo
                </span>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {statusMessage}
                </p>
              </div>
            </div>

            {lastScanned && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded border border-slate-200">
                {lastScanned}
              </span>
            )}
          </div>

          {/* Manual Entry Fallback */}
          <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-xs flex gap-2">
            <input
              type="text"
              placeholder="O ingresa código a mano..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendBarcodeToPC(manualCode);
                  setManualCode('');
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => {
                sendBarcodeToPC(manualCode);
                setManualCode('');
              }}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
            >
              Enviar
            </button>
          </div>

          {/* Scanned History List */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Historial de Escaneos
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {history.length} ítems
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.barcode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.timestamp}
                  </span>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Apunta a cualquier código de barras para agregarlo al carrito de la PC al instante.
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGREGAR PRODUCTO CON FOTO AL INVENTARIO DE LA PC                    */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <main className="flex-1 flex flex-col p-3">
          {createSuccessToast && (
            <div className="mb-3 p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>¡Producto agregado con foto y enviado a la computadora!</span>
            </div>
          )}

          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-xl border border-slate-300 shadow-xs p-4 space-y-3.5"
          >
            {/* Foto del Producto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Foto del Producto
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              {prodPhoto ? (
                <div className="space-y-2">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border-2 border-sky-500 bg-slate-900 group">
                    <img
                      src={prodPhoto}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-90">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/90 text-slate-900 text-xs font-bold rounded-lg shadow"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdPhoto(null)}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {/* Estado de limpieza y análisis inteligente */}
                  {(isEnhancingMobileBg || isAnalyzingMobileAI) && (
                    <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-center gap-2 text-sky-800 text-xs font-bold animate-pulse">
                      <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                      <span>
                        {isEnhancingMobileBg && isAnalyzingMobileAI
                          ? 'Limpiando fondo a blanco y reconociendo producto...'
                          : isEnhancingMobileBg
                          ? 'Mejorando foto a fondo blanco de catálogo...'
                          : 'Reconociendo producto con IA...'}
                      </span>
                    </div>
                  )}

                  {aiDetectedToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{aiDetectedToast}</span>
                    </div>
                  )}

                  {/* Botones de acción manual si el usuario desea reprocesar */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!prodPhoto) return;
                        setIsEnhancingMobileBg(true);
                        removeBackgroundToWhiteCanvas(prodPhoto)
                          .then((enhanced) => {
                            setProdPhoto(enhanced);
                            try {
                              localStorage.setItem('venematic_last_photo', enhanced);
                            } catch {}
                          })
                          .finally(() => setIsEnhancingMobileBg(false));
                      }}
                      disabled={isEnhancingMobileBg}
                      className="flex-1 py-1.5 px-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-[11px] text-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Fondo Blanco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!prodPhoto) return;
                        setIsAnalyzingMobileAI(true);
                        fetch('/api/vision/analyze-product', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ image: prodPhoto }),
                        })
                          .then((r) => r.json())
                          .then((json) => {
                            if (json.success && json.data) {
                              if (json.data.name) setProdName(json.data.name);
                              if (json.data.category) setProdCategory(json.data.category);
                              if (json.data.barcode) setProdBarcode(json.data.barcode);
                              if (json.data.suggestedPriceUSD) setProdPriceUSD(json.data.suggestedPriceUSD.toString());
                              setAiDetectedToast(`¡Detectado: ${json.data.name || 'Producto'}!`);
                              setTimeout(() => setAiDetectedToast(null), 4000);
                            }
                          })
                          .finally(() => setIsAnalyzingMobileAI(false));
                      }}
                      disabled={isAnalyzingMobileAI}
                      className="flex-1 py-1.5 px-2 bg-sky-50 border border-sky-300 rounded-lg font-bold text-[11px] text-sky-800 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-sky-600" />
                      <span>Auto-llenar IA</span>
                    </button>
                  </div>

                  {/* Botón directo de transferencia a la PC */}
                  <button
                    type="button"
                    onClick={handleSendPhotoOnly}
                    disabled={isSendingPhoto}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingPhoto ? 'Enviando a la PC...' : 'Enviar Foto a la PC'}</span>
                  </button>

                  {photoSentToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Foto transferida al formulario en tu PC!</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-sky-700 block">
                      Tomar Foto con Cámara
                    </span>
                    <span className="text-[10px] text-slate-400">
                      o elegir desde la galería
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Código de Barras */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Código de Barras *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej. 759123456789"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {lastScanned && (
                  <button
                    type="button"
                    onClick={() => setProdBarcode(lastScanned)}
                    className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg"
                  >
                    Usar {lastScanned}
                  </button>
                )}
              </div>
            </div>

            {/* Nombre del Producto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Descripción / Nombre *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Galletas María Puig 120g"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Categoría
              </label>
              <select
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Víveres">Víveres</option>
                <option value="Charcutería">Charcutería</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Cuidado Personal">Cuidado Personal</option>
                <option value="Snacks y Golosinas">Snacks y Golosinas</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            {/* Precios y Stock Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Precio Venta ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="1.50"
                    value={prodPriceUSD}
                    onChange={(e) => setProdPriceUSD(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Costo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    placeholder="1.10"
                    value={prodCostUSD}
                    onChange={(e) => setProdCostUSD(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingProd}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              <PackagePlus className="w-5 h-5" />
              <span>
                {isCreatingProd ? 'Guardando en PC...' : 'Guardar Producto en Inventario'}
              </span>
            </button>
          </form>
        </main>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVENTARIO & CONSULTA DE PRECIOS MÓVIL EN VIVO                     */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <main className="flex-1 flex flex-col p-3 gap-3">
          {/* Barra de Búsqueda y Tasa BCV */}
          <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-sky-700" />
                <span>Consulta de Inventario</span>
              </span>
              <span className="text-[11px] font-mono font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                Tasa BCV: Bs. {inventoryBcvRate.toFixed(2)}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {inventorySearch && (
                <button
                  onClick={() => setInventorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{inventoryList.length} productos registrados</span>
              <button
                onClick={fetchInventory}
                disabled={isLoadingInventory}
                className="text-sky-700 font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Lista de Productos con Tarjetas Táctiles */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-230px)] pb-6">
            {inventoryList
              .filter((p) => {
                if (!inventorySearch.trim()) return true;
                const q = inventorySearch.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.barcode.toLowerCase().includes(q) ||
                  (p.category && p.category.toLowerCase().includes(q))
                );
              })
              .map((p, idx) => {
                const priceVES = p.priceUSD * inventoryBcvRate;
                return (
                  <div
                    key={p.id || idx}
                    className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3"
                  >
                    {/* Imagen o Ícono del Producto */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Tag className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    {/* Información y Precios */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.category || 'General'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {p.barcode}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.stock <= 3
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          Stock: {p.stock}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Consulta de Inventario
                        </span>
                      </div>
                    </div>

                    {/* Precios en Monedas */}
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm text-emerald-700 block tabular-numbers">
                        ${p.priceUSD.toFixed(2)}
                      </span>
                      <span className="font-mono font-bold text-[11px] text-slate-500 block tabular-numbers">
                        Bs. {priceVES.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

            {inventoryList.length === 0 && !isLoadingInventory && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <p className="text-3xl">📦</p>
                <p className="text-xs font-bold text-slate-700">Sin productos cargados</p>
                <p className="text-[11px] text-slate-500">
                  Abre la caja en tu computadora para sincronizar el catálogo automáticamente.
                </p>
                <button
                  onClick={fetchInventory}
                  className="px-4 py-2 bg-sky-700 text-white text-xs font-bold rounded-xl mt-2"
                >
                  Cargar Catálogo
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ====== MODAL NUMPAD TÁCTIL ====== */}
      {numpadModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-end justify-center p-0"
          onClick={() => setNumpadModal((p) => ({ ...p, isOpen: false }))}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ingresa cantidad</p>
                <p className="text-sm font-black text-slate-900 truncate max-w-[220px]">{numpadModal.title}</p>
              </div>
              <button
                onClick={() => setNumpadModal((p) => ({ ...p, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg active:scale-95"
              >
                ×
              </button>
            </div>

            {/* Display */}
            <div className="mx-4 mb-3 bg-slate-900 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="font-mono font-black text-4xl text-white tabular-numbers tracking-wider">
                {numpadModal.value || '0'}
              </span>
              <button
                onClick={() => numpadPress('⌫')}
                className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white text-xl active:scale-90 transition-transform"
              >
                ⌫
              </button>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 px-4 pb-3">
              {['1','2','3','4','5','6','7','8','9','C','0', numpadModal.allowDecimal ? '.' : ''].map((key) =>
                key === '' ? (
                  <div key="empty" />
                ) : (
                  <button
                    key={key}
                    onClick={() => numpadPress(key)}
                    className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-95 ${
                      key === 'C'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {key}
                  </button>
                )
              )}
            </div>

            {/* Confirm Button */}
            <div className="px-4 pb-8">
              <button
                onClick={confirmNumpad}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-lg rounded-2xl shadow-lg transition-all"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


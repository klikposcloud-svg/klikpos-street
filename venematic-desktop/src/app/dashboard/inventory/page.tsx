'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, LocalProduct, InventoryMovement } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { parseInventoryFile, ParseResult } from '@/lib/importers';
import {
  UploadCloud,
  FileSpreadsheet,
  Package,
  Image as ImageIcon,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Plus,
  Search,
  Smartphone,
  QrCode,
  Sparkles,
  Minus,
  Edit2,
  Trash2,
  ShieldAlert,
  SlidersHorizontal,
  History,
  ClipboardCheck,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { removeBackgroundToWhiteCanvas } from '@/lib/background-remover';

export default function DesktopInventoryPage() {
  const { user, isAdmin, isCajero, requireAdminAuth } = useAuth();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);
  const [bcvRate, setBcvRate] = useState(848.55);

  // Form State para Nuevo / Editar Producto
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Víveres');
  const [unit, setUnit] = useState<string>('unidad');
  const [priceUSD, setPriceUSD] = useState('');
  const [costUSD, setCostUSD] = useState('');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('3');
  const [image, setImage] = useState('');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [phoneDevice, setPhoneDevice] = useState('');
  const [photoSyncMsg, setPhotoSyncMsg] = useState<string | null>(null);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [scannerUrl, setScannerUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Estados de Importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResultToast, setImportResultToast] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Ajuste con Motivo (Mermas, Caducidad, Autoconsumo, Conteo)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<LocalProduct | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState<'count_adjustment' | 'spoilage_damaged' | 'expiration' | 'internal_consumption' | 'return_supplier'>('spoilage_damaged');
  const [adjustmentMode, setAdjustmentMode] = useState<'decrease' | 'increase' | 'exact'>('decrease');
  const [adjustmentQty, setAdjustmentQty] = useState('1');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Estados de Historial / Kardex de Movimientos
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [movementsList, setMovementsList] = useState<InventoryMovement[]>([]);

  const loadScannerInfo = async () => {
    try {
      const res = await fetch('/api/server-info');
      const data = await res.json();
      const url = data.scannerUrl || `http://${data.ip || 'localhost'}:${data.port || 3002}/scanner?session=caja-1`;
      setScannerUrl(url);

      const qr = await QRCode.toDataURL(url, {
        width: 260,
        margin: 1.5,
        color: { dark: '#0284c7', light: '#ffffff' },
      });
      setQrCodeDataUrl(qr);
    } catch (e) {
      console.warn('Error loading scanner info:', e);
      // Fallback local en caso de error de red
      const fallbackUrl = `http://${window.location.hostname || 'localhost'}:3002/scanner?session=caja-1`;
      setScannerUrl(fallbackUrl);
      try {
        const qr = await QRCode.toDataURL(fallbackUrl, {
          width: 260,
          margin: 1.5,
          color: { dark: '#0284c7', light: '#ffffff' },
        });
        setQrCodeDataUrl(qr);
      } catch {}
    }
  };

  const loadProducts = async () => {
    const list = await db.products.toArray();
    setProducts(list);
    const bcv = await db.settings.get('bcv_rate');
    if (bcv) setBcvRate(bcv.value);
    return list;
  };

  // Sincronizar inventario al celular automáticamente después de cada cambio
  const broadcastInventoryToMobile = async () => {
    try {
      const list = await db.products.toArray();
      const bcvSetting = await db.settings.get('bcv_rate');
      const currentRate = bcvSetting?.value || 848.55;
      await fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: list.map((p) => ({
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

  useEffect(() => {
    loadProducts().then(() => {
      // Broadcast inmediato al celular cuando se abre el Inventario
      broadcastInventoryToMobile();
    });
    loadScannerInfo();

    // Suscripción en tiempo real al escáner y fotos enviadas desde el teléfono
    const eventSource = new EventSource('/api/scanner/events?session=caja-1');

    eventSource.addEventListener('phone_status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setPhoneConnected(Boolean(data.connected));
        if (data.deviceName) setPhoneDevice(data.deviceName);
      } catch (err) {
        console.error('Error parseando phone_status:', err);
      }
    });

    eventSource.addEventListener('photo_received', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.image) {
          setImage(data.image);
          if (data.barcode) {
            setBarcode((prev) => prev || data.barcode);
          }
          setPhotoSyncMsg('¡Foto recibida del celular! Mejorando fondo a blanco...');
          setShowAddModal(true); // Abrir modal automáticamente si no estaba abierto

          // Auto-remover fondo y mejorar a blanco tipo catálogo
          removeBackgroundToWhiteCanvas(data.image).then((clean) => {
            setImage(clean);
            setPhotoSyncMsg('¡Foto optimizada con fondo blanco de catálogo!');
            setTimeout(() => setPhotoSyncMsg(null), 4000);
          });

          // Auto-analizar con IA si está disponible la API key
          db.settings.get('gemini_api_key').then((k) => {
            if (k?.value) {
              handleAnalyzeWithVision(data.image);
            }
          });
        }
      } catch (err) {
        console.error('Error parseando photo_received:', err);
      }
    });

    // Cuando el celular abre la app y no hay inventario cacheado, responder con el catálogo actual
    eventSource.addEventListener('request_inventory', () => {
      broadcastInventoryToMobile();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Función de colores vivos de alta visibilidad para cada categoría/rubro
  const getCategoryBadge = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase().trim();
    if (cat.includes('víveres') || cat.includes('viveres') || cat.includes('alimento') || cat.includes('grano')) {
      return 'bg-amber-500 text-slate-950 font-black border border-amber-300 shadow-xs';
    }
    if (cat.includes('charcutería') || cat.includes('charcuteria') || cat.includes('queso') || cat.includes('carne') || cat.includes('pollo')) {
      return 'bg-rose-600 text-white font-black border border-rose-400 shadow-xs';
    }
    if (cat.includes('bebida') || cat.includes('refresco') || cat.includes('jugo') || cat.includes('agua') || cat.includes('licor')) {
      return 'bg-sky-500 text-slate-950 font-black border border-sky-300 shadow-xs';
    }
    if (cat.includes('limpieza') || cat.includes('hogar') || cat.includes('detergente')) {
      return 'bg-emerald-500 text-slate-950 font-black border border-emerald-300 shadow-xs';
    }
    if (cat.includes('cuidado') || cat.includes('higiene') || cat.includes('personal') || cat.includes('salud') || cat.includes('farmacia')) {
      return 'bg-purple-600 text-white font-black border border-purple-400 shadow-xs';
    }
    if (cat.includes('panadería') || cat.includes('panaderia') || cat.includes('dulce') || cat.includes('galleta') || cat.includes('snack')) {
      return 'bg-orange-500 text-white font-black border border-orange-300 shadow-xs';
    }
    if (cat.includes('tecnología') || cat.includes('tecnologia') || cat.includes('electr')) {
      return 'bg-indigo-600 text-white font-black border border-indigo-400 shadow-xs';
    }
    return 'bg-teal-600 text-white font-black border border-teal-400 shadow-xs';
  };

  // Navegación con teclado (W/S, Flechas Arriba/Abajo, RePág/AvPág)
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // Filtrado de productos
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRef = useRef<LocalProduct[]>([]);
  filteredRef.current = filtered;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No interferir si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (showAddModal || showImportModal || showMobileModal) {
        return;
      }

      const total = filteredRef.current.length;
      if (total === 0) return;

      const pageSize = 8; // salto de página

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(total - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(total - 1, prev + pageSize));
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - pageSize));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSelectedIndex(total - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, showImportModal, showMobileModal]);

  // Asegurar que la fila seleccionada se mantenga visible al desplazarse
  useEffect(() => {
    if (rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Manejar captura de imagen para nuevo producto
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(compressedDataUrl);

        // Auto-remover fondo a blanco limpio en segundo plano
        handleAutoEnhancePhoto(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Función automatizada para remover fondo a lienzo blanco de catálogo
  const handleAutoEnhancePhoto = async (targetImg?: string) => {
    const src = targetImg || image;
    if (!src) return;
    setIsRemovingBg(true);
    try {
      const cleanImg = await removeBackgroundToWhiteCanvas(src);
      setImage(cleanImg);
    } catch (e) {
      console.warn('Error mejorando fondo:', e);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Función automatizada para reconocer datos del producto con Google Vision / Gemini
  const handleAnalyzeWithVision = async (targetImg?: string) => {
    const src = targetImg || image;
    if (!src) {
      alert('Primero captura o sube una foto del producto.');
      return;
    }
    setIsAnalyzingAI(true);
    try {
      // Buscar si el usuario tiene API key guardada en settings
      const apiKeySetting = await db.settings.get('gemini_api_key');
      const apiKey = apiKeySetting?.value || '';

      const res = await fetch('/api/vision/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: src, apiKey }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.name && !name) {
          setName(json.data.name);
        } else if (json.data.name) {
          // Si ya había nombre pero se desea autocompletar
          setName(json.data.name);
        }

        if (json.data.category) {
          setCategory(json.data.category);
        }

        if (json.data.barcode && !barcode) {
          setBarcode(json.data.barcode);
        }

        if (json.data.suggestedPriceUSD && !priceUSD) {
          setPriceUSD(json.data.suggestedPriceUSD.toString());
        }

        setPhotoSyncMsg(`¡IA Detectó: "${json.data.name || 'Producto'}" (${json.data.category})!`);
        setTimeout(() => setPhotoSyncMsg(null), 5000);
      } else {
        if (json.hasApiKey === false) {
          alert('Para auto-llenado con IA necesitas configurar tu API Key gratuita de Google en Ajustes (F8).');
        } else {
          alert(json.error || 'No se pudo analizar la foto.');
        }
      }
    } catch (e) {
      console.error('Error analizando con IA:', e);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode || !priceUSD) return;

    const newProduct: LocalProduct = {
      name,
      barcode,
      category,
      priceUSD: parseFloat(priceUSD.replace(',', '.')),
      costUSD: parseFloat(costUSD.replace(',', '.')) || 0,
      stock: parseFloat(stock.replace(',', '.')) || 0,
      minStock: parseFloat(minStock.replace(',', '.')) || 0,
      unit: unit || 'unidad',
      image: image.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const exists = await db.products.where('barcode').equals(barcode).first();
    if (exists) {
      await db.products.update(exists.id!, newProduct);
    } else {
      await db.products.add(newProduct);
    }

    setName('');
    setBarcode('');
    setUnit('unidad');
    setPriceUSD('');
    setCostUSD('');
    setImage('');
    setShowAddModal(false);
    await loadProducts();
    broadcastInventoryToMobile();
  };

  // Abrir modal de edición con validación de Rol de Administrador
  const handleOpenEditModal = async (product: LocalProduct) => {
    if (!isAdmin) {
      const authorized = await requireAdminAuth();
      if (!authorized) return;
    }
    setEditingProduct(product);
    setName(product.name);
    setBarcode(product.barcode);
    setCategory(product.category || 'Víveres');
    setUnit(product.unit || 'unidad');
    setPriceUSD(product.priceUSD.toString());
    setCostUSD(product.costUSD ? product.costUSD.toString() : '');
    setStock(product.stock.toString());
    setMinStock(product.minStock ? product.minStock.toString() : '3');
    setImage(product.image || '');
    setShowEditModal(true);
  };

  // Guardar cambios de producto editado (Solo Administrador)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.id || !name || !barcode || !priceUSD) return;

    if (!isAdmin) {
      const authorized = await requireAdminAuth();
      if (!authorized) return;
    }

    const updatedData: Partial<LocalProduct> = {
      name,
      barcode,
      category,
      priceUSD: parseFloat(priceUSD.replace(',', '.')),
      costUSD: parseFloat(costUSD.replace(',', '.')) || 0,
      stock: parseFloat(stock.replace(',', '.')) || 0,
      minStock: parseFloat(minStock.replace(',', '.')) || 0,
      unit: unit || 'unidad',
      image: image.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await db.products.update(editingProduct.id, updatedData);
    setShowEditModal(false);
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setUnit('unidad');
    setPriceUSD('');
    setCostUSD('');
    setImage('');
    await loadProducts();
    broadcastInventoryToMobile();
  };

  // Eliminar producto (Solo Administrador)
  const handleDeleteProduct = async (id: number, prodName: string) => {
    if (!isAdmin) {
      const authorized = await requireAdminAuth();
      if (!authorized) return;
    }

    if (confirm(`¿Estás seguro de eliminar "${prodName}" del inventario? Esta acción es permanente.`)) {
      await db.products.delete(id);
      await loadProducts();
      broadcastInventoryToMobile();
    }
  };

  const handleQuickStockUpdate = async (id: number, delta: number) => {
    const p = await db.products.get(id);
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);
    await db.products.update(id, { stock: newStock, updatedAt: new Date().toISOString() });
    
    // Registrar movimiento en auditoría
    await db.inventoryMovements.add({
      productId: id,
      barcode: p.barcode,
      productName: p.name,
      type: delta > 0 ? 'in' : 'out',
      qtyDelta: delta,
      previousStock: p.stock,
      newStock: newStock,
      reason: 'count_adjustment',
      notes: delta > 0 ? 'Ajuste rápido (+1)' : 'Ajuste rápido (-1)',
      performedBy: user?.name || 'caja-1',
      timestamp: new Date().toISOString(),
    });

    await loadProducts();
    broadcastInventoryToMobile();
  };

  const handleOpenAdjustmentModal = (p: LocalProduct) => {
    setSelectedProductForAdjustment(p);
    setAdjustmentReason('spoilage_damaged');
    setAdjustmentMode('decrease');
    setAdjustmentQty('1');
    setAdjustmentNotes('');
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjustment || !selectedProductForAdjustment.id) return;

    const qty = parseFloat(adjustmentQty);
    if (isNaN(qty) || qty < 0) {
      alert('Por favor ingrese una cantidad válida');
      return;
    }

    const current = selectedProductForAdjustment.stock;
    let newStock = current;
    let delta = 0;

    if (adjustmentMode === 'decrease') {
      delta = -Math.abs(qty);
      newStock = Math.max(0, current - Math.abs(qty));
    } else if (adjustmentMode === 'increase') {
      delta = Math.abs(qty);
      newStock = current + Math.abs(qty);
    } else {
      // exact count
      newStock = qty;
      delta = newStock - current;
    }

    await db.products.update(selectedProductForAdjustment.id, {
      stock: newStock,
      updatedAt: new Date().toISOString(),
    });

    await db.inventoryMovements.add({
      productId: selectedProductForAdjustment.id,
      barcode: selectedProductForAdjustment.barcode,
      productName: selectedProductForAdjustment.name,
      type: delta >= 0 ? 'in' : 'out',
      qtyDelta: delta,
      previousStock: current,
      newStock: newStock,
      reason: adjustmentReason,
      notes: adjustmentNotes || undefined,
      performedBy: user?.name || 'caja-1',
      timestamp: new Date().toISOString(),
    });

    setShowAdjustmentModal(false);
    setSelectedProductForAdjustment(null);
    setImportResultToast(`Ajuste de inventario aplicado a "${selectedProductForAdjustment.name}".`);
    await loadProducts();
    broadcastInventoryToMobile();
  };

  const handleOpenMovementsModal = async () => {
    const list = await db.inventoryMovements.orderBy('createdAt').reverse().limit(100).toArray();
    setMovementsList(list);
    setShowMovementsModal(true);
  };

  // Manejador de selección de archivo de importación
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseInventoryFile(content, file.name);
      setParsedData(res);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Ejecutar importación a Dexie DB
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.products.length === 0) return;

    setIsImporting(true);
    try {
      let importedCount = 0;
      let updatedCount = 0;

      await db.transaction('rw', db.products, async () => {
        for (const prod of parsedData.products) {
          const existing = await db.products.where('barcode').equals(prod.barcode).first();
          if (existing) {
            if (overwriteExisting) {
              await db.products.update(existing.id!, {
                ...prod,
                updatedAt: new Date().toISOString(),
              });
              updatedCount++;
            }
          } else {
            await db.products.add(prod as LocalProduct);
            importedCount++;
          }
        }
      });

      await loadProducts();
      broadcastInventoryToMobile();
      setImportResultToast(
        `✓ Importación completada: ${importedCount} nuevos, ${updatedCount} actualizados de ${parsedData.totalParsed} productos.`
      );
      setShowImportModal(false);
      setParsedData(null);
      setImportFile(null);

      setTimeout(() => setImportResultToast(null), 5000);
    } catch (err: any) {
      alert(`Error durante la importación: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Plantilla de ejemplo descargable
  const downloadSampleTemplate = (type: 'csv' | 'json') => {
    let content = '';
    let filename = '';
    let mime = '';

    if (type === 'csv') {
      content =
        'codigo,descripcion,categoria,precio_usd,costo_usd,stock,imagen\n' +
        '759100100099,Harina de Maíz Juana 1kg,Víveres,1.20,0.90,30,https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400\n' +
        '759100100100,Salsa de Tomate Pampero 397g,Víveres,1.65,1.20,24,\n' +
        '759100100101,Queso Amarillo Torondoy 250g,Charcutería,3.40,2.60,15,\n';
      filename = 'plantilla_inventario_venematic.csv';
      mime = 'text/csv;charset=utf-8;';
    } else {
      content = JSON.stringify(
        [
          {
            barcode: '759100100099',
            name: 'Harina de Maíz Juana 1kg',
            category: 'Víveres',
            priceUSD: 1.2,
            costUSD: 0.9,
            stock: 30,
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
          },
          {
            barcode: '759100100100',
            name: 'Salsa de Tomate Pampero 397g',
            category: 'Víveres',
            priceUSD: 1.65,
            costUSD: 1.2,
            stock: 24,
          },
        ],
        null,
        2
      );
      filename = 'plantilla_inventario_venematic.json';
      mime = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-slate-100 font-sans">
      {/* Toast de Resultado de Importación */}
      {importResultToast && (
        <div className="p-3 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{importResultToast}</span>
          </div>
          <button
            onClick={() => setImportResultToast(null)}
            className="text-white/80 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Inventario y Catálogo de Productos
          </h2>
          <p className="text-xs text-slate-500">
            Control de existencias, fotos, precios en divisas y cálculo en bolívares (Tasa: Bs. {bcvRate.toFixed(2)})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Botón Auditoría / Kardex */}
          <button
            onClick={handleOpenMovementsModal}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Ver historial de mermas, caducidades y ajustes de stock"
          >
            <History className="w-4 h-4 text-amber-700" />
            <span>Auditoría / Kardex</span>
          </button>

          {/* Botón Importar desde Saint / CSV / JSON */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-sky-700" />
            <span>Importar Catálogo</span>
          </button>

          {/* Botón Nuevo Producto */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabla de Productos Industrial con Columna de Miniatura y Navegación */}
      <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden flex flex-col">
        <div ref={tableContainerRef} className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 sticky top-0 font-black text-slate-800 uppercase tracking-wider text-[11px] z-10 shadow-xs">
              <tr>
                <th className="py-3.5 px-3 text-center w-14">Foto</th>
                <th className="py-3.5 px-4 w-36">Código / Barras</th>
                <th className="py-3.5 px-4 min-w-[200px]">Producto</th>
                <th className="py-3.5 px-4 w-36">Categoría</th>
                <th className="py-3.5 px-4 text-right w-28">Precio USD</th>
                <th className="py-3.5 px-4 text-right w-32">Precio Bs</th>
                <th className="py-3.5 px-4 text-center w-28">Stock Actual</th>
                <th className="py-3.5 px-4 text-center w-28">Ajuste Rápido</th>
                <th className="py-3.5 px-4 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {filtered.map((p, idx) => {
                const isLow = p.stock <= p.minStock;
                const isSelected = selectedIndex === idx;
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={p.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    onClick={() => setSelectedIndex(idx)}
                    className={`transition-colors cursor-pointer inventory-table-row ${
                      isSelected
                        ? 'bg-sky-500/15 border-l-4 border-l-sky-500 ring-1 ring-inset ring-sky-500/40'
                        : isEven
                        ? 'bg-white/95'
                        : 'bg-slate-100/50'
                    } hover:bg-sky-500/20`}
                  >
                    {/* Miniatura Foto */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden mx-auto flex items-center justify-center shadow-2xs">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Código / Barras */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 text-xs">
                      {p.barcode}
                    </td>

                    {/* Nombre del Producto */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm tracking-normal leading-normal">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{p.name}</span>
                        {(p.unit === 'kg' || p.unit === 'gr' || p.unit?.toLowerCase().includes('kg')) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold shadow-xs">
                            <Scale className="w-3 h-3 text-amber-600" />
                            Pesable ({p.unit || 'kg'})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Categoría con Color Específico Distintivo */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getCategoryBadge(p.category)}`}>
                        {p.category}
                      </span>
                    </td>

                    {/* Precio USD */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-numbers">
                      <div>{formatUSD(p.priceUSD)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {p.unit === 'kg' ? '/ kg' : p.unit === 'gr' ? '/ gr' : '/ unid'}
                      </div>
                    </td>

                    {/* Precio Bs */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-600 text-xs tabular-numbers">
                      <div>{formatVES(p.priceUSD * bcvRate)}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.unit === 'kg' ? '/ kg' : p.unit === 'gr' ? '/ gr' : '/ unid'}
                      </div>
                    </td>

                    {/* Stock Actual */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${
                          isLow
                            ? 'bg-rose-600 text-white border-rose-400 shadow-2xs'
                            : 'bg-emerald-600 text-white border-emerald-400 shadow-2xs'
                        }`}
                      >
                        {p.stock} {p.unit || 'pza'}
                      </span>
                    </td>

                    {/* Ajuste Rápido (+ / -) con alto contraste y visibilidad garantizada */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStockUpdate(p.id!, -1);
                          }}
                          className="btn-stock-minus w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center border border-red-500 shadow-sm transition-all active:scale-95 group/btn"
                          title="Restar 1 (o tecla -)"
                        >
                          <Minus className="w-4 h-4 text-white stroke-[4] group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStockUpdate(p.id!, 1);
                          }}
                          className="btn-stock-plus w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center border border-emerald-500 shadow-sm transition-all active:scale-95 group/btn"
                          title="Sumar 1 (o tecla +)"
                        >
                          <Plus className="w-4 h-4 text-white stroke-[4] group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>

                    {/* Columna Acciones: Editar / Borrar (Editable con Rol Administrador) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAdjustmentModal(p);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 text-[11px] font-bold shadow-2xs transition-all active:scale-95"
                          title="Ajuste con Motivo (Mermas, Caducidad, Autoconsumo, Conteo)"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                          <span>Motivo</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(p);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 text-[11px] font-bold shadow-2xs transition-all active:scale-95"
                          title={isAdmin ? 'Editar producto completo (Administrador)' : 'Editar producto (Requiere clave de Admin)'}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                          <span>Editar</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p.id!, p.name);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95"
                            title="Eliminar producto (Solo Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: IMPORTAR DESDE SAINT, CSV / SVS Y JSON                              */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">
                    Importar Catálogo de Productos
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Compatible con Saint Enterprise (SAPROD), archivos CSV/SVS y JSON
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setParsedData(null);
                  setImportFile(null);
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Zona de Arrastre / Selección de Archivo */}
              <input
                ref={importFileInputRef}
                type="file"
                accept=".csv,.svs,.txt,.json"
                onChange={handleImportFileSelect}
                className="hidden"
              />

              <div
                onClick={() => importFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <UploadCloud className="w-6 h-6 text-sky-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {importFile ? importFile.name : 'Haz clic para seleccionar el archivo de inventario'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Admite exportaciones de <b>Saint (.csv, .txt)</b>, <b>CSV delimitado (, o ;)</b> y <b>JSON</b>
                  </p>
                </div>
              </div>

              {/* Botones de Descarga de Plantillas */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">¿Necesitas una plantilla de ejemplo?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('csv')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar Plantilla CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('json')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar Plantilla JSON</span>
                  </button>
                </div>
              </div>

              {/* Vista Previa de Datos Detectados */}
              {parsedData && (
                <div className="border border-slate-200 rounded-xl overflow-hidden space-y-2">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-xs">
                        Formato: {parsedData.formatDetected}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {parsedData.totalParsed} productos listos para importar
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                      />
                      <span>Sobrescribir si el código ya existe</span>
                    </label>
                  </div>

                  {/* Tabla Preview de Primeros 5 Items */}
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Nombre</th>
                          <th className="py-2 px-3">Categoría</th>
                          <th className="py-2 px-3 text-right">Precio USD</th>
                          <th className="py-2 px-3 text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.products.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{p.barcode}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-900 truncate max-w-[200px]">{p.name}</td>
                            <td className="py-1.5 px-3 text-slate-600">{p.category}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">${p.priceUSD.toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-center font-mono">{p.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedData.totalParsed > 5 && (
                    <div className="p-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                      Mostrando los primeros 5 productos de {parsedData.totalParsed} totales
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedData(null);
                  setImportFile(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!parsedData || parsedData.products.length === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'Importando...'
                    : `Confirmar e Importar ${parsedData?.totalParsed || 0} Productos`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REGISTRAR NUEVO PRODUCTO (CON FOTO)                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300 w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Producto</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Foto del Producto con Doble Opción */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto del Producto:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Banner de sincronización si llega foto del teléfono */}
                {photoSyncMsg && (
                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-emerald-800 text-[11px] font-semibold animate-bounce">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{photoSyncMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity"
                        >
                          Quitar
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Las 2 opciones pedidas por el usuario */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Opción 1: Subir desde PC */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                        title="Selecciona una imagen almacenada en tu computadora"
                      >
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        <span>Subir de PC</span>
                      </button>

                      {/* Opción 2: Tomar / Subir con Celular */}
                      <button
                        type="button"
                        onClick={() => {
                          loadScannerInfo();
                          setShowMobileModal(true);
                        }}
                        className={`px-2.5 py-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] ${
                          phoneConnected
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                        title={
                          phoneConnected
                            ? `Celular conectado (${phoneDevice || 'Móvil'}). Toma la foto en tu teléfono y aparecerá aquí automáticamente.`
                            : 'Ver código QR para vincular o abrir la App en tu móvil'
                        }
                      >
                        <Smartphone className={`w-3.5 h-3.5 ${phoneConnected ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`} />
                        <span>{phoneConnected ? 'Móvil Listo ✓' : 'Vincular Móvil'}</span>
                      </button>
                    </div>

                    {/* Estado del celular e indicador */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${phoneConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        {phoneConnected ? `Móvil activo (${phoneDevice || 'Conectado'})` : 'Móvil no detectado'}
                      </span>
                      <span className="text-[10px] text-slate-400">Sync auto</span>
                    </div>

                    <input
                      type="text"
                      placeholder="O pega URL directa de imagen..."
                      value={image.startsWith('data:') ? '' : image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-sky-500"
                    />

                    {/* Acciones Inteligentes de IA / Fondo Blanco */}
                    {image && (
                      <div className="flex gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleAutoEnhancePhoto()}
                          disabled={isRemovingBg}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                          title="Remueve el fondo y centra el producto en fondo blanco limpio"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{isRemovingBg ? 'Limpiando...' : 'Fondo Blanco IA'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnalyzeWithVision()}
                          disabled={isAnalyzingAI}
                          className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                          title="Auto-detecta nombre, marca y categoría con Google Vision / Gemini"
                        >
                          <Package className="w-3 h-3 text-sky-600" />
                          <span>{isAnalyzingAI ? 'Detectando...' : 'Auto-llenar con IA'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código de Barras / SKU *:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: 759100100099"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Producto *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Leche Completa 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  >
                    <option value="Víveres">Víveres</option>
                    <option value="Charcutería">Charcutería</option>
                    <option value="Carnicería">Carnicería</option>
                    <option value="Frutería / Verduras">Frutería / Verduras</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Venta / Unidad:
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold text-slate-800"
                  >
                    <option value="unidad">📦 Por Unidad (pza)</option>
                    <option value="kg">⚖️ Pesable por Kilo (kg)</option>
                    <option value="gr">⚖️ Pesable por Gramos (gr)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 truncate">
                    {unit === 'kg' ? 'Precio por Kg ($ USD) *:' : unit === 'gr' ? 'Precio por Gr ($ USD) *:' : 'Precio Venta ($ USD) *:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={unit === 'kg' ? 'Ej: 6.50 /kg' : '1.50'}
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  />
                </div>
              </div>

              {(unit === 'kg' || unit === 'gr') && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Producto Pesable configurado:</strong> En la caja registradora o balanza, el cobro se calculará automáticamente: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">Total USD = Peso ({unit}) × Precio fijado</code>.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {unit === 'kg' ? 'Costo por Kg ($ USD):' : unit === 'gr' ? 'Costo por Gr ($ USD):' : 'Costo ($ USD):'}
                  </label>
                  <input
                    type="text"
                    placeholder="1.10"
                    value={costUSD}
                    onChange={(e) => setCostUSD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {unit === 'kg' ? 'Stock Inicial (Kilos):' : unit === 'gr' ? 'Stock Inicial (Gramos):' : 'Stock Inicial (Unidades):'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={unit === 'kg' ? 'Ej: 15.5' : '10'}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CÓDIGO QR / APP MÓVIL EN INVENTARIO                                 */}
      {/* ========================================================================= */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-200" />
                <h3 className="font-bold text-sm tracking-wide">App Móvil Venematic</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="text-sky-200 hover:text-white p-1 rounded-lg hover:bg-sky-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white border-2 border-dashed border-sky-300 rounded-2xl shadow-xs flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Conexión Celular"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                    <span className="text-xs">Generando QR...</span>
                  </div>
                )}
              </div>

              {/* Estado de conexión */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                phoneConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${phoneConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span>{phoneConnected ? `¡Móvil Conectado (${phoneDevice || 'Dispositivo'})!` : 'Esperando conexión del móvil...'}</span>
              </div>

              {/* Guía App Dedicada PWA */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-left text-xs space-y-1.5 text-slate-700">
                <p className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  ¿Cómo instalarla como App en el móvil?
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Escanea el QR con la cámara de tu teléfono (en la misma red Wi-Fi).</li>
                  <li>En Chrome o Safari, presiona <b>"Agregar a pantalla principal"</b> o <b>"Instalar"</b>.</li>
                  <li>¡Listo! Tendrás el icono de Venematic para tomar fotos de productos y escanear códigos sin abrir nada en la PC.</li>
                </ol>
              </div>

              {/* Enlace directo */}
              {scannerUrl && (
                <div className="w-full text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    O escribe este enlace en el celular:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={scannerUrl}
                      className="flex-1 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(scannerUrl);
                        setImportResultToast('Enlace copiado al portapapeles');
                        setTimeout(() => setImportResultToast(null), 3000);
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDITAR PRODUCTO (SOLO ROL ADMINISTRADOR)                            */}
      {/* ========================================================================= */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Editar Producto de Inventario</h3>
                  <span className="text-[10px] text-indigo-600 font-semibold">Autorizado con Rol de Administrador</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3.5 text-xs">
              {/* Foto del Producto */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto del Producto:
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity"
                        >
                          Quitar
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cambiar Foto desde PC</span>
                    </button>
                    <input
                      type="text"
                      placeholder="O pega URL de imagen..."
                      value={image.startsWith('data:') ? '' : image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {image && (
                      <div className="flex gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleAutoEnhancePhoto()}
                          disabled={isRemovingBg}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{isRemovingBg ? 'Limpiando...' : 'Fondo Blanco IA'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnalyzeWithVision()}
                          disabled={isAnalyzingAI}
                          className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <Package className="w-3 h-3 text-indigo-600" />
                          <span>{isAnalyzingAI ? 'Detectando...' : 'Auto-llenar con IA'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código de Barras / SKU *:
                </label>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Producto *:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                  >
                    <option value="Víveres">Víveres</option>
                    <option value="Charcutería">Charcutería</option>
                    <option value="Carnicería">Carnicería</option>
                    <option value="Frutería / Verduras">Frutería / Verduras</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Venta / Unidad:
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold text-slate-800"
                  >
                    <option value="unidad">📦 Por Unidad (pza)</option>
                    <option value="kg">⚖️ Pesable por Kilo (kg)</option>
                    <option value="gr">⚖️ Pesable por Gramos (gr)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 truncate">
                    {unit === 'kg' ? 'Precio por Kg ($ USD) *:' : unit === 'gr' ? 'Precio por Gr ($ USD) *:' : 'Precio Venta ($ USD) *:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={unit === 'kg' ? 'Ej: 6.50 /kg' : '1.50'}
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              {(unit === 'kg' || unit === 'gr') && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Producto Pesable configurado:</strong> En la caja registradora o balanza, el cobro se calculará automáticamente: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">Total USD = Peso ({unit}) × Precio fijado</code>.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {unit === 'kg' ? 'Costo por Kg ($ USD):' : unit === 'gr' ? 'Costo por Gr ($ USD):' : 'Costo ($ USD):'}
                  </label>
                  <input
                    type="text"
                    placeholder="1.10"
                    value={costUSD}
                    onChange={(e) => setCostUSD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {unit === 'kg' ? 'Stock Actual (Kilos):' : unit === 'gr' ? 'Stock Actual (Gramos):' : 'Stock Actual (Unidades):'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={unit === 'kg' ? 'Ej: 15.5' : '10'}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (editingProduct?.id) {
                      handleDeleteProduct(editingProduct.id, editingProduct.name);
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-sm"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Inventario con Motivo */}
      {showAdjustmentModal && selectedProductForAdjustment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ajustar Stock con Motivo</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setSelectedProductForAdjustment(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Info Producto */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-slate-900">{selectedProductForAdjustment.name}</div>
                <div className="font-mono text-[10px] text-slate-500">{selectedProductForAdjustment.barcode}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Stock Actual</span>
                <span className="font-mono font-black text-sm text-slate-900">{selectedProductForAdjustment.stock} uds</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo / Causa del Ajuste *:
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="spoilage_damaged">Merma / Producto Dañado o Roto</option>
                  <option value="expiration">Vencimiento / Fecha de Caducidad</option>
                  <option value="count_adjustment">Ajuste de Conteo Físico / Auditoría</option>
                  <option value="internal_consumption">Autoconsumo / Gasto Interno</option>
                  <option value="return_supplier">Devolución a Proveedor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipo de Operación *:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('decrease')}
                    className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-colors ${
                      adjustmentMode === 'decrease'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    - Descontar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('increase')}
                    className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-colors ${
                      adjustmentMode === 'increase'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    + Ingresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('exact')}
                    className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-colors ${
                      adjustmentMode === 'exact'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Fijar Exacto
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {adjustmentMode === 'exact' ? 'Cantidad Exacta Contada:' : 'Cantidad a Modificar:'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  autoFocus
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones / Justificación:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Empaque roto en transporte o caducado el 15/09"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setSelectedProductForAdjustment(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar Ajuste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial / Kardex de Auditoría */}
      {showMovementsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Auditoría de Movimientos & Kardex de Stock</h3>
                  <p className="text-xs text-slate-500">Registro inmutable de mermas, caducidades, conteos y ajustes de inventario</p>
                </div>
              </div>
              <button
                onClick={() => setShowMovementsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-center">Motivo</th>
                    <th className="py-2.5 px-3 text-right">Stock Ant.</th>
                    <th className="py-2.5 px-3 text-center">Cambio (Delta)</th>
                    <th className="py-2.5 px-3 text-right">Nuevo Stock</th>
                    <th className="py-2.5 px-3">Usuario / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementsList.map((m) => {
                    const isPositive = m.qtyDelta > 0;
                    let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                    let reasonLabel: string = m.reason;

                    if (m.reason === 'spoilage_damaged') {
                      badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                      reasonLabel = 'Merma / Daño';
                    } else if (m.reason === 'expiration') {
                      badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                      reasonLabel = 'Caducidad';
                    } else if (m.reason === 'internal_consumption') {
                      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      reasonLabel = 'Autoconsumo';
                    } else if (m.reason === 'return_supplier') {
                      badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      reasonLabel = 'Devolución Prov.';
                    } else if (m.reason === 'count_adjustment') {
                      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      reasonLabel = 'Conteo Físico';
                    } else if ((m.reason as string) === 'sale_void') {
                      badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
                      reasonLabel = 'Anulación Venta';
                    } else if (m.reason === 'sale') {
                      badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      reasonLabel = 'Venta';
                    }

                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {new Date(m.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{m.productName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{m.barcode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {reasonLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {m.previousStock}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isPositive ? `+${m.qtyDelta}` : m.qtyDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {m.newStock}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700">{m.performedBy || 'caja-1'}</span>
                          {m.notes && <span className="text-slate-500 block">{m.notes}</span>}
                        </td>
                      </tr>
                    );
                  })}

                  {movementsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hay movimientos de inventario registrados en el historial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowMovementsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

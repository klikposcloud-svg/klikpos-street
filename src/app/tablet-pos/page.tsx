'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  Bike,
  CircleDollarSign,
  Menu,
  ShoppingCart,
  QrCode,
  Printer,
  Moon,
  Sun,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Phone,
  Store,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Receipt,
  Share2,
  Copy,
  Clock,
  ExternalLink,
  Flame,
  Check,
  Edit3,
  SlidersHorizontal,
  Tag,
  Palette,
  ShieldCheck,
  CheckCircle,
  Building,
  User,
  UserPlus,
  CreditCard,
  Wallet,
  FileText,
  Settings,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Package,
  Users,
  ArrowLeftRight,
  Boxes,
  Truck,
  Image as ImageIcon,
  Camera,
  Upload,
  Smartphone,
  List,
  MapPin
} from 'lucide-react';
import LicenseActivationModal from '@/components/LicenseActivationModal';
import VisualPacksModal from '@/components/marketplace/VisualPacksModal';
import StreetAmbassadorLicenseModal from '@/components/licensing/StreetAmbassadorLicenseModal';
import StreetSalesBackupModal from '@/components/tablet-pos/StreetSalesBackupModal';
import { evaluateTrialState, TrialState, registerTrialInstallation } from '@/lib/licensing/trial-manager';
import { db } from '@/lib/db';
import { TabletPosBottomNav } from '@/components/tablet-pos/TabletPosBottomNav';
import { StreetAutoUpdater } from '@/components/tablet-pos/StreetAutoUpdater';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';
import { SoftwareUpdateModal } from '@/components/tablet-pos/SoftwareUpdateModal';
import { DataSyncModal } from '@/components/tablet-pos/DataSyncModal';
import { ProductImageSelector } from '@/components/tablet-pos/ProductImageSelector';
import { PrinterConfigModal } from '@/components/tablet-pos/PrinterConfigModal';
import { BusinessRubroModal } from '@/components/tablet-pos/BusinessRubroModal';
import { DeliveryDriversModal } from '@/components/tablet-pos/DeliveryDriversModal';
import { EditProductModal } from '@/components/tablet-pos/EditProductModal';
import { CompanyConfigModal } from '@/components/tablet-pos/CompanyConfigModal';
import { PagoMovilConfigModal } from '@/components/tablet-pos/PagoMovilConfigModal';
import { CustomerModal } from '@/components/tablet-pos/CustomerModal';
import {
  SAMPLE_PRODUCTS,
  RUBROS_CATALOG,
  DEFAULT_DRIVERS,
  CATEGORIES,
  NOTE_PRESETS,
  DEFAULT_CUSTOMERS,
  BRAND_PALETTES,
  CANVAS_THEMES,
  VENEZUELAN_BANKS,
} from '@/lib/data/tablet-pos-rubros';
import type {
  CanvasTheme,
  CanvasThemeId,
  Motorizado,
  PrinterConfig,
  RubroId,
  CardViewMode,
  CartItem,
  Product,
  Customer,
  CompanyInfo,
  PagoMovilInfo,
  MixedPaymentEntry,
  CompletedSaleTicket,
  PosOrder,
} from '@/types/tablet-pos';
import { doc, setDoc } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase/config';
import { useBcvRate } from '@/hooks/useBcvRate';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { calcCartTotals } from '@/lib/pos/cart-calculations';

// Tipos locales auxiliares (no presentes en @/types/tablet-pos)

const DEFAULT_SAMPLE_ORDERS: PosOrder[] = [
  {
    id: 'ord_1',
    orderNumber: 'PED-101',
    type: 'local',
    status: 'en_cola',
    paymentStatus: 'pagado',
    paymentMethod: 'Pago Móvil',
    items: [
      { id: '1', name: 'Hamburguesa Doble Especial', priceUSD: 6.50, qty: 2, category: 'Hamburguesas', notes: 'Sin cebolla' },
      { id: '6', name: 'Refresco Familiar 1.5L Frío', priceUSD: 2.50, qty: 1, category: 'Bebidas' }
    ],
    totalUSD: 15.50,
    totalVES: 15.50 * 848.55,
    customer: { id: '2', name: 'Carlos Rodríguez', docId: 'V-18456123', phone: '0414-1234567' },
    table: 'Mesa 4',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    timeFormatted: '12 min'
  },
  {
    id: 'ord_2',
    orderNumber: 'PED-102',
    type: 'delivery',
    status: 'en_cola',
    paymentStatus: 'por_cobrar',
    paymentMethod: 'Cobro en Destino',
    items: [
      { id: '2', name: 'Perro Caliente Especial Jumbo', priceUSD: 3.50, qty: 3, category: 'Perros', notes: 'Con todo y queso parmesano' }
    ],
    totalUSD: 10.50,
    totalVES: 10.50 * 848.55,
    customer: { id: '3', name: 'María Gómez', docId: 'V-22987654', phone: '0424-9876543', address: 'Urb. Los Rosales, Calle 3, Casa #14' },
    deliveryAddress: 'Urb. Los Rosales, Calle 3, Casa #14',
    driverName: 'Alexander Morales',
    driverId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    timeFormatted: '6 min'
  },
  {
    id: 'ord_3',
    orderNumber: 'PED-100',
    type: 'delivery',
    status: 'despachado',
    paymentStatus: 'pagado',
    paymentMethod: 'Zelle',
    items: [
      { id: '4', name: 'Papas Fritas Gratinadas Tocineta', priceUSD: 4.00, qty: 2, category: 'Extras' }
    ],
    totalUSD: 8.00,
    totalVES: 8.00 * 848.55,
    customer: { id: '4', name: 'Inversiones Gourmet C.A.', docId: 'J-40987123-5', phone: '0212-9988776', address: 'Zona Industrial Galpón 4' },
    deliveryAddress: 'Zona Industrial Galpón 4',
    driverName: 'José Luis Rivas',
    driverId: '2',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timeFormatted: '45 min'
  }
];

// Tap digital háptico sutil y moderno (Cero latencia, 100% offline)
const playDigitalTapSound = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    // Tap suave de alta frecuencia con decaimiento ultra-corto (estilo háptico moderno / iOS digital tap)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.035);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  } catch {
    // Si el navegador bloquea audio por políticas, continúa silenciosamente
  }
};

export default function TabletMobilePosPage() {
  // Splash desactivado para carga instantánea 0ms
  const [showSplash] = useState(false);

  // ─── Hooks Anti-Frankenstein ─────────────────────────────────────────────

  // 1. Tasa BCV (extraído a /hooks/useBcvRate)
  const {
    bcvRate, setBcvRate, bcvMode, setBcvMode,
    isBcvEditing, setIsBcvEditing,
    customBcvInput, setCustomBcvInput,
    isFetchingBcv, bcvToast, setBcvToast,
    fetchBcvRateAuto, handleSaveManualBcv,
  } = useBcvRate();

  // 2. Navegación Principal
  const [activeTab, setActiveTab] = useState<'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Modos de Vista, Lienzo y Branding
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>('reels');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [activePalette, setActivePalette] = useState('amber');
  const [canvasTheme, setCanvasTheme] = useState<CanvasThemeId>('obsidian');
  const [stylePreset, setStylePreset] = useState<'street_pro' | 'gourmet_clean'>('street_pro');

  // 4. Drawers y Modales de Configuración
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showVisualPacksModal, setShowVisualPacksModal] = useState(false);
  const [showStreetAmbassadorModal, setShowStreetAmbassadorModal] = useState(false);
  const [menuQrUrl, setMenuQrUrl] = useState('');
  const [activeTable, setActiveTable] = useState<number | null>(null);

  // 4b. Docker Flotante Minimalista & Nuevos Módulos
  const [dockSide, setDockSide] = useState<'left' | 'right'>('left');
  const [isDockerOpen, setIsDockerOpen] = useState(false);
  const [activeRubro, setActiveRubro] = useState<RubroId>('comida');
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<string[]>(CATEGORIES);

  // Modales del Docker
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showRubroModal, setShowRubroModal] = useState(false);
  const [showSalesBackupModal, setShowSalesBackupModal] = useState(false);

  // Motorizados
  const [drivers, setDrivers] = useState<Motorizado[]>(DEFAULT_DRIVERS);
  const [newDriverForm, setNewDriverForm] = useState({ name: '', phone: '', vehicle: '' });

  // Impresora
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    connection: 'bluetooth',
    ip: '192.168.1.200',
    port: 9100,
    paperWidth: '80mm',
    autoCut: true
  });
  const [printerTestAlert, setPrinterTestAlert] = useState(false);

  // Gestión de Pedidos y Despachos (En Cola, Listos, Despachados)
  const [orders, setOrders] = useState<PosOrder[]>(DEFAULT_SAMPLE_ORDERS);
  const [orderFilterStatus, setOrderFilterStatus] = useState<'todos' | 'en_cola' | 'listo' | 'despachado'>('todos');
  const [orderFilterType, setOrderFilterType] = useState<'todos' | 'local' | 'delivery'>('todos');

  // Edición Completa de Producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Gestión de Productos Nuevos
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Hamburguesas',
    priceUSD: '',
    sku: '',
    tag: '⭐ Nuevo',
    image: ''
  });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // 5. Configuración de Empresa (Nombre, RIF, Teléfono, Dirección)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'KlikPOS Market & Gourmet',
    rif: 'J-50123456-7',
    phone: '0424-8298026',
    address: 'Av. Principal con Calle 4, Local Comercial #2',
    footerMsg: '¡Gracias por su preferencia! Vuelva pronto.'
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // 6. Configuración de Pago Móvil
  const [pagoMovilInfo, setPagoMovilInfo] = useState<PagoMovilInfo>({
    bank: '0134 - Banesco Banco Universal',
    phone: '04248298026',
    idDoc: 'V-20123456',
    ownerName: 'KlikPOS Inversiones C.A.'
  });
  const [showPagoMovilModal, setShowPagoMovilModal] = useState(false);

  // 7. Gestión de Clientes
  const [customers, setCustomers] = useState<Customer[]>(DEFAULT_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(DEFAULT_CUSTOMERS[0]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', docId: '', phone: '', address: '' });
  const [customerSearch, setCustomerSearch] = useState('');

  // 9. Mesas y Cuentas de Barra
  const [diningSpots, setDiningSpots] = useState([
    { id: 1, name: 'Mesa 1', type: 'mesa', status: 'libre', total: 0, items: 0, time: '' },
    { id: 2, name: 'Mesa 2', type: 'mesa', status: 'ocupada', total: 18.50, items: 3, time: '14 min' },
    { id: 3, name: 'Mesa 3', type: 'mesa', status: 'ocupada', total: 6.50, items: 1, time: '5 min' },
    { id: 4, name: 'Mesa 4', type: 'mesa', status: 'libre', total: 0, items: 0, time: '' },
    { id: 5, name: 'Barra 1', type: 'barra', status: 'ocupada', total: 4.00, items: 1, time: '20 min' },
    { id: 6, name: 'Barra 2', type: 'barra', status: 'libre', total: 0, items: 0, time: '' },
    { id: 7, name: 'Puesto Calle', type: 'barra', status: 'ocupada', total: 12.00, items: 2, time: '8 min' },
    { id: 8, name: 'Para Llevar #1', type: 'llevar', status: 'preparando', total: 15.00, items: 3, time: '3 min' },
  ]);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotType, setNewSpotType] = useState<'mesa' | 'barra' | 'llevar'>('mesa');

  // 10. Período de Prueba y Licencia Oficial
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // 11. Carrito (extraído a /hooks/useCart)
  const {
    cart, setCart,
    addToCart, updateQty, removeFromCart, clearCart, getCartQty,
    editingItemNotes, setEditingItemNotes, saveItemNotes,
  } = useCart([
    { id: '1', name: 'Hamburguesa Clásica Especial 200g', priceUSD: 6.50, qty: 2, category: 'Hamburguesas', notes: 'Sin cebolla, extra salsa de la casa', sku: 'HMB-01', image: SAMPLE_PRODUCTS[0].image },
    { id: '10', name: 'Refresco Personal Frío 355ml', priceUSD: 1.50, qty: 1, category: 'Bebidas', sku: 'BEB-01', image: SAMPLE_PRODUCTS[9].image }
  ]);

  // Cálculos financieros del carrito (funciones puras de /lib/pos/cart-calculations)
  const { totalUSD, totalVES, totalItems } = calcCartTotals(cart, bcvRate);


  // Carga inicial y sincronización con LocalStorage y Dexie DB

  useEffect(() => {
    try {
      // 1. Configuración de Empresa
      const savedCompany = localStorage.getItem('klikpos_company_info');
      if (savedCompany) {
        setCompanyInfo(JSON.parse(savedCompany));
      } else {
        db.settings.get('store_info').then((s) => {
          if (s && s.value) {
            setCompanyInfo({
              name: s.value.name || 'KlikPOS Market & Gourmet',
              rif: s.value.rif || 'J-50123456-7',
              phone: s.value.phone || '0424-8298026',
              address: s.value.address || 'Av. Principal con Calle 4, Local 2',
              footerMsg: s.value.footerMessage || '¡Gracias por su preferencia!'
            });
          }
        }).catch(() => {});
      }

      // 2. Configuración de Pago Móvil
      const savedPm = localStorage.getItem('klikpos_pago_movil');
      if (savedPm) {
        setPagoMovilInfo(JSON.parse(savedPm));
      }

      // 3. Clientes
      const savedClients = localStorage.getItem('klikpos_clients');
      if (savedClients) {
        const parsed = JSON.parse(savedClients);
        if (Array.isArray(parsed) && parsed.length > 0) setCustomers(parsed);
      } else {
        db.customers.toArray().then((arr) => {
          if (arr && arr.length > 0) {
            const mapped = arr.map(c => ({
              id: String(c.id || c.docId),
              name: c.name,
              docId: c.docId,
              phone: c.phone || '',
              address: c.address || ''
            }));
            setCustomers(mapped);
          }
        }).catch(() => {});
      }

      // 4. Modos y Temas
      const savedMode = localStorage.getItem('klikpos_card_view_mode') as any;
      if (savedMode === 'lista' || savedMode === 'grid' || savedMode === 'reels') {
        setCardViewMode(savedMode);
      } else if (savedMode === 'food') {
        setCardViewMode('reels');
      } else {
        setCardViewMode('reels');
      }
      const savedCanvas = localStorage.getItem('klikpos_canvas_theme');
      if (savedCanvas && CANVAS_THEMES.some(t => t.id === savedCanvas)) {
        setCanvasTheme(savedCanvas as CanvasThemeId);
      }

      const savedPalette = localStorage.getItem('venematic_branding_palette');
      if (savedPalette && BRAND_PALETTES.some(p => p.id === savedPalette)) {
        setActivePalette(savedPalette);
      }

      // 5. Carrito
      const savedCart = localStorage.getItem('klikpos_tablet_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) setCart(parsed);
      }

      // 6. Tasa BCV
      const savedBcvMode = localStorage.getItem('klikpos_bcv_mode') as 'auto' | 'manual';
      if (savedBcvMode) setBcvMode(savedBcvMode);
      const savedRate = localStorage.getItem('klikpos_bcv_rate');
      if (savedRate) {
        const val = parseFloat(savedRate);
        if (!isNaN(val) && val > 0) {
          setBcvRate(val);
          setCustomBcvInput(val.toFixed(2));
        }
      }
      if (savedBcvMode !== 'manual') fetchBcvRateAuto();

      // 7. Mesas
      const savedSpots = localStorage.getItem('klikpos_dining_spots');
      if (savedSpots) {
        const parsed = JSON.parse(savedSpots);
        if (Array.isArray(parsed) && parsed.length > 0) setDiningSpots(parsed);
      }

      // 8. Docker Flotante y Configuración
      const savedDockSide = localStorage.getItem('klikpos_dock_side') as 'left' | 'right';
      if (savedDockSide === 'left' || savedDockSide === 'right') setDockSide(savedDockSide);

      const savedRubro = localStorage.getItem('klikpos_active_rubro') as RubroId;
      if (savedRubro && RUBROS_CATALOG[savedRubro]) {
        setActiveRubro(savedRubro);
        setCategoriesList(RUBROS_CATALOG[savedRubro].categories);
      }

      const savedProducts = localStorage.getItem('klikpos_tablet_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
      }

      const savedDrivers = localStorage.getItem('klikpos_tablet_drivers');
      if (savedDrivers) {
        const parsed = JSON.parse(savedDrivers);
        if (Array.isArray(parsed) && parsed.length > 0) setDrivers(parsed);
      }

      const savedPrinter = localStorage.getItem('klikpos_printer_config');
      if (savedPrinter) {
        const parsed = JSON.parse(savedPrinter);
        if (parsed) setPrinterConfig(parsed);
      }

      // Resolver URL dinámica del Menú Digital para la red local / Wi-Fi
      fetch('/api/system/network-ip')
        .then(res => res.json())
        .then(data => {
          if (data.menuUrl) {
            setMenuQrUrl(data.menuUrl);
          } else if (data.serverUrl) {
            setMenuQrUrl(`${data.serverUrl}/menu`);
          } else if (typeof window !== 'undefined') {
            setMenuQrUrl(`${window.location.origin}/menu`);
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            setMenuQrUrl(`${window.location.origin}/menu`);
          }
        });

      // 9. Iniciar Auto-Sincronización Periódica en Segundo Plano (Cada 1 Hora)
      cloudSyncService.startAutoSync(3600);
    } catch {
      // Continuar silenciosamente
    }
  }, []);

  // Estado de Operación Permanente sin Bloqueo de Licencia
  useEffect(() => {
    try {
      registerTrialInstallation().catch(() => {});
    } catch {}

    const state = evaluateTrialState();
    setTrialState(state);
  }, []);

  const currentCanvas = CANVAS_THEMES.find(t => t.id === canvasTheme) || CANVAS_THEMES[0];
  const currentPal = BRAND_PALETTES.find(p => p.id === activePalette) || BRAND_PALETTES[0];
  const isLight = currentCanvas.isLight;
  const IS_LITE_MODE = true;

  // Sincronización Completa de Lienzo, Superficies y Branding en CSS Variables
  useEffect(() => {
    try {
      localStorage.setItem('klikpos_card_view_mode', cardViewMode);
      localStorage.setItem('klikpos_tablet_cart', JSON.stringify(cart));
      localStorage.setItem('klikpos_canvas_theme', canvasTheme);
      localStorage.setItem('venematic_theme', isLight ? 'light' : 'dark');
      localStorage.setItem('venematic_branding_palette', activePalette);

      const root = document.documentElement;
      root.setAttribute('data-canvas', canvasTheme);
      root.setAttribute('data-theme', isLight ? 'light' : 'dark');
      root.setAttribute('data-ui-style', isLight ? 'industrial' : 'street_pro');

      if (isLight) {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }

      // Inyección dinámica de tokens de acento y branding
      root.style.setProperty('--brand-primary', currentPal.primary);
      root.style.setProperty('--brand-hover', currentPal.hover);
      root.style.setProperty('--brand-accent', currentPal.accent);
      root.style.setProperty('--brand-glow', currentPal.glow);

      // Inyección dinámica de tokens de lienzo y superficies
      const effectiveBg = isLight ? '#ffffff' : (currentCanvas.bg || '#040711');
      root.style.setProperty('--pos-canvas-bg', effectiveBg);
      root.style.setProperty('--pos-surface-bg', isLight ? '#ffffff' : currentCanvas.surface);
      root.style.setProperty('--pos-surface-card', isLight ? '#ffffff' : currentCanvas.card);
      root.style.setProperty('--pos-border-subtle', isLight ? '#e2e8f0' : currentCanvas.border);
      root.style.setProperty('--header-bg', isLight ? '#ffffff' : '#090d16');
      root.style.setProperty('--header-text', isLight ? '#0f172a' : '#ffffff');
      root.style.setProperty('--industrial-bg', effectiveBg);
      root.style.setProperty('--industrial-card', isLight ? '#ffffff' : (currentCanvas.card || '#0f172a'));
      root.style.setProperty('--industrial-text', isLight ? '#0f172a' : '#ffffff');

      localStorage.setItem('klikpos_street_mode', 'true');
      localStorage.setItem('venematic_theme', isLight ? 'light' : 'dark');
      document.body.style.backgroundColor = effectiveBg;
      root.style.backgroundColor = effectiveBg;
    } catch {}
  }, [cardViewMode, cart, canvasTheme, activePalette, isLight, currentPal, currentCanvas]);

  // Cambio Dinámico Ultra Fluido (View Transitions API + Sincronización Inmediata sin Latencia)
  const applyThemeTokens = useCallback((targetThemeId: CanvasThemeId) => {
    const targetCanvas = CANVAS_THEMES.find(t => t.id === targetThemeId) || CANVAS_THEMES[0];
    const isTargetLight = targetCanvas.isLight;
    const effectiveBg = isTargetLight ? '#ffffff' : (targetCanvas.bg || '#040711');
    const root = document.documentElement;

    root.setAttribute('data-canvas', targetThemeId);
    root.setAttribute('data-theme', isTargetLight ? 'light' : 'dark');
    root.setAttribute('data-ui-style', isTargetLight ? 'industrial' : 'street_pro');

    if (isTargetLight) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    root.style.setProperty('--pos-canvas-bg', effectiveBg);
    root.style.setProperty('--pos-surface-bg', isTargetLight ? '#ffffff' : targetCanvas.surface);
    root.style.setProperty('--pos-surface-card', isTargetLight ? '#ffffff' : targetCanvas.card);
    root.style.setProperty('--pos-border-subtle', isTargetLight ? '#e2e8f0' : targetCanvas.border);
    root.style.setProperty('--header-bg', isTargetLight ? '#ffffff' : '#090d16');
    root.style.setProperty('--header-text', isTargetLight ? '#0f172a' : '#ffffff');
    root.style.setProperty('--industrial-bg', effectiveBg);
    root.style.setProperty('--industrial-card', isTargetLight ? '#ffffff' : (targetCanvas.card || '#0f172a'));
    root.style.setProperty('--industrial-text', isTargetLight ? '#0f172a' : '#ffffff');

    document.body.style.backgroundColor = effectiveBg;
    root.style.backgroundColor = effectiveBg;

    try {
      localStorage.setItem('klikpos_canvas_theme', targetThemeId);
      localStorage.setItem('venematic_theme', isTargetLight ? 'light' : 'dark');
      localStorage.setItem('klikpos_street_mode', 'true');
    } catch {}
  }, []);

  const handleToggleTheme = useCallback((targetThemeId?: CanvasThemeId) => {
    const nextThemeId: CanvasThemeId = targetThemeId || (isLight ? 'obsidian' : 'light-graphite');

    const updateThemeState = () => {
      applyThemeTokens(nextThemeId);
      setCanvasTheme(nextThemeId);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        updateThemeState();
      });
    } else {
      updateThemeState();
    }
  }, [isLight, applyThemeTokens]);

  // Blindaje Anti-Reinicio de Cámara: Persistir y recuperar estado de modal y borradores de inventario
  useEffect(() => {
    try {
      const activeModal = sessionStorage.getItem('klikpos_active_modal');
      if (activeModal === 'inventory') {
        setShowInventoryModal(true);
      }
      const draft = sessionStorage.getItem('klikpos_new_product_draft');
      if (draft) {
        setNewProductForm(JSON.parse(draft));
      }
      const editingDraft = sessionStorage.getItem('klikpos_editing_product_draft');
      if (editingDraft) {
        setEditingProduct(JSON.parse(editingDraft));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (showInventoryModal) {
        sessionStorage.setItem('klikpos_active_modal', 'inventory');
      } else {
        sessionStorage.removeItem('klikpos_active_modal');
      }
    } catch {}
  }, [showInventoryModal]);

  useEffect(() => {
    try {
      if (newProductForm.name || newProductForm.priceUSD || newProductForm.image) {
        sessionStorage.setItem('klikpos_new_product_draft', JSON.stringify(newProductForm));
      }
    } catch {}
  }, [newProductForm]);

  useEffect(() => {
    try {
      if (editingProduct) {
        sessionStorage.setItem('klikpos_editing_product_draft', JSON.stringify(editingProduct));
      } else {
        sessionStorage.removeItem('klikpos_editing_product_draft');
      }
    } catch {}
  }, [editingProduct]);

  // 8. Cobro (extraído a /hooks/useCheckout)
  const {
    selectedPaymentMethod, setSelectedPaymentMethod,
    pagoMovilRefInput, setPagoMovilRefInput,
    cashUSDReceived, setCashUSDReceived,
    cashVESReceived, setCashVESReceived,
    cardVoucherRef, setCardVoucherRef,
    zelleConfirmation, setZelleConfirmation,
    copiedPmAlert,
    fulfillmentMode, setFulfillmentMode,
    selectedDriverId, setSelectedDriverId,
    deliveryAddressInput, setDeliveryAddressInput,
    mixedPayments, mixedInputMethod, setMixedInputMethod,
    mixedInputCurrency, setMixedInputCurrency,
    mixedInputAmount, setMixedInputAmount,
    mixedInputRef, setMixedInputRef,
    handleAddMixedPayment, handleRemoveMixedPayment,
    vueltoUSD, vueltoVESfromUSD, vueltoVESfromVES,
    mixedPaidUSD, mixedPaidVES, mixedPendingUSD, mixedPendingVES,
    mixedChangeUSD, mixedChangeVES, isMixedComplete,
    isPaymentComplete, missingAmountUSD, missingAmountVES,
    completedSaleTicket, setCompletedSaleTicket,
    handleFinalizeSale, handleCopyPagoMovilData,
  } = useCheckout({
    cart, clearCart,
    totalUSD, totalVES, bcvRate,
    selectedCustomer, activeTable,
    drivers, orders, setOrders,
    companyInfo,
  });

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const leftProducts = filteredProducts.filter((_, idx) => idx % 2 === 0);
  const rightProducts = filteredProducts.filter((_, idx) => idx % 2 !== 0);



  // Alternar Lado del Docker Flotante (Izquierda / Derecha)
  const handleToggleDockSide = () => {
    const nextSide = dockSide === 'left' ? 'right' : 'left';
    setDockSide(nextSide);
    try { localStorage.setItem('klikpos_dock_side', nextSide); } catch {}
  };

  // Selector de Rubro Comercial
  const handleSelectRubro = (rubroId: RubroId) => {
    setActiveRubro(rubroId);
    const rubroData = RUBROS_CATALOG[rubroId];
    if (rubroData) {
      setCategoriesList(rubroData.categories);
      setSelectedCategory('Todos');
      setProducts(rubroData.sampleProducts);
      try {
        localStorage.setItem('klikpos_active_rubro', rubroId);
        localStorage.setItem('klikpos_tablet_products', JSON.stringify(rubroData.sampleProducts));
      } catch {}
    }
    setShowRubroModal(false);
  };

  // Gestión de Productos e Inventario
  const handleAddProduct = (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const priceNum = parseFloat(newProductForm.priceUSD);
    if (isNaN(priceNum) || priceNum <= 0) return;
    const newProd: Product = {
      id: 'prod_' + Date.now(),
      name: newProductForm.name.trim(),
      category: newProductForm.category.trim() || 'General',
      priceUSD: priceNum,
      sku: newProductForm.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      tag: newProductForm.tag.trim() || '⭐ Nuevo',
      prepTime: 'Inmediato',
      image: newProductForm.image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      description: `${newProductForm.name} - Calidad garantizada.`
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    try {
      localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated));
      sessionStorage.removeItem('klikpos_new_product_draft');
    } catch {}
    setNewProductForm({ name: '', category: categoriesList[1] || 'General', priceUSD: '', sku: '', tag: '⭐ Nuevo', image: '' });
  };

  const handleDeleteProduct = (id: string) => {
    if (!window.confirm('¿Eliminar este producto del catálogo?')) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    try { localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated)); } catch {}
  };

  const handleSavePriceEdit = (id: string) => {
    const val = parseFloat(editingPriceValue.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      const updated = products.map(p => p.id === id ? { ...p, priceUSD: val } : p);
      setProducts(updated);
      try { localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated)); } catch {}
    }
    setEditingPriceId(null);
  };

  // Guardar Edición Completa de Producto (Foto, Nombre, Categoría, SKU, Descripción)
  const handleSaveFullProductEdit = (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated));
      sessionStorage.removeItem('klikpos_editing_product_draft');
      db.products.put({
        id: Number(editingProduct.id) || undefined,
        name: editingProduct.name,
        category: editingProduct.category,
        priceUSD: editingProduct.priceUSD,
        barcode: editingProduct.sku,
        image: editingProduct.image,
        isActive: true,
        updatedAt: new Date().toISOString()
      } as any).catch(() => {});
    } catch {}
    setEditingProduct(null);
  };

  // Gestión de Motorizados y Despachos
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.name || !newDriverForm.phone) return;
    const newDriver: Motorizado = {
      id: 'drv_' + Date.now(),
      name: newDriverForm.name.trim(),
      phone: newDriverForm.phone.trim(),
      vehicle: newDriverForm.vehicle.trim() || 'Moto Particular',
      status: 'disponible'
    };
    const updated = [...drivers, newDriver];
    setDrivers(updated);
    try { localStorage.setItem('klikpos_tablet_drivers', JSON.stringify(updated)); } catch {}
    setNewDriverForm({ name: '', phone: '', vehicle: '' });
  };

  const handleDeleteDriver = (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    setDrivers(updated);
    try { localStorage.setItem('klikpos_tablet_drivers', JSON.stringify(updated)); } catch {}
  };

  const handleToggleDriverStatus = (id: string) => {
    const updated = drivers.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'disponible' ? 'en_ruta' : d.status === 'en_ruta' ? 'inactivo' : 'disponible';
        return { ...d, status: nextStatus as any };
      }
      return d;
    });
    setDrivers(updated);
    try { localStorage.setItem('klikpos_tablet_drivers', JSON.stringify(updated)); } catch {}
  };

  const handleDispatchOrderWhatsApp = (driverPhone: string, driverName: string) => {
    const cleanPhone = driverPhone.replace(/[^0-9]/g, '');
    let fullPhone = cleanPhone;
    if (fullPhone.startsWith('04')) fullPhone = '58' + fullPhone.slice(1);
    else if (fullPhone.length === 10 && fullPhone.startsWith('4')) fullPhone = '58' + fullPhone;

    const itemsSummary = cart.map(i => `• ${i.qty}x ${i.name} ($${(i.priceUSD * i.qty).toFixed(2)})${i.notes ? ` [Nota: ${i.notes}]` : ''}`).join('\n');
    const msg = `🛵 *DESPACHO DE ORDEN - ${companyInfo.name}*\n\n` +
      `¡Hola ${driverName}! Tienes un nuevo pedido asignado:\n\n` +
      `👤 *Cliente:* ${selectedCustomer.name}\n` +
      `📞 *Teléfono Cliente:* ${selectedCustomer.phone || 'No especificado'}\n` +
      `📍 *Dirección de Entrega:*\n${deliveryAddressInput || selectedCustomer.address || 'Entrega a Domicilio'}\n\n` +
      `📦 *Detalle del Pedido:*\n${itemsSummary || '• 1x Orden estándar'}\n\n` +
      `💰 *TOTAL A COBRAR EN DESTINO:*\n` +
      `💵 *$${totalUSD.toFixed(2)} USD* (o *Bs. ${totalVES.toFixed(2)}* a tasa BCV ${bcvRate.toFixed(2)})\n\n` +
      `Por favor confirmar recepción de esta orden. ¡Buen viaje! 🚀`;

    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Gestión de Estados de Pedidos
  const handleAdvanceOrderStatus = (orderId: string, nextStatus: 'en_cola' | 'listo' | 'despachado') => {
    playDigitalTapSound();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
    setOrders(updated);
    try { localStorage.setItem('klikpos_tablet_orders', JSON.stringify(updated)); } catch {}
  };

  const handleMarkOrderPaid = (orderId: string) => {
    playDigitalTapSound();
    const updated = orders.map(o => o.id === orderId ? { ...o, paymentStatus: 'pagado' as const } : o);
    setOrders(updated);
    try { localStorage.setItem('klikpos_tablet_orders', JSON.stringify(updated)); } catch {}
  };

  // Configuración de Impresora
  const handleSavePrinterConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('klikpos_printer_config', JSON.stringify(printerConfig));
    } catch {}
    setShowPrinterModal(false);
  };

  const handleTestPrint = () => {
    setPrinterTestAlert(true);
    setTimeout(() => setPrinterTestAlert(false), 3000);
  };

  // Guardar Empresa
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('klikpos_company_info', JSON.stringify(companyInfo));
      db.settings.put({
        key: 'store_info',
        value: {
          name: companyInfo.name,
          rif: companyInfo.rif,
          phone: companyInfo.phone,
          address: companyInfo.address,
          footerMessage: companyInfo.footerMsg
        }
      }).catch(() => {});
    } catch {}
    setShowCompanyModal(false);
  };

  // Guardar Pago Móvil
  const handleSavePagoMovil = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('klikpos_pago_movil', JSON.stringify(pagoMovilInfo));
    } catch {}
    setShowPagoMovilModal(false);
  };



  // Guardar Nuevo Cliente
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.docId.trim()) return;
    const newCust: Customer = {
      id: String(Date.now()),
      name: newCustomerForm.name.trim(),
      docId: newCustomerForm.docId.trim(),
      phone: newCustomerForm.phone.trim(),
      address: newCustomerForm.address.trim()
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    setSelectedCustomer(newCust);
    try {
      localStorage.setItem('klikpos_clients', JSON.stringify(updated));
      db.customers.add({
        name: newCust.name,
        docId: newCust.docId,
        phone: newCust.phone,
        address: newCust.address,
        currentCreditUSD: 0,
        createdAt: new Date().toISOString()
      }).catch(() => {});
    } catch {}
    setNewCustomerForm({ name: '', docId: '', phone: '', address: '' });
    setShowCustomerModal(false);
  };

  // Crear Mesa / Barra Dinámica
  const handleAddNewSpot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;
    const newId = Date.now();
    const newSpot = {
      id: newId,
      name: newSpotName.trim(),
      type: newSpotType,
      status: 'libre' as const,
      total: 0,
      items: 0,
      time: ''
    };
    const updated = [...diningSpots, newSpot];
    setDiningSpots(updated);
    try {
      localStorage.setItem('klikpos_dining_spots', JSON.stringify(updated));
    } catch {}
    setNewSpotName('');
    setShowAddSpotModal(false);
  };

  return (
    <div
      id="klikpos-street-root"
      className={`w-full w-screen max-w-none min-h-screen min-h-dvh h-screen flex flex-col font-sans select-none overflow-hidden relative m-0 p-0 transition-colors duration-200 ${
        isLight ? 'text-slate-900 bg-white light-mode' : 'text-slate-100 bg-[#040711] street-pos-dark-canvas dark-mode'
      }`}
      style={{
        backgroundColor: isLight ? '#ffffff' : (currentCanvas.bg || '#040711'),
        '--brand-color': currentPal.primary,
        '--brand-hover': currentPal.hover,
        '--brand-accent': currentPal.accent,
        '--brand-glow': currentPal.glow,
        '--pos-canvas-bg': isLight ? '#ffffff' : currentCanvas.bg,
        '--pos-surface-bg': isLight ? '#ffffff' : currentCanvas.surface,
        '--pos-surface-card': isLight ? '#ffffff' : currentCanvas.card,
        '--pos-border-subtle': isLight ? '#e2e8f0' : currentCanvas.border,
      } as React.CSSProperties}
    >
      <style jsx global>{`
        @keyframes cobrarBreathe {
          0%, 100% {
            box-shadow: 0 0 16px var(--brand-glow), 0 0 35px rgba(0,0,0,0.12);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 28px var(--brand-glow), 0 0 50px rgba(0,0,0,0.22);
            transform: scale(1.03);
          }
        }
        @keyframes badgeSpring {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
        @keyframes drawerSlideInLeft {
          from { transform: translateX(-100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes drawerSlideInRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        .anim-breathe {
          animation: cobrarBreathe 3s ease-in-out infinite;
        }
        .anim-badge-spring {
          animation: badgeSpring 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .anim-drawer-left {
          animation: drawerSlideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-drawer-right {
          animation: drawerSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Ocultar barras de desplazamiento visibles en toda la app manteniendo scroll fluido */
        ::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
          background: transparent !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* 0. Pantalla de Bienvenida / Splash Screen Animada Oficial */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070a12] text-white select-none animate-out fade-out duration-300">
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20 animate-pulse">
              <LayoutGrid className="w-10 h-10 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Klik<span className="text-amber-400">POS</span> <span className="text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">Street v01</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase">
                Sistema POS Autónomo Comercial
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-mono text-slate-400">Iniciando módulos y catálogo...</span>
            </div>
          </div>
        </div>
      )}

      {/* Docker Flotante Abierto: EXCLUSIVAMENTE Pill Vertical con Íconos Directos */}
      {isDockerOpen && (
        <>
          {/* Backdrop sutil e interactivo para cerrar al tocar fuera */}
          <div
            onClick={() => setIsDockerOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
            title="Cerrar Docker"
          />
          <div
            className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
              dockSide === 'left' ? 'left-2.5' : 'right-2.5'
            }`}
          >
            {/* Cápsula Vertical Adaptativa (Obsidian Dark Blue o Blanco Cristal Translúcido con Contraste AAA) */}
            <aside
              className="street-floating-docker w-14 rounded-[32px] py-4 px-1.5 flex flex-col items-center justify-between shadow-2xl border select-none shrink-0 min-h-[380px] z-50 backdrop-blur-xl transition-all"
              style={{
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.94)' : '#090d16',
                borderColor: isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: isLight
                  ? '0 20px 45px -10px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(15, 23, 42, 0.08)'
                  : '0 25px 60px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Íconos Centrales de Acceso Directo con Contraste AAA y Micro-Fondos */}
              <div className="flex flex-col items-center gap-2.5 my-auto">
                {/* 1. Inventario & Stock */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowInventoryModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
                      : 'text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40'
                  }`}
                  title="Gestión de Inventario & Stock"
                >
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* 1b. Paquetes Visuales & Catálogos Cloud con Fotos HD */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowVisualPacksModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-cyan-800 bg-cyan-100 border border-cyan-300 hover:bg-cyan-200'
                      : 'text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 hover:bg-cyan-500/40'
                  }`}
                  title="Librería Cloud de Paquetes Visuales & Fotos HD"
                >
                  <ImageIcon className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* 2. Motorizados / Despacho (Opcional en Lite) */}
                {!IS_LITE_MODE && (
                  <button
                    onClick={() => {
                      setIsDockerOpen(false);
                      setShowDriversModal(true);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                      isLight
                        ? 'text-amber-800 bg-amber-100 border border-amber-300 hover:bg-amber-200'
                        : 'text-amber-300 bg-amber-500/25 border border-amber-400/40 hover:bg-amber-500/40'
                    }`}
                    title="Motorizados & Despacho Delivery"
                  >
                    <Truck className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* 3. Impresora Térmica POS */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowPrinterModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-sky-800 bg-sky-100 border border-sky-300 hover:bg-sky-200'
                      : 'text-sky-300 bg-sky-500/25 border border-sky-400/40 hover:bg-sky-500/40'
                  }`}
                  title="Configuración de Impresora POS"
                >
                  <Printer className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* 4. Cambiar Rubro Comercial */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowRubroModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-purple-800 bg-purple-100 border border-purple-300 hover:bg-purple-200'
                      : 'text-purple-300 bg-purple-500/25 border border-purple-400/40 hover:bg-purple-500/40'
                  }`}
                  title="Cambiar Rubro Comercial (Comida, Farmacia, Bodega, etc.)"
                >
                  <Boxes className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* 5. Menú QR Dinámico para Clientes (Opcional en Lite) */}
                {!IS_LITE_MODE && (
                  <button
                    onClick={() => {
                      setIsDockerOpen(false);
                      setShowQrModal(true);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                      isLight
                        ? 'text-indigo-800 bg-indigo-100 border border-indigo-300 hover:bg-indigo-200'
                        : 'text-indigo-300 bg-indigo-500/25 border border-indigo-400/40 hover:bg-indigo-500/40'
                    }`}
                    title="Generar Menú QR Digital para Clientes"
                  >
                    <QrCode className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* 6. Módulo de Ventas & Respaldo */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowSalesBackupModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
                      : 'text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40'
                  }`}
                  title="Módulo de Ventas & Respaldo (Diario, Semanal, Mensual)"
                >
                  <TrendingUp className="w-5 h-5 stroke-[2.4]" />
                </button>

                {/* 7. Sincronizar Data */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowSyncModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-cyan-800 bg-cyan-100 border border-cyan-300 hover:bg-cyan-200'
                      : 'text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 hover:bg-cyan-500/40'
                  }`}
                  title="Sincronizar Data (Tasa BCV, Ventas & Catálogo Cloud)"
                >
                  <RefreshCw className="w-5 h-5 stroke-[2.4]" />
                </button>

                {/* 8. Actualizar Software */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setShowUpdateModal(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-amber-800 bg-amber-100 border border-amber-300 hover:bg-amber-200'
                      : 'text-yellow-300 bg-yellow-500/25 border border-yellow-400/40 hover:bg-yellow-500/40'
                  }`}
                  title="Actualizar Software (GitHub Release & APK)"
                >
                  <Sparkles className="w-5 h-5 stroke-[2.4]" />
                </button>

                {/* 9. Ajustes & Configuración */}
                <button
                  onClick={() => {
                    setIsDockerOpen(false);
                    setIsLeftDrawerOpen(true);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer group hover:scale-110 active:scale-95 ${
                    isLight
                      ? 'text-slate-800 bg-slate-100 border border-slate-300 hover:bg-slate-200'
                      : 'text-slate-100 bg-slate-800/90 border border-slate-600/70 hover:bg-slate-700'
                  }`}
                  title="Ajustes de Empresa & RIF"
                >
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>

              {/* Bottom: Alternar Lado (Izq/Der) y Colapsar */}
              <div className={`flex flex-col items-center gap-2 pt-2 border-t shrink-0 w-full ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <button
                  onClick={handleToggleDockSide}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                    isLight
                      ? 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
                      : 'text-slate-300 hover:text-amber-300 hover:bg-white/10'
                  }`}
                  title={dockSide === 'left' ? 'Mover Docker a la Derecha' : 'Mover Docker a la Izquierda'}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDockerOpen(false)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                    isLight
                      ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/20'
                  }`}
                  title="Minimizar Docker"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER SUPERIOR CON TASA BCV INTERACTIVA Y CONTRASTE WCAG AAA          */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. HEADER SUPERIOR ELEGANTE Y PERFECTAMENTE ORGANIZADO                     */}
      {/* ========================================================================= */}
      <header
        id="klikpos-street-header"
        className={`w-full h-[68px] px-4 sm:px-6 md:px-8 flex items-center border-b shrink-0 z-20 shadow-xs transition-colors duration-200 ${
          isLight ? 'border-slate-200 text-slate-900 bg-white' : 'border-slate-800/90 text-white bg-[#090d16]'
        }`}
        style={{
          backgroundColor: isLight ? '#ffffff' : '#090d16',
          borderColor: isLight ? '#e2e8f0' : currentCanvas.border,
          color: isLight ? '#0f172a' : '#ffffff'
        }}
      >
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        {/* LADO IZQUIERDO: Logo KlikPOS Street + Acciones Principales */}
        <div className="flex items-center gap-2">
          {/* Logo KlikPOS Street Vector & Clean Branding */}
          <div 
            onClick={() => setIsLeftDrawerOpen(true)}
            className="flex flex-col leading-none select-none cursor-pointer group pr-0.5"
            title="KlikPOS Street"
          >
            <div className="flex items-baseline tracking-tight font-black text-lg">
              <span className="klikpos-brand-klik" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Klik</span>
              <span style={{ color: currentPal.primary || '#f59e0b' }} className="transition-colors font-black">POS</span>
            </div>
            <span className="text-[9.5px] font-extrabold text-amber-400 tracking-wider text-right -mt-0.5">
              Street
            </span>
          </div>
        </div>

        {/* CENTRO: Pills Compactas y Espaciadas (BCV Optimizada + Sincronización + Tema) */}
        <div className="flex items-center gap-2 sm:gap-2.5 mx-auto">
          {isBcvEditing ? (
            <div 
              className="flex items-center gap-1 border px-2 py-0.5 rounded-full shadow-xs"
              style={{
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#cbd5e1' : '#334155'
              }}
            >
              <span className="text-[10px] font-mono font-bold text-slate-400">Bs.</span>
              <input
                type="number"
                step="0.01"
                value={customBcvInput}
                onChange={(e) => setCustomBcvInput(e.target.value)}
                className="w-14 text-xs font-mono font-black outline-none bg-transparent"
                style={{ color: isLight ? '#0f172a' : '#ffffff' }}
              />
              <button
                onClick={handleSaveManualBcv}
                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[9px] font-black cursor-pointer"
              >
                ✓
              </button>
              <button
                onClick={() => setIsBcvEditing(false)}
                className="px-1 py-0.5 text-slate-400 hover:text-slate-600 text-[9px] cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsBcvEditing(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-mono font-bold shadow-xs whitespace-nowrap cursor-pointer select-none active:scale-95"
              style={{
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#cbd5e1' : '#1e293b',
                color: isLight ? '#0f172a' : '#ffffff'
              }}
              title="Toca para editar tasa BCV manualmente"
            >
              <span className="text-[9.5px] font-black tracking-wider" style={{ color: isLight ? '#0284c7' : '#ffffff' }}>
                BCV:
              </span>
              <span className="font-black text-[11px]" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Bs. {bcvRate.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchBcvRateAuto(true);
                }}
                disabled={isFetchingBcv}
                className="p-0.5 hover:text-sky-300 transition-colors cursor-pointer"
                style={{ color: isLight ? '#64748b' : '#ffffff' }}
                title="Actualizar tasa oficial BCV"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isFetchingBcv ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          )}

          {/* Botón: Sincronizar Data (Visible en pantallas medianas/grandes para dar espacio al carrito en móvil) */}
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 dark:text-sky-400 font-black text-[10.5px] transition-all active:scale-95 shadow-xs cursor-pointer select-none shrink-0"
            title="Sincronizar Data (Tasa BCV, Ventas & Catálogo Cloud)"
          >
            <RefreshCw className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            <span>Sync</span>
          </button>

          {/* Botón Rápido de Cambio de Tema: Ultra Rápido y Fluido */}
          <button
            type="button"
            onClick={() => handleToggleTheme()}
            className="w-7 h-7 rounded-full border transition-all active:scale-90 cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: isLight ? '#ffffff' : '#0f172a',
              borderColor: isLight ? '#cbd5e1' : '#334155',
              color: isLight ? '#0f172a' : '#f59e0b'
            }}
            title={isLight ? 'Cambiar a modo Obsidian Nocturno' : 'Cambiar a modo Blanco Grafito'}
            aria-label="Alternar Tema Diurno/Nocturno"
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>

        {/* LADO DERECHO: Carrito / Comanda Activa (100% Protegido sin Cortes) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {trialState?.isTrial && (
            <button
              type="button"
              onClick={() => setShowStreetAmbassadorModal(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
              title="Prueba Comercial de 30 Minutos Activa. Toca para ver los 3 planes de activación comercial ($15 / $25 / $50)."
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Prueba: {trialState.formattedRemaining}</span>
            </button>
          )}

          <button
            onClick={() => setIsRightDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all duration-200 relative active:scale-95 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
            style={{ 
              backgroundColor: currentPal.primary,
              color: '#ffffff'
            }}
            title="Ver Comanda Activa"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="font-mono text-xs font-black shrink-0 text-white">${totalUSD.toFixed(2)}</span>
            {totalItems > 0 && (
              <span className="bg-slate-950 text-white border border-white/20 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full shadow-xs anim-badge-spring shrink-0">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        </div>
      </header>

      {/* Notificación Flotante de Tasa BCV Oficial */}
      {bcvToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 rounded-2xl bg-[#0b132b]/95 border border-sky-500/40 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{bcvToast.message}</span>
            <button
              onClick={() => setBcvToast(null)}
              className="ml-2 text-slate-400 hover:text-white p-0.5 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIENZO PRINCIPAL CON SCROLL 100% FLUIDO Y DESBLOQUEADO                 */}
      {/* ========================================================================= */}
      <main
        id="klikpos-street-main"
        className={`flex-1 min-h-0 overflow-hidden flex flex-col px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 w-full transition-colors duration-200 ${
          isLight ? 'bg-white' : 'bg-[#040711]'
        }`}
        style={{ backgroundColor: isLight ? '#ffffff' : (currentCanvas.bg || '#040711') }}
      >
        <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col">
        {/* ======================================================================= */}
        {/* VISTA 1: MENÚ Y CATÁLOGO TÁCTIL (GRID ADAPTATIVO TABLET & MODO LISTA)   */}
        {/* ======================================================================= */}
        {activeTab === 'menu' && (
          <div
            className={`flex-1 min-h-0 flex flex-col space-y-2 transition-colors duration-200 ${
              isLight ? 'bg-white' : 'bg-[#040711]'
            }`}
            style={{ backgroundColor: isLight ? '#ffffff' : (currentCanvas.bg || '#040711') }}
          >
            {/* 1. Barra de Búsqueda + Selector de Vista (3 Modos: Tragamonedas, Cuadrícula, Lista) */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Buscador amplio y cercano a los selectores de vista */}
                <div className="relative flex-1 min-w-0">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border transition-colors outline-none font-semibold ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-2xs'
                        : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Selector de 3 Modos: 🎰 Tragamonedas (2 cols independientes), 🔲 Cuadrícula, 📋 Lista */}
                <div className={`flex items-center gap-1.5 p-1 rounded-xl border shrink-0 ${isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
                  <button
                    onClick={() => setCardViewMode('reels')}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                      cardViewMode === 'reels' || cardViewMode === 'food'
                        ? 'shadow-xs'
                        : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    style={cardViewMode === 'reels' || cardViewMode === 'food' ? { backgroundColor: currentPal.primary, color: '#ffffff' } : {}}
                    title="Modo Tragamonedas: 2 Columnas con Desplazamiento Independiente"
                    aria-label="Modo Tragamonedas"
                  >
                    <span className="text-sm leading-none">🎰</span>
                  </button>
                  <button
                    onClick={() => setCardViewMode('grid')}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                      cardViewMode === 'grid'
                        ? 'shadow-xs'
                        : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    style={cardViewMode === 'grid' ? { backgroundColor: currentPal.primary, color: '#ffffff' } : {}}
                    title="Vista Cuadrícula Adaptativa Tablet"
                    aria-label="Vista Cuadrícula"
                  >
                    <LayoutGrid className="w-4 h-4 text-inherit" />
                  </button>
                  <button
                    onClick={() => setCardViewMode('lista')}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                      cardViewMode === 'lista'
                        ? 'shadow-xs'
                        : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    style={cardViewMode === 'lista' ? { backgroundColor: currentPal.primary, color: '#ffffff' } : {}}
                    title="Vista Lista Ergonómica"
                    aria-label="Vista Lista"
                  >
                    <List className="w-4 h-4 text-inherit" />
                  </button>
                </div>
              </div>

              {/* Píldoras de Categorías (Blindadas contra sobreescrituras con Contraste AAA) */}
              <div 
                className="street-categories-bar flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
                style={{ backgroundColor: 'transparent' }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border active:scale-95 cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-transparent font-black shadow-sm'
                          : isLight
                          ? 'hover:bg-slate-100 border-slate-300'
                          : 'hover:bg-slate-800 border-slate-800'
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? currentPal.primary
                          : (isLight ? '#ffffff' : '#0f172a'),
                        borderColor: isSelected
                          ? currentPal.primary
                          : (isLight ? '#cbd5e1' : '#1e293b'),
                        color: isSelected
                          ? '#ffffff'
                          : (isLight ? '#0f172a' : '#ffffff'),
                        fontWeight: isSelected ? 900 : 700
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================================================================= */}
            {/* MODO 1: 🎰 TRAGAMONEDAS (2 COLUMNAS CON SCROLL 100% INDEPENDIENTE)*/}
            {/* ================================================================= */}
            {(cardViewMode === 'reels' || cardViewMode === 'food') && (
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
                {/* REEL IZQUIERDO */}
                <div 
                  className="flex flex-col h-full min-h-0 overflow-hidden border rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : '#090d16',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b'
                  }}
                >
                  <div 
                    className="px-2.5 py-1.5 border-b flex items-center justify-between shrink-0"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      borderColor: isLight ? '#e2e8f0' : '#1e293b',
                      color: isLight ? '#0f172a' : '#fbbf24'
                    }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: isLight ? '#0f172a' : '#fbbf24' }}>
                      🍟 Columna 1
                    </span>
                    <span className="text-[9px] font-mono font-bold" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>
                      {leftProducts.length} ítems
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1.5 space-y-2 pb-24 scrollbar-none no-scrollbar">
                    {leftProducts.map((prod) => {
                      const qtyInCart = getCartQty(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => addToCart(prod)}
                          className="group border rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.96] select-none shadow-sm"
                          style={{
                            backgroundColor: isLight ? '#ffffff' : '#0e1726',
                            borderColor: isLight ? '#e2e8f0' : '#1e293b'
                          }}
                        >
                          <div 
                            className="relative h-22 sm:h-26 w-full flex items-center justify-center p-2 overflow-hidden"
                            style={{ backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)' }}
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                            <span 
                              className="absolute top-1.5 left-1.5 text-[8.5px] font-black px-2 py-0.5 rounded-full shadow-xs border"
                              style={{
                                backgroundColor: isLight ? '#fef3c7' : 'rgba(2, 6, 23, 0.9)',
                                color: isLight ? '#92400e' : '#fcd34d',
                                borderColor: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              {prod.tag}
                            </span>
                            {qtyInCart > 0 && (
                              <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                                {qtyInCart}
                              </span>
                            )}
                          </div>

                          <div className="p-2 flex-1 flex flex-col justify-between space-y-1">
                            <div>
                              <h3 className={`text-[11.5px] font-black line-clamp-1 leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {prod.name}
                              </h3>
                              <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                                {prod.description}
                              </p>
                            </div>

                            <div className={`flex items-center justify-between pt-1 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                              <div>
                                <span className="text-xs font-black font-mono block text-amber-500">
                                  ${prod.priceUSD.toFixed(2)}
                                </span>
                                <span className="text-[8.5px] font-mono text-slate-400 font-bold block">
                                  Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(prod);
                                }}
                                className="w-6.5 h-6.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex items-center justify-center transition-all shadow-xs font-black cursor-pointer"
                                title="Añadir a la comanda"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* REEL DERECHO */}
                <div 
                  className="flex flex-col h-full min-h-0 overflow-hidden border rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: isLight ? '#f8fafc' : '#090d16',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b'
                  }}
                >
                  <div 
                    className="px-2.5 py-1.5 border-b flex items-center justify-between shrink-0"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      borderColor: isLight ? '#e2e8f0' : '#1e293b',
                      color: isLight ? '#0f172a' : '#fbbf24'
                    }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: isLight ? '#0f172a' : '#fbbf24' }}>
                      🥤 Columna 2
                    </span>
                    <span className="text-[9px] font-mono font-bold" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>
                      {rightProducts.length} ítems
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1.5 space-y-2 pb-24 scrollbar-none no-scrollbar">
                    {rightProducts.map((prod) => {
                      const qtyInCart = getCartQty(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => addToCart(prod)}
                          className="group border rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.96] select-none shadow-sm"
                          style={{
                            backgroundColor: isLight ? '#ffffff' : '#0e1726',
                            borderColor: isLight ? '#e2e8f0' : '#1e293b'
                          }}
                        >
                          <div 
                            className="relative h-22 sm:h-26 w-full flex items-center justify-center p-2 overflow-hidden"
                            style={{ backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)' }}
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                            <span 
                              className="absolute top-1.5 left-1.5 text-[8.5px] font-black px-2 py-0.5 rounded-full shadow-xs border"
                              style={{
                                backgroundColor: isLight ? '#fef3c7' : 'rgba(2, 6, 23, 0.9)',
                                color: isLight ? '#92400e' : '#fcd34d',
                                borderColor: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              {prod.tag}
                            </span>
                            {qtyInCart > 0 && (
                              <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                                {qtyInCart}
                              </span>
                            )}
                          </div>

                          <div className="p-2 flex-1 flex flex-col justify-between space-y-1">
                            <div>
                              <h3 className={`text-[11.5px] font-black line-clamp-1 leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {prod.name}
                              </h3>
                              <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                                {prod.description}
                              </p>
                            </div>

                            <div className={`flex items-center justify-between pt-1 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                              <div>
                                <span className="text-xs font-black font-mono block text-amber-500">
                                  ${prod.priceUSD.toFixed(2)}
                                </span>
                                <span className="text-[8.5px] font-mono text-slate-400 font-bold block">
                                  Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(prod);
                                }}
                                className="w-6.5 h-6.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex items-center justify-center transition-all shadow-xs font-black cursor-pointer"
                                title="Añadir a la comanda"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MODO 2: 🔲 CUADRÍCULA ADAPTATIVA (2 COLS MÓVIL, 3-5 COLS EN TABLET)*/}
            {/* ================================================================= */}
            {cardViewMode === 'grid' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area transition-colors duration-200" style={{ backgroundColor: currentCanvas.bg }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                  {filteredProducts.map((prod) => {
                    const qtyInCart = getCartQty(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className={`group border rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.96] active:brightness-110 active:border-amber-400 select-none shadow-md ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0e1726] border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        <div className={`relative h-24 sm:h-28 w-full flex items-center justify-center p-2 overflow-hidden ${isLight ? 'bg-slate-50' : 'bg-slate-900/80'}`}>
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-slate-950/90 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-xs">
                            {prod.tag}
                          </span>
                          {qtyInCart > 0 && (
                            <span className="absolute top-1.5 right-1.5 text-slate-950 font-black font-mono text-[10.5px] w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                              {qtyInCart}
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                          <div>
                            <h3 className={`text-[12px] font-black line-clamp-1 leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {prod.name}
                            </h3>
                            <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                              {prod.description}
                            </p>
                          </div>

                          <div className={`flex items-center justify-between pt-1 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                            <div>
                              <span className="text-xs font-black font-mono block text-amber-400">
                                ${prod.priceUSD.toFixed(2)}
                              </span>
                              <span className="text-[8.5px] font-mono text-slate-400 font-bold block">
                                Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(prod);
                              }}
                              className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 active:bg-amber-300 text-slate-950 flex items-center justify-center transition-all shadow-sm font-black cursor-pointer"
                              title="Añadir a la comanda"
                            >
                              <Plus className="w-4 h-4 stroke-[2.8]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MODO 3: 📋 LISTA CON CARDS GRANDES PARA TABLET                    */}
            {/* ================================================================= */}
            {cardViewMode === 'lista' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area transition-colors duration-200" style={{ backgroundColor: currentCanvas.bg }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredProducts.map((prod) => {
                    const qtyInCart = getCartQty(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className={`p-3 border rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.98] active:brightness-105 active:border-amber-400 select-none shadow-sm ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border flex items-center justify-center p-1.5 ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-700'
                          }`}>
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain drop-shadow-sm"
                            />
                            {qtyInCart > 0 && (
                              <span className="absolute top-1 right-1 text-slate-950 font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md bg-amber-400 anim-badge-spring">
                                {qtyInCart}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">
                                {prod.category}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {prod.sku}
                              </span>
                            </div>
                            <h4 className={`text-xs font-black truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {prod.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                              {prod.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 pl-1">
                          <div className="text-right">
                            <span className="text-xs font-black font-mono block text-amber-400">
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(0)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 active:bg-amber-300 text-slate-950 flex items-center justify-center transition-all shadow-md font-black cursor-pointer"
                            title="Añadir a la comanda"
                          >
                            <Plus className="w-4 h-4 stroke-[2.8]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 2: MESAS Y CUENTAS DE BARRA (+ BOTÓN AGREGAR DINÁMICO)            */}
        {/* ======================================================================= */}
        {activeTab === 'mesas' && (
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pb-44 px-1 scrollbar-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  <LayoutGrid className="w-4 h-4" style={{ color: currentPal.primary }} />
                  <span>Gestión de Mesas y Cuentas de Barra</span>
                </h2>
                <span className="text-xs text-slate-500">Administra cuentas abiertas en tiempo real</span>
              </div>
              <button
                onClick={() => setShowAddSpotModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all"
                style={{ backgroundColor: currentPal.primary }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Mesa / Barra</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {diningSpots.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => {
                    setActiveTable(spot.id);
                    if (spot.total > 0) setIsRightDrawerOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative active:scale-95 shadow-xs ${
                    spot.status === 'libre'
                      ? isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900/60 border-slate-800'
                      : isLight ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-slate-900 border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      {spot.name}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        spot.status === 'libre'
                          ? 'bg-slate-400'
                          : spot.status === 'preparando'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                  </div>

                  {spot.status !== 'libre' ? (
                    <div>
                      <span className="text-sm font-black font-mono block" style={{ color: currentPal.primary }}>
                        ${spot.total.toFixed(2)}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{spot.items} ítems</span>
                        <span>⏱️ {spot.time}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Disponible
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 3: PEDIDOS Y DESPACHOS EN VIVO (LOCAL & DELIVERY)                 */}
        {/* ======================================================================= */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col pb-44 overflow-y-auto px-1 scrollbar-none">
            {/* Header & Filtros */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b shrink-0 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <h2 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <ClipboardList className="w-4 h-4" style={{ color: currentPal.primary }} />
                  <span>Control de Pedidos & Despachos</span>
                </h2>
                <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {orders.filter(o => o.status === 'en_cola').length} en cola • {orders.filter(o => o.status === 'listo').length} listos • {orders.filter(o => o.status === 'despachado').length} despachados
                </p>
              </div>

              {/* Filtros de Tipo y Estado */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Filtro por Tipo */}
                <div className={`flex items-center p-0.5 rounded-xl border ${
                  isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-slate-900'
                }`}>
                  {(['todos', 'local', 'delivery'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderFilterType(t)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        orderFilterType === t
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'todos' ? 'Todos' : t === 'local' ? 'Local' : 'Delivery'}
                    </button>
                  ))}
                </div>

                {/* Filtro por Estado */}
                <div className={`flex items-center p-0.5 rounded-xl border ${
                  isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800 bg-slate-900'
                }`}>
                  {(['todos', 'en_cola', 'listo', 'despachado'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilterStatus(st)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        orderFilterStatus === st
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'todos' ? 'Todos' : st === 'en_cola' ? 'En Cola' : st === 'listo' ? 'Listos' : 'Despachados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablero de Pedidos */}
            {(() => {
              const visibleOrders = orders.filter((o) => {
                const matchStatus = orderFilterStatus === 'todos' || o.status === orderFilterStatus;
                const matchType = orderFilterType === 'todos' || o.type === orderFilterType;
                return matchStatus && matchType;
              });

              if (visibleOrders.length === 0) {
                return (
                  <div className={`text-center py-12 text-xs italic border rounded-2xl ${
                    isLight ? 'text-slate-500 border-slate-200 bg-slate-50' : 'text-slate-400 border-slate-800/80 bg-slate-900/40'
                  }`}>
                    No hay pedidos registrados con los filtros seleccionados.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleOrders.map((ord) => {
                    const isDelivery = ord.type === 'delivery';
                    const isEnCola = ord.status === 'en_cola';
                    const isListo = ord.status === 'listo';
                    const isDespachado = ord.status === 'despachado';
                    const isPendingPayment = ord.paymentStatus === 'por_cobrar';

                    return (
                      <div
                        key={ord.id}
                        className={`border rounded-2xl p-3.5 space-y-3 transition-all flex flex-col justify-between shadow-md ${
                          isLight
                            ? isEnCola
                              ? 'bg-white border-amber-400 shadow-sm'
                              : isListo
                              ? 'bg-white border-sky-400 shadow-sm'
                              : 'bg-slate-50 border-slate-200 opacity-95'
                            : isEnCola
                            ? 'bg-[#0f172a] border-amber-500/40'
                            : isListo
                            ? 'bg-[#0f172a] border-sky-500/40'
                            : 'bg-slate-900/80 border-slate-800 opacity-90'
                        }`}
                      >
                        {/* Cabecera del Pedido */}
                        <div className={`space-y-1.5 pb-2 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                                {ord.orderNumber}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isDelivery
                                  ? isLight ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {isDelivery ? 'Delivery' : (ord.table || 'Local')}
                              </span>
                            </div>

                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {ord.timeFormatted}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                              {ord.customer?.name || 'Cliente'}
                            </span>
                            <div className="text-right">
                              <span className={`font-mono font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                                ${ord.totalUSD.toFixed(2)}
                              </span>
                              <span className={`text-[9.5px] font-mono block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Bs. {(ord.totalUSD * bcvRate).toFixed(0)}
                              </span>
                            </div>
                          </div>

                          {/* Estado de Pago */}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              Pago: <b className={isLight ? 'text-slate-900' : 'text-slate-300'}>{ord.paymentMethod}</b>
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              isPendingPayment
                                ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {isPendingPayment ? 'Por Cobrar en Destino' : 'Pagado'}
                            </span>
                          </div>

                          {/* Dirección / Motorizado si es Delivery */}
                          {isDelivery && (
                            <div className={`p-2 rounded-xl space-y-1 text-[10px] font-mono ${
                              isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-slate-950 border border-slate-800 text-slate-300'
                            }`}>
                              {ord.driverName && (
                                <p className={`flex items-center gap-1 ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                                  <Bike className="w-3 h-3" />
                                  <span>Chofer: <b>{ord.driverName}</b></span>
                                </p>
                              )}
                              {ord.deliveryAddress && (
                                <p className={`flex items-start gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                  <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{ord.deliveryAddress}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Lista de Ítems */}
                        <div className="space-y-1 flex-1 py-1 max-h-32 overflow-y-auto">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-baseline text-xs">
                              <div className={`truncate pr-2 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                                <span className={`font-mono font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{it.qty}x</span> {it.name}
                                {it.notes && (
                                  <span className={`block text-[9.5px] italic font-sans pl-4 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                                    Nota: {it.notes}
                                  </span>
                                )}
                              </div>
                              <span className={`font-mono shrink-0 text-[11px] ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                                ${(it.priceUSD * it.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Botones de Transición de Estado */}
                        <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                          {isEnCola && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(ord.id, 'listo')}
                              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Aceptar y Marcar Listo</span>
                            </button>
                          )}

                          {isListo && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(ord.id, 'despachado')}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>{isDelivery ? 'Despachar Motorizado' : 'Entregar al Cliente'}</span>
                            </button>
                          )}

                          {isDespachado && (
                            <div className={`w-full py-1.5 rounded-xl text-xs font-black text-center border ${
                              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-800/80 text-emerald-400 border-emerald-500/20'
                            }`}>
                              ✓ Orden Finalizada y Entregada
                            </div>
                          )}

                          {isPendingPayment && (
                            <button
                              onClick={() => handleMarkOrderPaid(ord.id)}
                              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Marcar Pago Recibido ($)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 4: DELIVERY Y RUTAS DE MOTORIZADOS                                */}
        {/* ======================================================================= */}
        {activeTab === 'delivery' && (
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pb-44 px-1 scrollbar-none">
            {/* Header con estadísticas y botón de alta rápida */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  <Bike className="w-5 h-5 text-amber-500" />
                  <span>Despachos y Delivery Autónomo</span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {drivers.filter(d => d.status === 'disponible').length} disponibles • {drivers.filter(d => d.status === 'en_ruta').length} en ruta • {drivers.length} choferes registrados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDriversModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-black shadow-md active:scale-95 transition-all"
                  style={{ backgroundColor: currentPal.primary }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Chofer</span>
                </button>
              </div>
            </div>

            {/* Banner de Comanda Activa Lista para Despachar */}
            <div className={`border rounded-2xl p-4 transition-all shadow-xs ${
              totalItems > 0
                ? 'bg-amber-500/10 border-amber-500/30'
                : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Comanda Actual para Despacho:
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {totalItems} producto{totalItems !== 1 ? 's' : ''} • ${totalUSD.toFixed(2)} USD (Bs. {totalVES.toFixed(2)})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Cliente:</span> {selectedCustomer.name} • <span className="font-bold">Destino:</span> {selectedCustomer.address || 'Mostrador / Por acordar'}
                  </p>
                </div>

                {totalItems === 0 && (
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    + Cargar Productos al Carrito
                  </button>
                )}
              </div>
            </div>

            {/* Cuadrícula de Motorizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drivers.map((driver) => {
                const isDisponible = driver.status === 'disponible';
                const isEnRuta = driver.status === 'en_ruta';
                return (
                  <div
                    key={driver.id}
                    className={`border rounded-2xl p-4 space-y-3 transition-all relative ${
                      isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {/* Encabezado del Chofer */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                          isDisponible ? 'bg-emerald-500/10 text-emerald-500' :
                          isEnRuta ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <Bike className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {driver.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {driver.vehicle}
                          </p>
                        </div>
                      </div>

                      {/* Estado conmutable */}
                      <button
                        onClick={() => handleToggleDriverStatus(driver.id)}
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all active:scale-95 ${
                          isDisponible ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                          isEnRuta ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' :
                          'bg-slate-150 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                        }`}
                        title="Toca para cambiar estado"
                      >
                        {isDisponible ? '● Disponible' : isEnRuta ? '◐ En Ruta' : '○ Inactivo'}
                      </button>
                    </div>

                    {/* Teléfono WhatsApp */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{driver.phone}</span>
                    </div>

                    {/* Botón de Acción Principal: Despachar Comanda por WhatsApp */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleDispatchOrderWhatsApp(driver.phone, driver.name)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                          totalItems > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-emerald-600/80 text-white hover:bg-emerald-600'
                        }`}
                        title="Enviar comanda activa por WhatsApp a este motorizado"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Despachar Orden (WhatsApp)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Eliminar chofer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 5: PASARELA DE COBRO COMPLETA (CLIENTE + PAGO MÓVIL + VUELTO)      */}
        {/* ======================================================================= */}
        {activeTab === 'cobro' && (
          <div className="max-w-xl mx-auto w-full space-y-4 flex-1 min-h-0 overflow-y-auto pb-44 px-2 scrollbar-none">
            {/* Header del Totalizador */}
            <div className={`border rounded-3xl p-5 text-center shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Total a Liquidar ({totalItems} productos)
              </span>
              <div className="text-4xl font-black font-mono mt-1" style={{ color: currentPal.primary }}>
                ${totalUSD.toFixed(2)} USD
              </div>
              <div className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Bs. {totalVES.toFixed(2)} (Tasa BCV: {bcvRate.toFixed(2)})
              </div>
            </div>

            {/* SECCIÓN 1: MODALIDAD DE DESPACHO Y ENTREGA */}
            <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-xs font-black uppercase tracking-wider block ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Modalidad de Entrega / Despacho:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'local', label: 'En Local / Mesa', desc: 'Consumo en salón o mostrador', icon: Store, color: 'text-emerald-500' },
                  { id: 'delivery_paid', label: 'Delivery Pagado', desc: 'Cobrado previo al despacho', icon: Bike, color: 'text-sky-500' },
                  { id: 'delivery_cod', label: 'Cobro en Destino', desc: 'El chofer cobra al entregar', icon: Truck, color: 'text-amber-500' },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = fulfillmentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFulfillmentMode(mode.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? isLight ? 'border-2 bg-slate-50 shadow-sm' : 'border-2 bg-[#0f172a] shadow-md'
                          : isLight ? 'bg-slate-50/60 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                      }`}
                      style={{
                        borderColor: isSelected ? currentPal.primary : undefined,
                      }}
                    >
                      <Icon className={`w-5 h-5 ${mode.color}`} />
                      <span className={`text-[11px] font-black leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {mode.label}
                      </span>
                      <span className={`text-[9px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Parámetros de Delivery si aplica */}
              {fulfillmentMode !== 'local' && (
                <div className={`p-3 rounded-xl border space-y-2.5 mt-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'border-slate-800 bg-slate-950/80'
                }`}>
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      Asignar Motorizado / Chofer:
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="">Por Asignar / Chofer Particular</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.vehicle}) - {d.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      Dirección o Punto de Referencia:
                    </label>
                    <input
                      type="text"
                      placeholder={selectedCustomer.address || 'Ej. Urb. Los Rosales, Calle 3, Casa #14'}
                      value={deliveryAddressInput}
                      onChange={(e) => setDeliveryAddressInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DATOS DEL CLIENTE / FACTURACIÓN */}
            <div className={`border rounded-2xl p-4 space-y-2.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <User className="w-4 h-4" style={{ color: currentPal.primary }} />
                  <span>Datos del Cliente / Facturación</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="text-xs font-black hover:underline flex items-center gap-1 active:scale-95 cursor-pointer"
                  style={{ color: currentPal.primary }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cambiar / + Nuevo</span>
                </button>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <h4 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedCustomer.name}
                  </h4>
                  <div className={`flex gap-2 text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                    <span>Doc: <b>{selectedCustomer.docId}</b></span>
                    {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  Seleccionado
                </span>
              </div>
            </div>

            {/* SECCIÓN 3: SELECTOR DE MÉTODO DE PAGO */}
            <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase tracking-wider block ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {fulfillmentMode === 'delivery_cod' ? 'Método Acordado en Destino:' : 'Selecciona Método de Pago:'}
                </span>
                {fulfillmentMode === 'delivery_cod' && (
                  <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    Por Cobrar en Destino
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pago_movil', label: 'Pago Móvil', icon: Phone, color: 'text-emerald-500' },
                  { id: 'cash_usd', label: 'Efectivo $', icon: CircleDollarSign, color: 'text-amber-500' },
                  { id: 'cash_ves', label: 'Efectivo Bs', icon: Wallet, color: 'text-sky-500' },
                  { id: 'card_debit', label: 'Punto / Débito', icon: CreditCard, color: 'text-purple-500' },
                  { id: 'zelle', label: 'Zelle', icon: Store, color: 'text-indigo-500' },
                  { id: 'mixed', label: 'Pago Mixto', icon: ArrowLeftRight, color: 'text-teal-400' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        isSelected
                          ? 'border-2 shadow-xs'
                          : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                      }`}
                      style={{
                        borderColor: isSelected ? currentPal.primary : undefined,
                        backgroundColor: isSelected ? (isLight ? '#ffffff' : '#0f172a') : undefined
                      }}
                    >
                      <Icon className={`w-5 h-5 ${m.color}`} />
                      <span className="text-[11px] font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* FORMULARIO DINÁMICO POR MÉTODO DE PAGO */}
              {/* 1. PAGO MÓVIL */}
              {selectedPaymentMethod === 'pago_movil' && (
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  {/* Tarjeta de Datos de Pago Móvil para el Cliente */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                        📱 Datos del Negocio para Recibir:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPagoMovilData(pagoMovilInfo, totalVES)}
                        className="text-[10px] font-black px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedPmAlert ? '¡Copiado!' : 'Copiar Datos'}</span>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-slate-800 dark:text-slate-200 space-y-0.5">
                      <p><b>Banco:</b> {pagoMovilInfo.bank}</p>
                      <p><b>Teléfono:</b> {pagoMovilInfo.phone}</p>
                      <p><b>Cédula/RIF:</b> {pagoMovilInfo.idDoc}</p>
                      <p><b>Titular:</b> {pagoMovilInfo.ownerName}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black mb-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Número de Referencia Bancaria (4 a 6 dígitos):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 948271"
                      value={pagoMovilRefInput}
                      onChange={(e) => setPagoMovilRefInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* 2. EFECTIVO USD CON VUELTO EN VIVO */}
              {selectedPaymentMethod === 'cash_usd' && (
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <label className="block text-xs font-black mb-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Monto Recibido en Dólares ($):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={cashUSDReceived || ''}
                      onChange={(e) => setCashUSDReceived(parseFloat(e.target.value) || 0)}
                      placeholder={`Mínimo: $${totalUSD.toFixed(2)}`}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Alerta en Vivo si Falta Dinero */}
                  {cashUSDReceived > 0 && cashUSDReceived < totalUSD - 0.01 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Falta por recibir: <b>${(totalUSD - cashUSDReceived).toFixed(2)} USD</b> (Bs. {((totalUSD - cashUSDReceived) * bcvRate).toFixed(2)})</span>
                    </div>
                  )}

                  {/* Botones de Efectivo Rápido */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashUSDReceived(Math.ceil(totalUSD))}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold active:scale-95"
                    >
                      Exacto (${Math.ceil(totalUSD)})
                    </button>
                    {[5, 10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashUSDReceived(val)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold active:scale-95"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  {/* Cálculo de Vuelto en Vivo */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    vueltoUSD > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-200/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <span className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Vuelto / Cambio a Entregar:
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                        ${vueltoUSD.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ó Bs. {vueltoVESfromUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. EFECTIVO BOLÍVARES */}
              {selectedPaymentMethod === 'cash_ves' && (
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <label className="block text-xs font-black mb-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Monto Recibido en Bolívares (Bs.):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={cashVESReceived || ''}
                      onChange={(e) => setCashVESReceived(parseFloat(e.target.value) || 0)}
                      placeholder={`Monto total: Bs. ${totalVES.toFixed(2)}`}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Alerta en Vivo si Falta Dinero */}
                  {cashVESReceived > 0 && cashVESReceived < totalVES - 0.05 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Falta por recibir: <b>Bs. {(totalVES - cashVESReceived).toFixed(2)}</b> ($ {bcvRate > 0 ? ((totalVES - cashVESReceived) / bcvRate).toFixed(2) : '0.00'})</span>
                    </div>
                  )}

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    vueltoVESfromVES > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-200/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <span className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Vuelto en Bolívares:
                    </span>
                    <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                      Bs. {vueltoVESfromVES.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. PUNTO DE VENTA / TARJETA */}
              {selectedPaymentMethod === 'card_debit' && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="block text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    N° Aprobación / Lote / Voucher:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: APROB-81726"
                    value={cardVoucherRef}
                    onChange={(e) => setCardVoucherRef(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              )}

              {/* 5. ZELLE */}
              {selectedPaymentMethod === 'zelle' && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="block text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Titular o Confirmación Zelle:
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del emisor o ID de transacción"
                    value={zelleConfirmation}
                    onChange={(e) => setZelleConfirmation(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              )}

              {/* 6. PAGO MIXTO / MULTIMONEDA (COMBINADO CON CÁLCULO EN VIVO Y VALIDACIÓN ESTRICTA) */}
              {selectedPaymentMethod === 'mixed' && (
                <div className="p-4 rounded-2xl border bg-slate-950/80 border-slate-800 space-y-4">
                  {/* Balance en Vivo de Pago Mixto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total a Cubrir
                      </span>
                      <div className="text-base font-black font-mono text-white">
                        ${totalUSD.toFixed(2)} USD
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Bs. {totalVES.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Recibido
                      </span>
                      <div className="text-base font-black font-mono text-emerald-400">
                        ${mixedPaidUSD.toFixed(2)} USD
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300">
                        Bs. {mixedPaidVES.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Estado en Vivo: Faltante o Vuelto */}
                  {!isMixedComplete ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <strong className="text-xs font-black block">Falta por Completar:</strong>
                          <span className="text-[11px] text-amber-200">El botón de cobro se habilitará al cubrir el monto</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-black text-amber-400">
                          ${mixedPendingUSD.toFixed(2)} USD
                        </div>
                        <div className="text-[10px] text-amber-300">
                          Bs. {mixedPendingVES.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <strong className="text-xs font-black block">¡Monto Total Cubierto!</strong>
                          <span className="text-[11px] text-emerald-200">
                            {mixedChangeUSD > 0.01 ? 'Vuelto / Cambio a Entregar:' : 'Pago exacto completado'}
                          </span>
                        </div>
                      </div>
                      {mixedChangeUSD > 0.01 && (
                        <div className="text-right font-mono">
                          <div className="text-sm font-black text-emerald-400">
                            ${mixedChangeUSD.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            Bs. {mixedChangeVES.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulario para Agregar Abono / Pago Parcial */}
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                      + Agregar Abono a esta Cuenta:
                    </span>

                    {/* Selector de Método para el Abono */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'cash_usd', label: 'Efectivo $', cur: 'USD' as const },
                        { id: 'cash_ves', label: 'Efectivo Bs', cur: 'VES' as const },
                        { id: 'pago_movil', label: 'Pago Móvil', cur: 'VES' as const },
                        { id: 'card_debit', label: 'Punto POS', cur: 'VES' as const },
                        { id: 'zelle', label: 'Zelle', cur: 'USD' as const },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMixedInputMethod(item.id as any);
                            setMixedInputCurrency(item.cur);
                          }}
                          className={`p-2 rounded-lg text-[10px] font-black border transition-all text-center ${
                            mixedInputMethod === item.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Moneda */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Moneda:
                        </label>
                        <select
                          value={mixedInputCurrency}
                          onChange={(e) => setMixedInputCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none bg-slate-950 border-slate-700 text-white"
                        >
                          <option value="USD">Dólares ($ USD)</option>
                          <option value="VES">Bolívares (Bs. VES)</option>
                        </select>
                      </div>

                      {/* Monto con botón Sugerir Faltante */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400">
                            Monto Recibido ({mixedInputCurrency}):
                          </label>
                          {mixedPendingUSD > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (mixedInputCurrency === 'USD') {
                                  setMixedInputAmount(mixedPendingUSD.toFixed(2));
                                } else {
                                  setMixedInputAmount(mixedPendingVES.toFixed(2));
                                }
                              }}
                              className="text-[10px] font-black text-amber-400 hover:underline active:scale-95"
                            >
                              Sugerir Faltante ({mixedInputCurrency === 'USD' ? `$${mixedPendingUSD.toFixed(2)}` : `Bs. ${mixedPendingVES.toFixed(2)}`})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={mixedInputAmount}
                          onChange={(e) => setMixedInputAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-xl text-sm font-mono font-black border outline-none bg-slate-950 border-slate-700 text-white focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Referencia opcional si aplica */}
                    {(mixedInputMethod === 'pago_movil' || mixedInputMethod === 'card_debit' || mixedInputMethod === 'zelle') && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Referencia / Titular (Opcional):
                        </label>
                        <input
                          type="text"
                          value={mixedInputRef}
                          onChange={(e) => setMixedInputRef(e.target.value)}
                          placeholder="Ej: 4 últimos dígitos o titular"
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-mono border outline-none bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddMixedPayment}
                      disabled={!mixedInputAmount || parseFloat(mixedInputAmount) <= 0}
                      className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md ${
                        !mixedInputAmount || parseFloat(mixedInputAmount) <= 0
                          ? 'bg-emerald-950/90 border border-emerald-500/40 text-white cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg shadow-emerald-500/25'
                      }`}
                      style={{
                        color: (!mixedInputAmount || parseFloat(mixedInputAmount) <= 0) ? '#ffffff' : '#022c22',
                        backgroundColor: (!mixedInputAmount || parseFloat(mixedInputAmount) <= 0) ? '#064e3b' : '#10b981'
                      }}
                    >
                      <Plus className="w-4 h-4 stroke-[3]" style={{ color: (!mixedInputAmount || parseFloat(mixedInputAmount) <= 0) ? '#ffffff' : '#022c22' }} />
                      <span className="font-black tracking-wide" style={{ color: (!mixedInputAmount || parseFloat(mixedInputAmount) <= 0) ? '#ffffff' : '#022c22' }}>
                        Registrar Abono a la Cuenta
                      </span>
                    </button>
                  </div>

                  {/* Lista de Abonos Registrados */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Abonos Registrados ({mixedPayments.length}):
                    </span>
                    {mixedPayments.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        No hay abonos agregados. Utiliza el formulario superior para registrar pagos parciales.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {mixedPayments.map((p) => {
                          const methodNames: Record<string, string> = {
                            cash_usd: 'Efectivo $',
                            cash_ves: 'Efectivo Bs',
                            pago_movil: 'Pago Móvil',
                            card_debit: 'Punto Débito',
                            zelle: 'Zelle'
                          };
                          return (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  {methodNames[p.method] || p.method}
                                </span>
                                {p.reference && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    Ref: {p.reference}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right font-mono">
                                  <span className="text-xs font-black text-emerald-400 block">
                                    {p.currency === 'USD' ? `$${p.amount.toFixed(2)} USD` : `Bs. ${p.amount.toFixed(2)}`}
                                  </span>
                                  <span className="text-[9px] text-slate-500">
                                    {p.currency === 'USD' ? `≈ Bs. ${p.amountVES.toFixed(2)}` : `≈ $${p.amountUSD.toFixed(2)} USD`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMixedPayment(p.id)}
                                  className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer"
                                  title="Eliminar este abono"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN FINAL DE LIQUIDACIÓN Y GENERACIÓN DE TICKET (BLOQUEADO SI FALTA DINERO) */}
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || !isPaymentComplete}
              className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0 || !isPaymentComplete
                  ? 'opacity-60 cursor-not-allowed bg-slate-800 border border-slate-700'
                  : 'active:scale-98 shadow-emerald-500/20'
              }`}
              style={{ backgroundColor: (cart.length > 0 && isPaymentComplete) ? currentPal.primary : undefined }}
            >
              {cart.length === 0 ? (
                <span>Comanda Vacía</span>
              ) : !isPaymentComplete ? (
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Falta Completar: ${missingAmountUSD.toFixed(2)} USD (Bs. {missingAmountVES.toFixed(2)})</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Confirmar Venta y Generar Ticket</span>
                </>
              )}
            </button>
          </div>
        )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. AUTO-ACTUALIZADOR SILENCIOSO Y EN VIVO PARA KLIKPOS STREET             */}
      {/* ========================================================================= */}
      <StreetAutoUpdater />

      {/* ========================================================================= */}
      {/* 5. NAV BAR INFERIOR FIJA CON SILUETA LÍQUIDA SVG & HERO COBRO (DEF)      */}
      {/* ========================================================================= */}
      <TabletPosBottomNav
        activeTab={activeTab}
        isLight={isLight}
        totalItems={totalItems}
        totalUSD={totalUSD}
        primaryColor={currentPal.primary}
        onSelectTab={(tab) => {
          setIsDockerOpen(false);
          setActiveTab(tab);
        }}
        onOpenCobro={() => {
          setIsDockerOpen(false);
          setActiveTab('cobro');
        }}
        onOpenSalesBackup={() => {
          setIsDockerOpen(false);
          setShowSalesBackupModal(true);
        }}
        onOpenQrModal={() => {
          setIsDockerOpen(false);
          setShowQrModal(true);
        }}
        onToggleOrderDrawer={() => {
          setIsDockerOpen(false);
          setIsRightDrawerOpen((prev) => !prev);
        }}
        isOrderDrawerOpen={isRightDrawerOpen}
        onToggleDocker={() => setIsDockerOpen((prev) => !prev)}
        isDockerOpen={isDockerOpen}
        isLiteMode={IS_LITE_MODE}
      />

      {/* ========================================================================= */}
      {/* 5. DRAWER IZQUIERDO: AJUSTES, EMPRESA, PAGO MÓVIL Y BRANDING              */}
      {/* ========================================================================= */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          <aside
            className={`relative w-84 max-w-[85vw] border-r h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-left overflow-y-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5" style={{ color: currentPal.primary }} />
                  <span className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Panel de Control KlikPOS
                  </span>
                </div>
                <button
                  onClick={() => setIsLeftDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECCIÓN 1: DATOS DE LA EMPRESA (REQUERIMIENTO EXPLÍCITO) */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowCompanyModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-300' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs"
                    style={{ backgroundColor: currentPal.primary }}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      Datos de la Empresa
                    </h4>
                    <p className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Nombre, RIF, Teléfono, Dirección
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>

              {/* SECCIÓN 2: DATOS DE PAGO MÓVIL (REQUERIMIENTO EXPLÍCITO) */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowPagoMovilModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-300' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-emerald-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      Datos de Pago Móvil
                    </h4>
                    <p className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Banco, Teléfono, Cédula/RIF
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>

              {/* SECCIÓN 3: GESTIÓN DE CLIENTES */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowCustomerModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-300' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-sky-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      Cartera de Clientes
                    </h4>
                    <p className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {customers.length} Registrados
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>

              {/* SECCIÓN 3B: LIBRERÍA CLOUD DE PAQUETES VISUALES & CATÁLOGOS */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowVisualPacksModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-sky-50/80 hover:bg-sky-100/90 border-sky-300' : 'bg-sky-950/40 hover:bg-sky-900/60 border-sky-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-gradient-to-tr from-sky-600 to-indigo-600">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        Paquetes Visuales & Catálogos
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-sky-500/20 text-sky-600 font-mono">
                        Cloud
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Descargar fotos HD, rubros y códigos
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </button>

              {/* SECCIÓN 4: BRANDING Y COLORES */}
              <div className={`p-3 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    <Palette className="w-4 h-4" style={{ color: currentPal.primary }} />
                    <span>Colores de Marca</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {currentPal.name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {BRAND_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => {
                        setActivePalette(pal.id);
                        try { localStorage.setItem('venematic_branding_palette', pal.id); } catch {}
                      }}
                      className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        activePalette === pal.id ? 'ring-2 font-black' : 'opacity-80'
                      }`}
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: activePalette === pal.id ? pal.primary : isLight ? '#cbd5e1' : '#1e293b'
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
                        style={{ backgroundColor: pal.primary }}
                      >
                        {activePalette === pal.id && '✓'}
                      </span>
                      <span className="text-[9px] truncate max-w-full font-bold" style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>
                        {pal.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className={`pt-2.5 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-500'}`}>Lienzo & Atmósfera:</span>
                    <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {currentCanvas.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {CANVAS_THEMES.map((canvas) => {
                      const isSelected = canvasTheme === canvas.id;
                      return (
                        <button
                          key={canvas.id}
                          type="button"
                          onClick={() => handleToggleTheme(canvas.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                            isSelected ? 'ring-2 font-black shadow-xs' : 'opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: canvas.surface,
                            borderColor: isSelected ? currentPal.primary : isLight ? '#cbd5e1' : canvas.border,
                            color: canvas.isLight ? '#0f172a' : '#ffffff'
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: canvas.bg }}
                            />
                            <span className={`text-[10px] font-black truncate max-w-[95px] ${canvas.isLight ? 'text-slate-950' : 'text-white'}`}>
                              {canvas.name}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold font-mono ${canvas.isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                            {canvas.isLight ? '☀️ Diurno' : '🌙 Nocturno'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Planes & Financiación Embajadores */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowStreetAmbassadorModal(true);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className={isLight ? 'text-emerald-950 font-black' : 'text-emerald-200'}>Planes Comerciales ($15 / $25)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded-md">Oferta</span>
              </button>

              {/* Presentación Comercial para Clientes */}
              <a
                href="/presentacion"
                target="_blank"
                rel="noreferrer"
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-sky-50 border-sky-300 text-sky-950' : 'bg-sky-950/40 border-sky-800 text-sky-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span className={isLight ? 'text-sky-950 font-black' : 'text-sky-200'}>Presentación para Clientes</span>
                </div>
                <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-100 px-2 py-0.5 rounded-md">Sliders →</span>
              </a>

              {/* Licencia Oficial */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowLicenseModal(true);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-950 shadow-xs' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className={isLight ? 'text-slate-950 font-black' : 'text-slate-100'}>Activar Clave de Licencia</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">Oficial</span>
              </button>
            </div>

            <div className={`pt-3 border-t text-center text-[10px] font-mono ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
              KlikPOS v3.0.4 • Blanco & Grafito
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DRAWER DERECHO: COMANDA ACTIVA                                         */}
      {/* ========================================================================= */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          <aside
            className={`relative w-full max-w-[380px] border-l h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-right transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#090d16] border-white/10 text-white'
            }`}
            style={{
              backgroundColor: isLight ? '#ffffff' : '#090d16',
              boxShadow: isLight ? '-10px 0 35px rgba(0, 0, 0, 0.12)' : '-10px 0 40px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isLight ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {activeTable ? `Mesa #${activeTable}` : 'Comanda Actual'}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className={`p-1.5 rounded-xl transition-all active:scale-90 cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-white/10'
                  }`}
                  title="Cerrar comanda"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Lista de Ítems */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs italic flex flex-col items-center gap-2">
                    <ShoppingCart className="w-8 h-8 opacity-30 text-slate-400" />
                    <span>No hay productos en esta cuenta.</span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border space-y-2 transition-all shadow-sm ${
                        isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'border-white/10 bg-[#111726] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 pr-1">
                          <h4 className={`text-xs font-black leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.name}
                          </h4>
                          <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            ${item.priceUSD.toFixed(2)} <span className={isLight ? 'text-slate-500 font-normal' : 'text-slate-400 font-normal'}>c/u</span>
                          </span>
                        </div>
                        <span className={`text-xs font-black font-mono shrink-0 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          ${(item.priceUSD * item.qty).toFixed(2)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className={`text-[10px] italic px-2 py-1 rounded-lg border ${
                          isLight ? 'bg-amber-50 text-amber-900 border-amber-200' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                        }`}>
                          📝 {item.notes}
                        </p>
                      )}

                      <div className={`flex items-center justify-between pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                        <button
                          onClick={() => setEditingItemNotes(item)}
                          className={`text-[11px] underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer ${
                            isLight ? 'text-slate-600 hover:text-amber-700' : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.notes ? 'Editar Nota' : '+ Nota'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black active:scale-90 transition-all cursor-pointer ${
                              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                            }`}
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className={`text-xs font-mono font-black w-5 text-center ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-black active:scale-90 shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totalizadores y Botón Ir a Cobrar */}
            {cart.length > 0 && (
              <div className={`pt-3 border-t space-y-3 shrink-0 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className={`p-3 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#06080e] border-white/10'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Total USD:</span>
                    <span className={`font-mono font-black text-lg ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      ${totalUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center text-xs pt-1 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                    <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Total Bs (BCV):</span>
                    <span className={`font-mono font-black text-sm ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                      Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    Tasa: Bs. {bcvRate.toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setCart([])}
                    className="py-3 px-3 active:scale-95 text-xs font-bold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(false);
                      setActiveTab('cobro');
                    }}
                    className="py-3 px-3 text-white text-xs font-black rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    Ir a Cobrar ➔
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL CONFIGURACIÓN DE EMPRESA (NOMBRE, RIF, TELÉFONO, DIRECCIÓN)       */}
      {/* ========================================================================= */}
      <CompanyConfigModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        isLight={isLight}
        primaryColor={currentPal.primary}
        companyInfo={companyInfo}
        setCompanyInfo={setCompanyInfo}
        onSave={handleSaveCompany}
      />

      {/* ========================================================================= */}
      {/* 8. MODAL CONFIGURACIÓN DE PAGO MÓVIL (BANCO, TELÉFONO, CÉDULA, TITULAR)     */}
      {/* ========================================================================= */}
      <PagoMovilConfigModal
        isOpen={showPagoMovilModal}
        onClose={() => setShowPagoMovilModal(false)}
        isLight={isLight}
        pagoMovilInfo={pagoMovilInfo}
        setPagoMovilInfo={setPagoMovilInfo}
        onSave={handleSavePagoMovil}
      />

      {/* ========================================================================= */}
      {/* 9. MODAL GESTIÓN Y REGISTRO RÁPIDO DE CLIENTES                             */}
      {/* ========================================================================= */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        isLight={isLight}
        primaryColor={currentPal.primary}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        newCustomerForm={newCustomerForm}
        setNewCustomerForm={setNewCustomerForm}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* ========================================================================= */}
      {/* 10. MODAL TICKET DIGITAL DE VENTA FINALIZADA                              */}
      {/* ========================================================================= */}
      {completedSaleTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setCompletedSaleTicket(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Ticket */}
            <div className="text-center space-y-0.5 border-b pb-2.5 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ¡Venta Cobrada con Éxito!
              </span>
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                {companyInfo.name}
              </h3>
              <p className="text-[10px] font-mono text-slate-500">
                RIF: {companyInfo.rif} • Tel: {companyInfo.phone}
              </p>
              <p className="text-[9px] text-slate-400">
                {companyInfo.address}
              </p>
              <div className="text-[10px] font-mono font-bold text-slate-500 pt-1">
                Ticket: <b>{completedSaleTicket.ticketNumber}</b> • {completedSaleTicket.timestamp}
              </div>
            </div>

            {/* Cliente */}
            <div className="text-xs font-mono border-b pb-2 border-slate-200 dark:border-slate-800 space-y-0.5">
              <p><b>Cliente:</b> {completedSaleTicket.customer.name}</p>
              <p><b>Cédula/RIF:</b> {completedSaleTicket.customer.docId}</p>
              {completedSaleTicket.table && <p><b>Ubicación:</b> {completedSaleTicket.table}</p>}
            </div>

            {/* Desglose de Productos */}
            <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono border-b pb-2 border-slate-200 dark:border-slate-800">
              {completedSaleTicket.items.map((it) => (
                <div key={it.id} className="flex justify-between items-baseline">
                  <span className="truncate pr-2">
                    {it.qty}x {it.name}
                  </span>
                  <span className="shrink-0 font-bold">
                    ${(it.priceUSD * it.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales y Método de Pago */}
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL USD:</span>
                <span style={{ color: currentPal.primary }}>
                  ${completedSaleTicket.totalUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>TOTAL BS (BCV):</span>
                <span>Bs. {completedSaleTicket.totalVES.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Método de Pago:</span>
                <span className="uppercase font-bold">{completedSaleTicket.paymentMethod}</span>
              </div>
              {completedSaleTicket.reference && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Referencia:</span>
                  <span className="font-bold">{completedSaleTicket.reference}</span>
                </div>
              )}
              {completedSaleTicket.mixedPayments && completedSaleTicket.mixedPayments.length > 0 && (
                <div className="py-1.5 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 my-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Desglose Pago Mixto:</span>
                  {completedSaleTicket.mixedPayments.map((p, idx) => {
                    const methodNames: Record<string, string> = {
                      cash_usd: 'Efectivo $',
                      cash_ves: 'Efectivo Bs',
                      pago_movil: 'Pago Móvil',
                      card_debit: 'Punto Débito',
                      zelle: 'Zelle'
                    };
                    return (
                      <div key={idx} className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-300">
                        <span>{methodNames[p.method] || p.method}{p.reference ? ` (${p.reference})` : ''}:</span>
                        <span className="font-bold">{p.currency === 'USD' ? `$${p.amount.toFixed(2)}` : `Bs. ${p.amount.toFixed(2)}`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {completedSaleTicket.changeUSD !== undefined && completedSaleTicket.changeUSD > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                  <span>Vuelto Entregado:</span>
                  <span>${completedSaleTicket.changeUSD.toFixed(2)} / Bs. {completedSaleTicket.changeVES?.toFixed(2)}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-center italic text-slate-400 pt-1">
              "{companyInfo.footerMsg}"
            </p>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => {
                  const receiptText = `*${companyInfo.name}*\n` +
                    `RIF: ${companyInfo.rif}\n` +
                    `Ticket: ${completedSaleTicket.ticketNumber}\n` +
                    `Cliente: ${completedSaleTicket.customer.name}\n` +
                    `Total: $${completedSaleTicket.totalUSD.toFixed(2)} USD (Bs. ${completedSaleTicket.totalVES.toFixed(2)})\n` +
                    `Pago: ${completedSaleTicket.paymentMethod} (Ref: ${completedSaleTicket.reference})\n` +
                    `¡Gracias por su compra!`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`, '_blank');
                }}
                className="py-2 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-500"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => {
                setCompletedSaleTicket(null);
                setActiveTab('menu');
              }}
              className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95"
              style={{ backgroundColor: currentPal.primary }}
            >
              Nueva Venta
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL AGREGAR MESA / BARRA DINÁMICA                                    */}
      {/* ========================================================================= */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowAddSpotModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              + Crear Nueva Mesa o Cuenta de Barra
            </h3>

            <form onSubmit={handleAddNewSpot} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nombre o Identificador:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 5, Barra Terraza, VIP..."
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Ubicación:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mesa', 'barra', 'llevar'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewSpotType(t)}
                      className={`py-1.5 rounded-xl text-xs font-bold capitalize border active:scale-95 ${
                        newSpotType === t
                          ? 'border-2 font-black'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                      style={{
                        borderColor: newSpotType === t ? currentPal.primary : undefined,
                        color: newSpotType === t ? currentPal.primary : undefined
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all mt-2"
                style={{ backgroundColor: currentPal.primary }}
              >
                Crear Mesa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL CÓDIGO QR PARA CLIENTES                                         */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider" style={{ color: currentPal.primary }}>
                Menú Digital Interactivo
              </span>
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Escanea para Ordenar
              </h3>
              <p className="text-xs text-slate-500">
                Apunta con la cámara de tu teléfono para ver la carta y ordenar en mesa.
              </p>
            </div>

            {(() => {
              const activeMenuUrl = menuQrUrl || (typeof window !== 'undefined' ? `${window.location.origin}/menu` : 'http://localhost:3000/menu');
              const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeMenuUrl)}`;
              return (
                <>
                  <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[220px] border border-slate-200">
                    <img
                      src={qrImgSrc}
                      alt="Código QR del Menú"
                      className="w-36 h-36"
                    />
                    <span className="text-[10px] font-mono font-black text-slate-900 mt-2 text-center break-all">
                      {activeMenuUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeMenuUrl);
                        alert('¡Enlace del Menú copiado al portapapeles!');
                      }}
                      className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border hover:bg-slate-50 active:scale-95 transition-transform"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Enlace</span>
                    </button>
                    <button
                      onClick={() => {
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Mira nuestro menú digital interactivo aquí: ' + activeMenuUrl)}`, '_blank');
                      }}
                      className="py-2 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
                      style={{ backgroundColor: currentPal.primary }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL DE NOTAS Y PERSONALIZACIÓN DE COCINA                            */}
      {/* ========================================================================= */}
      {editingItemNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setEditingItemNotes(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: currentPal.primary }}>
                Personalizar Ítem
              </span>
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                {editingItemNotes.name}
              </h3>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Opciones Frecuentes (1 Tap):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const current = editingItemNotes.notes || '';
                      const updated = current ? `${current}, ${preset}` : preset;
                      setEditingItemNotes({ ...editingItemNotes, notes: updated });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nota Específica:
              </label>
              <input
                type="text"
                value={editingItemNotes.notes || ''}
                onChange={(e) => setEditingItemNotes({ ...editingItemNotes, notes: e.target.value })}
                placeholder="Ej. Tocineta bien crujiente, sin tártara..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCart((prev) =>
                    prev.map((i) =>
                      i.id === editingItemNotes.id ? { ...i, notes: '' } : i
                    )
                  );
                  setEditingItemNotes(null);
                }}
                className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl active:scale-95"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCart((prev) => {
                    const exists = prev.find((i) => i.id === editingItemNotes.id);
                    if (exists) {
                      return prev.map((i) =>
                        i.id === editingItemNotes.id ? { ...i, notes: editingItemNotes.notes } : i
                      );
                    }
                    return prev;
                  });
                  setEditingItemNotes(null);
                }}
                className="flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all"
                style={{ backgroundColor: currentPal.primary }}
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13b. MODAL 1: GESTIÓN DE INVENTARIO Y CATÁLOGO                            */}
      {/* ========================================================================= */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                      Inventario
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      {products.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Catálogo activo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowInventoryModal(false);
                    setShowVisualPacksModal(true);
                  }}
                  className={`flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                  }`}
                  title="Explorar paquetes con fotos HD"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Paquetes </span>
                  <span>Fotos HD</span>
                </button>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
              {/* Formulario de Alta Rápida de Producto (Envoltorio seguro sin <form> para evitar recarga por cámara) */}
              <div className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Nuevo Producto al Catálogo
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">1 Tap para guardar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nombre del Producto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Salchipapa Especial Familiar"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Precio ($ USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="5.50"
                      value={newProductForm.priceUSD}
                      onChange={(e) => setNewProductForm({ ...newProductForm, priceUSD: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Categoría</label>
                    <select
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      {categoriesList.filter(c => c !== 'Todos').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Código / SKU</label>
                    <input
                      type="text"
                      placeholder="Ej. COMBO-01"
                      value={newProductForm.sku}
                      onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Etiqueta / Badge</label>
                    <input
                      type="text"
                      placeholder="⭐ Nuevo, 🔥 Popular"
                      value={newProductForm.tag}
                      onChange={(e) => setNewProductForm({ ...newProductForm, tag: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Foto / Imagen del Producto (URL o Cargar Archivo / Cámara) */}
                  <div className="sm:col-span-2 md:col-span-3 border-t border-slate-200 dark:border-slate-800 pt-2 mt-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Foto / Imagen del Producto (URL o Archivo/Cámara)</span>
                      </label>
                      {newProductForm.image && (
                        <button
                          type="button"
                          onClick={() => setNewProductForm({ ...newProductForm, image: '' })}
                          className="text-[9.5px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Quitar foto
                        </button>
                      )}
                    </div>

                    <ProductImageSelector
                      currentImage={newProductForm.image}
                      onImageSelected={(url) => setNewProductForm({ ...newProductForm, image: url })}
                      productName={newProductForm.name}
                      barcode={newProductForm.sku}
                      isLight={isLight}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar en Inventario</span>
                  </button>
                </div>
              </div>

              {/* Lista de Productos con Edición Inline de Precios */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Productos Registrados ({products.length})
                </span>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 border rounded-2xl overflow-hidden">
                  {products.map((p) => {
                    const isEditing = editingPriceId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isLight ? 'bg-white hover:bg-slate-50' : 'bg-slate-900 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-black truncate" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>SKU: {p.sku}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-bold">{p.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Precio con edición en vivo */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-bold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                autoFocus
                                value={editingPriceValue}
                                onChange={(e) => setEditingPriceValue(e.target.value)}
                                className="w-16 px-1.5 py-1 text-xs font-mono font-black border rounded-lg outline-none bg-white dark:bg-slate-800 border-emerald-500 text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePriceEdit(p.id)}
                                className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
                                title="Guardar precio"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(p.id);
                                setEditingPriceValue(String(p.priceUSD));
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors"
                              title="Toca para editar precio"
                            >
                              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                ${p.priceUSD.toFixed(2)}
                              </span>
                              <Edit3 className="w-3 h-3 text-slate-400" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingProduct({ ...p })}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar detalles y foto del producto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowInventoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl"
              >
                Cerrar Gestor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13b.2. MODAL DE EDICIÓN COMPLETA DE PRODUCTO (FOTO, NOMBRE, SKU, PRECIO)  */}
      {/* ========================================================================= */}
      <EditProductModal
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        categoriesList={categoriesList}
        onSave={handleSaveFullProductEdit}
      />

      {/* ========================================================================= */}
      {/* 13c. MODAL 2: GESTIÓN DE MOTORIZADOS & DESPACHOS                          */}
      {/* ========================================================================= */}
      <DeliveryDriversModal
        isOpen={showDriversModal}
        onClose={() => setShowDriversModal(false)}
        isLight={isLight}
        drivers={drivers}
        newDriverForm={newDriverForm}
        setNewDriverForm={setNewDriverForm}
        onAddDriver={handleAddDriver}
        onToggleDriverStatus={handleToggleDriverStatus}
        onDispatchOrderWhatsApp={handleDispatchOrderWhatsApp}
        onDeleteDriver={handleDeleteDriver}
      />

      {/* ========================================================================= */}
      {/* 13d. MODAL 3: CONFIGURACIÓN DE IMPRESORA POS TÉRMICA                      */}
      {/* ========================================================================= */}
      <PrinterConfigModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        isLight={isLight}
        printerConfig={printerConfig}
        setPrinterConfig={setPrinterConfig}
        onSave={handleSavePrinterConfig}
        onTestPrint={handleTestPrint}
        printerTestAlert={printerTestAlert}
      />

      {/* ========================================================================= */}
      {/* 13e. MODAL 4: SELECTOR DE RUBRO COMERCIAL                                 */}
      {/* ========================================================================= */}
      <BusinessRubroModal
        isOpen={showRubroModal}
        onClose={() => setShowRubroModal(false)}
        isLight={isLight}
        activeRubro={activeRubro}
        onSelectRubro={handleSelectRubro}
      />

      {/* ========================================================================= */}
      {/* 14. MODAL DE LICENCIA OFICIAL Y PRUEBA 15 MINUTOS                         */}
      {/* ========================================================================= */}
      <LicenseActivationModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        isTrialNotice={trialState?.isTrial}
      />

      {/* ========================================================================= */}
      {/* 14B. MODAL DE PLANES COMERCIALES & EMBAJADORES ($15 / $25 / $50)          */}
      {/* ========================================================================= */}
      <StreetAmbassadorLicenseModal
        isOpen={showStreetAmbassadorModal}
        onClose={() => setShowStreetAmbassadorModal(false)}
        isLight={isLight}
        primaryColor={currentPal.primary}
        storeName="KlikPOS Street Negocio"
      />

      {/* ========================================================================= */}
      {/* 14C. MÓDULO ESTRELLA DE VENTAS & RESPALDO (DIARIO / SEMANAL / MENSUAL)    */}
      {/* ========================================================================= */}
      <StreetSalesBackupModal
        isOpen={showSalesBackupModal}
        onClose={() => setShowSalesBackupModal(false)}
        isLight={isLight}
        bcvRate={bcvRate}
        primaryColor={currentPal.primary}
        onPrintTicket={(sale) => {
          try {
            if (typeof window !== 'undefined') window.print();
          } catch {}
        }}
      />

      {/* ========================================================================= */}
      {/* 15. MODAL DE LIBRERÍA DE PAQUETES VISUALES & CATÁLOGOS CLOUD              */}
      {/* ========================================================================= */}
      <VisualPacksModal
        isOpen={showVisualPacksModal}
        onClose={() => setShowVisualPacksModal(false)}
        isLight={isLight}
        primaryColor={currentPal.primary}
        onPackImported={async () => {
          try {
            const dbProds = await db.products.toArray();
            if (dbProds && dbProds.length > 0) {
              const mapped: Product[] = dbProds.map((p: any) => ({
                id: String(p.id || Math.random()),
                name: p.name,
                category: p.category || 'General',
                priceUSD: Number(p.priceUSD || p.priceUsd) || 0,
                tag: p.tag || p.badge || '⭐ Nuevo',
                prepTime: 'Inmediato',
                image: p.image || p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
                description: p.description || `${p.name} - Calidad garantizada.`,
                sku: p.sku || p.barcode || 'SKU-00'
              }));
              setProducts(mapped);
              localStorage.setItem('klikpos_tablet_products', JSON.stringify(mapped));
            } else {
              setProducts([]);
              localStorage.setItem('klikpos_tablet_products', JSON.stringify([]));
            }
          } catch (err) {
            console.warn('Error refrescando productos importados:', err);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 16. MODAL DE ACTUALIZACIÓN DE SOFTWARE (GITHUB RELEASES & DESCARGA APK)   */}
      {/* ========================================================================= */}
      <SoftwareUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* ========================================================================= */}
      {/* 17. MODAL DE SINCRONIZACIÓN DE DATA (BCV 4 PROVEEDORES + FIRESTORE)       */}
      {/* ========================================================================= */}
      <DataSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        isLight={isLight}
        currentBcvRate={bcvRate}
        onBcvUpdated={(newRate) => {
          setBcvRate(newRate);
          setCustomBcvInput(newRate.toFixed(2));
        }}
        onPacksUpdated={async () => {
          try {
            const dbProds = await db.products.toArray();
            if (dbProds && dbProds.length > 0) {
              const mapped: Product[] = dbProds.map((p: any) => ({
                id: String(p.id || Math.random()),
                name: p.name,
                category: p.category || 'General',
                priceUSD: Number(p.priceUSD || p.priceUsd) || 0,
                tag: p.tag || p.badge || '⭐ Nuevo',
                prepTime: 'Inmediato',
                image: p.image || p.imageUrl || '/packs/comida-street/hamburguesa.png',
                description: p.description || `${p.name} - Calidad garantizada.`,
                sku: p.sku || p.barcode || 'SKU-00'
              }));
              setProducts(mapped);
            }
          } catch {}
        }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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
import { evaluateTrialState, TrialState } from '@/lib/licensing/trial-manager';
import { db } from '@/lib/db';
import { TabletPosBottomNav } from '@/components/tablet-pos/TabletPosBottomNav';
import { StreetAutoUpdater } from '@/components/tablet-pos/StreetAutoUpdater';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';
import { SoftwareUpdateModal } from '@/components/tablet-pos/SoftwareUpdateModal';
import { DataSyncModal } from '@/components/tablet-pos/DataSyncModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase/config';

interface CartItem {
  id: string;
  name: string;
  priceUSD: number;
  qty: number;
  notes?: string;
  category: string;
  image?: string;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  image: string;
  description: string;
  tag: string;
  prepTime: string;
  sku: string;
  ingredients?: string[];
}

interface Customer {
  id: string;
  name: string;
  docId: string;
  phone: string;
  address?: string;
}

interface CompanyInfo {
  name: string;
  rif: string;
  phone: string;
  address: string;
  footerMsg: string;
}

interface PagoMovilInfo {
  bank: string;
  phone: string;
  idDoc: string;
  ownerName: string;
}

interface CompletedSaleTicket {
  ticketNumber: string;
  timestamp: string;
  items: CartItem[];
  subtotalUSD: number;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  paymentMethod: string;
  reference?: string;
  amountReceivedUSD?: number;
  changeUSD?: number;
  changeVES?: number;
  customer: Customer;
  table?: string;
}

interface Motorizado {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'disponible' | 'en_ruta' | 'inactivo';
}

interface PrinterConfig {
  connection: 'bluetooth' | 'lan' | 'usb';
  ip: string;
  port: number;
  paperWidth: '58mm' | '80mm';
  autoCut: boolean;
}

type RubroId = 'comida' | 'ropa' | 'panaderia' | 'minimarket' | 'farmacia' | 'ferreteria';

const DEFAULT_DRIVERS: Motorizado[] = [
  { id: '1', name: 'Alexander Morales', phone: '04141234567', vehicle: 'Bera SBR Azul - AF1G22', status: 'disponible' },
  { id: '2', name: 'José Luis Rivas', phone: '04249876543', vehicle: 'Empire Keeway Rojo - AA4B11', status: 'en_ruta' },
  { id: '3', name: 'Manuel Bastidas', phone: '04125556677', vehicle: 'Haojin Águila Negro - AB99CC', status: 'disponible' }
];

const RUBROS_CATALOG: Record<RubroId, { name: string; label: string; icon: string; description: string; categories: string[]; sampleProducts: Product[] }> = {
  comida: {
    name: 'Comida & Gastronomía',
    label: 'Comida & Gastronomía',
    icon: '🍔',
    description: 'Hamburguesas, pizzas, combos, perros calientes y bebidas.',
    categories: ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'],
    sampleProducts: [] // Se llena con SAMPLE_PRODUCTS
  },
  ropa: {
    name: 'Ropa, Calzado & Boutique',
    label: 'Ropa, Calzado & Boutique',
    icon: '👕',
    description: 'Moda femenina, masculina, calzado y accesorios de vestir.',
    categories: ['Todos', 'Caballeros', 'Damas', 'Calzado', 'Accesorios', 'Ofertas'],
    sampleProducts: [
      { id: 'r1', name: 'Camiseta Oversize Algodón Premium', category: 'Caballeros', priceUSD: 14.00, tag: '🔥 En Tendencia', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80', description: 'Algodón 100% peruano peinado, corte relajado.', sku: 'ROP-01' },
      { id: 'r2', name: 'Jeans Skinny Denim Stretch', category: 'Damas', priceUSD: 22.00, tag: '⭐ Favorito', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80', description: 'Denim stretch levanta cola tiro alto.', sku: 'ROP-02' },
      { id: 'r3', name: 'Zapatos Deportivos Sneakers Urban', category: 'Calzado', priceUSD: 35.00, tag: '💥 Premium', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80', description: 'Suela amortiguada antideslizante con acabado transpirable.', sku: 'ROP-03' },
      { id: 'r4', name: 'Gorra Clásica Vintage Ajustable', category: 'Accesorios', priceUSD: 8.50, tag: '🧢 Estilo', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', description: 'Broche metálico trasero con visera curva.', sku: 'ROP-04' }
    ]
  },
  panaderia: {
    name: 'Panadería, Café & Pastelería',
    label: 'Panadería, Café & Pastelería',
    icon: '🥖',
    description: 'Panes artesanales, repostería fina, desayunos y cafetería.',
    categories: ['Todos', 'Panes', 'Café', 'Pastelería', 'Charcutería', 'Bebidas'],
    sampleProducts: [
      { id: 'p1', name: 'Canilla Tradicional Crujiente', category: 'Panes', priceUSD: 0.80, tag: '🥖 Fresco', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80', description: 'Pan tipo canilla recién horneado con corteza dorada.', sku: 'PAN-01' },
      { id: 'p2', name: 'Café Capuchino Cremoso Grande', category: 'Café', priceUSD: 2.00, tag: '☕ Caliente', prepTime: '3 min', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80', description: 'Espresso doble con leche espumada y canela.', sku: 'PAN-02' },
      { id: 'p3', name: 'Croissant Mantequilla con Jamón y Queso', category: 'Pastelería', priceUSD: 3.50, tag: '🥐 Relleno', prepTime: '2 min', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80', description: 'Masa hojaldrada con mantequilla y relleno horneado.', sku: 'PAN-03' },
      { id: 'p4', name: 'Torta Tres Leches Casera Porción', category: 'Pastelería', priceUSD: 3.00, tag: '🍰 Dulce', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&q=80', description: 'Bizcocho bañado en mezcla de tres leches y merengue tostado.', sku: 'PAN-04' }
    ]
  },
  minimarket: {
    name: 'Abastos, Minimarkets & Víveres',
    label: 'Abastos, Minimarkets & Víveres',
    icon: '🛒',
    description: 'Alimentos no perecederos, bebidas, víveres y charcutería.',
    categories: ['Todos', 'Víveres', 'Lácteos', 'Snacks', 'Bebidas', 'Limpieza'],
    sampleProducts: [
      { id: 'm1', name: 'Harina de Maíz Blanco 1Kg', category: 'Víveres', priceUSD: 1.15, tag: '🌽 Esencial', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', description: 'Harina precocida tradicional para arepas.', sku: 'VIV-01' },
      { id: 'm2', name: 'Arroz Blanco Tradicional 1Kg', category: 'Víveres', priceUSD: 1.30, tag: '🍚 Básico', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=80', description: 'Grano entero de primera calidad.', sku: 'VIV-02' },
      { id: 'm3', name: 'Queso Paisa Rebanado 250g', category: 'Lácteos', priceUSD: 2.80, tag: '🧀 Fresco', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&q=80', description: 'Queso blanco semiduro pasteurizado.', sku: 'VIV-03' },
      { id: 'm4', name: 'Snack Papitas Tostadas Onduladas', category: 'Snacks', priceUSD: 1.50, tag: '🥔 Crujiente', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80', description: 'Papas fritas saladas crujientes bolsa familiar.', sku: 'VIV-04' }
    ]
  },
  farmacia: {
    name: 'Farmacia & Cuidado Personal',
    label: 'Farmacia & Cuidado Personal',
    icon: '💊',
    description: 'Medicamentos sin récipe, productos de higiene y primeros auxilios.',
    categories: ['Todos', 'Analgésicos', 'Cuidado Personal', 'Primeros Auxilios', 'Vitaminas'],
    sampleProducts: [
      { id: 'f1', name: 'Acetaminofén 500mg (10 Tabletas)', category: 'Analgésicos', priceUSD: 1.20, tag: '💊 Farmacia', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80', description: 'Alivio del dolor y la fiebre.', sku: 'FAR-01' },
      { id: 'f2', name: 'Alcohol Antiséptico 70% 500ml', category: 'Primeros Auxilios', priceUSD: 2.50, tag: '🩹 Botiquín', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&q=80', description: 'Solución desinfectante tópica para curas.', sku: 'FAR-02' },
      { id: 'f3', name: 'Vitamina C 1000mg Efervescente', category: 'Vitaminas', priceUSD: 3.80, tag: '🍊 Inmunidad', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&q=80', description: 'Tubo con 10 tabletas efervescentes sabor naranja.', sku: 'FAR-03' }
    ]
  },
  ferreteria: {
    name: 'Ferretería & Repuestos',
    label: 'Ferretería & Repuestos',
    icon: '🔧',
    description: 'Herramientas, material eléctrico, plomería y pinturas.',
    categories: ['Todos', 'Herramientas', 'Fijación', 'Eléctricos', 'Pinturas', 'Plomería'],
    sampleProducts: [
      { id: 'fe1', name: 'Cinta Métrica Profesional 5 Metros', category: 'Herramientas', priceUSD: 4.50, tag: '📏 Precisión', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80', description: 'Carcasa engomada de alto impacto con traba.', sku: 'FER-01' },
      { id: 'fe2', name: 'Tirro Plástico Aislante Negro 3M', category: 'Eléctricos', priceUSD: 1.20, tag: '⚡ Electricidad', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80', description: 'Cinta aislante para empalmes de hasta 600V.', sku: 'FER-02' },
      { id: 'fe3', name: 'Bombillo LED 12W Luz Blanca 6500K', category: 'Eléctricos', priceUSD: 1.80, tag: '💡 Ahorrador', prepTime: 'Inmediato', image: 'https://images.unsplash.com/photo-1550524514-9b69b5961e93?w=600&q=80', description: 'Rosca estándar E27 larga duración.', sku: 'FER-03' }
    ]
  }
};

const BRAND_PALETTES = [
  { id: 'slate', name: 'Grafito Klik', primary: '#1e293b', hover: '#0f172a', accent: '#334155', glow: 'rgba(30, 41, 59, 0.4)' },
  { id: 'emerald', name: 'Esmeralda', primary: '#059669', hover: '#047857', accent: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'petrol', name: 'Petróleo', primary: '#0e4f5a', hover: '#0a3d46', accent: '#15616d', glow: 'rgba(14, 79, 90, 0.4)' },
  { id: 'blue', name: 'Azul Real', primary: '#2563eb', hover: '#1d4ed8', accent: '#3b82f6', glow: 'rgba(37, 99, 235, 0.4)' },
  { id: 'sky', name: 'Cielo', primary: '#0284c7', hover: '#0369a1', accent: '#38bdf8', glow: 'rgba(2, 132, 199, 0.4)' },
  { id: 'amber', name: 'Ámbar Sol', primary: '#d97706', hover: '#b45309', accent: '#f59e0b', glow: 'rgba(217, 119, 6, 0.4)' },
  { id: 'ruby', name: 'Rubí', primary: '#dc2626', hover: '#b91c1c', accent: '#ef4444', glow: 'rgba(220, 38, 38, 0.4)' },
  { id: 'purple', name: 'Púrpura', primary: '#7c3aed', hover: '#6d28d9', accent: '#8b5cf6', glow: 'rgba(124, 58, 237, 0.4)' },
  { id: 'coral', name: 'Coral Cálido', primary: '#ea580c', hover: '#c2410c', accent: '#f97316', glow: 'rgba(234, 88, 12, 0.4)' }
];

const VENEZUELAN_BANKS = [
  '0102 - Banco de Venezuela',
  '0134 - Banesco Banco Universal',
  '0105 - Banco Mercantil',
  '0108 - Banco Provincial (BBVA)',
  '0191 - Banco Nacional de Crédito (BNC)',
  '0172 - Bancamiga Banco Universal',
  '0114 - Bancaribe',
  '0115 - Banco Exterior',
  '0163 - Banco del Tesoro',
  '0175 - Banco Bicentenario',
  '0151 - BFC Banco Fondo Común',
  '0137 - Banco Sofitasa',
  '0168 - Bancrecer'
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Clásica Especial 200g',
    category: 'Hamburguesas',
    priceUSD: 6.50,
    tag: '🔥 Más Vendido',
    prepTime: '8-10 min',
    image: '/packs/comida-street/hamburguesa.png',
    description: 'Carne 200g a la plancha, queso cheddar fundido, lechuga romana, tomate y salsas de la casa.',
    sku: 'HMB-01',
    ingredients: ['Carne Res 200g', 'Cheddar Fundido', 'Vegetales Frescos', 'Salsa de la Casa']
  },
  {
    id: '2',
    name: 'Perro Caliente Tradicional Con Todo',
    category: 'Perros',
    priceUSD: 2.50,
    tag: '🌭 Callejero',
    prepTime: '3-5 min',
    image: '/packs/comida-street/perro-caliente.png',
    description: 'Salchicha de primera, cebollita picada, repollo, lluvia de papitas crocantes, queso blanco y las 3 salsas.',
    sku: 'PER-01',
    ingredients: ['Salchicha de Primera', 'Cebollita y Repollo', 'Papitas Ralladas', 'Queso Blanco', '3 Salsas']
  },
  {
    id: '3',
    name: 'Pepito Mixto Gratinado 30cm',
    category: 'Hamburguesas',
    priceUSD: 8.50,
    tag: '🏆 Gigante',
    prepTime: '10-12 min',
    image: '/packs/comida-street/pepito.png',
    description: 'Pan artesanal suave de 30cm, lomito jugoso, pollo grille, papitas crocantes y queso de mano gratinado.',
    sku: 'PEP-01',
    ingredients: ['Pan Baguette 30cm', 'Lomito Tierno', 'Pechuga Pollo', 'Queso de Mano', 'Maíz']
  },
  {
    id: '4',
    name: 'Cachapa con Cochino Frito',
    category: 'Extras',
    priceUSD: 9.50,
    tag: '🥩 Tradicional',
    prepTime: '10-12 min',
    image: '/packs/comida-street/cachapa-con-cochino.png',
    description: 'Masa de maíz tierno recién molido, abundante queso de mano fresco, mantequilla llanera y porción de cochino frito crujiente.',
    sku: 'CAC-01',
    ingredients: ['Maíz Tierno', 'Queso de Mano Fresco', 'Cochino Frito Crujiente', 'Mantequilla Llanera']
  },
  {
    id: '5',
    name: 'Cachapa con Queso de Mano Doble',
    category: 'Extras',
    priceUSD: 6.00,
    tag: '🧀 Criollo',
    prepTime: '6-8 min',
    image: '/packs/comida-street/cachapa-con-queso.png',
    description: 'Cachapa dorada con doble rueda de queso de mano artesanal y mantequilla derretida.',
    sku: 'CAC-02',
    ingredients: ['Maíz Tierno', 'Doble Rueda Queso Mano', 'Mantequilla']
  },
  {
    id: '6',
    name: 'Mega Promo 5 Perros Calientes',
    category: 'Combos',
    priceUSD: 10.00,
    tag: '💥 Ahorro',
    prepTime: '8-10 min',
    image: '/packs/comida-street/combo-5-perros.png',
    description: '5 Perros calientes tradicionales completos con papitas, queso blanco y salsas variadas.',
    sku: 'CMB-01',
    ingredients: ['5x Perros Calientes', 'Papitas Ralladas', 'Queso Blanco', 'Salsas Tradicionales']
  },
  {
    id: '7',
    name: 'Combo 4 Perros + Refresco 1.5L',
    category: 'Combos',
    priceUSD: 11.50,
    tag: '👥 Familiar',
    prepTime: '8-10 min',
    image: '/packs/comida-street/combo-4-perros-refresco.png',
    description: '4 Perros calientes especiales con todo + 1 Refresco familiar de 1.5 litros bien frío.',
    sku: 'CMB-02',
    ingredients: ['4x Perros Especiales', '1x Refresco 1.5L Frío', 'Salsas Variadas']
  },
  {
    id: '8',
    name: 'Shawarma Mixto Libanés Especial',
    category: 'Hamburguesas',
    priceUSD: 5.50,
    tag: '🌯 Clásico',
    prepTime: '6-8 min',
    image: '/packs/comida-street/shawarma.png',
    description: 'Pan pita árabe tostado, carne marinada y pollo al trompo, lechuga, tomate, crema de ajo y salsa tártara.',
    sku: 'SHW-01',
    ingredients: ['Pan Pita Árabe', 'Carne y Pollo al Trompo', 'Crema de Ajo', 'Salsa Tártara']
  },
  {
    id: '9',
    name: 'Combo Shawarma + Papas + Refresco',
    category: 'Combos',
    priceUSD: 8.50,
    tag: '🍟 Combo Brutal',
    prepTime: '8-10 min',
    image: '/packs/comida-street/combo-shawarma.png',
    description: '1 Shawarma Mixto grande + 1 ración de papas fritas crocantes + 1 bebida personal fría.',
    sku: 'CMB-03',
    ingredients: ['1x Shawarma Mixto', '1x Ración Papas Fritas', '1x Bebida Personal']
  },
  {
    id: '10',
    name: 'Refresco Personal Frío 355ml',
    category: 'Bebidas',
    priceUSD: 1.50,
    tag: '🧊 Bien Frío',
    prepTime: 'Inmediato',
    image: '/packs/comida-street/refresco.png',
    description: 'Refresco frío a elección (Coca-Cola, Pepsi, Chinotto, Kolita) bien frío.',
    sku: 'BEB-01',
    ingredients: ['Lata / Botella 355ml', 'Bien Frío']
  }
];
RUBROS_CATALOG.comida.sampleProducts = SAMPLE_PRODUCTS;

const CATEGORIES = ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'];

const NOTE_PRESETS = [
  'Con todo (tradicional)',
  'Sin cebolla',
  'Sin salsas',
  'Extra salsa tártara',
  'Extra salsa de ajo',
  'Extra queso rallado',
  'Bien cocido / Dorado',
  'Para Llevar (Empaque térmico)'
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Consumidor Final', docId: 'V-00000000', phone: '', address: 'Consumo en Salón' },
  { id: '2', name: 'Carlos Rodríguez', docId: 'V-18456123', phone: '0414-1234567', address: 'Calle 5 con Av. Principal' },
  { id: '3', name: 'María Gómez', docId: 'V-22987654', phone: '0424-9876543', address: 'Urb. Los Rosales, Casa #14' },
  { id: '4', name: 'Inversiones Gourmet C.A.', docId: 'J-40987123-5', phone: '0212-9988776', address: 'Zona Industrial Galpón 4' }
];

interface PosOrder {
  id: string;
  orderNumber: string;
  type: 'local' | 'delivery' | 'llevar';
  status: 'en_cola' | 'listo' | 'despachado';
  paymentStatus: 'pagado' | 'por_cobrar';
  paymentMethod: string;
  items: CartItem[];
  totalUSD: number;
  totalVES: number;
  customer: Customer;
  table?: string;
  driverId?: string;
  driverName?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  timeFormatted: string;
}

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
  // 0. Pantalla de Bienvenida con Loader Animado (1s)
  const [showSplash, setShowSplash] = useState(false);

  // Splash desactivado para carga instantánea 0ms

  // 1. Tasa BCV y Modo de Consulta
  const [bcvRate, setBcvRate] = useState(871.37);
  const [bcvMode, setBcvMode] = useState<'auto' | 'manual'>('auto');
  const [isBcvEditing, setIsBcvEditing] = useState(false);
  const [customBcvInput, setCustomBcvInput] = useState('871.37');
  const [isFetchingBcv, setIsFetchingBcv] = useState(false);
  const [bcvToast, setBcvToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // 2. Navegación Principal
  const [activeTab, setActiveTab] = useState<'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 3. Modos de Vista y Tema (100% Dark Permanente)
  const [cardViewMode, setCardViewMode] = useState<'food' | 'lista'>('food');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [activePalette, setActivePalette] = useState('amber');
  const [stylePreset, setStylePreset] = useState<'street_pro' | 'gourmet_clean'>('street_pro');

  // 4. Drawers y Modales de Configuración
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showVisualPacksModal, setShowVisualPacksModal] = useState(false);
  const [showStreetAmbassadorModal, setShowStreetAmbassadorModal] = useState(false);
  const [menuQrUrl, setMenuQrUrl] = useState('');
  const [editingItemNotes, setEditingItemNotes] = useState<CartItem | null>(null);
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

  // Modalidad de Despacho en Cobro (Local, Delivery Pagado, Cobro en Destino)
  const [fulfillmentMode, setFulfillmentMode] = useState<'local' | 'delivery_paid' | 'delivery_cod'>('local');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('1');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState<string>('');

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

  // 8. Pasarela de Cobro y Métodos
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pago_movil' | 'cash_usd' | 'cash_ves' | 'card_debit' | 'zelle'>('pago_movil');
  const [pagoMovilRefInput, setPagoMovilRefInput] = useState('');
  const [cashUSDReceived, setCashUSDReceived] = useState<number>(0);
  const [cashVESReceived, setCashVESReceived] = useState<number>(0);
  const [cardVoucherRef, setCardVoucherRef] = useState('');
  const [zelleConfirmation, setZelleConfirmation] = useState('');
  const [completedSaleTicket, setCompletedSaleTicket] = useState<CompletedSaleTicket | null>(null);
  const [copiedPmAlert, setCopiedPmAlert] = useState(false);

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

  // 11. Carrito Persistente
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Hamburguesa Clásica Especial 200g', priceUSD: 6.50, qty: 2, category: 'Hamburguesas', notes: 'Sin cebolla, extra salsa de la casa', sku: 'HMB-01', image: SAMPLE_PRODUCTS[0].image },
    { id: '10', name: 'Refresco Personal Frío 355ml', priceUSD: 1.50, qty: 1, category: 'Bebidas', sku: 'BEB-01', image: SAMPLE_PRODUCTS[9].image }
  ]);

  // Consulta automática de la Tasa Oficial BCV Multi-Fuente con Respaldo Firestore (0 CORS)
  const fetchBcvRateAuto = async () => {
    setIsFetchingBcv(true);
    let resolvedRate: number | null = null;
    let resolvedSource = '';

    try {
      // 1. Prioridad 1: Servidor Local / API Route (Scraper directo a bcv.org.ve en tiempo real)
      try {
        const res = await fetch('/api/bcv/rate?refresh=true');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.rate === 'number' && data.rate > 0) {
            resolvedRate = data.rate;
            resolvedSource = data.source || 'Portal Oficial BCV (bcv.org.ve)';
          }
        }
      } catch {}

      // 2. Prioridad 2: Respaldo Cloud Firestore (0 CORS, colección canónica bcv_rates/latest y fallback system_config)
      if (!resolvedRate) {
        try {
          const cloudRate = await cloudSyncService.fetchLatestBcvRate();
          if (cloudRate && cloudRate.rate > 0) {
            resolvedRate = cloudRate.rate;
            resolvedSource = cloudRate.source || 'Respaldo Cloud';
          }
        } catch (e) {
          console.warn('[BCV] Firestore read fallback:', e);
        }
      }

      // 3. Prioridad 3: DolarAPI Venezuela
      if (!resolvedRate) {
        try {
          const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          if (res.ok) {
            const data = await res.json();
            const rate = data.promedio || data.precio || data.valor;
            if (typeof rate === 'number' && rate > 0) {
              resolvedRate = rate;
              resolvedSource = 'DolarAPI Venezuela';
            }
          }
        } catch {}
      }

      // 4. Prioridad 4: PyDolar Venezuela
      if (!resolvedRate) {
        try {
          const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.monitors?.usd?.price);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'PyDolar Venezuela';
            }
          }
        } catch {}
      }

      // 5. Prioridad 5: Open Exchange Rates VES
      if (!resolvedRate) {
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.rates?.VES);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'OpenExchange';
            }
          }
        } catch {}
      }

      // 6. Prioridad 6: Fawaz Ahmed Currency CDN
      if (!resolvedRate) {
        try {
          const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
          if (res.ok) {
            const data = await res.json();
            const val = parseFloat(data?.usd?.ves);
            if (!isNaN(val) && val > 0) {
              resolvedRate = val;
              resolvedSource = 'CurrencyCDN';
            }
          }
        } catch {}
      }

      if (resolvedRate && resolvedRate > 0) {
        const rounded = Math.round(resolvedRate * 100) / 100;
        setBcvRate(rounded);
        setCustomBcvInput(rounded.toFixed(2));
        try {
          localStorage.setItem('klikpos_bcv_rate', String(rounded));
          localStorage.setItem('klikpos_bcv_mode', 'auto');
          if (isFirebaseConfigured()) {
            cloudSyncService.pushBcvRate(rounded, resolvedSource).catch(() => {});
            setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
              rate: rounded,
              source: resolvedSource,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          }
        } catch {}

        setBcvToast({
          message: `✅ Tasa BCV Actualizada: Bs. ${rounded.toFixed(2)} (${resolvedSource})`,
          type: 'success'
        });
        setTimeout(() => setBcvToast(null), 4000);
      } else {
        setBcvToast({
          message: `⚠️ Conectado en modo offline. Tasa actual: Bs. ${bcvRate.toFixed(2)}`,
          type: 'info'
        });
        setTimeout(() => setBcvToast(null), 4000);
      }
    } catch {
      try {
        const saved = localStorage.getItem('klikpos_bcv_rate');
        if (saved) setBcvRate(parseFloat(saved));
      } catch {}
    } finally {
      setIsFetchingBcv(false);
    }
  };

  const handleSaveManualBcv = () => {
    const parsed = parseFloat(customBcvInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      const rounded = Math.round(parsed * 100) / 100;
      setBcvRate(rounded);
      setBcvMode('manual');
      setIsBcvEditing(false);
      try {
        localStorage.setItem('klikpos_bcv_rate', String(rounded));
        localStorage.setItem('klikpos_bcv_mode', 'manual');
        if (isFirebaseConfigured()) {
          cloudSyncService.pushBcvRate(rounded, 'Ajuste Manual en Terminal').catch(() => {});
          setDoc(doc(firestoreDb, 'system_config', 'bcv_rate'), {
            rate: rounded,
            source: 'Ajuste Manual en Terminal',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      } catch {}

      setBcvToast({
        message: `✅ Tasa manual fijada: Bs. ${rounded.toFixed(2)}`,
        type: 'info'
      });
      setTimeout(() => setBcvToast(null), 4000);
    }
  };

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
      if (savedMode === 'lista' || savedMode === 'food') {
        setCardViewMode(savedMode);
      } else {
        setCardViewMode('food');
      }
      localStorage.setItem('klikpos_street_theme', 'dark');
      localStorage.setItem('venematic_theme', 'dark');
      setThemeMode('dark');

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

      // 9. FUNCIÓN ESTRELLA: Iniciar Auto-Sincronización Periódica en Segundo Plano (Cada 1 Hora)
      cloudSyncService.startAutoSync(3600);
    } catch {
      // Continuar silenciosamente
    }
  }, []);

  // Sincronización radical del Modo Oscuro con el DOM (Full Dark Monolítico)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.removeAttribute('data-ui-style');
      document.body.style.backgroundColor = '#090d16';
      document.documentElement.style.backgroundColor = '#090d16';
    }
  }, [themeMode]);

  // Monitor del Período de Prueba de 15 Minutos
  useEffect(() => {
    const checkTrial = () => {
      const state = evaluateTrialState();
      setTrialState(state);
      if (state.isTrial && state.isExpired) {
        setShowLicenseModal(true);
      }
    };
    checkTrial();
    const timer = setInterval(checkTrial, 2000);
    return () => clearInterval(timer);
  }, []);

  // Guardar Cambios de Carrito, Vistas y Tema con Sincronización de Body/HTML
  useEffect(() => {
    try {
      localStorage.setItem('klikpos_card_view_mode', cardViewMode);
      localStorage.setItem('klikpos_tablet_cart', JSON.stringify(cart));
      localStorage.setItem('klikpos_street_theme', 'dark');
      localStorage.setItem('venematic_theme', 'dark');
      localStorage.setItem('venematic_branding_palette', activePalette);

      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.removeAttribute('data-ui-style');
      document.body.style.backgroundColor = '#090d16';
      document.documentElement.style.backgroundColor = '#090d16';
    } catch {}
  }, [cardViewMode, cart, themeMode, activePalette]);

  const currentPal = BRAND_PALETTES.find(p => p.id === activePalette) || BRAND_PALETTES[0];
  const isLight = false;
  const IS_LITE_MODE = true;

  // Cálculos Financieros
  const totalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.qty), 0);
  const totalVES = totalUSD * bcvRate;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // Vueltos en Efectivo
  const vueltoUSD = Math.max(0, cashUSDReceived - totalUSD);
  const vueltoVESfromUSD = vueltoUSD * bcvRate;
  const vueltoVESfromVES = Math.max(0, cashVESReceived - totalVES);

  const addToCart = (prod: Product) => {
    playDigitalTapSound();
    setCart((prev) => {
      const exists = prev.find((item) => item.id === prod.id);
      if (exists) {
        return prev.map((item) =>
          item.id === prod.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, {
        id: prod.id,
        name: prod.name,
        priceUSD: prod.priceUSD,
        qty: 1,
        category: prod.category,
        image: prod.image,
        sku: prod.sku
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    playDigitalTapSound();
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const getCartQty = (productId: string) => {
    const found = cart.find((i) => i.id === productId);
    return found ? found.qty : 0;
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
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
    try { localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated)); } catch {}
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
  const handleSaveFullProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated));
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

  // Copiar datos de Pago Móvil para el cliente
  const handleCopyPagoMovilData = () => {
    const text = `*DATOS PARA PAGO MÓVIL*\n` +
      `🏦 Banco: ${pagoMovilInfo.bank}\n` +
      `📱 Teléfono: ${pagoMovilInfo.phone}\n` +
      `📄 Cédula/RIF: ${pagoMovilInfo.idDoc}\n` +
      `👤 Titular: ${pagoMovilInfo.ownerName}\n` +
      `💰 Monto en Bs: Bs. ${totalVES.toFixed(2)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPmAlert(true);
      setTimeout(() => setCopiedPmAlert(false), 2500);
    }
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

  // Finalizar Venta y Generar Ticket
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      alert('La comanda está vacía. Agrega productos antes de liquidar.');
      return;
    }

    const ticketNo = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderNo = `PED-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });

    let refNumber = '';
    if (selectedPaymentMethod === 'pago_movil') refNumber = pagoMovilRefInput || 'S/R';
    else if (selectedPaymentMethod === 'card_debit') refNumber = cardVoucherRef || 'Lote-POS';
    else if (selectedPaymentMethod === 'zelle') refNumber = zelleConfirmation || 'Zelle-OK';

    const chosenDriver = drivers.find(d => d.id === selectedDriverId);

    const saleTicket: CompletedSaleTicket = {
      ticketNumber: ticketNo,
      timestamp: now,
      items: [...cart],
      subtotalUSD: totalUSD,
      totalUSD: totalUSD,
      totalVES: totalVES,
      bcvRate: bcvRate,
      paymentMethod: fulfillmentMode === 'delivery_cod' ? 'Cobro en Destino (Delivery)' : selectedPaymentMethod,
      reference: refNumber,
      amountReceivedUSD: selectedPaymentMethod === 'cash_usd' ? cashUSDReceived : undefined,
      changeUSD: selectedPaymentMethod === 'cash_usd' ? vueltoUSD : undefined,
      changeVES: selectedPaymentMethod === 'cash_usd' ? vueltoVESfromUSD : (selectedPaymentMethod === 'cash_ves' ? vueltoVESfromVES : undefined),
      customer: selectedCustomer,
      table: fulfillmentMode === 'local' ? (activeTable ? `Mesa #${activeTable}` : 'Barra / Mostrador') : `Delivery (${chosenDriver?.name || 'Motorizado'})`
    };

    // Crear registro de Pedido en Cola
    const newOrder: PosOrder = {
      id: 'ord_' + Date.now(),
      orderNumber: orderNo,
      type: fulfillmentMode === 'local' ? 'local' : 'delivery',
      status: 'en_cola',
      paymentStatus: fulfillmentMode === 'delivery_cod' ? 'por_cobrar' : 'pagado',
      paymentMethod: fulfillmentMode === 'delivery_cod' ? 'Cobro en Destino' : selectedPaymentMethod,
      items: [...cart],
      totalUSD: totalUSD,
      totalVES: totalVES,
      customer: selectedCustomer,
      table: fulfillmentMode === 'local' ? (activeTable ? `Mesa #${activeTable}` : 'Mostrador') : undefined,
      driverId: fulfillmentMode !== 'local' ? selectedDriverId : undefined,
      driverName: fulfillmentMode !== 'local' ? (chosenDriver?.name || 'Por Asignar') : undefined,
      deliveryAddress: fulfillmentMode !== 'local' ? (deliveryAddressInput || selectedCustomer.address || 'Entrega a Domicilio') : undefined,
      createdAt: new Date().toISOString(),
      timeFormatted: 'Ahora'
    };

    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    try {
      localStorage.setItem('klikpos_tablet_orders', JSON.stringify(nextOrders));
      const pastSales = JSON.parse(localStorage.getItem('klikpos_tablet_sales') || '[]');
      localStorage.setItem('klikpos_tablet_sales', JSON.stringify([saleTicket, ...pastSales.slice(0, 100)]));

      db.sales.add({
        receiptNumber: ticketNo,
        timestamp: new Date().toISOString(),
        items: cart.map(i => ({
          productId: Number(i.id) || 1,
          name: i.name,
          barcode: i.sku || 'SKU-00',
          qty: i.qty,
          priceUSD: i.priceUSD,
          totalUSD: i.priceUSD * i.qty
        })),
        subtotalUSD: totalUSD,
        taxUSD: 0,
        totalUSD: totalUSD,
        totalVES: totalVES,
        bcvRate: bcvRate,
        payments: [{
          method: (fulfillmentMode === 'delivery_cod' ? 'cash_usd' : selectedPaymentMethod) as any,
          amountUSD: totalUSD,
          amountVES: totalVES,
          reference: refNumber
        }],
        changeUSD: vueltoUSD,
        changeVES: vueltoVESfromUSD,
        cashierName: 'Cajero Tablet',
        customerName: selectedCustomer.name,
        customerDoc: selectedCustomer.docId,
        status: (fulfillmentMode === 'delivery_cod' ? 'pending' : 'completed') as any,
        source: 'tablet'
      }).catch(() => {});
    } catch {}

    setCompletedSaleTicket(saleTicket);
    setCart([]);
    setPagoMovilRefInput('');
    setCashUSDReceived(0);
    setCashVESReceived(0);
    setDeliveryAddressInput('');
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
      className="h-screen flex flex-col font-sans select-none overflow-hidden relative bg-[#070a12] text-slate-100 street-pos-dark-canvas"
      style={{
        backgroundColor: '#070a12',
        '--brand-color': currentPal.primary,
        '--brand-hover': currentPal.hover,
        '--brand-accent': currentPal.accent,
        '--brand-glow': currentPal.glow,
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
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
            dockSide === 'left' ? 'left-2.5' : 'right-2.5'
          }`}
        >
          {/* Cápsula Vertical Grafito Profundo con Cristal Translúcido y Micro-Tarjetas de Alto Contraste AAA */}
          <aside
            className="w-14 rounded-[32px] py-3.5 px-1.5 flex flex-col items-center justify-between shadow-2xl border select-none shrink-0 min-h-[440px] z-50 backdrop-blur-xl transition-all"
            style={{
              backgroundColor: 'rgba(9, 13, 22, 0.82)',
              borderColor: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Top: LayoutGrid Icon / Brand Pill */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.45)'
              }}
              title="KlikPOS Tools"
            >
              <LayoutGrid className="w-5 h-5 text-slate-950 font-black stroke-[2.4]" />
            </div>

            {/* Íconos Centrales de Acceso Directo con Contraste AAA y Micro-Fondos */}
            <div className="flex flex-col items-center gap-2.5 my-auto">
              {/* 1. Inventario & Stock */}
              <button
                onClick={() => setShowInventoryModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Gestión de Inventario & Stock"
              >
                <Package className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* 1b. Paquetes Visuales & Catálogos Cloud con Fotos HD */}
              <button
                onClick={() => setShowVisualPacksModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 hover:bg-cyan-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Librería Cloud de Paquetes Visuales & Fotos HD"
              >
                <ImageIcon className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* 2. Motorizados / Despacho (Opcional en Lite) */}
              {!IS_LITE_MODE && (
                <button
                  onClick={() => setShowDriversModal(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-300 bg-amber-500/25 border border-amber-400/40 hover:bg-amber-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                  title="Motorizados & Despacho Delivery"
                >
                  <Truck className="w-5 h-5 stroke-[2.2]" />
                </button>
              )}

              {/* 3. Impresora Térmica POS */}
              <button
                onClick={() => setShowPrinterModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-300 bg-sky-500/25 border border-sky-400/40 hover:bg-sky-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Configuración de Impresora POS"
              >
                <Printer className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* 4. Cambiar Rubro Comercial */}
              <button
                onClick={() => setShowRubroModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 bg-purple-500/25 border border-purple-400/40 hover:bg-purple-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Cambiar Rubro Comercial (Comida, Farmacia, Bodega, etc.)"
              >
                <Boxes className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* 5. Menú QR Dinámico para Clientes (Opcional en Lite) */}
              {!IS_LITE_MODE && (
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-300 bg-indigo-500/25 border border-indigo-400/40 hover:bg-indigo-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                  title="Generar Menú QR Digital para Clientes"
                >
                  <QrCode className="w-5 h-5 stroke-[2.2]" />
                </button>
              )}

              {/* 6. Módulo de Ventas & Respaldo */}
              <button
                onClick={() => setShowSalesBackupModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 hover:bg-emerald-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Módulo de Ventas & Respaldo (Diario, Semanal, Mensual)"
              >
                <TrendingUp className="w-5 h-5 stroke-[2.4]" />
              </button>

              {/* 7. Sincronizar Data */}
              <button
                onClick={() => setShowSyncModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 hover:bg-cyan-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Sincronizar Data (Tasa BCV, Ventas & Catálogo Cloud)"
              >
                <RefreshCw className="w-5 h-5 stroke-[2.4]" />
              </button>

              {/* 8. Actualizar Software */}
              <button
                onClick={() => setShowUpdateModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-300 bg-yellow-500/25 border border-yellow-400/40 hover:bg-yellow-500/40 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Actualizar Software (GitHub Release & APK)"
              >
                <Sparkles className="w-5 h-5 stroke-[2.4]" />
              </button>

              {/* 9. Ajustes & Configuración */}
              <button
                onClick={() => setIsLeftDrawerOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-100 bg-slate-800/90 border border-slate-600/70 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer group"
                title="Ajustes de Empresa & RIF"
              >
                <Settings className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Bottom: Alternar Lado (Izq/Der) y Colapsar */}
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 shrink-0 w-full">
              <button
                onClick={handleToggleDockSide}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-300 hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title={dockSide === 'left' ? 'Mover Docker a la Derecha' : 'Mover Docker a la Izquierda'}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDockerOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-90 transition-all cursor-pointer"
                title="Minimizar Docker"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER SUPERIOR CON TASA BCV INTERACTIVA Y CONTRASTE WCAG AAA          */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. HEADER SUPERIOR ELEGANTE Y PERFECTAMENTE ORGANIZADO                     */}
      {/* ========================================================================= */}
      <header
        className="h-14 px-3 flex items-center justify-between border-b shrink-0 z-20 shadow-xs bg-[#090d16] border-slate-800/90 text-white"
        style={{ backgroundColor: '#090d16' }}
      >
        {/* LADO IZQUIERDO: Logo KlikPOS Street + Acciones Principales */}
        <div className="flex items-center gap-2">
          {/* Logo KlikPOS Street Vector & Clean Branding */}
          <div 
            onClick={() => setIsLeftDrawerOpen(true)}
            className="flex flex-col leading-none select-none cursor-pointer group pr-0.5"
            title="KlikPOS Street"
          >
            <div className="flex items-baseline tracking-tight font-black text-lg">
              <span className="text-white">Klik</span>
              <span className="text-amber-500 group-hover:text-amber-400 transition-colors">POS</span>
            </div>
            <span className="text-[9px] font-extrabold text-amber-500/95 tracking-widest text-right -mt-0.5">
              Street
            </span>
          </div>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-800 hidden xs:block" />

          {/* Botón de Menú & Ajustes */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsLeftDrawerOpen(true)}
              className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white'
              }`}
              title="Menú & Ajustes"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTRO: Badge Tasa BCV Oficial (Una Sola Línea, Sin Romper Texto) */}
        <div className="flex items-center justify-center mx-1">
          {isBcvEditing ? (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-xs">
              <span className="text-[11px] font-mono font-bold text-slate-400">Bs.</span>
              <input
                type="number"
                step="0.01"
                value={customBcvInput}
                onChange={(e) => setCustomBcvInput(e.target.value)}
                className="w-16 text-xs font-mono font-black text-slate-900 dark:text-white bg-transparent outline-none"
              />
              <button
                onClick={handleSaveManualBcv}
                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black cursor-pointer"
              >
                ✓
              </button>
              <button
                onClick={() => setIsBcvEditing(false)}
                className="px-1 py-0.5 text-slate-400 text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsBcvEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-mono font-bold shadow-xs whitespace-nowrap cursor-pointer select-none ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                  : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-100'
              }`}
              title="Toca para editar tasa BCV manualmente"
            >
              <span className="text-[10px] font-black text-sky-500 tracking-wider">BCV:</span>
              <span className="font-black text-xs" style={{ color: isLight ? '#0f172a' : '#38bdf8' }}>
                Bs. {bcvRate.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchBcvRateAuto();
                }}
                disabled={isFetchingBcv}
                className="p-0.5 hover:text-sky-400 text-slate-400 transition-colors cursor-pointer"
                title="Actualizar tasa oficial BCV"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingBcv ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          )}

          {/* Botón: Sincronizar Data */}
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-black text-xs transition-all active:scale-95 shadow-xs cursor-pointer select-none"
            title="Sincronizar Data (Tasa BCV, Ventas & Catálogo Cloud)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Sincronizar Data</span>
          </button>

          {/* Botón: Actualizar Software */}
          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-black text-xs transition-all active:scale-95 shadow-xs cursor-pointer select-none"
            title="Actualizar Software desde GitHub Releases"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Actualizar Software</span>
          </button>
        </div>

        {/* LADO DERECHO: Carrito / Comanda Activa */}
        <div className="flex items-center gap-1.5">
          {trialState?.isTrial && (
            <button
              onClick={() => setShowLicenseModal(true)}
              className="hidden md:flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-mono font-bold"
            >
              <span>⏱️ {trialState.remainingMinutes}m</span>
            </button>
          )}

          <button
            onClick={() => setIsRightDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-950 font-black text-xs transition-all duration-200 relative active:scale-95 shadow-md cursor-pointer"
            style={{ backgroundColor: currentPal.primary }}
            title="Ver Comanda Activa"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
            <span className="font-mono text-xs font-black">${totalUSD.toFixed(2)}</span>
            {totalItems > 0 && (
              <span className="bg-slate-950 text-amber-400 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full shadow-xs anim-badge-spring">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notificación Flotante de Tasa BCV Oficial */}
      {bcvToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3 max-w-6xl mx-auto w-full street-pos-dark-canvas" style={{ backgroundColor: "#070a12" }}>
        {/* ======================================================================= */}
        {/* VISTA 1: MENÚ Y CATÁLOGO TÁCTIL (GRID ADAPTATIVO TABLET & MODO LISTA)   */}
        {/* ======================================================================= */}
        {activeTab === 'menu' && (
          <div className="flex-1 min-h-0 flex flex-col space-y-2 street-pos-dark-canvas" style={{ backgroundColor: '#070a12' }}>
            {/* 1. Barra de Búsqueda + Selector de Vista (Cuadrícula / Lista) + Selector de Tema */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Buscador */}
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar producto o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border transition-colors outline-none font-semibold bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Selector de Modos: Cuadrícula Adaptativa / Lista */}
                <div className="flex items-center p-0.5 rounded-xl border shrink-0 bg-slate-900 border-slate-800">
                  <button
                    onClick={() => setCardViewMode('food')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      cardViewMode === 'food'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vista Cuadrícula Adaptativa"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cuadrícula</span>
                  </button>
                  <button
                    onClick={() => setCardViewMode('lista')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      cardViewMode === 'lista'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vista Lista con Cards Grandes"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                </div>

                {/* Visualización Exclusiva: Street Pro */}
                <div className="flex items-center shrink-0">
                  <span
                    className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1 select-none"
                    title="Visualización Street Pro Oficial"
                  >
                    🔥 Street Pro
                  </span>
                </div>
              </div>

              {/* Píldoras de Categorías */}
              <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 border active:scale-95 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ================================================================= */}
            {/* MODO 1: CUADRÍCULA ADAPTATIVA (2 COLS MÓVIL, 3-5 COLS EN TABLET)  */}
            {/* ================================================================= */}
            {cardViewMode === 'food' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area bg-[#070a12]" style={{ backgroundColor: "#070a12" }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                  {filteredProducts.map((prod) => {
                    const qtyInCart = getCartQty(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className="group border rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.96] active:brightness-110 active:border-amber-400 select-none shadow-md bg-[#0e1726] border-slate-800 hover:border-amber-500/50"
                      >
                        <div className="relative h-24 sm:h-28 w-full bg-slate-900/80 flex items-center justify-center p-2 overflow-hidden">
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
                            <h3 className="text-[12px] font-black line-clamp-1 leading-tight text-white">
                              {prod.name}
                            </h3>
                            <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                              {prod.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
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
            {/* MODO 2: LISTA CON CARDS GRANDES PARA TABLET                       */}
            {/* ================================================================= */}
            {cardViewMode === 'lista' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area bg-[#070a12]" style={{ backgroundColor: "#070a12" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredProducts.map((prod) => {
                    const qtyInCart = getCartQty(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className="p-3 border rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.98] active:brightness-105 active:border-amber-400 select-none shadow-sm bg-slate-900/90 border-slate-800 hover:border-amber-500/40"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900/80 border border-slate-700 flex items-center justify-center p-1.5">
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
                            <h4 className="text-xs font-black truncate text-white mt-0.5">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <ClipboardList className="w-4 h-4" style={{ color: currentPal.primary }} />
                  <span>Control de Pedidos & Despachos</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  {orders.filter(o => o.status === 'en_cola').length} en cola • {orders.filter(o => o.status === 'listo').length} listos • {orders.filter(o => o.status === 'despachado').length} despachados
                </p>
              </div>

              {/* Filtros de Tipo y Estado */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Filtro por Tipo */}
                <div className="flex items-center p-0.5 rounded-xl border border-slate-800 bg-slate-900">
                  {(['todos', 'local', 'delivery'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderFilterType(t)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        orderFilterType === t
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'todos' ? 'Todos' : t === 'local' ? 'Local' : 'Delivery'}
                    </button>
                  ))}
                </div>

                {/* Filtro por Estado */}
                <div className="flex items-center p-0.5 rounded-xl border border-slate-800 bg-slate-900">
                  {(['todos', 'en_cola', 'listo', 'despachado'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilterStatus(st)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        orderFilterStatus === st
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
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
                  <div className="text-center py-12 text-slate-400 text-xs italic border border-slate-800/80 rounded-2xl bg-slate-900/40">
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
                          isEnCola ? 'bg-[#0f172a] border-amber-500/40' :
                          isListo ? 'bg-[#0f172a] border-sky-500/40' :
                          'bg-slate-900/80 border-slate-800 opacity-90'
                        }`}
                      >
                        {/* Cabecera del Pedido */}
                        <div className="space-y-1.5 pb-2 border-b border-slate-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-black text-amber-400">
                                {ord.orderNumber}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isDelivery ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {isDelivery ? 'Delivery' : (ord.table || 'Local')}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400">
                              {ord.timeFormatted}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">
                              {ord.customer?.name || 'Cliente'}
                            </span>
                            <div className="text-right">
                              <span className="font-mono font-black text-amber-400">
                                ${ord.totalUSD.toFixed(2)}
                              </span>
                              <span className="text-[9.5px] font-mono text-slate-400 block">
                                Bs. {(ord.totalUSD * bcvRate).toFixed(0)}
                              </span>
                            </div>
                          </div>

                          {/* Estado de Pago */}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Pago: <b className="text-slate-300">{ord.paymentMethod}</b>
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              isPendingPayment
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {isPendingPayment ? 'Por Cobrar en Destino' : 'Pagado'}
                            </span>
                          </div>

                          {/* Dirección / Motorizado si es Delivery */}
                          {isDelivery && (
                            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[10px] font-mono text-slate-300">
                              {ord.driverName && (
                                <p className="flex items-center gap-1 text-purple-300">
                                  <Bike className="w-3 h-3" />
                                  <span>Chofer: <b>{ord.driverName}</b></span>
                                </p>
                              )}
                              {ord.deliveryAddress && (
                                <p className="flex items-start gap-1 text-slate-400">
                                  <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
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
                              <div className="truncate pr-2 text-slate-200">
                                <span className="font-mono font-bold text-amber-400">{it.qty}x</span> {it.name}
                                {it.notes && (
                                  <span className="block text-[9.5px] text-amber-300 italic font-sans pl-4">
                                    Nota: {it.notes}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-400 shrink-0 text-[11px]">
                                ${(it.priceUSD * it.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Botones de Transición de Estado */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
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
                            <div className="w-full py-1.5 bg-slate-800/80 text-emerald-400 rounded-xl text-xs font-black text-center border border-emerald-500/20">
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
            <div className="border rounded-2xl p-4 space-y-3 shadow-xs bg-slate-900 border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider block text-white">
                Modalidad de Entrega / Despacho:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'local', label: 'En Local / Mesa', desc: 'Consumo en salón o mostrador', icon: Store, color: 'text-emerald-400' },
                  { id: 'delivery_paid', label: 'Delivery Pagado', desc: 'Cobrado previo al despacho', icon: Bike, color: 'text-sky-400' },
                  { id: 'delivery_cod', label: 'Cobro en Destino', desc: 'El chofer cobra al entregar', icon: Truck, color: 'text-amber-400' },
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
                          ? 'border-2 bg-[#0f172a] shadow-md'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                      }`}
                      style={{
                        borderColor: isSelected ? currentPal.primary : undefined,
                      }}
                    >
                      <Icon className={`w-5 h-5 ${mode.color}`} />
                      <span className="text-[11px] font-black text-white leading-tight">
                        {mode.label}
                      </span>
                      <span className="text-[9px] text-slate-400 leading-tight">
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Parámetros de Delivery si aplica */}
              {fulfillmentMode !== 'local' && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Asignar Motorizado / Chofer:
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none bg-slate-900 border-slate-700 text-white"
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
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Dirección o Punto de Referencia:
                    </label>
                    <input
                      type="text"
                      placeholder={selectedCustomer.address || 'Ej. Urb. Los Rosales, Calle 3, Casa #14'}
                      value={deliveryAddressInput}
                      onChange={(e) => setDeliveryAddressInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DATOS DEL CLIENTE / FACTURACIÓN */}
            <div className="border rounded-2xl p-4 space-y-2.5 shadow-xs bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <User className="w-4 h-4" style={{ color: currentPal.primary }} />
                  <span>Datos del Cliente / Facturación</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="text-xs font-black hover:underline flex items-center gap-1 active:scale-95"
                  style={{ color: currentPal.primary }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cambiar / + Nuevo</span>
                </button>
              </div>

              <div className="p-3 rounded-xl border flex items-center justify-between bg-slate-950 border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-white">
                    {selectedCustomer.name}
                  </h4>
                  <div className="flex gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>Doc: <b>{selectedCustomer.docId}</b></span>
                    {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-bold text-slate-300">
                  Seleccionado
                </span>
              </div>
            </div>

            {/* SECCIÓN 3: SELECTOR DE MÉTODO DE PAGO */}
            <div className="border rounded-2xl p-4 space-y-3 shadow-xs bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider block text-white">
                  {fulfillmentMode === 'delivery_cod' ? 'Método Acordado en Destino:' : 'Selecciona Método de Pago:'}
                </span>
                {fulfillmentMode === 'delivery_cod' && (
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
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
                        onClick={handleCopyPagoMovilData}
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
            </div>

            {/* BOTÓN FINAL DE LIQUIDACIÓN Y GENERACIÓN DE TICKET */}
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0}
              className="w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: currentPal.primary }}
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Confirmar Venta y Generar Ticket</span>
            </button>
          </div>
        )}
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
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenCobro={() => setActiveTab('cobro')}
        onOpenQrModal={() => setShowQrModal(true)}
        onToggleOrderDrawer={() => setIsRightDrawerOpen((prev) => !prev)}
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
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
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
                    <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Datos de la Empresa
                    </h4>
                    <p className="text-[10px] text-slate-500">Nombre, RIF, Teléfono, Dirección</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* SECCIÓN 2: DATOS DE PAGO MÓVIL (REQUERIMIENTO EXPLÍCITO) */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowPagoMovilModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-emerald-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Datos de Pago Móvil
                    </h4>
                    <p className="text-[10px] text-slate-500">Banco, Teléfono, Cédula/RIF</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* SECCIÓN 3: GESTIÓN DE CLIENTES */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowCustomerModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-sky-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                      Cartera de Clientes
                    </h4>
                    <p className="text-[10px] text-slate-500">{customers.length} Registrados</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* SECCIÓN 3B: LIBRERÍA CLOUD DE PAQUETES VISUALES & CATÁLOGOS */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowVisualPacksModal(true);
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-96 shadow-2xs ${
                  isLight ? 'bg-sky-50/70 hover:bg-sky-100/90 border-sky-200' : 'bg-sky-950/40 hover:bg-sky-900/60 border-sky-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shrink-0 shadow-xs bg-gradient-to-tr from-sky-600 to-indigo-600">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                        Paquetes Visuales & Catálogos
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-sky-500/20 text-sky-500">
                        Cloud
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Descargar fotos HD, rubros y códigos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-500" />
              </button>

              {/* SECCIÓN 4: BRANDING Y COLORES */}
              <div className={`p-3 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    <Palette className="w-4 h-4" style={{ color: currentPal.primary }} />
                    <span>Colores de Marca</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
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
                        borderColor: activePalette === pal.id ? pal.primary : isLight ? '#e2e8f0' : '#1e293b'
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

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Lienzo:</span>
                  <button
                    onClick={() => {
                      const next = themeMode === 'light' ? 'dark' : 'light';
                      setThemeMode(next);
                      try { localStorage.setItem('venematic_theme', next); } catch {}
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#1e293b',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      color: isLight ? '#0f172a' : '#ffffff'
                    }}
                  >
                    {isLight ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isLight ? 'Modo Oscuro' : 'Blanco Oficial'}</span>
                  </button>
                </div>
              </div>

              {/* Botón QR */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowQrModal(true);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4 text-sky-500" />
                <span>Mostrar Menú Digital QR</span>
              </button>

              {/* Planes & Financiación Embajadores */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowStreetAmbassadorModal(true);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Planes Comerciales ($15 / $25)</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Oferta</span>
              </button>

              {/* Presentación Comercial para Clientes */}
              <a
                href="/presentacion"
                target="_blank"
                rel="noreferrer"
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-950/40 border-sky-800 text-sky-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-500" />
                  <span>Presentación para Clientes</span>
                </div>
                <span className="text-[10px] text-sky-600 font-mono font-bold">Sliders →</span>
              </a>

              {/* Licencia Oficial */}
              <button
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setShowLicenseModal(true);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Activar Clave de Licencia</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Oficial</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 font-mono">
              KlikPOS v2.4.5 • Blanco & Grafito
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
            className="relative w-full max-w-[380px] border-l border-white/10 h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-right text-white"
            style={{
              backgroundColor: '#090d16',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {activeTable ? `Mesa #${activeTable}` : 'Comanda Actual'}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer border border-white/10"
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
                      className="p-3 rounded-2xl border border-white/10 bg-[#111726] hover:border-white/20 space-y-2 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 pr-1">
                          <h4 className="text-xs font-black text-white leading-tight">
                            {item.name}
                          </h4>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            ${item.priceUSD.toFixed(2)} <span className="text-slate-400 font-normal">c/u</span>
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-white shrink-0">
                          ${(item.priceUSD * item.qty).toFixed(2)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[10px] text-amber-300 italic bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/30">
                          📝 {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                        <button
                          onClick={() => setEditingItemNotes(item)}
                          className="text-[11px] text-slate-400 hover:text-amber-400 underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.notes ? 'Editar Nota' : '+ Nota'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center text-xs font-black active:scale-90 transition-all cursor-pointer"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-mono font-black w-5 text-center text-emerald-400">
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
              <div className="pt-3 border-t border-white/10 space-y-3 shrink-0">
                <div className="p-3 rounded-2xl bg-[#06080e] border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold">Total USD:</span>
                    <span className="font-mono font-black text-lg text-emerald-400">
                      ${totalUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400 font-medium">Total Bs (BCV):</span>
                    <span className="font-mono font-black text-sm text-amber-300">
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
                    className="py-3 px-3 active:scale-95 text-xs font-bold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1"
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
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowCompanyModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" style={{ color: currentPal.primary }} />
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Datos de la Empresa y Tickets
              </h3>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nombre Comercial / Razón Social:
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    RIF / Identificación Fiscal:
                  </label>
                  <input
                    type="text"
                    required
                    value={companyInfo.rif}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, rif: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Teléfono del Negocio:
                  </label>
                  <input
                    type="text"
                    required
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Dirección Física del Establecimiento:
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Mensaje al Pie del Recibo:
                </label>
                <input
                  type="text"
                  value={companyInfo.footerMsg}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, footerMsg: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all mt-2"
                style={{ backgroundColor: currentPal.primary }}
              >
                Guardar Datos de Empresa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL CONFIGURACIÓN DE PAGO MÓVIL (BANCO, TELÉFONO, CÉDULA, TITULAR)     */}
      {/* ========================================================================= */}
      {showPagoMovilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowPagoMovilModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Configurar Datos de Pago Móvil
              </h3>
            </div>

            <form onSubmit={handleSavePagoMovil} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Banco Receptor:
                </label>
                <select
                  value={pagoMovilInfo.bank}
                  onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, bank: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {VENEZUELAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Teléfono Pago Móvil:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 04248298026"
                    value={pagoMovilInfo.phone}
                    onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Cédula / RIF Titular:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: V-20123456"
                    value={pagoMovilInfo.idDoc}
                    onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, idDoc: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nombre del Titular de la Cuenta:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre o Razón Social registrada en el banco"
                  value={pagoMovilInfo.ownerName}
                  onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, ownerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-500 mt-2"
              >
                Guardar Datos de Pago Móvil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL GESTIÓN Y REGISTRO RÁPIDO DE CLIENTES                             */}
      {/* ========================================================================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <User className="w-5 h-5" style={{ color: currentPal.primary }} />
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Seleccionar o Registrar Cliente
              </h3>
            </div>

            {/* Formulario de Nuevo Cliente */}
            <form onSubmit={handleCreateCustomer} className={`p-3 rounded-2xl border space-y-2 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                + Agregar Nuevo Cliente:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre / Razón Social *"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none font-bold ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Cédula / RIF *"
                  required
                  value={newCustomerForm.docId}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, docId: e.target.value })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Teléfono (Opcional)"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="submit"
                  className="py-1.5 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-xs"
                  style={{ backgroundColor: currentPal.primary }}
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>

            {/* Buscador de Clientes Existentes */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o cédula..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>

            {/* Lista de Clientes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {customers
                .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.docId.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setShowCustomerModal(false);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                      selectedCustomer.id === cust.id
                        ? 'border-2 shadow-xs'
                        : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                    }`}
                    style={{
                      borderColor: selectedCustomer.id === cust.id ? currentPal.primary : undefined
                    }}
                  >
                    <div>
                      <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                        {cust.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {cust.docId} {cust.phone && `• ${cust.phone}`}
                      </span>
                    </div>
                    {selectedCustomer.id === cust.id && (
                      <Check className="w-4 h-4" style={{ color: currentPal.primary }} />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Gestor de Inventario y Precios
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {products.length} productos en el catálogo activo • Precios en tiempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInventoryModal(false);
                    setShowVisualPacksModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-[11px] font-black shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Descargar paquetes de productos completos con fotos HD"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paquetes con Fotos HD</span>
                </button>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
              {/* Formulario de Alta Rápida de Producto */}
              <form onSubmit={handleAddProduct} className={`p-3.5 rounded-2xl border space-y-3 ${
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

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      {/* Vista previa de la foto */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center relative shadow-xs">
                        {newProductForm.image ? (
                          <img
                            src={newProductForm.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                            <Camera className="w-5 h-5 text-slate-400 mb-0.5" />
                            <span className="text-[8px] font-bold">Sin foto</span>
                          </div>
                        )}
                      </div>

                      {/* Inputs: URL directa y botón de subir archivo / foto */}
                      <div className="flex-1 w-full space-y-1.5">
                        <input
                          type="url"
                          placeholder="Pegar enlace de imagen https://... (opcional)"
                          value={newProductForm.image}
                          onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                          className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-medium ${
                            isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black rounded-lg cursor-pointer transition-all border border-slate-700 active:scale-95">
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>Subir Archivo / Tomar Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    if (typeof evt.target?.result === 'string') {
                                      setNewProductForm({ ...newProductForm, image: evt.target.result });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          <span className="text-[9.5px] text-slate-500">
                            {newProductForm.image ? '✓ Foto lista' : 'Si no eliges foto, se asignará una automáticamente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar en Inventario</span>
                  </button>
                </div>
              </form>

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
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="border rounded-3xl p-5 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative bg-slate-900 border-slate-800 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Editar Producto
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Actualiza imagen, precio, categoría y detalles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullProductEdit} className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
              {/* Foto del Producto */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Foto del Producto</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center relative shadow-xs">
                    {editingProduct.image ? (
                      <img
                        src={editingProduct.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="URL de imagen https://..."
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none bg-slate-950 border-slate-700 text-white"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black rounded-lg cursor-pointer transition-all border border-slate-700 active:scale-95">
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (typeof evt.target?.result === 'string') {
                                  setEditingProduct({ ...editingProduct, image: evt.target.result });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {editingProduct.image && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Quitar Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-bold bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Precio ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.priceUSD}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold bg-slate-950 border-slate-700 text-amber-400"
                  />
                </div>
              </div>

              {/* Categoría, SKU y Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-bold bg-slate-950 border-slate-700 text-white"
                  >
                    {categoriesList.filter(c => c !== 'Todos').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Código / SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Etiqueta / Badge</label>
                  <input
                    type="text"
                    value={editingProduct.tag || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold bg-slate-950 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Descripción / Detalles de Cocina */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Descripción / Ingredientes</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Detalla los ingredientes o modo de preparación..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs border outline-none bg-slate-950 border-slate-700 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13c. MODAL 2: GESTIÓN DE MOTORIZADOS & DESPACHOS                          */}
      {/* ========================================================================= */}
      {showDriversModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-5 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Motorizados y Delivery WhatsApp
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Despacha pedidos en 1 clic directamente al teléfono de tus repartidores
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriversModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
              {/* Formulario de Alta Rápida de Motorizado */}
              <form onSubmit={handleAddDriver} className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Registrar Nuevo Chofer
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Daniel Pérez"
                      value={newDriverForm.name}
                      onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Teléfono WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="04121234567"
                      value={newDriverForm.phone}
                      onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Vehículo / Placa</label>
                    <input
                      type="text"
                      placeholder="Bera SBR Azul / AE34F"
                      value={newDriverForm.vehicle}
                      onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicle: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar Motorizado</span>
                  </button>
                </div>
              </form>

              {/* Lista de Motorizados */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Choferes Afiliados ({drivers.length})
                </span>

                <div className="space-y-2">
                  {drivers.map((d) => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                              {d.name}
                            </h4>
                            <button
                              onClick={() => handleToggleDriverStatus(d.id)}
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                d.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-600' :
                                d.status === 'en_ruta' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-slate-150 text-slate-500'
                              }`}
                            >
                              {d.status}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {d.vehicle} • WhatsApp: {d.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDispatchOrderWhatsApp(d.phone, d.name)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                          title="Enviar comanda activa por WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDriver(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Eliminar chofer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDriversModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl"
              >
                Cerrar Motorizados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13d. MODAL 3: CONFIGURACIÓN DE IMPRESORA POS TÉRMICA                      */}
      {/* ========================================================================= */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-5 max-w-md w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Impresora Térmica POS
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tickets de comanda y recibos fiscales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrinterConfig} className="space-y-4 py-4">
              {/* Tipo de Conexión */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Tipo de Conexión</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bluetooth', 'lan', 'usb'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPrinterConfig({ ...printerConfig, connection: type })}
                      className={`py-2 px-2 rounded-xl border text-xs font-black uppercase transition-all ${
                        printerConfig.connection === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {type === 'lan' ? 'Red LAN' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parámetros de Red LAN si aplica */}
              {printerConfig.connection === 'lan' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">IP de la Impresora</label>
                    <input
                      type="text"
                      value={printerConfig.ip || '192.168.1.200'}
                      onChange={(e) => setPrinterConfig({ ...printerConfig, ip: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Puerto (Default 9100)</label>
                    <input
                      type="number"
                      value={printerConfig.port || 9100}
                      onChange={(e) => setPrinterConfig({ ...printerConfig, port: parseInt(e.target.value) || 9100 })}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Ancho del Papel */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Ancho del Papel Térmico</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['58mm', '80mm'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPrinterConfig({ ...printerConfig, paperWidth: w })}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all ${
                        printerConfig.paperWidth === w
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {w} (Formato Estándar)
                    </button>
                  ))}
                </div>
              </div>

              {/* Alerta de prueba de impresión */}
              {printerTestAlert && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Comando de prueba enviado exitosamente a la impresora!</span>
                </div>
              )}

              {/* Botón de prueba y guardado */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Ticket Prueba</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Guardar Impresora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13e. MODAL 4: SELECTOR DE RUBRO COMERCIAL                                 */}
      {/* ========================================================================= */}
      {showRubroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Seleccionar Rubro Comercial
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Adapta categorías y productos de muestra con 1 solo toque
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRubroModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {(Object.keys(RUBROS_CATALOG) as RubroId[]).map((rubroKey) => {
                const r = RUBROS_CATALOG[rubroKey];
                const isSelected = activeRubro === rubroKey;
                return (
                  <button
                    key={rubroKey}
                    type="button"
                    onClick={() => handleSelectRubro(rubroKey)}
                    className={`p-4 rounded-2xl border text-left transition-all active:scale-98 flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-md ring-2 ring-purple-500/30'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{r.icon}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white">
                          Rubro Activo
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                        {r.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {r.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.categories.filter(c => c !== 'Todos').slice(0, 4).map((c) => (
                        <span key={c} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRubroModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
        currentVersion="v1.0.0"
      />

      {/* ========================================================================= */}
      {/* 17. MODAL DE SINCRONIZACIÓN DE DATA (BCV 4 PROVEEDORES + FIRESTORE)       */}
      {/* ========================================================================= */}
      <DataSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
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

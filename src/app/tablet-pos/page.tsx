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
  Truck
} from 'lucide-react';
import LicenseActivationModal from '@/components/LicenseActivationModal';
import { evaluateTrialState, TrialState } from '@/lib/licensing/trial-manager';
import { db } from '@/lib/db';

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
    name: 'Hamburguesa Doble Especial',
    category: 'Hamburguesas',
    priceUSD: 6.50,
    tag: '🔥 Más Vendido',
    prepTime: '8-10 min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    description: 'Carne 200g, doble queso cheddar fundido, tocineta crujiente, vegetales frescos y salsa especial.',
    sku: 'HMB-01',
    ingredients: ['Carne Res 200g', 'Cheddar Fundido', 'Tocineta Ahumada', 'Salsa de la Casa']
  },
  {
    id: '2',
    name: 'Perro Caliente Especial Jumbo',
    category: 'Perros',
    priceUSD: 3.50,
    tag: '⭐ Favorito',
    prepTime: '4-6 min',
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&q=80',
    description: 'Salchicha polaca premium, lluvia de queso blanco rallado, papitas crocantes y combo de 4 salsas.',
    sku: 'PER-01',
    ingredients: ['Salchicha Polaca', 'Queso Rallado', 'Papitas Rellenas', '4 Salsas']
  },
  {
    id: '3',
    name: 'Combo Parrillero Mixto XL',
    category: 'Combos',
    priceUSD: 12.00,
    tag: '💥 Ahorro',
    prepTime: '12-15 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    description: 'Lomito de res, pechuga a la brasa, chorizo ahumado, papas rústicas, ensalada cole slaw y guasacaca.',
    sku: 'CMB-01',
    ingredients: ['Lomito Res', 'Pechuga Grille', 'Chorizo Ahumado', 'Papas Rústicas']
  },
  {
    id: '4',
    name: 'Papas Fritas Gratinadas Tocineta',
    category: 'Extras',
    priceUSD: 4.00,
    tag: '🥓 Crujiente',
    prepTime: '6-8 min',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
    description: 'Canasta de papas fritas recién hechas bañadas en salsa cheddar y tocineta ahumada picada.',
    sku: 'EXT-01',
    ingredients: ['Papas Corte Grueso', 'Cheddar Caliente', 'Tocineta Crispy']
  },
  {
    id: '5',
    name: 'Pepito Mixto Gratinado 30cm',
    category: 'Hamburguesas',
    priceUSD: 8.50,
    tag: '🏆 Gigante',
    prepTime: '10-12 min',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
    description: 'Pan artesanal de 30cm, lomito jugoso, pollo grille, queso de mano gratinado, maíz y papitas.',
    sku: 'PEP-01',
    ingredients: ['Lomito Tierno', 'Pechuga Pollo', 'Queso de Mano', 'Maíz Tierno']
  },
  {
    id: '6',
    name: 'Refresco Familiar 1.5L Frío',
    category: 'Bebidas',
    priceUSD: 2.50,
    tag: '🧊 Bien Frío',
    prepTime: 'Inmediato',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
    description: 'Coca-Cola, Pepsi, Chinotto o Frescolita a temperatura bajo cero.',
    sku: 'BEB-01',
    ingredients: ['Envase 1.5 Litros', 'Bien Frío']
  },
  {
    id: '7',
    name: 'Tequeños Gourmet de Queso (6 uds)',
    category: 'Extras',
    priceUSD: 4.50,
    tag: '🧀 Crujientes',
    prepTime: '5-7 min',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
    description: 'Masa fina dorada rellena de abundante queso llanero fundido acompañado de salsa tártara de ajo.',
    sku: 'EXT-02',
    ingredients: ['6 Unidades Grandes', 'Queso Llanero Fundido', 'Salsa Tártara']
  },
  {
    id: '8',
    name: 'Crispy Chicken Supreme Burger',
    category: 'Hamburguesas',
    priceUSD: 7.00,
    tag: '🍗 Pollo Crispy',
    prepTime: '8-10 min',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80',
    description: 'Pechuga de pollo súper crujiente marinada con especias, lechuga romana, pepinillos y mayonesa chipotle.',
    sku: 'HMB-02',
    ingredients: ['Pechuga Empanizada', 'Lechuga Romana', 'Pepinillos Dulces', 'Mayo Chipotle']
  },
  {
    id: '9',
    name: 'Perro Caliente Tradicional Con Todo',
    category: 'Perros',
    priceUSD: 2.50,
    tag: '🌭 Callejero',
    prepTime: '3-5 min',
    image: 'https://images.unsplash.com/photo-1627054234036-749e4975f284?w=600&q=80',
    description: 'El clásico de la noche: salchicha, cebolla picadita, repollo, papitas, queso blanco y las 3 salsas.',
    sku: 'PER-02',
    ingredients: ['Salchicha Viena', 'Repollo y Cebollita', 'Queso Blanco', '3 Salsas Tradicionales']
  },
  {
    id: '10',
    name: 'Combo Pareja (2 Burgers + Papas + 2 Bebidas)',
    category: 'Combos',
    priceUSD: 14.50,
    tag: '👥 Para Dos',
    prepTime: '10-14 min',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',
    description: '2 Hamburguesas Clásicas completas + 1 porción grande de papas + 2 bebidas de lata a elección.',
    sku: 'CMB-02',
    ingredients: ['2x Hamburguesas Clásicas', '1x Papas Grandes', '2x Bebidas Lata']
  },
  {
    id: '11',
    name: 'Malta Polar Retornable Bien Fría',
    category: 'Bebidas',
    priceUSD: 1.25,
    tag: '🍺 Clásica',
    prepTime: 'Inmediato',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    description: 'Malta Polar con hielo frappé o servida directamente de la nevera.',
    sku: 'BEB-02',
    ingredients: ['Botella Vidrio 222ml', 'Fría de Nevera']
  },
  {
    id: '12',
    name: 'Aros de Cebolla Crujientes (8 uds)',
    category: 'Extras',
    priceUSD: 3.50,
    tag: '🧅 Frito',
    prepTime: '5-7 min',
    image: 'https://images.unsplash.com/photo-1639024471287-032f6640dc1f?w=600&q=80',
    description: 'Aros de cebolla dulce rebozados con panko extra crujiente servidos con salsa barbacoa.',
    sku: 'EXT-03',
    ingredients: ['8 Aros Grandes', 'Rebozado Panko', 'Salsa BBQ Ahumada']
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
  { id: '1', name: 'Consumidor Final', docId: 'V-00000000', phone: '', address: 'Venta de Mostrador' },
  { id: '2', name: 'Carlos Rodríguez', docId: 'V-18456123', phone: '0414-1234567', address: 'Calle 5 con Av. 2' },
  { id: '3', name: 'María Gómez', docId: 'V-22987654', phone: '0424-9876543', address: 'Urb. Los Rosales' },
  { id: '4', name: 'Inversiones Gourmet C.A.', docId: 'J-40987123-5', phone: '0212-9988776', address: 'Zona Industrial' }
];

export default function TabletMobilePosPage() {
  // 1. Tasa BCV y Modo de Consulta
  const [bcvRate, setBcvRate] = useState(848.55);
  const [bcvMode, setBcvMode] = useState<'auto' | 'manual'>('auto');
  const [isBcvEditing, setIsBcvEditing] = useState(false);
  const [customBcvInput, setCustomBcvInput] = useState('848.55');
  const [isFetchingBcv, setIsFetchingBcv] = useState(false);

  // 2. Navegación Principal
  const [activeTab, setActiveTab] = useState<'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 3. Modos de Vista y Tema (Contraste Estándar WCAG AAA)
  const [cardViewMode, setCardViewMode] = useState<'food' | 'cuadricula' | 'lista' | 'minimalista'>('food');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [activePalette, setActivePalette] = useState('slate');

  // 4. Drawers y Modales de Configuración
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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

  // Gestión de Productos
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Hamburguesas',
    priceUSD: '',
    sku: '',
    tag: '⭐ Nuevo'
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

  // 11. Carrito Persistente
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Hamburguesa Doble Especial', priceUSD: 6.50, qty: 2, category: 'Hamburguesas', notes: 'Sin cebolla, extra salsa tártara', sku: 'HMB-01', image: SAMPLE_PRODUCTS[0].image },
    { id: '6', name: 'Refresco Familiar 1.5L Frío', priceUSD: 2.50, qty: 1, category: 'Bebidas', sku: 'BEB-01', image: SAMPLE_PRODUCTS[5].image }
  ]);

  // Consulta automática de la Tasa Oficial BCV Multi-Fuente
  const fetchBcvRateAuto = async () => {
    setIsFetchingBcv(true);
    try {
      // 1. Intento primario: Endpoint interno del servidor (con 4 capas de scraping y caché)
      try {
        const res = await fetch('/api/bcv/rate?refresh=true');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.rate === 'number' && data.rate > 0) {
            setBcvRate(data.rate);
            setCustomBcvInput(data.rate.toFixed(2));
            try {
              localStorage.setItem('klikpos_bcv_rate', String(data.rate));
              localStorage.setItem('klikpos_bcv_mode', 'auto');
            } catch {}
            return;
          }
        }
      } catch {}

      // 2. Espejo 1: DolarAPI Venezuela
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (res.ok) {
          const data = await res.json();
          const rate = data.promedio || data.precio || data.valor;
          if (typeof rate === 'number' && rate > 0) {
            setBcvRate(rate);
            setCustomBcvInput(rate.toFixed(2));
            try {
              localStorage.setItem('klikpos_bcv_rate', String(rate));
              localStorage.setItem('klikpos_bcv_mode', 'auto');
            } catch {}
            return;
          }
        }
      } catch {}

      // 3. Espejo 2: Open Exchange Rates VES
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          const val = parseFloat(data?.rates?.VES);
          if (!isNaN(val) && val > 0) {
            setBcvRate(val);
            setCustomBcvInput(val.toFixed(2));
            try {
              localStorage.setItem('klikpos_bcv_rate', String(val));
              localStorage.setItem('klikpos_bcv_mode', 'auto');
            } catch {}
            return;
          }
        }
      } catch {}

      // 4. Espejo 3: CDN Fawaz Ahmed Currency
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
        if (res.ok) {
          const data = await res.json();
          const val = parseFloat(data?.usd?.ves);
          if (!isNaN(val) && val > 0) {
            setBcvRate(val);
            setCustomBcvInput(val.toFixed(2));
            try {
              localStorage.setItem('klikpos_bcv_rate', String(val));
              localStorage.setItem('klikpos_bcv_mode', 'auto');
            } catch {}
            return;
          }
        }
      } catch {}

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
      setBcvRate(parsed);
      setBcvMode('manual');
      setIsBcvEditing(false);
      try {
        localStorage.setItem('klikpos_bcv_rate', String(parsed));
        localStorage.setItem('klikpos_bcv_mode', 'manual');
      } catch {}
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
      if (savedMode && ['food', 'cuadricula', 'lista', 'minimalista'].includes(savedMode)) {
        setCardViewMode(savedMode);
      }
      const savedTheme = localStorage.getItem('venematic_theme') as any;
      if (savedTheme === 'light' || savedTheme === 'dark') setThemeMode(savedTheme);

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
    } catch {
      // Continuar silenciosamente
    }
  }, []);

  // Sincronización radical del Modo Claro y Oscuro con el DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-ui-style', 'industrial');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
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

  // Guardar Cambios de Carrito y Vistas
  useEffect(() => {
    try {
      localStorage.setItem('klikpos_card_view_mode', cardViewMode);
      localStorage.setItem('klikpos_tablet_cart', JSON.stringify(cart));
    } catch {}
  }, [cardViewMode, cart]);

  const currentPal = BRAND_PALETTES.find(p => p.id === activePalette) || BRAND_PALETTES[0];
  const isLight = themeMode === 'light';

  // Cálculos Financieros
  const totalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.qty), 0);
  const totalVES = totalUSD * bcvRate;
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // Vueltos en Efectivo
  const vueltoUSD = Math.max(0, cashUSDReceived - totalUSD);
  const vueltoVESfromUSD = vueltoUSD * bcvRate;
  const vueltoVESfromVES = Math.max(0, cashVESReceived - totalVES);

  const addToCart = (prod: Product) => {
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
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      description: `${newProductForm.name} - Calidad garantizada.`
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    try { localStorage.setItem('klikpos_tablet_products', JSON.stringify(updated)); } catch {}
    setNewProductForm({ name: '', category: categoriesList[1] || 'General', priceUSD: '', sku: '', tag: '⭐ Nuevo' });
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
      `📍 *Dirección de Entrega:*\n${selectedCustomer.address || 'Entrega a Domicilio'}\n\n` +
      `📦 *Detalle del Pedido:*\n${itemsSummary || '• 1x Orden estándar'}\n\n` +
      `💰 *TOTAL A COBRAR EN DESTINO:*\n` +
      `💵 *$${totalUSD.toFixed(2)} USD* (o *Bs. ${totalVES.toFixed(2)}* a tasa BCV ${bcvRate.toFixed(2)})\n\n` +
      `Por favor confirmar recepción de esta orden. ¡Buen viaje! 🚀`;

    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`, '_blank');
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
    const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });

    let refNumber = '';
    if (selectedPaymentMethod === 'pago_movil') refNumber = pagoMovilRefInput || 'S/R';
    else if (selectedPaymentMethod === 'card_debit') refNumber = cardVoucherRef || 'Lote-POS';
    else if (selectedPaymentMethod === 'zelle') refNumber = zelleConfirmation || 'Zelle-OK';

    const saleTicket: CompletedSaleTicket = {
      ticketNumber: ticketNo,
      timestamp: now,
      items: [...cart],
      subtotalUSD: totalUSD,
      totalUSD: totalUSD,
      totalVES: totalVES,
      bcvRate: bcvRate,
      paymentMethod: selectedPaymentMethod,
      reference: refNumber,
      amountReceivedUSD: selectedPaymentMethod === 'cash_usd' ? cashUSDReceived : undefined,
      changeUSD: selectedPaymentMethod === 'cash_usd' ? vueltoUSD : undefined,
      changeVES: selectedPaymentMethod === 'cash_usd' ? vueltoVESfromUSD : (selectedPaymentMethod === 'cash_ves' ? vueltoVESfromVES : undefined),
      customer: selectedCustomer,
      table: activeTable ? `Mesa #${activeTable}` : 'Barra / Mostrador'
    };

    // Guardar en Dexie y LocalStorage
    try {
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
          method: selectedPaymentMethod as any,
          amountUSD: totalUSD,
          amountVES: totalVES,
          reference: refNumber
        }],
        changeUSD: vueltoUSD,
        changeVES: vueltoVESfromUSD,
        cashierName: 'Cajero Tablet',
        customerName: selectedCustomer.name,
        customerDoc: selectedCustomer.docId,
        status: 'completed',
        source: 'tablet'
      }).catch(() => {});
    } catch {}

    setCompletedSaleTicket(saleTicket);
    setCart([]);
    setPagoMovilRefInput('');
    setCashUSDReceived(0);
    setCashVESReceived(0);
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
      className={`h-screen flex flex-col font-sans select-none overflow-hidden relative transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{
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
      `}</style>

      {/* ========================================================================= */}
      {/* 1. DOCKER FLOTANTE MINIMALISTA: PILL VERTICAL PURO DIRECTO                */}
      {/* ========================================================================= */}
      {/* Botón Píldora Colapsado cuando el Docker está cerrado */}
      {!isDockerOpen && (
        <button
          type="button"
          onClick={() => setIsDockerOpen(true)}
          className={`fixed top-1/2 -translate-y-1/2 z-40 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-md group cursor-pointer ${
            dockSide === 'left' ? 'left-0 rounded-r-2xl border-l-0' : 'right-0 rounded-l-2xl border-r-0'
          }`}
          style={{
            width: '38px',
            height: '64px',
            backgroundColor: `${currentPal.primary}e6`,
            boxShadow: `0 8px 24px ${currentPal.glow || 'rgba(0,0,0,0.3)'}`
          }}
          title={`Abrir Docker Rápido (${dockSide === 'left' ? 'Izquierda' : 'Derecha'})`}
        >
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-300 drop-shadow-xs group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] font-black text-white tracking-tighter uppercase font-mono">DOCK</span>
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md anim-badge-spring">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {/* Docker Flotante Abierto: EXCLUSIVAMENTE Pill Vertical con Íconos Directos */}
      {isDockerOpen && (
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
            dockSide === 'left' ? 'left-2.5' : 'right-2.5'
          }`}
        >
          {/* Cápsula Vertical Oscura con Íconos de Herramientas Directas */}
          <aside className="w-13 bg-slate-950/92 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] py-3.5 px-1.5 flex flex-col items-center justify-between shadow-2xl border border-slate-700/70 text-white select-none shrink-0 min-h-[390px]">
            {/* Top: Sparkles Icon / Brand Pill */}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-slate-950" />
            </div>

            {/* Íconos Centrales de Acceso Directo a Ventanas y Modales */}
            <div className="flex flex-col items-center gap-2.5 my-auto">
              {/* 1. Inventario & Stock */}
              <button
                onClick={() => setShowInventoryModal(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Gestión de Inventario & Stock"
              >
                <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* 2. Motorizados / Despacho */}
              <button
                onClick={() => setShowDriversModal(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Motorizados & Despacho Delivery"
              >
                <Truck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* 3. Impresora Térmica POS */}
              <button
                onClick={() => setShowPrinterModal(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-indigo-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Configuración de Impresora POS"
              >
                <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* 4. Cambiar Rubro Comercial */}
              <button
                onClick={() => setShowRubroModal(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-purple-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Cambiar Rubro Comercial (Comida, Farmacia, Bodega, etc.)"
              >
                <Boxes className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* 5. Menú QR Dinámico para Clientes */}
              <button
                onClick={() => setShowQrModal(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-sky-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Generar Menú QR Digital para Clientes"
              >
                <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* 6. Comanda / Ticket Activo */}
              <button
                onClick={() => setIsRightDrawerOpen(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 active:scale-90 transition-all relative group cursor-pointer"
                title="Ver Comanda Activa"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* 7. Ajustes & Configuración */}
              <button
                onClick={() => setIsLeftDrawerOpen(true)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 active:scale-90 transition-all group relative cursor-pointer"
                title="Ajustes de Empresa & RIF"
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Bottom: Alternar Lado (Izq/Der) y Colapsar */}
            <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800/80 shrink-0">
              <button
                onClick={handleToggleDockSide}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 active:scale-90 transition-all cursor-pointer"
                title={dockSide === 'left' ? 'Mover Docker a la Derecha' : 'Mover Docker a la Izquierda'}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDockerOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 active:scale-90 transition-all cursor-pointer"
                title="Minimizar Docker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER SUPERIOR CON TASA BCV INTERACTIVA Y CONTRASTE WCAG AAA          */}
      {/* ========================================================================= */}
      <header
        className={`h-14 px-3 flex items-center justify-between border-b shrink-0 z-20 shadow-xs transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Izquierda: Drawer y Nombre del Negocio */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeftDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
            }`}
          >
            <Menu className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span className="text-xs font-black hidden sm:inline" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              Menú
            </span>
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tight uppercase line-clamp-1 max-w-[130px] sm:max-w-[200px]" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              {companyInfo.name}
            </span>
            <span className="text-[9px] font-mono text-slate-500 font-bold">
              {companyInfo.rif}
            </span>
          </div>
        </div>

        {/* Centro: Badge Tasa BCV Oficial con Edición Manual/Auto */}
        <div className="flex items-center gap-1.5">
          {isBcvEditing ? (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500">Bs.</span>
              <input
                type="number"
                step="0.01"
                value={customBcvInput}
                onChange={(e) => setCustomBcvInput(e.target.value)}
                className="w-18 text-xs font-mono font-black text-slate-900 dark:text-white bg-transparent outline-none"
              />
              <button
                onClick={handleSaveManualBcv}
                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black"
              >
                ✓
              </button>
              <button
                onClick={() => setIsBcvEditing(false)}
                className="px-1 py-0.5 text-slate-400 text-[10px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsBcvEditing(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all text-xs font-mono font-bold shadow-2xs ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-800/90 border-slate-700 text-slate-100'
              }`}
              title="Toca para editar tasa BCV manualmente"
            >
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">BCV:</span>
              <span className="font-black" style={{ color: isLight ? '#0f172a' : '#38bdf8' }}>
                Bs. {bcvRate.toFixed(2)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchBcvRateAuto();
                }}
                disabled={isFetchingBcv}
                className="p-0.5 hover:text-sky-500"
                title="Actualizar tasa desde DolarAPI"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingBcv ? 'animate-spin text-sky-500' : 'text-slate-400'}`} />
              </button>
            </button>
          )}

          {/* Badge de Prueba de 15 Minutos */}
          {trialState?.isTrial && (
            <button
              onClick={() => setShowLicenseModal(true)}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-mono font-bold"
            >
              <span>⏱️ {trialState.remainingMinutes}m</span>
            </button>
          )}
        </div>

        {/* Derecha: Botón Carrito y Totalizador */}
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md text-white transition-all duration-200 relative active:scale-95"
          style={{ backgroundColor: currentPal.primary }}
          title="Ver Comanda Activa"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span className="text-xs font-black text-white">${totalUSD.toFixed(2)}</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs anim-badge-spring">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 3. LIENZO PRINCIPAL CON SCROLL 100% FLUIDO Y DESBLOQUEADO                 */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3 pb-28 max-w-6xl mx-auto w-full">
        {/* ======================================================================= */}
        {/* VISTA 1: MENÚ Y CATÁLOGO TÁCTIL (4 MODOS DE VISTA)                      */}
        {/* ======================================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {/* Buscador + Selector de Modo de Vista */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar hamburguesas, perros, bebidas, combos o SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-none font-semibold ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
                        : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 4 Modos de Vista */}
                <div className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
                }`}>
                  <button
                    onClick={() => setCardViewMode('food')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      cardViewMode === 'food'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Vista Visual Food"
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setCardViewMode('cuadricula')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      cardViewMode === 'cuadricula'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Cuadrícula 4 Columnas"
                  >
                    4 Cols
                  </button>
                  <button
                    onClick={() => setCardViewMode('lista')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      cardViewMode === 'lista'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Lista Ergonómica"
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setCardViewMode('minimalista')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      cardViewMode === 'minimalista'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Alta Densidad"
                  >
                    Mini
                  </button>
                </div>
              </div>

              {/* Píldoras de Categorías */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border active:scale-95 ${
                      selectedCategory === cat
                        ? 'text-white shadow-xs'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === cat ? currentPal.primary : undefined,
                      borderColor: selectedCategory === cat ? currentPal.primary : undefined
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCTOS RENDERIZADOS SEGÚN MODO DE VISTA */}
            {cardViewMode === 'food' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`group border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98 shadow-xs ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative h-36 sm:h-40 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-black bg-slate-900/80 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                          {prod.tag}
                        </span>
                        {qtyInCart > 0 && (
                          <span
                            className="absolute top-2.5 right-2.5 text-white font-black font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md anim-badge-spring"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            {qtyInCart}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <h3
                            className="text-xs sm:text-sm font-black line-clamp-2 min-h-[32px] leading-tight"
                            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                          >
                            {prod.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {prod.description}
                          </p>
                        </div>

                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-sm sm:text-base font-black font-mono" style={{ color: currentPal.primary }}>
                              ${prod.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            className="w-8 h-8 rounded-xl text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cardViewMode === 'cuadricula' && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`p-3 border rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer active:scale-98 shadow-xs ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3
                            className="text-xs font-black line-clamp-2 min-h-[32px]"
                            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                          >
                            {prod.name}
                          </h3>
                          {qtyInCart > 0 && (
                            <span
                              className="text-white text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0"
                              style={{ backgroundColor: currentPal.primary }}
                            >
                              x{qtyInCart}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400">
                          {prod.sku}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <div>
                          <span className="text-sm font-black font-mono" style={{ color: currentPal.primary }}>
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {qtyInCart > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(prod.id, -1);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center text-xs font-black active:scale-90"
                            >
                              -
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black active:scale-90 shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cardViewMode === 'lista' && (
              <div className="space-y-2">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`p-2.5 border rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-99 shadow-2xs ${
                        isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black truncate" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {prod.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black font-mono block" style={{ color: currentPal.primary }}>
                            ${prod.priceUSD.toFixed(2)}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            Bs. {(prod.priceUSD * bcvRate).toFixed(2)}
                          </span>
                        </div>

                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(prod.id, -1);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center text-xs font-black"
                            >
                              -
                            </button>
                            <span className="text-xs font-black font-mono w-4 text-center">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(prod);
                              }}
                              className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black"
                              style={{ backgroundColor: currentPal.primary }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            className="px-2.5 py-1 text-white rounded-lg text-xs font-bold shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cardViewMode === 'minimalista' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                {filteredProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between h-20 transition-all active:scale-95 shadow-2xs ${
                        isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] font-black line-clamp-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                          {prod.name}
                        </span>
                        {qtyInCart > 0 && (
                          <span
                            className="text-white text-[9px] font-black px-1 rounded"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            {qtyInCart}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black font-mono" style={{ color: currentPal.primary }}>
                          ${prod.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          Bs.{(prod.priceUSD * bcvRate).toFixed(0)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 2: MESAS Y CUENTAS DE BARRA (+ BOTÓN AGREGAR DINÁMICO)            */}
        {/* ======================================================================= */}
        {activeTab === 'mesas' && (
          <div className="space-y-4">
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
        {/* VISTA 3: PEDIDOS ENTRANTES / COCINA                                     */}
        {/* ======================================================================= */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              <ClipboardList className="w-4 h-4" style={{ color: currentPal.primary }} />
              <span>Pedidos en Cocina y Comandas QR</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`border rounded-2xl p-3 space-y-2.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-xs font-black text-amber-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🟡 NUEVOS ENTRANTES (1)</span>
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">QR Mesa</span>
                </div>
                <div className={`p-2.5 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Mesa 4 • Juan C.</span>
                    <span className="font-mono font-bold" style={{ color: currentPal.primary }}>$15.50</span>
                  </div>
                  <p className="text-[11px] text-slate-500">2x Hamburguesa Doble, 1x Papas Gratinadas</p>
                  <button
                    className="w-full py-1.5 text-white rounded-lg text-xs font-black active:scale-95"
                    style={{ backgroundColor: currentPal.primary }}
                  >
                    Aceptar y Pasar a Plancha
                  </button>
                </div>
              </div>

              <div className={`border rounded-2xl p-3 space-y-2.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-xs font-black text-sky-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🔵 EN PLANCHA / PREPARACIÓN (1)</span>
                </div>
                <div className={`p-2.5 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Barra 1 • María P.</span>
                    <span className="font-mono font-bold" style={{ color: currentPal.primary }}>$4.00</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1x Papas Fritas Gratinadas</p>
                  <button className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black active:scale-95">
                    Marcar Listo para Servir
                  </button>
                </div>
              </div>

              <div className={`border rounded-2xl p-3 space-y-2.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-xs font-black text-emerald-600 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>🟢 LISTOS / ENTREGADOS</span>
                </div>
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Todos los pedidos listos fueron despachados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VISTA 4: DELIVERY Y RUTAS DE MOTORIZADOS                                */}
        {/* ======================================================================= */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
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
          <div className="max-w-xl mx-auto space-y-4 pb-6">
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

            {/* SECCIÓN 1: SELECCIÓN Y REGISTRO DE CLIENTE */}
            <div className={`border rounded-2xl p-4 space-y-2.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
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

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    {selectedCustomer.name}
                  </h4>
                  <div className="flex gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>Doc: <b>{selectedCustomer.docId}</b></span>
                    {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  Seleccionado
                </span>
              </div>
            </div>

            {/* SECCIÓN 2: SELECTOR DE MÉTODO DE PAGO */}
            <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="text-xs font-black uppercase tracking-wider block" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Selecciona Método de Pago:
              </span>

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
      {/* 4. NAV BAR INFERIOR FIJA CON ANIMACIÓN ELÁSTICA PRO & HERO COBRO           */}
      {/* ========================================================================= */}
      <nav
        className={`fixed bottom-0 inset-x-0 w-full h-17 z-40 border-t flex items-center justify-around px-3 pb-safe shadow-2xl transition-colors duration-300 ${
          isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
        } backdrop-blur-xl`}
      >
        <div className="max-w-xl w-full mx-auto flex items-center justify-between relative">
          {/* 1. Menú / Catálogo */}
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl nav-item-spring active:scale-90 relative cursor-pointer ${
              activeTab === 'menu' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            style={{ color: activeTab === 'menu' ? currentPal.primary : undefined }}
          >
            {activeTab === 'menu' && (
              <span
                className="absolute inset-0 rounded-2xl -z-10 shadow-sm opacity-15 nav-elastic-pill border border-current"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
            <UtensilsCrossed className={`w-5.5 h-5.5 stroke-[2.2] transition-transform duration-300 ${activeTab === 'menu' ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-[10.5px] mt-0.5 font-bold tracking-tight">Menú</span>
            {activeTab === 'menu' && (
              <span
                className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
          </button>

          {/* 2. Mesas */}
          <button
            onClick={() => setActiveTab('mesas')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl nav-item-spring active:scale-90 relative cursor-pointer ${
              activeTab === 'mesas' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            style={{ color: activeTab === 'mesas' ? currentPal.primary : undefined }}
          >
            {activeTab === 'mesas' && (
              <span
                className="absolute inset-0 rounded-2xl -z-10 shadow-sm opacity-15 nav-elastic-pill border border-current"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
            <LayoutGrid className={`w-5.5 h-5.5 stroke-[2.2] transition-transform duration-300 ${activeTab === 'mesas' ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-[10.5px] mt-0.5 font-bold tracking-tight">Mesas</span>
            {activeTab === 'mesas' && (
              <span
                className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
          </button>

          {/* 3. BOTÓN CENTRAL DESTACADO HERO "COBRAR" (20% MÁS GRANDE) */}
          <div className="flex-1 flex flex-col items-center -mt-7 shrink-0 z-10">
            <button
              onClick={() => setActiveTab('cobro')}
              className="w-16 h-16 rounded-full flex items-center justify-center nav-hero-button cursor-pointer anim-breathe text-white shadow-2xl relative border-4 border-white dark:border-slate-900 group"
              style={{
                backgroundColor: currentPal.primary,
                boxShadow: `0 10px 28px -4px ${currentPal.primary}66, 0 4px 12px rgba(0,0,0,0.15)`,
              }}
              title="Cobrar Cuenta / Abrir Caja Registradora"
            >
              <CircleDollarSign className="w-8.5 h-8.5 stroke-[2.4] text-white group-hover:rotate-12 transition-transform duration-300" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 anim-badge-spring">
                  {totalItems}
                </span>
              )}
            </button>
            <span
              className="text-[9.5px] font-black uppercase tracking-wider mt-1 text-center"
              style={{ color: currentPal.primary }}
            >
              Cobrar
            </span>
          </div>

          {/* 4. Pedidos */}
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl nav-item-spring active:scale-90 relative cursor-pointer ${
              activeTab === 'pedidos' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            style={{ color: activeTab === 'pedidos' ? currentPal.primary : undefined }}
          >
            {activeTab === 'pedidos' && (
              <span
                className="absolute inset-0 rounded-2xl -z-10 shadow-sm opacity-15 nav-elastic-pill border border-current"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
            <ClipboardList className={`w-5.5 h-5.5 stroke-[2.2] transition-transform duration-300 ${activeTab === 'pedidos' ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-[10.5px] mt-0.5 font-bold tracking-tight">Pedidos</span>
            {activeTab === 'pedidos' && (
              <span
                className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
          </button>

          {/* 5. Delivery */}
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl nav-item-spring active:scale-90 relative cursor-pointer ${
              activeTab === 'delivery' ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            style={{ color: activeTab === 'delivery' ? currentPal.primary : undefined }}
          >
            {activeTab === 'delivery' && (
              <span
                className="absolute inset-0 rounded-2xl -z-10 shadow-sm opacity-15 nav-elastic-pill border border-current"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
            <Bike className={`w-5.5 h-5.5 stroke-[2.2] transition-transform duration-300 ${activeTab === 'delivery' ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-[10.5px] mt-0.5 font-bold tracking-tight">Delivery</span>
            {activeTab === 'delivery' && (
              <span
                className="w-1.5 h-1.5 rounded-full mt-0.5 anim-badge-spring shadow-xs"
                style={{ backgroundColor: currentPal.primary }}
              />
            )}
          </button>
        </div>
      </nav>

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
                  <span>Activar / Estado de Licencia</span>
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
            className={`relative w-84 max-w-[88vw] border-l h-full p-4 flex flex-col justify-between shadow-2xl z-10 anim-drawer-right ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: currentPal.primary }} />
                  <span className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    {activeTable ? `Mesa #${activeTable}` : 'Comanda Actual'}
                  </span>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Ítems */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No hay productos en esta cuenta.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-black line-clamp-1" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono" style={{ color: currentPal.primary }}>
                            ${item.priceUSD.toFixed(2)} c/u
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                          ${(item.priceUSD * item.qty).toFixed(2)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[9px] text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                          📝 {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => setEditingItemNotes(item)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-white underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.notes ? 'Editar Nota' : '+ Nota'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center text-xs font-black active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black w-4 text-center" style={{ color: currentPal.primary }}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black active:scale-90 shadow-xs"
                            style={{ backgroundColor: currentPal.primary }}
                          >
                            <Plus className="w-3 h-3" />
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
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total USD:</span>
                  <span className="font-mono font-black text-base" style={{ color: currentPal.primary }}>
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Bs (BCV):</span>
                  <span className="font-mono font-black text-xs" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    Bs. {totalVES.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setCart([])}
                    className={`py-2.5 active:scale-95 text-xs font-bold rounded-xl border transition-all ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => {
                      setIsRightDrawerOpen(false);
                      setActiveTab('cobro');
                    }}
                    className="py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all"
                    style={{ backgroundColor: currentPal.primary }}
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
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
    </div>
  );
}

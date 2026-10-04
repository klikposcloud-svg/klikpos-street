import { Product, Motorizado, Customer, RubroId, CanvasTheme } from '@/types/tablet-pos';

export const SAMPLE_PRODUCTS: Product[] = [
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
  },
  {
    id: '11',
    name: 'Chicha Tradicional Criolla con Canela',
    category: 'Bebidas',
    priceUSD: 2.00,
    tag: '🥤 Criolla',
    prepTime: 'Inmediato',
    image: '/packs/comida-street/chicha.png',
    description: 'Chicha espesa de arroz con leche condensada generosa y toque de canela molida.',
    sku: 'BEB-02',
    ingredients: ['Arroz Cremoso', 'Leche Condensada', 'Canela en Polvo', 'Hielo Picado']
  },
  {
    id: '12',
    name: 'Combo Burger Especial + Papas + Bebida',
    category: 'Combos',
    priceUSD: 8.50,
    tag: '🍔 Combo Estrella',
    prepTime: '10-12 min',
    image: '/packs/comida-street/combo-burger-1.png',
    description: 'Hamburguesa 200g completa con queso cheddar, huevo, tocineta, papas rústicas y refresco.',
    sku: 'CMB-04',
    ingredients: ['Burger 200g', 'Papas Fritas', 'Bebida 355ml', 'Salsas de la Casa']
  },
  {
    id: '13',
    name: 'Combo Cachapa Doble Queso y Cochino Frito',
    category: 'Combos',
    priceUSD: 10.50,
    tag: '🥩 Supremo Llanero',
    prepTime: '10-12 min',
    image: '/packs/comida-street/combo-cachapa-01.png',
    description: 'Cachapa gigante con doble queso de mano tierno, ración de cochino frito crujiente y bebida.',
    sku: 'CMB-05',
    ingredients: ['Cachapa Gigante', 'Doble Queso Mano', 'Cochino Crujiente', 'Bebida Fría']
  },
  {
    id: '14',
    name: 'Combo Cachapa Criolla Doble Queso Mano',
    category: 'Combos',
    priceUSD: 7.50,
    tag: '🌽 Tradicional',
    prepTime: '8-10 min',
    image: '/packs/comida-street/combo-cachapa-02.png',
    description: 'Cachapa dorada con abundante queso de mano fresco, mantequilla derretida y bebida fría.',
    sku: 'CMB-06',
    ingredients: ['Cachapa Fresca', 'Queso de Mano Telita', 'Mantequilla', 'Bebida Fría']
  },
  {
    id: '15',
    name: 'Combo Pepito Mixto 30cm + Papas + Bebida',
    category: 'Combos',
    priceUSD: 11.00,
    tag: '🥖 Mega Pepito',
    prepTime: '12-14 min',
    image: '/packs/comida-street/combo-pepito-01.png',
    description: 'Pepito mixto lomito y pollo 30cm gratinado con queso de mano y maíz, papas fritas y refresco.',
    sku: 'CMB-07',
    ingredients: ['Pepito 30cm Mixto', 'Papas Fritas', 'Refresco Frío', 'Queso Gratinado']
  },
  {
    id: '16',
    name: 'Combo Dúo Shawarma Mixto Especial',
    category: 'Combos',
    priceUSD: 12.00,
    tag: '🌯 Pareja / Dúo',
    prepTime: '10-12 min',
    image: '/packs/comida-street/combo-shawarma-01.png',
    description: '2 Shawarmas mixtos grandes con pan pita tostado, papas y salsas árabes.',
    sku: 'CMB-08',
    ingredients: ['2x Shawarmas Mixtos', 'Ración de Papas', 'Crema de Ajo y Tártara']
  }
];

export const CATEGORIES = ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'];

export const RUBROS_CATALOG: Record<RubroId, { name: string; label: string; icon: string; description: string; categories: string[]; sampleProducts: Product[] }> = {
  comida: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  },
  ropa: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  },
  panaderia: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  },
  minimarket: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  },
  farmacia: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  },
  ferreteria: {
    name: 'Comida Rápida & Street Food',
    label: 'Comida Rápida & Street Food',
    icon: '🍔',
    description: 'Hamburguesas, cachapas, perros calientes, pepitos, combos familiares y bebidas.',
    categories: CATEGORIES,
    sampleProducts: SAMPLE_PRODUCTS
  }
};

export const DEFAULT_DRIVERS: Motorizado[] = [
  { id: '1', name: 'Alexander Morales', phone: '04141234567', vehicle: 'Bera SBR Azul - AF1G22', status: 'disponible' },
  { id: '2', name: 'José Luis Rivas', phone: '04249876543', vehicle: 'Empire Keeway Rojo - AA4B11', status: 'en_ruta' },
  { id: '3', name: 'Manuel Bastidas', phone: '04125556677', vehicle: 'Haojin Águila Negro - AB99CC', status: 'disponible' }
];

export const NOTE_PRESETS = [
  'Con todo (tradicional)',
  'Sin cebolla',
  'Sin salsas',
  'Extra salsa tártara',
  'Extra salsa de ajo',
  'Extra queso rallado',
  'Bien cocido / Dorado',
  'Para Llevar (Empaque térmico)'
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Consumidor Final', docId: 'V-00000000', phone: '', address: 'Consumo en Salón' },
  { id: '2', name: 'Carlos Rodríguez', docId: 'V-18456123', phone: '0414-1234567', address: 'Calle 5 con Av. Principal' },
  { id: '3', name: 'María Gómez', docId: 'V-22987654', phone: '0424-9876543', address: 'Urb. Los Rosales, Casa #14' },
  { id: '4', name: 'Inversiones Gourmet C.A.', docId: 'J-40987123-5', phone: '0212-9988776', address: 'Zona Industrial Galpón 4' }
];

export const BRAND_PALETTES = [
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

export const CANVAS_THEMES: readonly CanvasTheme[] = [
  { id: 'obsidian', name: 'Obsidian Blue', subtitle: 'Lienzo Nocturno Clásico', bg: '#040711', surface: '#090d16', card: '#0f172a', border: '#1e293b', isLight: false },
  { id: 'light-graphite', name: 'Blanco Grafito', subtitle: 'Luz Diurna / Alto Contraste', bg: '#ffffff', surface: '#ffffff', card: '#ffffff', border: '#e2e8f0', isLight: true }
] as const;

export const VENEZUELAN_BANKS = [
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

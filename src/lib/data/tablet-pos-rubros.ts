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
  }
];

export const RUBROS_CATALOG: Record<RubroId, { name: string; label: string; icon: string; description: string; categories: string[]; sampleProducts: Product[] }> = {
  comida: {
    name: 'Comida & Gastronomía',
    label: 'Comida & Gastronomía',
    icon: '🍔',
    description: 'Hamburguesas, pizzas, combos, perros calientes y bebidas.',
    categories: ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'],
    sampleProducts: SAMPLE_PRODUCTS
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

export const DEFAULT_DRIVERS: Motorizado[] = [
  { id: '1', name: 'Alexander Morales', phone: '04141234567', vehicle: 'Bera SBR Azul - AF1G22', status: 'disponible' },
  { id: '2', name: 'José Luis Rivas', phone: '04249876543', vehicle: 'Empire Keeway Rojo - AA4B11', status: 'en_ruta' },
  { id: '3', name: 'Manuel Bastidas', phone: '04125556677', vehicle: 'Haojin Águila Negro - AB99CC', status: 'disponible' }
];

export const CATEGORIES = ['Todos', 'Combos', 'Hamburguesas', 'Perros', 'Bebidas', 'Extras'];

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

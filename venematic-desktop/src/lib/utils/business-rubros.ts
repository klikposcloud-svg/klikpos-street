import { db, LocalProduct } from '@/lib/db';
import { BrandingConfig, applyBrandingToDOM, IndustrialBgPreset } from '@/lib/theme';

export type StandardRubroId = 'bodega' | 'market' | 'pharmacy' | 'bakery' | 'liquor' | 'bookstore';

export interface RubroCategory {
  name: string;
  badgeColor: string;
}

export interface RubroStandardDefinition {
  id: StandardRubroId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  defaultStoreName: string;
  recommendedPaletteId: string;
  recommendedBgPreset: IndustrialBgPreset;
  categories: string[];
  sampleProducts: Array<{
    barcode: string;
    name: string;
    category: string;
    priceUSD: number;
    costUSD: number;
    stock: number;
    minStock: number;
    unit: string;
    image?: string;
  }>;
}

export const STANDARD_RUBROS: Record<StandardRubroId, RubroStandardDefinition> = {
  bodega: {
    id: 'bodega',
    name: 'Bodega Tradicional',
    icon: '🏪',
    tagline: 'Víveres esenciales, charcutería al corte, abarrotes y golosinas',
    description: 'Ideal para abastos de barrio, bodegas familiares y comercio vecinal con alta rotación diaria.',
    defaultStoreName: 'Bodega & Víveres La Fe',
    recommendedPaletteId: 'amber',
    recommendedBgPreset: 'white',
    categories: ['Víveres', 'Charcutería', 'Bebidas', 'Snacks', 'Limpieza', 'Cuidado Personal'],
    sampleProducts: [
      {
        barcode: '759100100101',
        name: 'Harina PAN Maíz Blanco 1kg',
        category: 'Víveres',
        priceUSD: 1.25,
        costUSD: 0.95,
        stock: 50,
        minStock: 10,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100100102',
        name: 'Arroz Primor Tradicional 1kg',
        category: 'Víveres',
        priceUSD: 1.35,
        costUSD: 1.00,
        stock: 40,
        minStock: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
      },
      {
        barcode: '759100100103',
        name: 'Pasta Capri Larga 1kg',
        category: 'Víveres',
        priceUSD: 1.60,
        costUSD: 1.15,
        stock: 35,
        minStock: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
      },
      {
        barcode: '759100100104',
        name: 'Aceite Mazeite Comestible 1L',
        category: 'Víveres',
        priceUSD: 2.75,
        costUSD: 2.15,
        stock: 25,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      },
      {
        barcode: '759100100105',
        name: 'Azúcar Montalbán 1kg',
        category: 'Víveres',
        priceUSD: 1.30,
        costUSD: 0.95,
        stock: 30,
        minStock: 6,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&q=80',
      },
      {
        barcode: '759100100106',
        name: 'Café Fama de América 250g',
        category: 'Víveres',
        priceUSD: 2.50,
        costUSD: 1.85,
        stock: 28,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
      },
      {
        barcode: '759100100107',
        name: 'Queso Blanco Llanero Duro (kg)',
        category: 'Charcutería',
        priceUSD: 5.20,
        costUSD: 3.90,
        stock: 18,
        minStock: 4,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
      },
      {
        barcode: '759100100108',
        name: 'Huevos Frescos Granja (Cartón 30 uds)',
        category: 'Víveres',
        priceUSD: 4.80,
        costUSD: 3.80,
        stock: 20,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
      },
      {
        barcode: '759100100109',
        name: 'Mayonesa Mavesa 445g',
        category: 'Víveres',
        priceUSD: 2.40,
        costUSD: 1.75,
        stock: 22,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
      },
      {
        barcode: '759100100110',
        name: 'Refresco Coca-Cola 1.5L',
        category: 'Bebidas',
        priceUSD: 2.00,
        costUSD: 1.45,
        stock: 30,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      },
      {
        barcode: '759100100111',
        name: 'Galletas María Puig 150g',
        category: 'Snacks',
        priceUSD: 0.95,
        costUSD: 0.65,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
      },
      {
        barcode: '759100100112',
        name: 'Detergente Las Llaves Limón 1kg',
        category: 'Limpieza',
        priceUSD: 2.30,
        costUSD: 1.70,
        stock: 25,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
      },
    ],
  },

  market: {
    id: 'market',
    name: 'Supermercado & Minimarket',
    icon: '🛒',
    tagline: 'Alimentos frescos, frutas, verduras, carnes, lácteos y enlatados',
    description: 'Diseñado para supermercados, bodegones mixtos y tiendas de autoservicio con múltiples departamentos.',
    defaultStoreName: 'Venemarket Express C.A.',
    recommendedPaletteId: 'sky',
    recommendedBgPreset: 'blue',
    categories: ['Víveres', 'Carnes y Pollo', 'Frutas y Verduras', 'Charcutería', 'Lácteos', 'Bebidas', 'Limpieza'],
    sampleProducts: [
      {
        barcode: '759100200201',
        name: 'Pechuga de Pollo Fresca deshuesada (kg)',
        category: 'Carnes y Pollo',
        priceUSD: 4.80,
        costUSD: 3.50,
        stock: 25,
        minStock: 5,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
      },
      {
        barcode: '759100200202',
        name: 'Carne Molida de Primera (kg)',
        category: 'Carnes y Pollo',
        priceUSD: 6.20,
        costUSD: 4.60,
        stock: 20,
        minStock: 4,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80',
      },
      {
        barcode: '759100200203',
        name: 'Jamón Superior Plumrose Rebanado 250g',
        category: 'Charcutería',
        priceUSD: 3.80,
        costUSD: 2.90,
        stock: 24,
        minStock: 6,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
      },
      {
        barcode: '759100200204',
        name: 'Queso Amarillo Gouda Holandés (kg)',
        category: 'Charcutería',
        priceUSD: 7.90,
        costUSD: 5.80,
        stock: 14,
        minStock: 3,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
      },
      {
        barcode: '759100200205',
        name: 'Leche Completa Pasteurizada 1L',
        category: 'Lácteos',
        priceUSD: 2.10,
        costUSD: 1.45,
        stock: 32,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
      },
      {
        barcode: '759100200206',
        name: 'Mantequilla con Sal Mavesa 500g',
        category: 'Lácteos',
        priceUSD: 2.60,
        costUSD: 1.90,
        stock: 25,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
      },
      {
        barcode: '759100200207',
        name: 'Manzanas Rojas Importadas (kg)',
        category: 'Frutas y Verduras',
        priceUSD: 3.40,
        costUSD: 2.20,
        stock: 30,
        minStock: 5,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
      },
      {
        barcode: '759100200208',
        name: 'Papas Blancas Seleccionadas (kg)',
        category: 'Frutas y Verduras',
        priceUSD: 1.40,
        costUSD: 0.85,
        stock: 50,
        minStock: 10,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
      },
      {
        barcode: '759100200209',
        name: 'Atún Margarita en Aceite 140g',
        category: 'Víveres',
        priceUSD: 1.70,
        costUSD: 1.20,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&q=80',
      },
      {
        barcode: '759100200210',
        name: 'Papel Higiénico Rosal Plus (4 Rollos)',
        category: 'Limpieza',
        priceUSD: 2.20,
        costUSD: 1.50,
        stock: 30,
        minStock: 6,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&q=80',
      },
    ],
  },

  pharmacy: {
    id: 'pharmacy',
    name: 'Farmacia & Cuidado de la Salud',
    icon: '💊',
    tagline: 'Medicamentos, analgésicos, primeros auxilios, higiene y cuidado personal',
    description: 'Configuración para farmacias, droguerías, botiquerías y centros de atención médica ambulatoria.',
    defaultStoreName: 'Farmacia & Droguería San Rafael',
    recommendedPaletteId: 'teal',
    recommendedBgPreset: 'teal',
    categories: ['Medicamentos', 'Primeros Auxilios', 'Cuidado Personal', 'Vitaminas y Suplementos', 'Infantil y Bebé'],
    sampleProducts: [
      {
        barcode: '759100300301',
        name: 'Acetaminofén / Paracetamol 500mg (10 Tabs)',
        category: 'Medicamentos',
        priceUSD: 1.50,
        costUSD: 0.75,
        stock: 80,
        minStock: 15,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
      },
      {
        barcode: '759100300302',
        name: 'Ibuprofeno 400mg Antiinflamatorio (10 Tabs)',
        category: 'Medicamentos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 65,
        minStock: 12,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
      },
      {
        barcode: '759100300303',
        name: 'Omeprazol 20mg Cápsulas (14 Caps)',
        category: 'Medicamentos',
        priceUSD: 2.60,
        costUSD: 1.30,
        stock: 45,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      },
      {
        barcode: '759100300304',
        name: 'Alcohol Antiséptico 70% 500ml',
        category: 'Primeros Auxilios',
        priceUSD: 1.95,
        costUSD: 1.10,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
      },
      {
        barcode: '759100300305',
        name: 'Curitas Adhesivas Flexibles (Caja 30 uds)',
        category: 'Primeros Auxilios',
        priceUSD: 1.20,
        costUSD: 0.55,
        stock: 60,
        minStock: 10,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80',
      },
      {
        barcode: '759100300306',
        name: 'Vitamina C Masticable 500mg (30 Tabs)',
        category: 'Vitaminas y Suplementos',
        priceUSD: 3.50,
        costUSD: 1.80,
        stock: 35,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
      },
      {
        barcode: '759100300307',
        name: 'Protector Solar FPS 50+ Facial Toque Seco 50ml',
        category: 'Cuidado Personal',
        priceUSD: 8.50,
        costUSD: 4.80,
        stock: 20,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
      },
      {
        barcode: '759100300308',
        name: 'Suero Oral Rehidratante Electrolitos 500ml',
        category: 'Medicamentos',
        priceUSD: 2.20,
        costUSD: 1.25,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
      },
      {
        barcode: '759100300309',
        name: 'Pañales Huggies Talla M (Pack 24 uds)',
        category: 'Infantil y Bebé',
        priceUSD: 7.20,
        costUSD: 5.20,
        stock: 25,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
      },
      {
        barcode: '759100300310',
        name: 'Jabón Líquido Antibacterial Protex 250ml',
        category: 'Cuidado Personal',
        priceUSD: 2.50,
        costUSD: 1.60,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1607006411601-775c8cc632dc?w=400&q=80',
      },
    ],
  },

  bakery: {
    id: 'bakery',
    name: 'Panadería, Cafetería & Pastelería',
    icon: '🥐',
    tagline: 'Panadería artesanal, café expreso, cachitos de jamón, bollería y dulces',
    description: 'Especializada en cafeterías, panaderías, delis, pastelerías y reposterías con servicio rápido.',
    defaultStoreName: 'Panadería & Pastelería La Mansión',
    recommendedPaletteId: 'coral',
    recommendedBgPreset: 'white',
    categories: ['Panadería', 'Cafetería y Bebidas', 'Desayunos y Salados', 'Pastelería y Repostería', 'Charcutería'],
    sampleProducts: [
      {
        barcode: '759100400401',
        name: 'Pan Canilla Tradicional Caliente',
        category: 'Panadería',
        priceUSD: 0.50,
        costUSD: 0.20,
        stock: 120,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100400402',
        name: 'Pan Campesino Rústico con Ajonjolí',
        category: 'Panadería',
        priceUSD: 1.50,
        costUSD: 0.60,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80',
      },
      {
        barcode: '759100400403',
        name: 'Cachito de Jamón Ahumado',
        category: 'Desayunos y Salados',
        priceUSD: 2.20,
        costUSD: 0.90,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
      },
      {
        barcode: '759100400404',
        name: 'Croissant Francés de Mantequilla',
        category: 'Panadería',
        priceUSD: 1.80,
        costUSD: 0.70,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
      },
      {
        barcode: '759100400405',
        name: 'Café Expreso Doble Italiano',
        category: 'Cafetería y Bebidas',
        priceUSD: 1.40,
        costUSD: 0.35,
        stock: 200,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
      },
      {
        barcode: '759100400406',
        name: 'Café con Leche Grande (12oz)',
        category: 'Cafetería y Bebidas',
        priceUSD: 2.20,
        costUSD: 0.70,
        stock: 150,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&q=80',
      },
      {
        barcode: '759100400407',
        name: 'Pastelito de Hojaldre con Queso y Jamón',
        category: 'Desayunos y Salados',
        priceUSD: 1.60,
        costUSD: 0.65,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&q=80',
      },
      {
        barcode: '759100400408',
        name: 'Golfeado Tradicional con Queso de Mano',
        category: 'Panadería',
        priceUSD: 2.80,
        costUSD: 1.20,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100400409',
        name: 'Porción Torta Tres Leches Casera',
        category: 'Pastelería y Repostería',
        priceUSD: 3.50,
        costUSD: 1.30,
        stock: 16,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      },
      {
        barcode: '759100400410',
        name: 'Jugo Natural de Naranja 400ml',
        category: 'Cafetería y Bebidas',
        priceUSD: 2.00,
        costUSD: 0.75,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
      },
    ],
  },

  liquor: {
    id: 'liquor',
    name: 'Licorería & Bodegón',
    icon: '🍾',
    tagline: 'Cervezas bien frías, rones, whisky, vinos, hielo y snacks nocturnos',
    description: 'Perfecto para licorerías, distribuidoras de bebidas, bodegones premium y tiendas de conveniencia.',
    defaultStoreName: 'Bodegón & Licorería La Ronda',
    recommendedPaletteId: 'purple',
    recommendedBgPreset: 'gray',
    categories: ['Cervezas', 'Rones y Destilados', 'Whisky', 'Vinos y Sangrías', 'Hielo y Mezcladores', 'Snacks'],
    sampleProducts: [
      {
        barcode: '759100500501',
        name: 'Cerveza Polar Pilsen Tercio 330ml (Caja 24 uds)',
        category: 'Cervezas',
        priceUSD: 18.50,
        costUSD: 15.00,
        stock: 30,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1608270118837-1c1097e33e9d?w=400&q=80',
      },
      {
        barcode: '759100500502',
        name: 'Cerveza Polar Light Lata 355ml',
        category: 'Cervezas',
        priceUSD: 1.00,
        costUSD: 0.75,
        stock: 120,
        minStock: 24,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1608270118837-1c1097e33e9d?w=400&q=80',
      },
      {
        barcode: '759100500503',
        name: 'Ron Santa Teresa Gran Reserva 0.75L',
        category: 'Rones y Destilados',
        priceUSD: 9.50,
        costUSD: 7.20,
        stock: 25,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
      },
      {
        barcode: '759100500504',
        name: 'Ron Cacique Añejo Superior 0.75L',
        category: 'Rones y Destilados',
        priceUSD: 8.80,
        costUSD: 6.80,
        stock: 25,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
      },
      {
        barcode: '759100500505',
        name: 'Whisky Buchanan\'s 12 Años De Luxe 0.75L',
        category: 'Whisky',
        priceUSD: 32.00,
        costUSD: 24.50,
        stock: 12,
        minStock: 2,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80',
      },
      {
        barcode: '759100500506',
        name: 'Vino Tinto Concha y Toro Cabernet 750ml',
        category: 'Vinos y Sangrías',
        priceUSD: 7.50,
        costUSD: 4.80,
        stock: 20,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
      },
      {
        barcode: '759100500507',
        name: 'Sangría Caroreña Tinto Verano 1.75L',
        category: 'Vinos y Sangrías',
        priceUSD: 5.50,
        costUSD: 3.80,
        stock: 28,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
      },
      {
        barcode: '759100500508',
        name: 'Hielo Cristal en Bolsa 3kg',
        category: 'Hielo y Mezcladores',
        priceUSD: 1.50,
        costUSD: 0.70,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
      },
      {
        barcode: '759100500509',
        name: 'Refresco Coca-Cola 2L (Mezclador)',
        category: 'Hielo y Mezcladores',
        priceUSD: 2.50,
        costUSD: 1.80,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      },
      {
        barcode: '759100500510',
        name: 'Doritos Mega Queso Fiesta 145g',
        category: 'Snacks',
        priceUSD: 2.40,
        costUSD: 1.60,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
      },
    ],
  },

  bookstore: {
    id: 'bookstore',
    name: 'Librería & Papelería',
    icon: '📚',
    tagline: 'Útiles escolares, cuadernos, resmas de papel, dibujo, arte y oficina',
    description: 'Orientado a papelerías comerciales, librerías, copisterías y tiendas de artículos escolares.',
    defaultStoreName: 'Librería & Papelería El Estudiante',
    recommendedPaletteId: 'indigo',
    recommendedBgPreset: 'blue',
    categories: ['Cuadernos', 'Útiles Escolares', 'Papelería y Resmas', 'Arte y Dibujo', 'Oficina y Archivo'],
    sampleProducts: [
      {
        barcode: '759100600601',
        name: 'Cuaderno Cosido Doble Línea 100 Hojas',
        category: 'Cuadernos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 75,
        minStock: 15,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      },
      {
        barcode: '759100600602',
        name: 'Cuaderno Cuadriculado 100 Hojas',
        category: 'Cuadernos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 65,
        minStock: 15,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      },
      {
        barcode: '759100600603',
        name: 'Caja de Lápices Grafito Mongol HB (12 uds)',
        category: 'Útiles Escolares',
        priceUSD: 2.60,
        costUSD: 1.25,
        stock: 45,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600604',
        name: 'Resma de Papel Bond Carta 75g (500 Hojas)',
        category: 'Papelería y Resmas',
        priceUSD: 5.50,
        costUSD: 3.80,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
      },
      {
        barcode: '759100600605',
        name: 'Set de Marcadores Punta Fina (24 Colores)',
        category: 'Arte y Dibujo',
        priceUSD: 4.80,
        costUSD: 2.30,
        stock: 25,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80',
      },
      {
        barcode: '759100600606',
        name: 'Juego de Geometría Escolar 4 Piezas',
        category: 'Útiles Escolares',
        priceUSD: 2.20,
        costUSD: 1.05,
        stock: 40,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600607',
        name: 'Carpeta de Archivo de Palanca Oficio',
        category: 'Oficina y Archivo',
        priceUSD: 3.40,
        costUSD: 1.95,
        stock: 22,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
      },
      {
        barcode: '759100600608',
        name: 'Pega Blanca Líquida Escolar 250ml',
        category: 'Útiles Escolares',
        priceUSD: 1.40,
        costUSD: 0.65,
        stock: 40,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600609',
        name: 'Borrador de Nata Escolar Suave',
        category: 'Útiles Escolares',
        priceUSD: 0.50,
        costUSD: 0.18,
        stock: 100,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600610',
        name: 'Tijera Escolar Punta Roma Acero',
        category: 'Útiles Escolares',
        priceUSD: 1.20,
        costUSD: 0.50,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
    ],
  },
};

/**
 * Aplica el rubro seleccionado al sistema:
 * 1. Configura el tema de color recomendado y el preset de fondo.
 * 2. Carga los productos de muestra en Dexie (modo replace o merge).
 * 3. Actualiza el nombre de la tienda en settings.
 * 4. Envía broadcast a la app móvil.
 */
export async function applyRubroToSystem(
  rubroId: StandardRubroId,
  options: {
    loadProducts?: boolean;
    productMode?: 'replace' | 'merge';
    updateStoreName?: boolean;
  } = { loadProducts: true, productMode: 'replace', updateStoreName: true }
): Promise<{ success: boolean; productCount: number; message: string }> {
  const rubro = STANDARD_RUBROS[rubroId];
  if (!rubro) {
    return { success: false, productCount: 0, message: 'Rubro no encontrado' };
  }

  // 1. Aplicar Branding / Tema
  const brandingConfig: BrandingConfig = {
    paletteId: rubro.recommendedPaletteId,
    uiStyle: 'industrial',
    industrialBg: rubro.recommendedBgPreset,
  };
  applyBrandingToDOM(brandingConfig);

  try {
    localStorage.setItem('venematic_branding_palette', brandingConfig.paletteId);
    localStorage.setItem('venematic_ui_style', brandingConfig.uiStyle);
    localStorage.setItem('venematic_industrial_bg', brandingConfig.industrialBg || 'white');
    localStorage.setItem('venematic_active_rubro', rubroId);
    await db.settings.put({ key: 'branding_config', value: brandingConfig });
    await db.settings.put({ key: 'active_rubro', value: rubroId });
  } catch {}

  // 2. Actualizar nombre de tienda si se solicitó
  if (options.updateStoreName) {
    try {
      const existingInfo = await db.settings.get('store_info');
      const updatedInfo = {
        name: rubro.defaultStoreName,
        rif: existingInfo?.value?.rif || 'J-40123456-7',
        phone: existingInfo?.value?.phone || '0414-1234567',
        address: existingInfo?.value?.address || 'Av. Principal, Local 1',
        footerMessage: existingInfo?.value?.footerMessage || '¡Gracias por su compra!',
      };
      await db.settings.put({ key: 'store_info', value: updatedInfo });
    } catch {}
  }

  // 3. Cargar productos de muestra si se solicitó
  let insertedCount = 0;
  if (options.loadProducts) {
    await db.transaction('rw', db.products, async () => {
      if (options.productMode === 'replace') {
        await db.products.clear();
      }

      for (const p of rubro.sampleProducts) {
        const existing = await db.products.where('barcode').equals(p.barcode).first();
        if (existing) {
          await db.products.update(existing.id!, {
            ...p,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await db.products.add({
            ...p,
            updatedAt: new Date().toISOString(),
          } as LocalProduct);
          insertedCount++;
        }
      }
    });

    // Sincronizar catálogo al celular automáticamente
    try {
      const allProducts = await db.products.toArray();
      const bcv = await db.settings.get('bcv_rate');
      await fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: allProducts,
          bcvRate: bcv?.value || 848.55,
        }),
      }).catch(() => {});
    } catch {}
  }

  // Notificar al sistema
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('venematic:rubro_changed', {
        detail: {
          rubroId,
          rubroName: rubro.name,
          storeName: rubro.defaultStoreName,
        },
      })
    );
  }

  return {
    success: true,
    productCount: rubro.sampleProducts.length,
    message: `¡Rubro "${rubro.name}" aplicado con éxito! Tema y catálogo configurados.`,
  };
}

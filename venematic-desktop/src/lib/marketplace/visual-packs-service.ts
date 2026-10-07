import { db } from '@/lib/db';
import { db as firestoreDb } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';

export interface VisualPackProduct {
  name: string;
  category: string;
  priceUsd: number;
  costUsd?: number;
  barcode?: string;
  imageUrl: string;
  isStockManaged?: boolean;
  stock?: number;
  taxRate?: number;
  description?: string;
}

export interface VisualPack {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
  version: string;
  totalProducts: number;
  coverImage: string;
  isFree: boolean;
  priceUsd?: number;
  accessCode?: string;
  tags: string[];
  products: VisualPackProduct[];
  author?: string;
  createdAt?: string;
}

// Catálogos base de alta calidad integrados (listos para usar offline de inmediato)
export const DEFAULT_VISUAL_PACKS: VisualPack[] = [
  {
    id: 'pack-comida-street-venezuela',
    title: 'Comida Rápida & Street Food (PNG Transparente HD)',
    description: 'Hamburguesas, perros calientes, combos familiares, cachapas con queso de mano y cochino frito, pepitos 30cm, shawarmas y refrescos en PNG transparente.',
    category: 'Comida Rápida',
    badge: '⭐ Oficial Street',
    version: '1.0.0',
    totalProducts: 10,
    coverImage: '/packs/comida-street/hamburguesa.png',
    isFree: true,
    tags: ['hamburguesas', 'perros', 'cachapas', 'pepito', 'shawarma', 'street', 'venezuela'],
    products: [
      {
        name: 'Hamburguesa Clásica Especial 200g',
        category: 'Hamburguesas',
        priceUsd: 6.50,
        costUsd: 3.80,
        barcode: '759100000001',
        imageUrl: '/packs/comida-street/hamburguesa.png',
        stock: 50,
        isStockManaged: true,
        description: 'Carne 200g a la plancha, queso cheddar fundido, lechuga romana, tomate y salsas de la casa.'
      },
      {
        name: 'Perro Caliente Tradicional Con Todo',
        category: 'Perros',
        priceUsd: 2.50,
        costUsd: 1.20,
        barcode: '759100000002',
        imageUrl: '/packs/comida-street/perro-caliente.png',
        stock: 60,
        isStockManaged: true,
        description: 'Salchicha de primera, cebollita picada, repollo, lluvia de papitas crocantes, queso blanco y las 3 salsas.'
      },
      {
        name: 'Pepito Mixto Gratinado 30cm',
        category: 'Hamburguesas',
        priceUsd: 8.50,
        costUsd: 5.20,
        barcode: '759100000003',
        imageUrl: '/packs/comida-street/pepito.png',
        stock: 35,
        isStockManaged: true,
        description: 'Pan artesanal suave de 30cm, lomito jugoso, pollo grille, papitas crocantes y queso de mano gratinado.'
      },
      {
        name: 'Cachapa Tradicional con Cochino Frito',
        category: 'Combos',
        priceUsd: 9.50,
        costUsd: 5.50,
        barcode: '759100000004',
        imageUrl: '/packs/comida-street/cachapa-con-cochino.png',
        stock: 30,
        isStockManaged: true,
        description: 'Masa de maíz tierno recién molido, abundante queso de mano fresco, mantequilla llanera y porción de cochino frito crujiente.'
      },
      {
        name: 'Cachapa con Queso de Mano Doble',
        category: 'Combos',
        priceUsd: 6.00,
        costUsd: 3.20,
        barcode: '759100000005',
        imageUrl: '/packs/comida-street/cachapa-con-queso.png',
        stock: 40,
        isStockManaged: true,
        description: 'Cachapa dorada con doble rueda de queso de mano artesanal y mantequilla derretida.'
      },
      {
        name: 'Mega Promo 5 Perros Calientes',
        category: 'Combos',
        priceUsd: 10.00,
        costUsd: 5.50,
        barcode: '759100000006',
        imageUrl: '/packs/comida-street/combo-5-perros.png',
        stock: 25,
        isStockManaged: true,
        description: '5 Perros calientes tradicionales completos con papitas, queso blanco y salsas variadas.'
      },
      {
        name: 'Combo Familiar 4 Perros + Refresco 1.5L',
        category: 'Combos',
        priceUsd: 11.50,
        costUsd: 6.20,
        barcode: '759100000007',
        imageUrl: '/packs/comida-street/combo-4-perros-refresco.png',
        stock: 20,
        isStockManaged: true,
        description: '4 Perros calientes especiales con todo + 1 Refresco familiar de 1.5 litros bien frío.'
      },
      {
        name: 'Shawarma Mixto Libanés Especial',
        category: 'Hamburguesas',
        priceUsd: 5.50,
        costUsd: 3.00,
        barcode: '759100000008',
        imageUrl: '/packs/comida-street/shawarma.png',
        stock: 45,
        isStockManaged: true,
        description: 'Pan pita árabe tostado, carne marinada y pollo al trompo, lechuga, tomate, crema de ajo y salsa tártara.'
      },
      {
        name: 'Combo Shawarma + Papas + Refresco',
        category: 'Combos',
        priceUsd: 8.50,
        costUsd: 4.80,
        barcode: '759100000009',
        imageUrl: '/packs/comida-street/combo-shawarma.png',
        stock: 30,
        isStockManaged: true,
        description: '1 Shawarma Mixto grande + 1 ración de papas fritas crocantes + 1 bebida personal fría.'
      },
      {
        name: 'Refresco Personal en Lata 355ml',
        category: 'Bebidas',
        priceUsd: 1.50,
        costUsd: 0.85,
        barcode: '759100000010',
        imageUrl: '/packs/comida-street/refresco.png',
        stock: 100,
        isStockManaged: true,
        description: 'Refresco frío a elección (Coca-Cola, Pepsi, Chinotto, Kolita).'
      }
    ]
  },
  {
    id: 'pack-bodegon-licores',
    title: 'Bodegón, Licores & Bebidas Premium',
    description: 'Catálogo completo de rones venezolanos, cervezas, whiskies, vinos, refrescos, snacks importados y hielo con fotografías HD listas con fondo blanco.',
    category: 'Bodegón & Licores',
    badge: 'Popular',
    version: '1.2.0',
    totalProducts: 10,
    coverImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=80',
    isFree: true,
    tags: ['bodegon', 'ron', 'cerveza', 'refresco', 'licores', 'venezuela'],
    products: [
      {
        name: 'Ron Santa Teresa Gran Reserva 750ml',
        category: 'Licores & Rones',
        priceUsd: 12.50,
        costUsd: 9.80,
        barcode: '7591031001015',
        imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80',
        stock: 24,
        isStockManaged: true,
      },
      {
        name: 'Ron Diplomático Reserva Exclusiva 750ml',
        category: 'Licores & Rones',
        priceUsd: 36.00,
        costUsd: 29.50,
        barcode: '7591031002029',
        imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=80',
        stock: 12,
        isStockManaged: true,
      },
      {
        name: 'Cerveza Polar Pilsen Tercios (Pack 6)',
        category: 'Cervezas & Maltas',
        priceUsd: 6.50,
        costUsd: 4.80,
        barcode: '7591011000014',
        imageUrl: 'https://images.unsplash.com/photo-1608270191763-7186a827ec31?w=500&auto=format&fit=crop&q=80',
        stock: 50,
        isStockManaged: true,
      },
      {
        name: 'Cerveza Polar Light Lata 355ml',
        category: 'Cervezas & Maltas',
        priceUsd: 1.25,
        costUsd: 0.90,
        barcode: '7591011000038',
        imageUrl: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=500&auto=format&fit=crop&q=80',
        stock: 96,
        isStockManaged: true,
      },
      {
        name: 'Whisky Old Parr 12 Años 750ml',
        category: 'Whiskies',
        priceUsd: 32.00,
        costUsd: 26.00,
        barcode: '5000281005409',
        imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80',
        stock: 8,
        isStockManaged: true,
      },
      {
        name: 'Coca-Cola Sabor Original 2 Litros',
        category: 'Bebidas & Refrescos',
        priceUsd: 2.75,
        costUsd: 2.10,
        barcode: '7591024001011',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
        stock: 40,
        isStockManaged: true,
      },
      {
        name: 'Agua Mineral Minalba 1.5L',
        category: 'Bebidas & Refrescos',
        priceUsd: 1.00,
        costUsd: 0.65,
        barcode: '7591008000010',
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
        stock: 60,
        isStockManaged: true,
      },
      {
        name: 'Bolsa de Hielo Purificado 5Kg',
        category: 'Hielo & Congelados',
        priceUsd: 2.00,
        costUsd: 1.10,
        barcode: '7590000000055',
        imageUrl: 'https://images.unsplash.com/photo-1516054575922-f0b8eeadec1a?w=500&auto=format&fit=crop&q=80',
        stock: 30,
        isStockManaged: true,
      },
      {
        name: 'Papas Pringles Original 158g',
        category: 'Snacks & Pasapalos',
        priceUsd: 3.50,
        costUsd: 2.60,
        barcode: '038000138416',
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80',
        stock: 25,
        isStockManaged: true,
      },
      {
        name: 'Energizante Red Bull 250ml',
        category: 'Bebidas & Refrescos',
        priceUsd: 2.50,
        costUsd: 1.80,
        barcode: '9002490100070',
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
        stock: 35,
        isStockManaged: true,
      }
    ]
  },
  {
    id: 'pack-comida-rapida-restaurante',
    title: 'Comida Rápida, Burgers & Street Food',
    description: 'Hamburguesas gourmet, perros calientes, pepitos venezolanos, pizzas, tequeños, papas fritas y combos con fotos apetitosas en alta resolución.',
    category: 'Restaurante & Fast Food',
    badge: 'Nuevo',
    version: '1.1.0',
    totalProducts: 8,
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isFree: true,
    tags: ['hamburguesas', 'comida', 'pepito', 'pizza', 'tequeños', 'fast food'],
    products: [
      {
        name: 'Hamburguesa Doble Carne con Queso Cheddar & Tocineta',
        category: 'Hamburguesas',
        priceUsd: 6.50,
        costUsd: 3.20,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Hamburguesa Crispy Chicken con Salsa Especial',
        category: 'Hamburguesas',
        priceUsd: 5.50,
        costUsd: 2.80,
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Perro Caliente Especial con Todo y Queso Amarillo',
        category: 'Perros Calientes',
        priceUsd: 2.50,
        costUsd: 1.10,
        imageUrl: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Pepito Mixto (Carne & Pollo) 30cm con Queso Parmesano',
        category: 'Pepitos & Especiales',
        priceUsd: 9.00,
        costUsd: 4.50,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Ración de Tequeños de Queso (6 unidades)',
        category: 'Entradas & Pasapalos',
        priceUsd: 4.00,
        costUsd: 1.80,
        imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Papas Fritas Rústicas con Queso Fundido y Bacon',
        category: 'Acompañantes',
        priceUsd: 3.50,
        costUsd: 1.40,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Pizza Pepperoni Familiar (8 Porciones)',
        category: 'Pizzas',
        priceUsd: 11.00,
        costUsd: 5.50,
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      },
      {
        name: 'Club House Sandwich con Papas Fritas',
        category: 'Sandwiches',
        priceUsd: 7.00,
        costUsd: 3.20,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
        stock: 100,
        isStockManaged: false,
      }
    ]
  },
  {
    id: 'pack-viveres-supermercado',
    title: 'Víveres, Despensa & Supermercado',
    description: 'Harina PAN, arroz, pasta, café, azúcar, aceite, leche, atún y productos básicos venezolanos con códigos de barra oficiales EAN-13.',
    category: 'Víveres & Abarrotes',
    badge: 'Esencial',
    version: '1.0.0',
    totalProducts: 8,
    coverImage: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&auto=format&fit=crop&q=80',
    isFree: true,
    tags: ['viveres', 'harina pan', 'mercado', 'arroz', 'cafe', 'comida'],
    products: [
      {
        name: 'Harina PAN Blanca Tradicional 1Kg',
        category: 'Harinas & Granos',
        priceUsd: 1.30,
        costUsd: 1.05,
        barcode: '7591001000116',
        imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=500&auto=format&fit=crop&q=80',
        stock: 120,
        isStockManaged: true,
      },
      {
        name: 'Arroz Primor Tradicional 1Kg',
        category: 'Harinas & Granos',
        priceUsd: 1.45,
        costUsd: 1.15,
        barcode: '7591001000239',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
        stock: 80,
        isStockManaged: true,
      },
      {
        name: 'Pasta Primor Larga Spaguetti 1Kg',
        category: 'Pastas & Salsas',
        priceUsd: 1.60,
        costUsd: 1.25,
        barcode: '7591001000352',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281701?w=500&auto=format&fit=crop&q=80',
        stock: 75,
        isStockManaged: true,
      },
      {
        name: 'Café Fama de América Tostado y Molido 250g',
        category: 'Café & Infusiones',
        priceUsd: 2.80,
        costUsd: 2.15,
        barcode: '7591045000120',
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80',
        stock: 45,
        isStockManaged: true,
      },
      {
        name: 'Aceite Mazeite Puro de Maíz 1L',
        category: 'Aceites & Grasas',
        priceUsd: 3.20,
        costUsd: 2.60,
        barcode: '7591001000413',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
        stock: 35,
        isStockManaged: true,
      },
      {
        name: 'Azúcar Montalbán Refinada 1Kg',
        category: 'Azúcar & Endulzantes',
        priceUsd: 1.35,
        costUsd: 1.05,
        barcode: '7591028000010',
        imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop&q=80',
        stock: 60,
        isStockManaged: true,
      },
      {
        name: 'Atún Margarita en Aceite 140g',
        category: 'Enlatados & Conservas',
        priceUsd: 1.85,
        costUsd: 1.40,
        barcode: '7591001000529',
        imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&auto=format&fit=crop&q=80',
        stock: 50,
        isStockManaged: true,
      },
      {
        name: 'Mayonesa Mavesa Tradicional 445g',
        category: 'Salsas & Aderezos',
        priceUsd: 2.40,
        costUsd: 1.85,
        barcode: '7591001000635',
        imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=500&auto=format&fit=crop&q=80',
        stock: 40,
        isStockManaged: true,
      }
    ]
  },
  {
    id: 'pack-farmacia-cuidado',
    title: 'Farmacia, Salud & Cuidado Personal',
    description: 'Medicamentos analgésicos, cuidado bucal, jabones, champú, desodorantes y primeros auxilios con códigos y dosificación.',
    category: 'Farmacia & Cuidado',
    badge: 'Salud',
    version: '1.0.0',
    totalProducts: 6,
    coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    isFree: true,
    tags: ['farmacia', 'salud', 'medicina', 'shampoo', 'crema', 'higiene'],
    products: [
      {
        name: 'Acetaminofén / Paracetamol 500mg (Caja 10 Tab)',
        category: 'Medicamentos',
        priceUsd: 1.50,
        costUsd: 0.90,
        barcode: '7592000000011',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
        stock: 50,
        isStockManaged: true,
      },
      {
        name: 'Ibuprofeno 400mg (Caja 10 Tab)',
        category: 'Medicamentos',
        priceUsd: 1.80,
        costUsd: 1.10,
        barcode: '7592000000028',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
        stock: 45,
        isStockManaged: true,
      },
      {
        name: 'Crema Dental Colgate Triple Acción 100ml',
        category: 'Cuidado Bucal',
        priceUsd: 1.95,
        costUsd: 1.45,
        barcode: '7592000000035',
        imageUrl: 'https://images.unsplash.com/photo-1559591937-e1032b4b4e94?w=500&auto=format&fit=crop&q=80',
        stock: 35,
        isStockManaged: true,
      },
      {
        name: 'Jabón de Baño Protex Antibacterial 110g',
        category: 'Cuidado Personal',
        priceUsd: 1.20,
        costUsd: 0.85,
        barcode: '7592000000042',
        imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&auto=format&fit=crop&q=80',
        stock: 40,
        isStockManaged: true,
      },
      {
        name: 'Champú Pantene Restauración 400ml',
        category: 'Cuidado Capilar',
        priceUsd: 4.80,
        costUsd: 3.60,
        barcode: '7592000000059',
        imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
        stock: 20,
        isStockManaged: true,
      },
      {
        name: 'Alcohol Antiséptico 70% 500ml',
        category: 'Primeros Auxilios',
        priceUsd: 2.20,
        costUsd: 1.50,
        barcode: '7592000000066',
        imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=80',
        stock: 30,
        isStockManaged: true,
      }
    ]
  },
  {
    id: 'pack-snacks-venezuela',
    title: 'Snacks, Chocolates & Chucherías Venezuela (17 Productos HD)',
    description: 'Catálogo de alta rotación para bodegas y quioscos: Cheese Tris, Doritos, Pepitos, Ruffles, Cocosete, Susy, Toronto, Carré, Galak y más en PNG transparente.',
    category: 'Snacks & Golosinas',
    badge: '🔥 Bodega & Kiosco',
    version: '1.0.0',
    totalProducts: 17,
    coverImage: '/packs/snacks/Cheese%20Tris.png',
    isFree: true,
    priceUsd: 0,
    tags: ['snacks', 'chucherias', 'galletas', 'chocolates', 'savoy', 'frito-lay', 'nestle', 'bodega', 'venezuela'],
    products: [
      { name: 'Chicle Bolibomba Clásico Fresa', category: 'Golosinas', priceUsd: 0.25, costUsd: 0.12, barcode: '759101000001', imageUrl: '/packs/snacks/Bolibomba.png', stock: 100, isStockManaged: true, description: 'Chicle bomba tradicional sabor a fresa intensa.' },
      { name: 'Chocolate Savoy Carré con Avellanas 25g', category: 'Chocolates', priceUsd: 1.20, costUsd: 0.75, barcode: '759101000002', imageUrl: '/packs/snacks/Carre.png', stock: 50, isStockManaged: true, description: 'Fino chocolate de leche Savoy relleno con avellana seleccionada.' },
      { name: 'Cheese Tris Tradicional Frito-Lay 45g', category: 'Snacks', priceUsd: 0.90, costUsd: 0.55, barcode: '759101000003', imageUrl: '/packs/snacks/Cheese%20Tris.png', stock: 80, isStockManaged: true, description: 'Snack crujiente horneado con inconfundible sabor a queso venezolano.' },
      { name: 'Cheetos Mega Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 0.90, costUsd: 0.55, barcode: '759101000004', imageUrl: '/packs/snacks/Cheetos%20Mega%20Queso.png', stock: 75, isStockManaged: true, description: 'Crujientes palitos de maíz inflado con mega queso.' },
      { name: 'Chiclets Adams Clásico Menta 2 Pastillas', category: 'Golosinas', priceUsd: 0.35, costUsd: 0.18, barcode: '759101000005', imageUrl: '/packs/snacks/Chiclets.png', stock: 120, isStockManaged: true, description: 'Pastillas de goma de mascar sabor a menta refrescante.' },
      { name: 'Galleta Cocosete Sándwich Nestlé 50g', category: 'Galletas', priceUsd: 1.00, costUsd: 0.60, barcode: '759101000006', imageUrl: '/packs/snacks/Cocosete.png', stock: 90, isStockManaged: true, description: 'Crujiente barquillo relleno de deliciosa crema de coco auténtico.' },
      { name: 'De Todito Frito-Lay Familiar 110g', category: 'Snacks', priceUsd: 1.80, costUsd: 1.15, barcode: '759101000007', imageUrl: '/packs/snacks/De%20Todito%20Mix.png', stock: 45, isStockManaged: true, description: 'Mezcla perfecta de Doritos, Cheese Tris, Platanitos y Fritos crujientes.' },
      { name: 'Doritos Mega Queso Frito-Lay 42g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000008', imageUrl: '/packs/snacks/Doritos%20Mega%20Queso.png', stock: 80, isStockManaged: true, description: 'Totopos triangulares de maíz crujiente bañados con queso cheddar.' },
      { name: 'Chocolate Blanco Galak Nestlé 30g', category: 'Chocolates', priceUsd: 1.10, costUsd: 0.70, barcode: '759101000009', imageUrl: '/packs/snacks/Galak.png', stock: 60, isStockManaged: true, description: 'Cremoso chocolate blanco elaborado con leche pura Nestlé.' },
      { name: 'Pepito Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 0.85, costUsd: 0.50, barcode: '759101000010', imageUrl: '/packs/snacks/Pepitos.png', stock: 90, isStockManaged: true, description: 'Aros y cilindros de maíz inflado suaves con sabor a queso tradicional.' },
      { name: 'Pastelito Pingüino Marinela Pack Doble', category: 'Galletas', priceUsd: 1.50, costUsd: 0.95, barcode: '759101000011', imageUrl: '/packs/snacks/Pinguino.png', stock: 40, isStockManaged: true, description: 'Esponjoso pastelito de chocolate relleno de rica crema con firma decorativa.' },
      { name: 'Platanitos Ondulados Salados 45g', category: 'Snacks', priceUsd: 0.80, costUsd: 0.48, barcode: '759101000012', imageUrl: '/packs/snacks/Platanitos.png', stock: 85, isStockManaged: true, description: 'Rebanadas crocantes de plátano verde fritas al punto exacto con sal.' },
      { name: 'Ruffles Mega Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000013', imageUrl: '/packs/snacks/Rufles%20Mega%20Queso.png', stock: 70, isStockManaged: true, description: 'Papas onduladas ultra crujientes condimentadas con queso cheddar.' },
      { name: 'Ruffles Papas Saladas Original 40g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000014', imageUrl: '/packs/snacks/Rufles%20Original.png', stock: 70, isStockManaged: true, description: 'Papas onduladas naturales con corte grueso y sal marina.' },
      { name: 'Caramelos Masticables Frutales Sparkies', category: 'Golosinas', priceUsd: 0.50, costUsd: 0.28, barcode: '759101000015', imageUrl: '/packs/snacks/Sparkies.png', stock: 110, isStockManaged: true, description: 'Caramelos confitados masticables surtidos en ricos sabores a frutas.' },
      { name: 'Galleta Susy Savoy Chocolate 50g', category: 'Galletas', priceUsd: 1.00, costUsd: 0.60, barcode: '759101000016', imageUrl: '/packs/snacks/Susy.png', stock: 90, isStockManaged: true, description: 'Capas crujientes de oblea rellenas de auténtico chocolate Savoy.' },
      { name: 'Bombón Toronto Savoy Avellana Original', category: 'Chocolates', priceUsd: 0.40, costUsd: 0.22, barcode: '759101000017', imageUrl: '/packs/snacks/Toronto.png', stock: 150, isStockManaged: true, description: 'Emblemático bombón venezolano de chocolate con leche y centro de avellana entera.' }
    ]
  }
];

// Obtener todos los paquetes disponibles (Firestore + Defaults)
export async function getAvailableVisualPacks(): Promise<VisualPack[]> {
  try {
    const packsMap = new Map<string, VisualPack>();

    // 1. Cargar paquetes predeterminados
    DEFAULT_VISUAL_PACKS.forEach(p => packsMap.set(p.id, p));

    // 2. Intentar consultar Firestore si está disponible
    try {
      const colRef = collection(firestoreDb, 'marketplace_packs');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        snap.forEach(docSnap => {
          const data = docSnap.data() as VisualPack;
          packsMap.set(docSnap.id, { ...data, id: docSnap.id });
        });
      }
    } catch (firebaseErr) {
      console.warn('No se pudo conectar a Firestore para paquetes (usando catálogo local offline):', firebaseErr);
    }

    return Array.from(packsMap.values());
  } catch (err) {
    console.error('Error al obtener paquetes visuales:', err);
    return DEFAULT_VISUAL_PACKS;
  }
}

// Obtener IDs de paquetes ya instalados localmente
export function getInstalledPackIds(): string[] {
  try {
    const raw = localStorage.getItem('venematic_installed_visual_packs');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Marcar paquete como instalado
export function markPackAsInstalled(packId: string) {
  try {
    const installed = new Set(getInstalledPackIds());
    installed.add(packId);
    localStorage.setItem('venematic_installed_visual_packs', JSON.stringify(Array.from(installed)));
  } catch {}
}

// Desbloquear paquete privado por código
export async function unlockPrivatePack(code: string): Promise<VisualPack | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const colRef = collection(firestoreDb, 'marketplace_packs');
    const q = query(colRef, where('accessCode', '==', cleanCode));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { ...(docSnap.data() as VisualPack), id: docSnap.id };
    }
  } catch (err) {
    console.warn('Error al verificar código en Firestore:', err);
  }

  // Comprobar si coincide con algún paquete local
  const found = DEFAULT_VISUAL_PACKS.find(p => p.accessCode && p.accessCode.toUpperCase() === cleanCode);
  return found || null;
}

// Importar e insertar productos e imágenes en la base de datos local (IndexedDB)
export async function importVisualPackToLocalDb(
  pack: VisualPack,
  options?: { overwriteExisting?: boolean }
): Promise<{ importedCount: number; categoriesCreated: number }> {
  let importedCount = 0;
  let categoriesCreated = 0;

  try {
    // 1. Obtener productos y categorías existentes
    const existingProducts = await db.products.toArray();
    const existingCategories = Array.from(new Set(existingProducts.map(p => p.category))).filter(Boolean);
    const categoryNames = new Set(existingCategories.map(c => (c || '').toLowerCase().trim()));
    const productBarcodes = new Set(existingProducts.map(p => p.barcode ? p.barcode.trim() : ''));
    const productNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));

    // 2. Procesar categorías nuevas
    const packCategories = new Set(pack.products.map(p => (p.category || '').trim()));

    packCategories.forEach(catName => {
      if (catName && !categoryNames.has(catName.toLowerCase().trim())) {
        categoryNames.add(catName.toLowerCase().trim());
        categoriesCreated++;
      }
    });

    // 3. Procesar e insertar productos con imágenes HD
    const productsToInsert: any[] = [];

    for (const p of pack.products) {
      const pNameLower = p.name.toLowerCase().trim();
      const pBarcode = p.barcode ? p.barcode.trim() : '';

      // Si ya existe por código de barras o nombre y no se requiere sobreescribir
      if (!options?.overwriteExisting) {
        if (pBarcode && productBarcodes.has(pBarcode)) continue;
        if (productNames.has(pNameLower)) continue;
      }

      productsToInsert.push({
        name: p.name,
        category: p.category || 'General',
        priceUSD: Number(p.priceUsd) || 0,
        costUSD: Number(p.costUsd) || 0,
        barcode: p.barcode || `VP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        image: p.imageUrl || '',
        stock: p.stock !== undefined ? p.stock : 50,
        minStock: 5,
        unit: 'UND',
        updatedAt: new Date().toISOString(),
      });

      importedCount++;
      if (pBarcode) productBarcodes.add(pBarcode);
      productNames.add(pNameLower);
    }

    if (productsToInsert.length > 0) {
      await db.products.bulkAdd(productsToInsert);
    }

    // Marcar como instalado
    markPackAsInstalled(pack.id);

    return { importedCount, categoriesCreated };
  } catch (err) {
    console.error('Error al importar paquete a la base de datos local:', err);
    throw err;
  }
}

// Desmarcar paquete como instalado
export function unmarkPackAsInstalled(packId: string) {
  try {
    const installed = new Set(getInstalledPackIds());
    installed.delete(packId);
    localStorage.setItem('venematic_installed_visual_packs', JSON.stringify(Array.from(installed)));
  } catch {}
}

// Desinstalar / Eliminar una colección o catálogo de productos específico
export async function uninstallVisualPack(pack: VisualPack): Promise<{ uninstalledCount: number }> {
  let uninstalledCount = 0;
  try {
    const packBarcodes = new Set(pack.products.map(p => p.barcode ? p.barcode.trim() : '').filter(Boolean));
    const packNames = new Set(pack.products.map(p => p.name.toLowerCase().trim()));

    const allProducts = await db.products.toArray();
    const idsToDelete: number[] = [];

    for (const prod of allProducts) {
      const pBarcode = prod.barcode ? prod.barcode.trim() : '';
      const pName = prod.name ? prod.name.toLowerCase().trim() : '';

      if ((pBarcode && packBarcodes.has(pBarcode)) || packNames.has(pName)) {
        if (typeof prod.id === 'number') {
          idsToDelete.push(prod.id);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await db.products.bulkDelete(idsToDelete);
      uninstalledCount = idsToDelete.length;
    }

    unmarkPackAsInstalled(pack.id);
    return { uninstalledCount };
  } catch (err) {
    console.error('Error al desinstalar colección del paquete:', err);
    throw err;
  }
}

// Limpiar por completo todo el catálogo de productos para iniciar una Marca Nueva
export async function clearAllProductsCatalog(): Promise<{ clearedCount: number }> {
  try {
    const count = await db.products.count();
    await db.products.clear();
    
    // Limpiar registros de paquetes instalados y caché de tablet-pos
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('venematic_installed_visual_packs');
        localStorage.setItem('klikpos_tablet_products', JSON.stringify([]));
      } catch {}
    }

    return { clearedCount: count };
  } catch (err) {
    console.error('Error al limpiar todo el catálogo de productos:', err);
    throw err;
  }
}


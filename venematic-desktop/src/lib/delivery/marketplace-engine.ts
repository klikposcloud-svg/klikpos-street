import { MarketplaceStore, CrossStoreProduct, DeliveryOrder } from '@/types/delivery'
import { BUSINESS_RUBROS, type BusinessType } from '@/lib/utils/business-rubros'

// Catálogo de Tiendas de la Red Marketplace en Venezuela
export const INITIAL_MARKETPLACE_STORES: MarketplaceStore[] = [
  {
    id: 'store_venemarket_chacao',
    name: 'Venemarket Express Chacao',
    businessType: 'supermarket',
    businessTypeLabel: 'Supermercado',
    tagline: 'Víveres, charcutería y productos frescos importados',
    city: 'Caracas',
    state: 'Miranda',
    zone: 'Chacao / Altamira',
    address: 'Av. Francisco de Miranda, Edif. Parque Cristal, Local 4-B',
    lat: 10.4965,
    lng: -66.8523,
    phone: '+584141234567',
    rating: 4.9,
    reviewCount: 342,
    deliveryTime: '20-35 min',
    deliveryFeeUSD: 2.0,
    minOrderUSD: 5.0,
    isOpen: true,
    openingHours: '8:00 AM - 9:00 PM',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  {
    id: 'store_farma_mercedes',
    name: 'Farmacia & Bienestar Las Mercedes',
    businessType: 'pharmacy',
    businessTypeLabel: 'Farmacia',
    tagline: 'Medicamentos, cuidado personal, fórmulas e insumos médicos',
    city: 'Caracas',
    state: 'Miranda',
    zone: 'Las Mercedes',
    address: 'Calle Madrid con Calle Veracruz, Las Mercedes',
    lat: 10.4812,
    lng: -66.8621,
    phone: '+584129876543',
    rating: 4.8,
    reviewCount: 215,
    deliveryTime: '15-25 min',
    deliveryFeeUSD: 2.5,
    minOrderUSD: 4.0,
    isOpen: true,
    openingHours: '24 Horas',
    logo: '💊',
    banner: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  {
    id: 'store_libreria_los_palos',
    name: 'Librería & Papelería Saber Los Palos Grandes',
    businessType: 'bookstore',
    businessTypeLabel: 'Librería',
    tagline: 'Textos escolares, papelería fina, cuadernos y arte',
    city: 'Caracas',
    state: 'Miranda',
    zone: 'Los Palos Grandes',
    address: '3ra Avenida de Los Palos Grandes, C.C. Parque del Sol',
    lat: 10.4990,
    lng: -66.8450,
    phone: '+584245551234',
    rating: 4.7,
    reviewCount: 98,
    deliveryTime: '25-40 min',
    deliveryFeeUSD: 2.0,
    minOrderUSD: 3.0,
    isOpen: true,
    openingHours: '9:00 AM - 6:00 PM',
    logo: '📚',
    banner: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  {
    id: 'store_ferro_el_recreo',
    name: 'Ferretería & Construcción El Recreo',
    businessType: 'hardware',
    businessTypeLabel: 'Ferretería',
    tagline: 'Herramientas, electricidad, fontanería, tornillos y pinturas',
    city: 'Caracas',
    state: 'Distrito Capital',
    zone: 'Sabana Grande / El Recreo',
    address: 'Av. Casanova, C.C. El Recreo Nivel C1',
    lat: 10.4910,
    lng: -66.8770,
    phone: '+584163334455',
    rating: 4.6,
    reviewCount: 154,
    deliveryTime: '30-50 min',
    deliveryFeeUSD: 3.0,
    minOrderUSD: 8.0,
    isOpen: true,
    openingHours: '8:30 AM - 5:30 PM',
    logo: '🔨',
    banner: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  {
    id: 'store_venemarket_valencia',
    name: 'Venemarket Viñedo Valencia',
    businessType: 'supermarket',
    businessTypeLabel: 'Supermercado',
    tagline: 'Alimentos, víveres al mayor y detal en Valencia Norte',
    city: 'Valencia',
    state: 'Carabobo',
    zone: 'El Viñedo / Prebo',
    address: 'Av. Carlos Sanda, C.C. Viñedo Plaza',
    lat: 10.2185,
    lng: -68.0076,
    phone: '+584144445566',
    rating: 4.9,
    reviewCount: 280,
    deliveryTime: '20-30 min',
    deliveryFeeUSD: 1.5,
    minOrderUSD: 5.0,
    isOpen: true,
    openingHours: '8:00 AM - 8:30 PM',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  {
    id: 'store_tech_maracaibo',
    name: 'Venetech Digital 5 de Julio',
    businessType: 'electronics',
    businessTypeLabel: 'Tecnología',
    tagline: 'Cables, cargadores, accesorios para celular y computación',
    city: 'Maracaibo',
    state: 'Zulia',
    zone: '5 de Julio / Delicias',
    address: 'Calle 77 (5 de Julio) con Av. 15',
    lat: 10.6650,
    lng: -71.6250,
    phone: '+584127778899',
    rating: 4.8,
    reviewCount: 167,
    deliveryTime: '20-40 min',
    deliveryFeeUSD: 2.0,
    minOrderUSD: 5.0,
    isOpen: true,
    openingHours: '9:00 AM - 7:00 PM',
    logo: '📱',
    banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    acceptsPagoMovil: true,
    acceptsZelle: true,
    acceptsCash: true,
    acceptsCard: true,
  }
];

// Zonas Populares para Filtrar en Venezuela
export const POPULAR_ZONES = [
  { key: 'all', label: 'Toda Venezuela (Red Nacional)', city: 'all' },
  { key: 'chacao', label: '📍 Caracas - Chacao / Altamira', city: 'Caracas', lat: 10.4965, lng: -66.8523 },
  { key: 'mercedes', label: '📍 Caracas - Las Mercedes', city: 'Caracas', lat: 10.4812, lng: -66.8621 },
  { key: 'palos_grandes', label: '📍 Caracas - Los Palos Grandes', city: 'Caracas', lat: 10.4990, lng: -66.8450 },
  { key: 'sabana_grande', label: '📍 Caracas - Sabana Grande / El Recreo', city: 'Caracas', lat: 10.4910, lng: -66.8770 },
  { key: 'vinedo', label: '📍 Valencia - El Viñedo / Prebo', city: 'Valencia', lat: 10.2185, lng: -68.0076 },
  { key: 'maracaibo', label: '📍 Maracaibo - 5 de Julio / Delicias', city: 'Maracaibo', lat: 10.6650, lng: -71.6250 },
  { key: 'barquisimeto', label: '📍 Barquisimeto - Este / Nueva Segovia', city: 'Barquisimeto', lat: 10.0650, lng: -69.3150 },
];

const DEFAULT_DEMO_PRODUCTS = [
  { id: 'p_1', name: 'Harina PAN 1kg', category: 'viveres', priceUSD: 1.20, stock: 50, barcode: '7591001000010', image: '' },
  { id: 'p_2', name: 'Arroz Mary Tradicional 1kg', category: 'viveres', priceUSD: 1.35, stock: 40, barcode: '7591001000027', image: '' },
  { id: 'p_3', name: 'Pasta Primor Plumas 500g', category: 'viveres', priceUSD: 1.10, stock: 35, barcode: '7591001000034', image: '' },
  { id: 'p_4', name: 'Aceite Mazeite 1L', category: 'viveres', priceUSD: 3.50, stock: 20, barcode: '7591001000041', image: '' },
  { id: 'p_5', name: 'Azúcar Montalbán 1kg', category: 'viveres', priceUSD: 1.40, stock: 30, barcode: '7591001000058', image: '' },
  { id: 'p_6', name: 'Café Fama de América 250g', category: 'viveres', priceUSD: 2.50, stock: 25, barcode: '7591001000065', image: '' },
  { id: 'p_7', name: 'Leche en Polvo La Campiña 400g', category: 'lacteos', priceUSD: 4.20, stock: 15, barcode: '7591001000072', image: '' },
  { id: 'p_8', name: 'Queso Blanco Llanero 1kg', category: 'lacteos', priceUSD: 5.50, stock: 12, barcode: '7591001000089', image: '' },
  { id: 'p_9', name: 'Mantequilla Mavesa 500g', category: 'lacteos', priceUSD: 2.80, stock: 18, barcode: '7591001000096', image: '' },
  { id: 'p_10', name: 'Mayonesa Mavesa 445g', category: 'salsas', priceUSD: 2.60, stock: 22, barcode: '7591001000102', image: '' },
  { id: 'p_11', name: 'Salsa de Tomate Pampero 397g', category: 'salsas', priceUSD: 1.50, stock: 20, barcode: '7591001000119', image: '' },
  { id: 'p_12', name: 'Atún Margarita en Aceite 140g', category: 'enlatados', priceUSD: 1.80, stock: 30, barcode: '7591001000126', image: '' }
];

// Catálogo demo de productos por tienda
export const STORE_INVENTORIES: Record<string, any[]> = {
  store_venemarket_chacao: [
    ...DEFAULT_DEMO_PRODUCTS.map(p => ({ ...p, storeId: 'store_venemarket_chacao' })),
    { id: 'p_ch_1', name: 'Nutella 350g Importada', category: 'snacks', priceUSD: 4.50, stock: 15, barcode: '8000500179864', image: '' },
    { id: 'p_ch_2', name: 'Aceite de Oliva Extra Virgen 500ml', category: 'viveres', priceUSD: 6.20, stock: 8, barcode: '8410065001234', image: '' },
    { id: 'p_ch_3', name: 'Refresco Coca-Cola 2L', category: 'bebidas', priceUSD: 2.20, stock: 24, barcode: '7591001000123', image: '' }
  ],
  store_farma_mercedes: [
    { id: 'p_fa_1', name: 'Acetaminofén 500mg (Caja 10 tabs)', category: 'analgesicos', priceUSD: 1.20, stock: 45, barcode: '7592001001111', image: '' },
    { id: 'p_fa_2', name: 'Ibuprofeno 400mg (Caja 10 caps)', category: 'analgesicos', priceUSD: 1.80, stock: 32, barcode: '7592001001112', image: '' },
    { id: 'p_fa_3', name: 'Amoxicilina 500mg (Caja 12 cápsulas)', category: 'antibioticos', priceUSD: 3.50, stock: 18, barcode: '7592001001113', image: '' },
    { id: 'p_fa_4', name: 'Alcohol Antiséptico 70% 500ml', category: 'primeros_auxilios', priceUSD: 1.50, stock: 28, barcode: '7592001001114', image: '' },
    { id: 'p_fa_5', name: 'Vitamina C 1000mg Efervescente', category: 'vitaminas', priceUSD: 4.80, stock: 20, barcode: '7592001001115', image: '' },
    { id: 'p_fa_6', name: 'Protector Solar FPS 50+ 120ml', category: 'cuidado_personal', priceUSD: 8.50, stock: 12, barcode: '7592001001116', image: '' },
    { id: 'p_fa_7', name: 'Pañales Huggies Talla G (Paquete 32)', category: 'bebes', priceUSD: 11.00, stock: 14, barcode: '7592001001117', image: '' }
  ],
  store_libreria_los_palos: [
    { id: 'p_lib_1', name: 'Cuaderno Doble Línea 100 Hojas', category: 'cuadernos', priceUSD: 1.50, stock: 50, barcode: '7593001001201', image: '' },
    { id: 'p_lib_2', name: 'Cuaderno Cuadriculado 100 Hojas', category: 'cuadernos', priceUSD: 1.50, stock: 45, barcode: '7593001001202', image: '' },
    { id: 'p_lib_3', name: 'Caja de Lápices de Grafito Mongool #2 (12 uds)', category: 'escritura', priceUSD: 3.20, stock: 30, barcode: '7593001001203', image: '' },
    { id: 'p_lib_4', name: 'Resma de Papel Bond Carta 500 Hojas', category: 'papeleria', priceUSD: 4.90, stock: 22, barcode: '7593001001204', image: '' },
    { id: 'p_lib_5', name: 'Juego de Colores Prismacolor 24 Unidades', category: 'arte', priceUSD: 9.50, stock: 16, barcode: '7593001001205', image: '' },
    { id: 'p_lib_6', name: 'Calculadora Científica Casio FX-82LA', category: 'tecnologia', priceUSD: 14.00, stock: 10, barcode: '7593001001206', image: '' }
  ],
  store_ferro_el_recreo: [
    { id: 'p_fe_1', name: 'Taladro Percutor 1/2 Pulgada 650W', category: 'herramientas', priceUSD: 29.99, stock: 8, barcode: '7594001001301', image: '' },
    { id: 'p_fe_2', name: 'Juego de Destornilladores 6 Piezas', category: 'herramientas', priceUSD: 5.50, stock: 25, barcode: '7594001001302', image: '' },
    { id: 'p_fe_3', name: 'Bombillo LED 9W Rosca E27 Luz Blanca', category: 'electricidad', priceUSD: 1.10, stock: 80, barcode: '7594001001303', image: '' },
    { id: 'p_fe_4', name: 'Cinta Métrica 5 Metros Resistente', category: 'medicion', priceUSD: 2.80, stock: 35, barcode: '7594001001304', image: '' },
    { id: 'p_fe_5', name: 'Tirro Plomo / Duct Tape Gris 50m', category: 'adhesivos', priceUSD: 3.00, stock: 40, barcode: '7594001001305', image: '' },
    { id: 'p_fe_6', name: 'Candado de Seguridad 50mm con 3 Llaves', category: 'seguridad', priceUSD: 4.50, stock: 19, barcode: '7594001001306', image: '' }
  ],
  store_venemarket_valencia: [
    { id: 'p_vl_1', name: 'Harina PAN 1kg', category: 'viveres', priceUSD: 1.20, stock: 60, barcode: '7591001000010', image: '' },
    { id: 'p_vl_2', name: 'Queso Llanero Duro 1kg', category: 'lacteos', priceUSD: 5.20, stock: 25, barcode: '7591001000050', image: '' },
    { id: 'p_vl_3', name: 'Café Fama de América 500g', category: 'viveres', priceUSD: 3.40, stock: 30, barcode: '7591001000030', image: '' },
    { id: 'p_vl_4', name: 'Pollo Entero Fresco (kg)', category: 'proteinas', priceUSD: 2.90, stock: 40, barcode: '7591001000070', image: '' }
  ],
  store_tech_maracaibo: [
    { id: 'p_tc_1', name: 'Cable USB Tipo C a Tipo C Carga Rápida 60W', category: 'cables', priceUSD: 4.00, stock: 35, barcode: '7595001001401', image: '' },
    { id: 'p_tc_2', name: 'Audífonos Inalámbricos Bluetooth TWS', category: 'audio', priceUSD: 12.50, stock: 20, barcode: '7595001001402', image: '' },
    { id: 'p_tc_3', name: 'Cargador Rápido 20W USB-C', category: 'cargadores', priceUSD: 6.50, stock: 28, barcode: '7595001001403', image: '' },
    { id: 'p_tc_4', name: 'Power Bank 10000mAh Portátil', category: 'baterias', priceUSD: 15.00, stock: 12, barcode: '7595001001404', image: '' }
  ]
};

// Cálculo de Distancia Geográfica (Fórmula de Haversine en Km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Motor de Búsqueda de Productos Multitienda
export function searchMarketplaceProducts(params: {
  query?: string;
  category?: string;
  businessType?: string;
  zoneKey?: string;
  userLat?: number;
  userLng?: number;
  bcvRate: number;
}): CrossStoreProduct[] {
  const { query = '', category = 'all', businessType = 'all', zoneKey = 'all', userLat, userLng, bcvRate } = params;
  const cleanQ = query.trim().toLowerCase();

  const selectedZone = POPULAR_ZONES.find(z => z.key === zoneKey);

  let results: CrossStoreProduct[] = [];

  for (const store of INITIAL_MARKETPLACE_STORES) {
    if (businessType !== 'all' && store.businessType !== businessType) {
      continue;
    }

    if (zoneKey !== 'all' && selectedZone && selectedZone.city !== 'all' && store.city.toLowerCase() !== selectedZone.city.toLowerCase()) {
      continue;
    }

    const storeProducts = STORE_INVENTORIES[store.id] || [];

    // Calcular distancia estimada al cliente
    let distanceKm = 1.8;
    if (userLat && userLng) {
      distanceKm = calculateDistanceKm(userLat, userLng, store.lat, store.lng);
    } else if (selectedZone && selectedZone.lat && selectedZone.lng) {
      distanceKm = calculateDistanceKm(selectedZone.lat, selectedZone.lng, store.lat, store.lng);
    }

    for (const p of storeProducts) {
      const matchQ = !cleanQ || 
        p.name.toLowerCase().includes(cleanQ) || 
        (p.category && p.category.toLowerCase().includes(cleanQ)) ||
        (p.barcode && p.barcode.includes(cleanQ));

      const matchCat = category === 'all' || (p.category && p.category.toLowerCase() === category.toLowerCase());

      if (matchQ && matchCat) {
        results.push({
          id: p.id,
          name: p.name,
          category: p.category || 'General',
          priceUSD: p.priceUSD,
          priceBS: Number((p.priceUSD * bcvRate).toFixed(2)),
          stock: p.stock ?? 10,
          isAvailable: (p.stock ?? 10) > 0,
          barcode: p.barcode,
          image: p.image || '',
          storeId: store.id,
          storeName: store.name,
          storeZone: store.zone,
          storeCity: store.city,
          storeBusinessType: store.businessType,
          storeRating: store.rating,
          deliveryTime: store.deliveryTime,
          deliveryFeeUSD: store.deliveryFeeUSD,
          distanceKm,
        });
      }
    }
  }

  // Ordenar resultados: primero los disponibles en stock y luego por cercanía
  results.sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  return results;
}

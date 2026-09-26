import { db, LocalProduct } from './db';

export const INITIAL_PRODUCTS: Omit<LocalProduct, 'id'>[] = [
  {
    barcode: '75910020201',
    name: 'Pechuga de Pollo Fresca',
    category: 'Carnes y Pollo',
    priceUSD: 4.80,
    costUSD: 3.50,
    stock: 25,
    minStock: 5,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020202',
    name: 'Carne Molida de Primera',
    category: 'Carnes y Pollo',
    priceUSD: 6.20,
    costUSD: 4.80,
    stock: 20,
    minStock: 5,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020203',
    name: 'Jamón Superior Plumrose',
    category: 'Charcutería',
    priceUSD: 3.80,
    costUSD: 2.90,
    stock: 24,
    minStock: 4,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020204',
    name: 'Queso Amarillo Gouda',
    category: 'Charcutería',
    priceUSD: 7.90,
    costUSD: 6.10,
    stock: 14,
    minStock: 3,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020205',
    name: 'Leche Completa',
    category: 'Lácteos',
    priceUSD: 2.10,
    costUSD: 1.50,
    stock: 32,
    minStock: 8,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759102020206',
    name: 'Mantequilla con Sal Mavesa',
    category: 'Lácteos',
    priceUSD: 2.60,
    costUSD: 1.90,
    stock: 25,
    minStock: 5,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020207',
    name: 'Manzanas Rojas Importadas',
    category: 'Frutas y Verduras',
    priceUSD: 3.40,
    costUSD: 2.30,
    stock: 30,
    minStock: 8,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '75910020208',
    name: 'Papas Blancas',
    category: 'Frutas y Verduras',
    priceUSD: 1.40,
    costUSD: 0.90,
    stock: 50,
    minStock: 10,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100203209',
    name: 'Atún Margarita en Aceite',
    category: 'Víveres',
    priceUSD: 2.00,
    costUSD: 1.45,
    stock: 40,
    minStock: 10,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100200210',
    name: 'Papel Higiénico Rosal Plus',
    category: 'Limpieza',
    priceUSD: 3.00,
    costUSD: 2.10,
    stock: 20,
    minStock: 5,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
];

let initPromise: Promise<void> | null = null;

export async function initializeDatabaseIfNeeded(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      for (const prod of INITIAL_PRODUCTS) {
        const exists = await db.products.where('barcode').equals(prod.barcode).first();
        if (!exists) {
          await db.products.add(prod as LocalProduct);
        } else if (!exists.image && prod.image) {
          await db.products.update(exists.id!, { image: prod.image });
        }
      }

      const bcvSetting = await db.settings.get('bcv_rate');
      if (!bcvSetting) {
        await db.settings.put({ key: 'bcv_rate', value: 852.42 });
      }

      const storeInfo = await db.settings.get('store_info');
      if (!storeInfo) {
        await db.settings.put({
          key: 'store_info',
          value: {
            name: 'Venemarket Express C.A.',
            rif: 'J-50123456-7',
            phone: '0414-1234567',
            address: 'Av. Principal, Local 4, Caracas',
            footerMessage: '¡Gracias por su compra!',
          },
        });
      }

      // Verificar si hay un turno abierto
      const openShift = await db.cashShifts.where('status').equals('open').first();
      if (!openShift) {
        await db.cashShifts.add({
          openedAt: new Date().toISOString(),
          cashierName: 'Caja 1',
          initialCashUSD: 50.0,
          initialCashVES: 0.0,
          totalSalesUSD: 0,
          totalCashUSD: 0,
          totalCashVES: 0,
          totalPagoMovilVES: 0,
          totalCardVES: 0,
          totalZelleUSD: 0,
          status: 'open',
        });
      }
    } catch (err) {
      console.warn('Init db handled exception:', err);
    }
  })();

  return initPromise;
}

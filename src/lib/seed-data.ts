import { db, LocalProduct } from './db';

export const INITIAL_PRODUCTS: Omit<LocalProduct, 'id'>[] = [
  {
    barcode: '759100100001',
    name: 'Harina PAN Blanca 1kg',
    category: 'Víveres',
    priceUSD: 1.25,
    costUSD: 0.95,
    stock: 48,
    minStock: 10,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100002',
    name: 'Arroz Primor Tradicional 1kg',
    category: 'Víveres',
    priceUSD: 1.40,
    costUSD: 1.05,
    stock: 35,
    minStock: 8,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100003',
    name: 'Pasta Primor Larga 1kg',
    category: 'Víveres',
    priceUSD: 1.65,
    costUSD: 1.20,
    stock: 40,
    minStock: 10,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100004',
    name: 'Aceite Mazeite 1L',
    category: 'Víveres',
    priceUSD: 2.80,
    costUSD: 2.20,
    stock: 24,
    minStock: 5,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100005',
    name: 'Azúcar Montalbán 1kg',
    category: 'Víveres',
    priceUSD: 1.35,
    costUSD: 1.00,
    stock: 30,
    minStock: 6,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100006',
    name: 'Café Fama de América 250g',
    category: 'Víveres',
    priceUSD: 2.50,
    costUSD: 1.90,
    stock: 20,
    minStock: 5,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100007',
    name: 'Queso Paisa Rebanado 400g',
    category: 'Charcutería',
    priceUSD: 4.20,
    costUSD: 3.30,
    stock: 15,
    minStock: 4,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100008',
    name: 'Jamón de Pierna Plumrose 250g',
    category: 'Charcutería',
    priceUSD: 3.60,
    costUSD: 2.80,
    stock: 18,
    minStock: 4,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100009',
    name: 'Refresco Coca-Cola 1.5L',
    category: 'Bebidas',
    priceUSD: 2.00,
    costUSD: 1.50,
    stock: 25,
    minStock: 6,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100010',
    name: 'Agua Mineral Minalba 5L',
    category: 'Bebidas',
    priceUSD: 1.80,
    costUSD: 1.25,
    stock: 16,
    minStock: 4,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100011',
    name: 'Detergente Las Llaves 1kg',
    category: 'Limpieza',
    priceUSD: 2.40,
    costUSD: 1.80,
    stock: 22,
    minStock: 5,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    barcode: '759100100012',
    name: 'Jabón Protex Avena 110g',
    category: 'Cuidado Personal',
    priceUSD: 1.10,
    costUSD: 0.75,
    stock: 50,
    minStock: 10,
    unit: 'unidad',
    image: 'https://images.unsplash.com/photo-1607006411601-775c8cc632dc?w=400&q=80',
    updatedAt: new Date().toISOString(),
  },
];

let initPromise: Promise<void> | null = null;

export async function initializeDatabaseIfNeeded(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const count = await db.products.count();
      if (count === 0) {
        for (const prod of INITIAL_PRODUCTS) {
          const exists = await db.products.where('barcode').equals(prod.barcode).first();
          if (!exists) {
            await db.products.add(prod as LocalProduct);
          }
        }
        console.log('Catálogo base cargado exitosamente.');
      } else {
        // Backfill de imágenes para productos iniciales si no tienen
        for (const p of INITIAL_PRODUCTS) {
          const existing = await db.products.where('barcode').equals(p.barcode).first();
          if (existing && !existing.image && p.image) {
            await db.products.update(existing.id!, { image: p.image });
          }
        }
      }

      const bcvSetting = await db.settings.get('bcv_rate');
      if (!bcvSetting) {
        await db.settings.put({ key: 'bcv_rate', value: 848.55 });
      }

      const storeInfo = await db.settings.get('store_info');
      if (!storeInfo) {
        await db.settings.put({
          key: 'store_info',
          value: {
            name: 'Comercial Mi Tienda C.A.',
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

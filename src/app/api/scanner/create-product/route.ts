import { NextRequest, NextResponse } from 'next/server';
import { scannerEmitter } from '@/lib/scanner-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session = 'caja-1', product } = body;

    if (!product || !product.barcode || !product.name || !product.priceUSD) {
      return NextResponse.json(
        { error: 'Datos de producto incompletos (requiere código, nombre y precio)' },
        { status: 400 }
      );
    }

    const cleanProduct = {
      barcode: String(product.barcode).trim(),
      name: String(product.name).trim(),
      category: String(product.category || 'Víveres').trim(),
      priceUSD: Number(product.priceUSD) || 0,
      costUSD: Number(product.costUSD) || 0,
      stock: Number(product.stock) || 1,
      minStock: Number(product.minStock) || 2,
      unit: String(product.unit || 'unit').trim(),
      image: product.image || undefined,
      updatedAt: new Date().toISOString(),
    };

    scannerEmitter.emit('new_product', {
      session,
      product: cleanProduct,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, product: cleanProduct });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory queue for incoming orders from LAN mobile/tablet devices
interface PendingOrder {
  id: string;
  receiptNumber: string;
  tableNumber?: string;
  items: any[];
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  customerName?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'completed';
}

const ordersQueue: PendingOrder[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: 'Datos de orden invalidos' },
        { status: 400 }
      );
    }

    const newOrder: PendingOrder = {
      id: `LAN-${Date.now()}`,
      receiptNumber: body.receiptNumber || `M-${Date.now().toString().slice(-4)}`,
      tableNumber: body.tableNumber || 'Mesa Salón',
      items: body.items,
      totalUSD: body.totalUSD || 0,
      totalVES: body.totalVES || 0,
      bcvRate: body.bcvRate || 1,
      customerName: body.customerName || 'Cliente Móvil',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    ordersQueue.unshift(newOrder);
    if (ordersQueue.length > 50) ordersQueue.pop();

    return NextResponse.json({
      success: true,
      message: 'Orden recibida en caja exitosamente',
      order: newOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando orden' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    orders: ordersQueue,
    count: ordersQueue.length,
  });
}

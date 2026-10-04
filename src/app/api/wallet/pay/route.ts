import { NextRequest, NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';
import { MerchantPayRequest } from '@/types/wallet';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MerchantPayRequest & { rateBCV?: number };
    if (!body.customerWalletId || !body.storeId || !body.amountUSD) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos para el pago en comercio.' },
        { status: 400 }
      );
    }

    const amountUSD = Number(body.amountUSD);
    if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
      return NextResponse.json(
        { success: false, message: 'El monto a pagar debe ser un número válido mayor a 0.' },
        { status: 400 }
      );
    }

    if (amountUSD > 50000) {
      return NextResponse.json(
        { success: false, message: 'El monto excede el límite máximo permitido por pago de billetera.' },
        { status: 400 }
      );
    }

    const rawRate = Number(body.rateBCV);
    const rateBCV = (Number.isFinite(rawRate) && rawRate > 0) ? Number(rawRate.toFixed(4)) : 49.00;

    const sanitizedBody: MerchantPayRequest = {
      ...body,
      amountUSD: Number(amountUSD.toFixed(2)),
    };

    const result = tokenWalletService.payMerchant(sanitizedBody, rateBCV);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar pago';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

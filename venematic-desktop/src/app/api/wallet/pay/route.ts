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

    if (body.amountUSD <= 0) {
      return NextResponse.json(
        { success: false, message: 'El monto a pagar debe ser mayor a 0.' },
        { status: 400 }
      );
    }

    const rateBCV = body.rateBCV || 49.00;
    const result = tokenWalletService.payMerchant(body, rateBCV);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar pago';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';
import { TopupRequest } from '@/types/wallet';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TopupRequest;
    if (!body.walletIdentifier) {
      return NextResponse.json(
        { success: false, message: 'La cédula o teléfono de la billetera es requerida.' },
        { status: 400 }
      );
    }

    if (!body.amountUSD && !body.amountVES) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar un monto en USD o en Bolívares.' },
        { status: 400 }
      );
    }

    const result = tokenWalletService.topupWallet(body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar recarga';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

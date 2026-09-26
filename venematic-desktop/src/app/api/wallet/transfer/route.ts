import { NextRequest, NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';
import { P2PTransferRequest } from '@/types/wallet';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as P2PTransferRequest & { rateBCV?: number };
    if (!body.senderWalletId || !body.recipientIdentifier || !body.amountUSD) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos para la transferencia P2P.' },
        { status: 400 }
      );
    }

    if (body.amountUSD <= 0) {
      return NextResponse.json(
        { success: false, message: 'El monto debe ser superior a 0 Tokens.' },
        { status: 400 }
      );
    }

    const rateBCV = body.rateBCV || 49.00;
    const result = tokenWalletService.transferP2P(body, rateBCV);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar transferencia';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

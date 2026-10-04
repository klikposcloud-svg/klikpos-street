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

    const amountUSD = Number(body.amountUSD);
    const amountVES = Number(body.amountVES);
    const rateBCV = Number(body.rateBCV);

    const hasValidUSD = !isNaN(amountUSD) && Number.isFinite(amountUSD) && amountUSD > 0;
    const hasValidVES = !isNaN(amountVES) && Number.isFinite(amountVES) && amountVES > 0;

    if (!hasValidUSD && !hasValidVES) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar un monto válido y mayor a cero en USD o en Bolívares.' },
        { status: 400 }
      );
    }

    if (hasValidVES && (!Number.isFinite(rateBCV) || rateBCV <= 0)) {
      return NextResponse.json(
        { success: false, message: 'La tasa de cambio (BCV) debe ser un número válido y mayor a cero.' },
        { status: 400 }
      );
    }

    // Proteger contra montos excesivos o desbordamientos
    if ((hasValidUSD && amountUSD > 100000) || (hasValidVES && amountVES > 100000000)) {
      return NextResponse.json(
        { success: false, message: 'El monto excede el límite máximo por transacción de recarga.' },
        { status: 400 }
      );
    }

    const sanitizedBody: TopupRequest = {
      ...body,
      amountUSD: hasValidUSD ? Number(amountUSD.toFixed(2)) : 0,
      amountVES: hasValidVES ? Number(amountVES.toFixed(2)) : undefined,
      rateBCV: Number.isFinite(rateBCV) && rateBCV > 0 ? Number(rateBCV.toFixed(4)) : 0,
    };

    const result = tokenWalletService.topupWallet(sanitizedBody);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar recarga';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

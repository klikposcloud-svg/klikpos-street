import { NextRequest, NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';
import { WithdrawalRequest } from '@/types/wallet';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WithdrawalRequest;
    if (!body.walletId || !body.amountUSD || !body.bankName || !body.bankPhone) {
      return NextResponse.json(
        { success: false, message: 'Datos bancarios incompletos para el retiro.' },
        { status: 400 }
      );
    }

    if (body.amountUSD <= 0) {
      return NextResponse.json(
        { success: false, message: 'El monto a retirar debe ser mayor a 0 Tokens.' },
        { status: 400 }
      );
    }

    const rateBCV = body.rateBCV || 49.20;
    const result = tokenWalletService.requestWithdrawal({
      walletId: body.walletId,
      amountUSD: body.amountUSD,
      bankName: body.bankName,
      bankPhone: body.bankPhone,
      bankDocId: body.bankDocId || 'V-00000000',
      rateBCV: rateBCV,
      feePercent: body.feePercent,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar retiro';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

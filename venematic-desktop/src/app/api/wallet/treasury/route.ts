import { NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';

export async function GET() {
  try {
    const metrics = tokenWalletService.getTreasuryMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar métricas de tesorería';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

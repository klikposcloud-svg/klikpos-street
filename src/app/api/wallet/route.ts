import { NextRequest, NextResponse } from 'next/server';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get('id') || searchParams.get('q');

    if (identifier) {
      const wallet = tokenWalletService.findWalletByIdentifier(identifier);
      if (!wallet) {
        return NextResponse.json({ success: false, message: 'Billetera no encontrada' }, { status: 404 });
      }
      const txs = tokenWalletService.getTransactions(wallet.walletId);
      return NextResponse.json({ success: true, wallet, transactions: txs });
    }

    const currentWallet = tokenWalletService.getActiveWallet();
    const txs = tokenWalletService.getTransactions(currentWallet.walletId);
    return NextResponse.json({
      success: true,
      wallet: currentWallet,
      transactions: txs,
      allWallets: tokenWalletService.getAllWallets(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar billetera';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

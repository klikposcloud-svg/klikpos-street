import { WalletAccount, WalletTransaction, TopupRequest, P2PTransferRequest, MerchantPayRequest } from '@/types/wallet';

const WALLETS_STORAGE_KEY = 'venematic_wallets_db';
const TRANSACTIONS_STORAGE_KEY = 'venematic_wallet_txs_db';
const CURRENT_ACTIVE_WALLET_KEY = 'venematic_current_wallet_id';

// Cuentas de demostración iniciales
const INITIAL_WALLETS: WalletAccount[] = [
  {
    walletId: 'w_user_1',
    userId: 'u_1',
    userName: 'Carlos Rodríguez',
    userPhone: '+58 414 1234567',
    userDocId: 'V-18234567',
    userEmail: 'carlos.r@gmail.com',
    balanceUSD: 45.50, // 45.50 Tokens USD
    qrCodeData: 'VNK-WALLET:w_user_1:V-18234567:Carlos Rodriguez',
    status: 'active',
    pinHash: '1234',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    walletId: 'w_user_2',
    userId: 'u_2',
    userName: 'María Valentina Gómez',
    userPhone: '+58 424 9876543',
    userDocId: 'V-24567890',
    userEmail: 'maria.gomez@gmail.com',
    balanceUSD: 120.00, // 120.00 Tokens USD
    qrCodeData: 'VNK-WALLET:w_user_2:V-24567890:Maria Gomez',
    status: 'active',
    pinHash: '1234',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    walletId: 'w_user_3',
    userId: 'u_3',
    userName: 'Pedro Pérez (Repartidor D-Panas)',
    userPhone: '+58 412 5558899',
    userDocId: 'V-20112233',
    userEmail: 'pedro.rider@dpanas.com',
    balanceUSD: 18.25,
    qrCodeData: 'VNK-WALLET:w_user_3:V-20112233:Pedro Perez',
    status: 'active',
    pinHash: '1234',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_demo_1',
    walletId: 'w_user_1',
    type: 'cash_in',
    amountUSD: 50.00,
    rateBCV: 48.50,
    amountVES: 2425.00,
    referenceNumber: 'PM-984721',
    paymentMethodOrigin: 'cash_usd',
    storeId: 'store_chacao',
    storeName: 'Venemarket Chacao',
    concept: 'Recarga en Efectivo mostrador Venemarket',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'tx_demo_2',
    walletId: 'w_user_1',
    type: 'purchase_payment',
    amountUSD: 4.50,
    rateBCV: 48.50,
    amountVES: 218.25,
    referenceNumber: 'FAC-2026-0089',
    storeId: 'store_chacao',
    storeName: 'Venemarket Chacao',
    concept: 'Pago de víveres en tienda física',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  }
];

class TokenWalletService {
  private wallets: WalletAccount[] = [];
  private transactions: WalletTransaction[] = [];
  private activeWalletId: string = 'w_user_1';

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    } else {
      this.wallets = INITIAL_WALLETS;
      this.transactions = INITIAL_TRANSACTIONS;
    }
  }

  private init() {
    try {
      const savedWallets = localStorage.getItem(WALLETS_STORAGE_KEY);
      if (savedWallets) {
        this.wallets = JSON.parse(savedWallets);
      } else {
        this.wallets = INITIAL_WALLETS;
        this.persistWallets();
      }

      const savedTxs = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (savedTxs) {
        this.transactions = JSON.parse(savedTxs);
      } else {
        this.transactions = INITIAL_TRANSACTIONS;
        this.persistTransactions();
      }

      const savedActive = localStorage.getItem(CURRENT_ACTIVE_WALLET_KEY);
      if (savedActive) {
        this.activeWalletId = savedActive;
      }
    } catch {
      this.wallets = INITIAL_WALLETS;
      this.transactions = INITIAL_TRANSACTIONS;
    }
  }

  private persistWallets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(this.wallets));
    }
  }

  private persistTransactions() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(this.transactions));
    }
  }

  public getActiveWallet(): WalletAccount {
    this.init();
    const found = this.wallets.find(w => w.walletId === this.activeWalletId);
    return found || this.wallets[0] || INITIAL_WALLETS[0];
  }

  public setActiveWallet(walletId: string) {
    this.activeWalletId = walletId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_ACTIVE_WALLET_KEY, walletId);
    }
  }

  public getAllWallets(): WalletAccount[] {
    this.init();
    return this.wallets;
  }

  public findWalletByIdentifier(identifier: string): WalletAccount | undefined {
    this.init();
    const clean = identifier.trim().toLowerCase().replace(/\s+/g, '');
    return this.wallets.find(w => {
      const cleanDoc = w.userDocId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanPhone = w.userPhone.replace(/[^0-9]/g, '');
      const cleanId = clean.replace(/[^a-z0-9]/g, '');
      return (
        w.walletId.toLowerCase() === clean ||
        cleanDoc === cleanId ||
        cleanPhone.endsWith(cleanId) ||
        w.userName.toLowerCase().includes(clean)
      );
    });
  }

  public getTransactions(walletId?: string): WalletTransaction[] {
    this.init();
    const targetId = walletId || this.activeWalletId;
    return this.transactions
      .filter(tx => tx.walletId === targetId || tx.recipientId === targetId || tx.senderId === targetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Recarga de Saldo / Tokens (Cash-in en caja o digital)
   * Blindaje contra la inflación: Se convierte a Tokens USD 1:1 en el momento de la recarga
   */
  public topupWallet(req: TopupRequest): { success: boolean; message: string; tx?: WalletTransaction; wallet?: WalletAccount } {
    this.init();
    let wallet = this.findWalletByIdentifier(req.walletIdentifier);

    // Si el usuario no existe aún, se auto-crea la billetera con su Cédula/Teléfono
    if (!wallet) {
      const newWalletId = `w_${Date.now()}`;
      wallet = {
        walletId: newWalletId,
        userId: `u_${Date.now()}`,
        userName: req.notes || `Usuario ${req.walletIdentifier}`,
        userPhone: req.walletIdentifier.startsWith('+') || req.walletIdentifier.startsWith('04') ? req.walletIdentifier : '+58 414 0000000',
        userDocId: req.walletIdentifier.toUpperCase().startsWith('V-') || req.walletIdentifier.toUpperCase().startsWith('J-') ? req.walletIdentifier.toUpperCase() : `V-${req.walletIdentifier}`,
        balanceUSD: 0,
        qrCodeData: `VNK-WALLET:${newWalletId}:${req.walletIdentifier}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.wallets.push(wallet);
    }

    // Calcular monto en Tokens USD
    let creditedUSD = req.amountUSD || 0;
    if (!creditedUSD && req.amountVES && req.rateBCV > 0) {
      creditedUSD = Number((req.amountVES / req.rateBCV).toFixed(2));
    }
    const vesEquivalent = req.amountVES || Number((creditedUSD * req.rateBCV).toFixed(2));

    if (creditedUSD <= 0) {
      return { success: false, message: 'El monto a recargar debe ser mayor a 0.' };
    }

    // Acreditar saldo
    wallet.balanceUSD = Number((wallet.balanceUSD + creditedUSD).toFixed(2));
    wallet.updatedAt = new Date().toISOString();

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      walletId: wallet.walletId,
      type: 'cash_in',
      amountUSD: creditedUSD,
      rateBCV: req.rateBCV,
      amountVES: vesEquivalent,
      referenceNumber: req.referenceNumber || `RCG-${Date.now().toString().slice(-6)}`,
      paymentMethodOrigin: req.paymentMethod,
      storeId: req.agentStoreId,
      storeName: req.agentStoreName,
      concept: `Recarga de ${creditedUSD.toFixed(2)} Tokens ($${creditedUSD.toFixed(2)}) en ${req.agentStoreName || 'Caja Venemarket'}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(newTx);
    this.persistWallets();
    this.persistTransactions();

    return {
      success: true,
      message: `¡Recarga de ${creditedUSD.toFixed(2)} Tokens USD completada con éxito! Nuevo saldo: ${wallet.balanceUSD.toFixed(2)} USD.`,
      tx: newTx,
      wallet,
    };
  }

  /**
   * Transferencia Persona a Persona (P2P Instantánea)
   * Los tokens se envían 1:1 sin devaluación
   */
  public transferP2P(req: P2PTransferRequest, rateBCV: number = 49.00): { success: boolean; message: string; tx?: WalletTransaction } {
    this.init();
    const sender = this.wallets.find(w => w.walletId === req.senderWalletId);
    if (!sender) {
      return { success: false, message: 'Billetera emisora no encontrada.' };
    }

    if (sender.balanceUSD < req.amountUSD) {
      return { 
        success: false, 
        message: `Saldo insuficiente. Tienes ${sender.balanceUSD.toFixed(2)} Tokens USD e intentas transferir ${req.amountUSD.toFixed(2)} Tokens.` 
      };
    }

    const recipient = this.findWalletByIdentifier(req.recipientIdentifier);
    if (!recipient) {
      return { success: false, message: `No se encontró usuario con el identificador "${req.recipientIdentifier}". Verifica la cédula o teléfono.` };
    }

    if (recipient.walletId === sender.walletId) {
      return { success: false, message: 'No puedes transferirte saldo a ti mismo.' };
    }

    // Efectuar débito y crédito
    sender.balanceUSD = Number((sender.balanceUSD - req.amountUSD).toFixed(2));
    sender.updatedAt = new Date().toISOString();

    recipient.balanceUSD = Number((recipient.balanceUSD + req.amountUSD).toFixed(2));
    recipient.updatedAt = new Date().toISOString();

    const ref = `TRF-${Date.now().toString().slice(-6)}`;
    const vesEquivalent = Number((req.amountUSD * rateBCV).toFixed(2));

    // Registro de transacción para el emisor
    const senderTx: WalletTransaction = {
      id: `tx_${Date.now()}_out`,
      walletId: sender.walletId,
      type: 'p2p_transfer_out',
      amountUSD: req.amountUSD,
      rateBCV,
      amountVES: vesEquivalent,
      recipientId: recipient.walletId,
      recipientName: recipient.userName,
      recipientDocId: recipient.userDocId,
      referenceNumber: ref,
      concept: req.concept || `Transferencia a ${recipient.userName}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    // Registro de transacción para el receptor
    const recipientTx: WalletTransaction = {
      id: `tx_${Date.now()}_in`,
      walletId: recipient.walletId,
      type: 'p2p_transfer_in',
      amountUSD: req.amountUSD,
      rateBCV,
      amountVES: vesEquivalent,
      senderId: sender.walletId,
      senderName: sender.userName,
      senderDocId: sender.userDocId,
      referenceNumber: ref,
      concept: req.concept || `Recibido de ${sender.userName}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(senderTx, recipientTx);
    this.persistWallets();
    this.persistTransactions();

    return {
      success: true,
      message: `¡Enviaste ${req.amountUSD.toFixed(2)} Tokens USD a ${recipient.userName} con éxito!`,
      tx: senderTx,
    };
  }

  /**
   * Pago de compras en Comercio / Delivery D-Panas con Tokens
   */
  public payMerchant(req: MerchantPayRequest, rateBCV: number = 49.00): { success: boolean; message: string; tx?: WalletTransaction } {
    this.init();
    const customer = this.wallets.find(w => w.walletId === req.customerWalletId);
    if (!customer) {
      return { success: false, message: 'Billetera del cliente no encontrada.' };
    }

    if (customer.balanceUSD < req.amountUSD) {
      return { 
        success: false, 
        message: `Saldo insuficiente en Billetera (${customer.balanceUSD.toFixed(2)} Tokens). Requiere ${req.amountUSD.toFixed(2)} Tokens.` 
      };
    }

    // Descontar saldo de tokens
    customer.balanceUSD = Number((customer.balanceUSD - req.amountUSD).toFixed(2));
    customer.updatedAt = new Date().toISOString();

    const ref = req.orderNumber || `PAY-${Date.now().toString().slice(-6)}`;
    const vesEquivalent = Number((req.amountUSD * rateBCV).toFixed(2));

    const payTx: WalletTransaction = {
      id: `tx_${Date.now()}_pay`,
      walletId: customer.walletId,
      type: 'purchase_payment',
      amountUSD: req.amountUSD,
      rateBCV,
      amountVES: vesEquivalent,
      storeId: req.storeId,
      storeName: req.storeName,
      referenceNumber: ref,
      concept: req.concept || `Pago de compra en ${req.storeName}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(payTx);
    this.persistWallets();
    this.persistTransactions();

    return {
      success: true,
      message: `¡Pago de ${req.amountUSD.toFixed(2)} Tokens ($${req.amountUSD.toFixed(2)}) procesado en ${req.storeName}!`,
      tx: payTx,
    };
  }

  /**
   * Retiro / Liquidación Bancaria a Tasa BCV (Calce de Tesorería & Mini-Comisión)
   * Permite al repartidor o comercio retirar sus tokens convertidos a Bolívares hoy sin perder valor
   */
  public requestWithdrawal(req: {
    walletId: string;
    amountUSD: number;
    bankName: string;
    bankPhone: string;
    bankDocId: string;
    rateBCV: number;
    feePercent?: number;
  }): { success: boolean; message: string; tx?: WalletTransaction; netVES?: number } {
    this.init();
    const wallet = this.wallets.find(w => w.walletId === req.walletId);
    if (!wallet) {
      return { success: false, message: 'Billetera no encontrada.' };
    }

    if (wallet.balanceUSD < req.amountUSD) {
      return {
        success: false,
        message: `Saldo insuficiente. Tienes ${wallet.balanceUSD.toFixed(2)} Tokens e intentas retirar ${req.amountUSD.toFixed(2)} Tokens.`,
      };
    }

    const feePct = req.feePercent !== undefined ? req.feePercent : 2.0; // 2% fee de plataforma
    const feeUSD = Number(((req.amountUSD * feePct) / 100).toFixed(2));
    const netUSD = Number((req.amountUSD - feeUSD).toFixed(2));
    const netVES = Number((netUSD * req.rateBCV).toFixed(2));
    const totalGrossVES = Number((req.amountUSD * req.rateBCV).toFixed(2));

    // Descontar saldo total
    wallet.balanceUSD = Number((wallet.balanceUSD - req.amountUSD).toFixed(2));
    wallet.updatedAt = new Date().toISOString();

    const ref = `PM-RET-${Date.now().toString().slice(-6)}`;
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_ret`,
      walletId: wallet.walletId,
      type: 'cash_out',
      amountUSD: req.amountUSD,
      feeUSD,
      netAmountUSD: netUSD,
      netAmountVES: netVES,
      rateBCV: req.rateBCV,
      amountVES: totalGrossVES,
      bankName: req.bankName,
      bankPhone: req.bankPhone,
      bankDocId: req.bankDocId,
      referenceNumber: ref,
      concept: `Liquidación a ${req.bankName} (${req.bankPhone}) • Tasa BCV: ${req.rateBCV.toFixed(2)}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    this.persistWallets();
    this.persistTransactions();

    return {
      success: true,
      message: `¡Retiro procesado! Transferidos Bs. ${netVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })} a ${req.bankName} (${req.bankPhone}). Comisión: $${feeUSD.toFixed(2)} USD.`,
      tx,
      netVES,
    };
  }

  /**
   * Métricas de Tesorería y Calce de Reservas
   */
  public getTreasuryMetrics(): {
    totalTokensCirculatingUSD: number;
    totalReserveUSD: number;
    totalPlatformFeesUSD: number;
    totalWithdrawalsCount: number;
    defaultWithdrawalFeePercent: number;
    isBacked100Percent: boolean;
  } {
    this.init();
    const totalCirculating = this.wallets.reduce((sum, w) => sum + w.balanceUSD, 0);
    const withdrawals = this.transactions.filter(t => t.type === 'cash_out');
    const totalFees = withdrawals.reduce((sum, t) => sum + (t.feeUSD || 0), 0);

    return {
      totalTokensCirculatingUSD: Number(totalCirculating.toFixed(2)),
      totalReserveUSD: Number(totalCirculating.toFixed(2)), // 100% Calce en reserva 1:1
      totalPlatformFeesUSD: Number(totalFees.toFixed(2)),
      totalWithdrawalsCount: withdrawals.length,
      defaultWithdrawalFeePercent: 2.0,
      isBacked100Percent: true,
    };
  }
}

export const tokenWalletService = new TokenWalletService();


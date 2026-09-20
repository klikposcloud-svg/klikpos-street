export interface WalletAccount {
  walletId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userDocId: string; // Cédula o RIF (ej. V-18234567)
  userEmail?: string;
  balanceUSD: number; // Saldo en Tokens V-USD (1 Token = 1.00 USD)
  qrCodeData: string;
  status: 'active' | 'suspended' | 'blocked';
  pinHash?: string; // PIN de 4 dígitos para autorizar pagos
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'cash_in'          // Recarga de saldo (efectivo en caja o pago móvil)
  | 'cash_out'         // Retiro a cuenta bancaria (Pago Móvil / Transferencia)
  | 'p2p_transfer_out' // Envío a otra persona
  | 'p2p_transfer_in'  // Recepción de otra persona
  | 'purchase_payment' // Pago de productos en tienda Venemarket
  | 'delivery_payment' // Pago de pedido en D-Panas
  | 'ride_payment';    // Pago de carrera / moto / transporte

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amountUSD: number; // Cantidad de Tokens (USD)
  rateBCV: number;   // Tasa de cambio oficial BCV al momento exacto
  amountVES: number; // Equivalente en Bolívares al momento de la operación
  
  senderId?: string;
  senderName?: string;
  senderDocId?: string;

  recipientId?: string;
  recipientName?: string;
  recipientDocId?: string;

  storeId?: string;
  storeName?: string;

  feeUSD?: number;   // Comisión de plataforma en USD
  netAmountUSD?: number;
  netAmountVES?: number;

  bankName?: string;
  bankPhone?: string;
  bankDocId?: string;

  referenceNumber: string;
  paymentMethodOrigin?: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'zelle' | 'pos_card' | 'tokens';
  concept: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

export interface TopupRequest {
  walletIdentifier: string; // Cédula o Teléfono del usuario
  amountUSD?: number;
  amountVES?: number;
  paymentMethod: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'zelle';
  rateBCV: number;
  referenceNumber?: string;
  agentStoreId?: string;
  agentStoreName?: string;
  notes?: string;
}

export interface P2PTransferRequest {
  senderWalletId: string;
  recipientIdentifier: string; // Cédula o Teléfono de quien recibe
  amountUSD: number;
  concept?: string;
  pin?: string;
}

export interface MerchantPayRequest {
  customerWalletId: string;
  storeId: string;
  storeName: string;
  amountUSD: number;
  orderNumber?: string;
  concept: string;
  pin?: string;
}

export interface WithdrawalRequest {
  walletId: string;
  amountUSD: number;     // Tokens a retirar
  bankName: string;      // Banco de destino (ej. Banco de Venezuela, Banesco, Mercantil, Bancamiga)
  bankPhone: string;     // Teléfono Pago Móvil
  bankDocId: string;     // Cédula del titular
  rateBCV: number;       // Tasa BCV del momento
  feePercent?: number;   // Comisión de plataforma (ej. 2.0%)
}

export interface TreasuryMetrics {
  totalTokensCirculatingUSD: number; // Total tokens en manos de usuarios
  totalReserveUSD: number;           // Reserva real 1:1 en custodia
  totalPlatformFeesUSD: number;      // Ganancias netas generadas por comisiones
  totalWithdrawalsCount: number;
  defaultWithdrawalFeePercent: number;
  isBacked100Percent: boolean;
}

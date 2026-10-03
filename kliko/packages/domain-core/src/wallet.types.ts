export type TokenTransactionType = 
  | 'CASHBACK_REWARD'       // Recompensa por compra recurrente
  | 'P2P_TRANSFER'           // Transferencia interna entre usuarios/motorizados
  | 'ORDER_PAYMENT'          // Pago de pedido con K-Tokens
  | 'CREDIT_INSTALLMENT'     // Pago de cuota de K-Crédito
  | 'COMMISSION_PAYOUT'      // Pago de flete a motorizado
  | 'DEPOSIT_BS'             // Recarga con Pago Móvil a tasa BCV
  | 'WITHDRAW_BS';           // Liquidación a cuenta bancaria a tasa BCV

export interface KlikoWallet {
  userId: string;
  userType: 'CUSTOMER' | 'RIDER' | 'MERCHANT';
  balanceTokens: number;      // Saldo equivalente indexado (1 Token = 1 USD de poder adquisitivo)
  lockedTokens: number;       // Tokens bloqueados en órdenes en curso
  reputationScore: number;    // Score crediticio interno (0 a 100)
  creditLimitTokens: number;  // Límite de microcrédito pre-aprobado
  creditUsedTokens: number;   // Monto de crédito actualmente en uso
  createdAt: string;
  updatedAt: string;
}

export interface TokenTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TokenTransactionType;
  amountTokens: number;
  rateBcvSnapshot: number;   // Tasa oficial de referencia al momento de la operación
  amountBsEquivalent: number;
  orderId?: string;
  referenceProof?: string;   // Referencia bancaria si fue recarga Pago Móvil
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  timestamp: string;
}

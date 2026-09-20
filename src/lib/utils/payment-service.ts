export interface PaymentDetails {
  method: PaymentMethod;
  amountUSD: number;
  amountBS: number;
  rate: number;
  reference: string;
  bank?: string;
  phone?: string;
  lastFourDigits?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  timestamp: string;
  verificationData?: VerificationData;
}

export interface VerificationData {
  verifiedBy: 'sms' | 'manual' | 'qr';
  verifiedAt?: string;
  notes?: string;
}

export interface ZelleVerification {
  senderName: string;
  amount: number;
  reference: string;
  date: string;
  confirmationId: string;
}

export interface CashChange {
  amountUSD: number;
  amountBS: number;
  breakdown: ChangeBreakdown[];
  creditVoucher?: CreditVoucher;
}

export interface ChangeBreakdown {
  type: 'cash_usd' | 'cash_bs' | 'mobile_payment' | 'credit_voucher';
  amountUSD: number;
  amountBS: number;
  description: string;
}

export interface CreditVoucher {
  id: string;
  customerName: string;
  customerId: string;
  amountUSD: number;
  amountBS: number;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  usedInSaleId?: string;
}

export interface MobilePayment {
  bank: string;
  phone: string;
  reference: string;
  lastFour: string;
  verified: boolean;
  verifiedAt?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'zelle' | 'mobile_payment' | 'mixed' | 'qr_bcv';

export interface SalePayment {
  method: PaymentMethod;
  amountUSD: number;
  amountBS: number;
  rate: number;
  reference: string;
  bank?: string;
  phone?: string;
  status: 'pending' | 'verified' | 'rejected';
  igtf_aplicado: boolean;
  timestamp: string;
}

export interface BcvQrData {
  rif: string;
  phone: string;
  bank: string;
  accountType: 'corriente' | 'ahorro';
  amount?: number;
  concept?: string;
}

export const VENEZUELAN_BANKS = [
  { code: '0102', name: 'Banco de Venezuela', shortName: 'BDV' },
  { code: '0104', name: 'Banco Provincial', shortName: 'BPRO' },
  { code: '0105', name: 'Banco Mercantil', shortName: 'BM' },
  { code: '0108', name: 'Banco Caribe', shortName: 'BC' },
  { code: '0114', name: 'Banco Occidental de Descuento', shortName: 'BOD' },
  { code: '0115', name: 'Banco Plaza', shortName: 'BPLAZA' },
  { code: '0121', name: 'Banco Sofitasa', shortName: 'BSOF' },
  { code: '0134', name: 'Banco Bicentenario', shortName: 'BB' },
  { code: '0137', name: 'Banco Sofica', shortName: 'BSOFICA' },
  { code: '0138', name: 'Banco del Tesoro', shortName: 'BTES' },
  { code: '0146', name: 'Banco de la Fuerza Armada', shortName: 'BANFAA' },
  { code: '0151', name: 'Banco Fondo Común', shortName: 'BFC' },
  { code: '0156', name: '100% Banco', shortName: '100%B' },
  { code: '0157', name: 'Banco Digital de los Trabajadores', shortName: 'BDT' },
  { code: '0163', name: 'Banco del Alba', shortName: 'BALBA' },
  { code: '0168', name: 'Banco Bancrecer', shortName: 'BBANCR' },
  { code: '0169', name: 'Banco Nacional de Crédito', shortName: 'BNC' },
  { code: '0171', name: 'Banco Activo', shortName: 'BACTIVO' },
  { code: '0172', name: 'Banco Atlántida', shortName: 'BATL' },
  { code: '0174', name: 'Banco Bangente', shortName: 'BANG' },
  { code: '0175', name: 'Banco Banesco', shortName: 'BANESCO' },
  { code: '0177', name: 'Banco Banplus', shortName: 'BANPLUS' },
  { code: '0190', name: 'Banco Nacional de Venezuela', shortName: 'BNV' },
  { code: '0191', name: 'Citibank', shortName: 'CITI' },
] as const;

export class PaymentService {
  private static IGTF_RATE = 0.03;

  static calculateIgtf(amountUSD: number): number {
    return Math.round(amountUSD * this.IGTF_RATE * 100) / 100;
  }

  static formatBs(amountUSD: number, rate: number): number {
    return Math.round(amountUSD * rate * 100) / 100;
  }

  static parseBsToUsd(amountBS: number, rate: number): number {
    return Math.round((amountBS / rate) * 100) / 100;
  }

  static calculateChange(
    totalUSD: number,
    receivedUSD: number,
    receivedBS: number,
    rate: number,
    applyIgtf: boolean
  ): CashChange {
    const subtotalUSD = totalUSD;
    const igtf = applyIgtf ? this.calculateIgtf(subtotalUSD) : 0;
    const finalTotalUSD = subtotalUSD + igtf;
    const finalTotalBS = this.formatBs(finalTotalUSD, rate);

    const receivedUSDValue = receivedUSD || 0;
    const receivedBSValue = receivedBS || 0;
    const totalReceivedUSD = receivedUSDValue + this.parseBsToUsd(receivedBSValue, rate);

    const changeUSD = Math.max(0, totalReceivedUSD - finalTotalUSD);
    const changeBS = Math.max(0, finalTotalBS - this.formatBs(totalReceivedUSD, rate));

    const breakdown: ChangeBreakdown[] = [];

    if (changeUSD > 0) {
      breakdown.push({
        type: 'cash_usd',
        amountUSD: changeUSD,
        amountBS: this.formatBs(changeUSD, rate),
        description: `${changeUSD.toFixed(2)} USD en efectivo`
      });
    }

    if (changeBS > 0.01) {
      breakdown.push({
        type: 'cash_bs',
        amountUSD: this.parseBsToUsd(changeBS, rate),
        amountBS: changeBS,
        description: `${changeBS.toFixed(2)} BS en efectivo`
      });
    }

    return {
      amountUSD: Math.round(changeUSD * 100) / 100,
      amountBS: Math.round(changeBS * 100) / 100,
      breakdown
    };
  }

  static calculateOptimalChange(
    changeUSD: number,
    rate: number,
    availableDenominations: { usd: number[]; bs: number[] }
  ): ChangeBreakdown[] {
    const breakdown: ChangeBreakdown[] = [];
    let remainingUSD = changeUSD;
    let remainingBS = changeUSD * rate;

    for (const denom of availableDenominations.usd.sort((a, b) => b - a)) {
      if (remainingUSD >= denom) {
        const count = Math.floor(remainingUSD / denom);
        remainingUSD = Math.round((remainingUSD - count * denom) * 100) / 100;
        breakdown.push({
          type: 'cash_usd',
          amountUSD: count * denom,
          amountBS: this.formatBs(count * denom, rate),
          description: `${count}x $${denom.toFixed(2)}`
        });
      }
    }

    if (remainingUSD > 0.01) {
      const closestBsDenom = availableDenominations.bs
        .filter(d => d >= remainingBS)
        .sort((a, b) => a - b)[0];

      if (closestBsDenom) {
        const equivalentBs = Math.ceil(remainingUSD * rate / closestBsDenom) * closestBsDenom;
        breakdown.push({
          type: 'cash_bs',
          amountUSD: this.parseBsToUsd(equivalentBs, rate),
          amountBS: equivalentBs,
          description: `${equivalentBs.toLocaleString('es-VE')} BS`
        });
      } else {
        breakdown.push({
          type: 'cash_bs',
          amountUSD: remainingUSD,
          amountBS: remainingBS,
          description: `${remainingBS.toFixed(2)} BS`
        });
      }
    }

    return breakdown;
  }

  static generateMobilePaymentRef(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
  }

  static validateMobileRef(reference: string): boolean {
    return /^\d{4,10}$/.test(reference);
  }

  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
  }

  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `0412${cleaned.slice(0, 8)}`;
    }
    if (cleaned.length === 11) {
      return cleaned;
    }
    return cleaned;
  }

  static generateCreditVoucher(
    customerName: string,
    customerId: string,
    amountUSD: number,
    rate: number,
    expiresInDays: number = 30
  ): CreditVoucher {
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + expiresInDays);

    return {
      id: `VOU-${Date.now().toString(36).toUpperCase()}`,
      customerName,
      customerId,
      amountUSD,
      amountBS: this.formatBs(amountUSD, rate),
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      used: false
    };
  }

  static generateBcvQrData(
    storeRif: string,
    storePhone: string,
    bankCode: string,
    accountType: 'corriente' | 'ahorro' = 'corriente',
    amount?: number,
    concept?: string
  ): BcvQrData {
    return {
      rif: storeRif.replace(/[^0-9kK]/g, ''),
      phone: storePhone.replace(/\D/g, ''),
      bank: bankCode,
      accountType,
      amount,
      concept
    };
  }

  static parseBcvQrString(qrString: string): BcvQrData | null {
    try {
      if (qrString.startsWith('N')) {
        const parts = qrString.split('|');
        return {
          rif: parts[1] || '',
          phone: parts[2] || '',
          bank: parts[3] || '',
          accountType: (parts[4] as 'corriente' | 'ahorro') || 'corriente',
          amount: parts[5] ? parseFloat(parts[5]) : undefined,
          concept: parts[6] || undefined
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static isDuplicateZelleRef(
    reference: string,
    existingRefs: string[]
  ): boolean {
    return existingRefs.some(
      existing =>
        existing.toUpperCase() === reference.toUpperCase()
    );
  }

  static createMixedPayment(
    payments: Array<{
      method: PaymentMethod;
      amountUSD: number;
      amountBS: number;
    }>,
    rate: number
  ): SalePayment[] {
    return payments.map(p => ({
      method: p.method,
      amountUSD: p.amountUSD,
      amountBS: p.amountBS || this.formatBs(p.amountUSD, rate),
      rate,
      reference: this.generateMobilePaymentRef(),
      status: 'pending',
      igtf_aplicado: p.method === 'zelle' || p.method === 'mobile_payment',
      timestamp: new Date().toISOString(),
    }));
  }
}

export const paymentService = PaymentService;

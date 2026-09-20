import { venematicDB } from '@/lib/indexeddb/db'
import { CurrencyAdapterFactory, VenezuelaBSVAdapter, type BaseCurrencyAdapter, type CurrencyCalculation } from '@/lib/utils/currency-adapter'

export class CurrencyService {
  private static adapter: BaseCurrencyAdapter | null = null

  static getAdapter(): BaseCurrencyAdapter {
    if (!this.adapter) {
      this.adapter = CurrencyAdapterFactory.getAdapter('VE')
    }
    return this.adapter
  }

  static setAdapter(adapter: BaseCurrencyAdapter): void {
    this.adapter = adapter
  }

  static getIgtfRate(): number {
    return this.getAdapter().getTaxInfo().rate
  }

  static async getCurrentBcvRate(): Promise<number> {
    const cached = await venematicDB.getLatestBcvRate()
    if (cached) return cached.rate

    try {
      const adapter = this.getAdapter()
      const rate = await adapter.getRate()
      await adapter.saveRate(rate)
      await venematicDB.saveBcvRate(rate)
      return rate.rate
    } catch (error) {
      console.error('Failed to fetch BCV rate:', error)
    }

    return 0
  }

  static async getBcvRateForDate(date: string): Promise<number> {
    const rates = await venematicDB.getAllBcvRates()
    const targetRate = rates.find((r) => r.date === date)
    if (targetRate) return targetRate.rate

    let closestRate: any = null
    let closestDiff = Infinity

    for (const rate of rates) {
      const diff = Math.abs(new Date(rate.date).getTime() - new Date(date).getTime())
      if (diff < closestDiff) {
        closestDiff = diff
        closestRate = rate
      }
    }

    return closestRate?.rate || 0
  }

  static calculateSale(
    items: Array<{ priceUSD: number; quantity: number }>,
    bcvRate: number,
    applyIgtf: boolean = false
  ): CurrencyCalculation {
    return this.getAdapter().calculate(
      items.map((i) => ({ priceForeign: i.priceUSD, quantity: i.quantity })),
      bcvRate,
      applyIgtf
    )
  }

  static usdToBs(amountUSD: number, bcvRate: number, applyIgtf: boolean = false): number {
    return this.getAdapter().foreignToLocal(amountUSD, bcvRate, applyIgtf)
  }

  static bsToUsd(amountBS: number, bcvRate: number): number {
    return this.getAdapter().localToForeign(amountBS, bcvRate)
  }

  static formatCurrency(amount: number, currency: 'USD' | 'BS'): string {
    const adapter = this.getAdapter()
    if (currency === 'USD') {
      return adapter.formatForeign(amount)
    }
    return adapter.formatLocal(amount)
  }

  static async saveManualRate(rate: number, updatedBy: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()
    const rateRecord = {
      id: `manual_${today}`,
      rate,
      date: today,
      source: 'manual' as const,
      updatedBy,
      createdAt: now,
      updatedAt: now,
    }
    await venematicDB.saveBcvRate(rateRecord)
    this.getAdapter().setCachedRate(rateRecord)
  }
}

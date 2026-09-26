export interface ExchangeRate {
  rate: number
  date: string
  source: 'scraper' | 'manual' | 'api'
  updatedAt: string
}

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  localCurrency: string
  localSymbol: string
  taxRate: number
  taxName: string
  taxAppliesTo: string[]
  decimalPlaces: number
  locale: string
}

export interface CurrencyCalculation {
  subtotalLocal: number
  subtotalForeign: number
  taxAmount: number
  totalLocal: number
  totalForeign: number
  rate: number
  rateDate: string
  items: Array<{
    priceLocal: number
    priceForeign: number
    quantity: number
    totalLocal: number
    totalForeign: number
  }>
}

export interface RateProvider {
  fetchRate(): Promise<ExchangeRate>
  fetchHistoricalRates?(days: number): Promise<ExchangeRate[]>
  getProviderName(): string
}

export abstract class BaseCurrencyAdapter {
  protected config: CurrencyConfig
  protected rateProvider: RateProvider | null = null
  protected cachedRate: ExchangeRate | null = null

  constructor(config: CurrencyConfig) {
    this.config = config
  }

  setRateProvider(provider: RateProvider): void {
    this.rateProvider = provider
  }

  setCachedRate(rate: ExchangeRate): void {
    this.cachedRate = rate
  }

  abstract getRate(): Promise<ExchangeRate>

  abstract saveRate(rate: ExchangeRate): Promise<void>

  calculate(
    items: Array<{ priceForeign: number; quantity: number }>,
    rate: number,
    applyTax: boolean = false
  ): CurrencyCalculation {
    const calculatedItems = items.map((item) => {
      const totalForeign = item.priceForeign * item.quantity
      const totalLocal = totalForeign * rate

      return {
        priceLocal: Math.round(item.priceForeign * rate * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
        priceForeign: item.priceForeign,
        quantity: item.quantity,
        totalLocal: Math.round(totalLocal * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
        totalForeign: Math.round(totalForeign * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      }
    })

    const subtotalForeign = calculatedItems.reduce((sum, item) => sum + item.totalForeign, 0)
    const subtotalLocal = subtotalForeign * rate
    const taxAmount = applyTax ? subtotalForeign * this.config.taxRate : 0
    const totalForeign = subtotalForeign + taxAmount
    const totalLocal = totalForeign * rate

    return {
      subtotalLocal: Math.round(subtotalLocal * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      subtotalForeign: Math.round(subtotalForeign * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      taxAmount: Math.round(taxAmount * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      totalLocal: Math.round(totalLocal * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      totalForeign: Math.round(totalForeign * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces),
      rate,
      rateDate: new Date().toISOString(),
      items: calculatedItems,
    }
  }

  localToForeign(amountLocal: number, rate: number, applyTax: boolean = false): number {
    if (rate === 0) return 0
    const withTax = applyTax ? amountLocal * (1 + this.config.taxRate) : amountLocal
    const foreign = withTax / rate
    return Math.round(foreign * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces)
  }

  foreignToLocal(amountForeign: number, rate: number, applyTax: boolean = false): number {
    const withTax = applyTax ? amountForeign * (1 + this.config.taxRate) : amountForeign
    const local = withTax * rate
    return Math.round(local * Math.pow(10, this.config.decimalPlaces)) / Math.pow(10, this.config.decimalPlaces)
  }

  formatLocal(amount: number): string {
    return new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: this.config.localCurrency,
      minimumFractionDigits: this.config.decimalPlaces,
    }).format(amount)
  }

  formatForeign(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.config.code,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  getConfig(): CurrencyConfig {
    return this.config
  }

  getTaxInfo(): { name: string; rate: number; appliesTo: string[] } {
    return {
      name: this.config.taxName,
      rate: this.config.taxRate,
      appliesTo: this.config.taxAppliesTo,
    }
  }
}

export class VenezuelaBSVAdapter extends BaseCurrencyAdapter {
  constructor() {
    super({
      code: 'USD',
      symbol: '$',
      name: 'Dólar Estadounidense',
      localCurrency: 'VES',
      localSymbol: 'Bs.',
      taxRate: 0.03,
      taxName: 'IGTF',
      taxAppliesTo: ['card', 'transfer', 'zelle', 'foreign_cash'],
      decimalPlaces: 2,
      locale: 'es-VE',
    })
  }

  async getRate(): Promise<ExchangeRate> {
    if (this.cachedRate) return this.cachedRate

    if (this.rateProvider) {
      const rate = await this.rateProvider.fetchRate()
      this.cachedRate = rate
      return rate
    }

    throw new Error('No rate provider configured and no cached rate available')
  }

  async saveRate(rate: ExchangeRate): Promise<void> {
    this.cachedRate = rate
  }
}

export class ColombiaCOPAdapter extends BaseCurrencyAdapter {
  constructor() {
    super({
      code: 'USD',
      symbol: '$',
      name: 'Dólar Estadounidense',
      localCurrency: 'COP',
      localSymbol: '$',
      taxRate: 0.19,
      taxName: 'IVA',
      taxAppliesTo: ['all'],
      decimalPlaces: 0,
      locale: 'es-CO',
    })
  }

  async getRate(): Promise<ExchangeRate> {
    if (this.cachedRate) return this.cachedRate

    if (this.rateProvider) {
      const rate = await this.rateProvider.fetchRate()
      this.cachedRate = rate
      return rate
    }

    throw new Error('No rate provider configured and no cached rate available')
  }

  async saveRate(rate: ExchangeRate): Promise<void> {
    this.cachedRate = rate
  }
}

export class BcvRateProvider implements RateProvider {
  private scraperUrl: string

  constructor(scraperUrl = '/api/bcv-rate') {
    this.scraperUrl = scraperUrl
  }

  async fetchRate(): Promise<ExchangeRate> {
    const response = await fetch(this.scraperUrl, { signal: AbortSignal.timeout(15000) })

    if (!response.ok) {
      throw new Error(`Failed to fetch BCV rate: ${response.status}`)
    }

    const data = await response.json()

    return {
      rate: data.rate,
      date: data.date,
      source: data.source,
      updatedAt: new Date().toISOString(),
    }
  }

  async fetchHistoricalRates(days: number = 30): Promise<ExchangeRate[]> {
    const response = await fetch(`${this.scraperUrl}/historical?days=${days}`, {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.map((item: any) => ({
      rate: item.rate,
      date: item.date,
      source: item.source,
      updatedAt: new Date().toISOString(),
    }))
  }

  getProviderName(): string {
    return 'BCV (Banco Central de Venezuela)'
  }
}

export class ManualRateProvider implements RateProvider {
  private rate: number
  private date: string

  constructor(rate: number, date?: string) {
    this.rate = rate
    this.date = date || new Date().toISOString().split('T')[0]
  }

  async fetchRate(): Promise<ExchangeRate> {
    return {
      rate: this.rate,
      date: this.date,
      source: 'manual',
      updatedAt: new Date().toISOString(),
    }
  }

  getProviderName(): string {
    return 'Tasa Manual'
  }

  updateRate(rate: number, date?: string): void {
    this.rate = rate
    this.date = date || new Date().toISOString().split('T')[0]
  }
}

export class CurrencyAdapterFactory {
  private static adapters: Map<string, BaseCurrencyAdapter> = new Map()

  static getAdapter(country: string = 'VE'): BaseCurrencyAdapter {
    if (!this.adapters.has(country)) {
      const adapter = this.createAdapter(country)
      this.adapters.set(country, adapter)
    }
    return this.adapters.get(country)!
  }

  private static createAdapter(country: string): BaseCurrencyAdapter {
    switch (country.toUpperCase()) {
      case 'VE':
        return new VenezuelaBSVAdapter()
      case 'CO':
        return new ColombiaCOPAdapter()
      default:
        return new VenezuelaBSVAdapter()
    }
  }

  static registerAdapter(country: string, adapter: BaseCurrencyAdapter): void {
    this.adapters.set(country.toUpperCase(), adapter)
  }

  static getSupportedCountries(): string[] {
    return ['VE', 'CO']
  }
}

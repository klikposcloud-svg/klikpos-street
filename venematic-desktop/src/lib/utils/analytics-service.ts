import { venematicDB } from '@/lib/indexeddb/db'
import type { IDBSale } from '@/lib/indexeddb/db'

export interface CurrencySummary {
  method: string
  label: string
  totalUSD: number
  totalBS: number
  transactionCount: number
  percentage: number
  icon: string
}

export interface IGTFCalculation {
  totalSalesWithIGTF: number
  igtfCollectedUSD: number
  igtfCollectedBS: number
  taxableTransactions: number
  byMethod: {
    method: string
    transactions: number
    subtotalUSD: number
    igtfUSD: number
    igtfBS: number
  }[]
  byDate: {
    date: string
    igtfUSD: number
    igtfBS: number
    transactions: number
  }[]
  fiscalPeriod: string
}

export interface HourlyHeatmapData {
  hour: number
  dayOfWeek: number
  sales: number
  revenueUSD: number
  revenueBS: number
  transactionCount: number
  avgTicketUSD: number
}

export interface DailyTrend {
  date: string
  salesUSD: number
  salesBS: number
  transactions: number
  avgTicketUSD: number
  igtfUSD: number
}

export interface AnalyticsData {
  currencySummary: CurrencySummary[]
  igtf: IGTFCalculation
  heatmapData: HourlyHeatmapData[]
  dailyTrends: DailyTrend[]
  totalSalesUSD: number
  totalSalesBS: number
  totalTransactions: number
  avgTicketUSD: number
  periodStart: string
  periodEnd: string
}

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  cash: { label: 'Efectivo USD', icon: '💵' },
  card: { label: 'Tarjeta', icon: '💳' },
  transfer: { label: 'Transferencia', icon: '🏦' },
  mobile: { label: 'Pago Móvil (BS)', icon: '📱' },
  zelle: { label: 'Zelle', icon: '🅉' },
  mixed: { label: 'Pago Mixto', icon: '🔄' },
  otros: { label: 'Otros', icon: '📋' },
}

export class AnalyticsService {
  static async getAnalyticsData(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsData> {
    const sales = await venematicDB.getSalesByStore(storeId)

    const filteredSales = sales.filter((s) => {
      const saleDate = s.createdAt.split('T')[0]
      return saleDate >= startDate && saleDate <= endDate
    })

    const currencySummary = this.calculateCurrencySummary(filteredSales)
    const igtf = this.calculateIGTF(filteredSales)
    const heatmapData = this.calculateHeatmapData(filteredSales)
    const dailyTrends = this.calculateDailyTrends(filteredSales)

    const totalSalesUSD = filteredSales.reduce((sum, s) => sum + s.totalUSD, 0)
    const totalSalesBS = filteredSales.reduce((sum, s) => sum + s.totalBS, 0)
    const totalTransactions = filteredSales.length
    const avgTicketUSD = totalTransactions > 0 ? totalSalesUSD / totalTransactions : 0

    return {
      currencySummary,
      igtf,
      heatmapData,
      dailyTrends,
      totalSalesUSD: Math.round(totalSalesUSD * 100) / 100,
      totalSalesBS: Math.round(totalSalesBS * 100) / 100,
      totalTransactions,
      avgTicketUSD: Math.round(avgTicketUSD * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
    }
  }

  static calculateCurrencySummary(sales: IDBSale[]): CurrencySummary[] {
    const methodTotals: Record<string, { totalUSD: number; totalBS: number; count: number }> = {}

    sales.forEach((sale) => {
      const method = sale.paymentMethod || 'cash'

      if (method === 'mixed') {
        sale.payments?.forEach((payment) => {
          const pMethod = payment.method || 'otros'
          if (!methodTotals[pMethod]) {
            methodTotals[pMethod] = { totalUSD: 0, totalBS: 0, count: 0 }
          }
          methodTotals[pMethod].totalUSD += payment.amountUSD
          methodTotals[pMethod].totalBS += payment.amountBS
          methodTotals[pMethod].count++
        })
      } else {
        if (!methodTotals[method]) {
          methodTotals[method] = { totalUSD: 0, totalBS: 0, count: 0 }
        }
        methodTotals[method].totalUSD += sale.totalUSD
        methodTotals[method].totalBS += sale.totalBS
        methodTotals[method].count++
      }
    })

    const totalAllUSD = Object.values(methodTotals).reduce((sum, m) => sum + m.totalUSD, 0)

    return Object.entries(methodTotals)
      .map(([method, data]) => {
        const info = PAYMENT_LABELS[method] || PAYMENT_LABELS.otros
        return {
          method,
          label: info.label,
          totalUSD: Math.round(data.totalUSD * 100) / 100,
          totalBS: Math.round(data.totalBS * 100) / 100,
          transactionCount: data.count,
          percentage: totalAllUSD > 0 ? Math.round((data.totalUSD / totalAllUSD) * 10000) / 100 : 0,
          icon: info.icon,
        }
      })
      .sort((a, b) => b.totalUSD - a.totalUSD)
  }

  static calculateIGTF(sales: IDBSale[]): IGTFCalculation {
    const IGTF_RATE = 0.03

    const igtfByMethod: Record<string, { transactions: number; subtotalUSD: number; igtfUSD: number; igtfBS: number }> = {}
    const igtfByDate: Record<string, { igtfUSD: number; igtfBS: number; transactions: number }> = {}

    let totalIGTFUSD = 0
    let totalIGTFBS = 0
    let taxableTransactions = 0
    let totalSalesWithIGTF = 0

    sales.forEach((sale) => {
      const date = sale.createdAt.split('T')[0]

      if (sale.igtfUSD > 0) {
        taxableTransactions++
        totalSalesWithIGTF += sale.subtotalUSD
        totalIGTFUSD += sale.igtfUSD
        totalIGTFBS += sale.igtfUSD * sale.bcvRate

        if (!igtfByMethod[sale.paymentMethod]) {
          igtfByMethod[sale.paymentMethod] = { transactions: 0, subtotalUSD: 0, igtfUSD: 0, igtfBS: 0 }
        }
        igtfByMethod[sale.paymentMethod].transactions++
        igtfByMethod[sale.paymentMethod].subtotalUSD += sale.subtotalUSD
        igtfByMethod[sale.paymentMethod].igtfUSD += sale.igtfUSD
        igtfByMethod[sale.paymentMethod].igtfBS += sale.igtfUSD * sale.bcvRate

        if (!igtfByDate[date]) {
          igtfByDate[date] = { igtfUSD: 0, igtfBS: 0, transactions: 0 }
        }
        igtfByDate[date].igtfUSD += sale.igtfUSD
        igtfByDate[date].igtfBS += sale.igtfUSD * sale.bcvRate
        igtfByDate[date].transactions++
      }
    })

    const byMethod = Object.entries(igtfByMethod).map(([method, data]) => ({
      method,
      transactions: data.transactions,
      subtotalUSD: Math.round(data.subtotalUSD * 100) / 100,
      igtfUSD: Math.round(data.igtfUSD * 100) / 100,
      igtfBS: Math.round(data.igtfBS * 100) / 100,
    }))

    const byDate = Object.entries(igtfByDate)
      .map(([date, data]) => ({
        date,
        igtfUSD: Math.round(data.igtfUSD * 100) / 100,
        igtfBS: Math.round(data.igtfBS * 100) / 100,
        transactions: data.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const now = new Date()
    const fiscalPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    return {
      totalSalesWithIGTF: Math.round(totalSalesWithIGTF * 100) / 100,
      igtfCollectedUSD: Math.round(totalIGTFUSD * 100) / 100,
      igtfCollectedBS: Math.round(totalIGTFBS * 100) / 100,
      taxableTransactions,
      byMethod,
      byDate,
      fiscalPeriod,
    }
  }

  static calculateHeatmapData(sales: IDBSale[]): HourlyHeatmapData[] {
    const heatmap: Record<string, { sales: number; revenueUSD: number; revenueBS: number; count: number }> = {}

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      const key = `${dayOfWeek}-${hour}`

      if (!heatmap[key]) {
        heatmap[key] = { sales: 0, revenueUSD: 0, revenueBS: 0, count: 0 }
      }
      heatmap[key].sales += sale.totalUSD
      heatmap[key].revenueUSD += sale.totalUSD
      heatmap[key].revenueBS += sale.totalBS
      heatmap[key].count++
    })

    const result: HourlyHeatmapData[] = []

    for (let day = 0; day < 7; day++) {
      for (let hour = 6; hour <= 22; hour++) {
        const key = `${day}-${hour}`
        const data = heatmap[key] || { sales: 0, revenueUSD: 0, revenueBS: 0, count: 0 }
        result.push({
          hour,
          dayOfWeek: day,
          sales: Math.round(data.revenueUSD * 100) / 100,
          revenueUSD: Math.round(data.revenueUSD * 100) / 100,
          revenueBS: Math.round(data.revenueBS * 100) / 100,
          transactionCount: data.count,
          avgTicketUSD: data.count > 0 ? Math.round((data.revenueUSD / data.count) * 100) / 100 : 0,
        })
      }
    }

    return result
  }

  static calculateDailyTrends(sales: IDBSale[]): DailyTrend[] {
    const dailyData: Record<string, { salesUSD: number; salesBS: number; transactions: number; igtfUSD: number }> = {}

    sales.forEach((sale) => {
      const date = sale.createdAt.split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { salesUSD: 0, salesBS: 0, transactions: 0, igtfUSD: 0 }
      }
      dailyData[date].salesUSD += sale.totalUSD
      dailyData[date].salesBS += sale.totalBS
      dailyData[date].transactions++
      dailyData[date].igtfUSD += sale.igtfUSD || 0
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        salesUSD: Math.round(data.salesUSD * 100) / 100,
        salesBS: Math.round(data.salesBS * 100) / 100,
        transactions: data.transactions,
        avgTicketUSD: data.transactions > 0 ? Math.round((data.salesUSD / data.transactions) * 100) / 100 : 0,
        igtfUSD: Math.round(data.igtfUSD * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  static getDayName(day: number): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return days[day]
  }

  static getPeakHours(heatmapData: HourlyHeatmapData[]): { hour: number; avgRevenue: number }[] {
    const hourlyTotals: Record<number, { total: number; count: number }> = {}

    heatmapData.forEach((d) => {
      if (!hourlyTotals[d.hour]) hourlyTotals[d.hour] = { total: 0, count: 0 }
      hourlyTotals[d.hour].total += d.revenueUSD
      hourlyTotals[d.hour].count += d.transactionCount
    })

    return Object.entries(hourlyTotals)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgRevenue: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
      .slice(0, 5)
  }

  static getPeakDays(heatmapData: HourlyHeatmapData[]): { day: number; totalRevenue: number }[] {
    const dailyTotals: Record<number, number> = {}

    heatmapData.forEach((d) => {
      if (!dailyTotals[d.dayOfWeek]) dailyTotals[d.dayOfWeek] = 0
      dailyTotals[d.dayOfWeek] += d.revenueUSD
    })

    return Object.entries(dailyTotals)
      .map(([day, total]) => ({
        day: parseInt(day),
        totalRevenue: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }
}

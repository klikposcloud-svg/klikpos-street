'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/I18nProvider'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AnalyticsService, type CurrencySummary, type IGTFCalculation, type HourlyHeatmapData, type DailyTrend } from '@/lib/utils/analytics-service'
import { venematicDB } from '@/lib/indexeddb/db'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getHeatmapColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-slate-100 dark:bg-slate-800'
  const ratio = value / max
  if (ratio < 0.15) return 'bg-emerald-100 dark:bg-emerald-900/20'
  if (ratio < 0.3) return 'bg-emerald-200 dark:bg-emerald-900/30'
  if (ratio < 0.45) return 'bg-emerald-300 dark:bg-emerald-800/40'
  if (ratio < 0.6) return 'bg-emerald-400 dark:bg-emerald-700/50'
  if (ratio < 0.75) return 'bg-emerald-500 dark:bg-emerald-600/60'
  if (ratio < 0.9) return 'bg-emerald-600 dark:bg-emerald-500/70'
  return 'bg-emerald-700 dark:bg-emerald-400/80'
}

function getHeatmapTextColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'text-slate-400 dark:text-slate-600'
  const ratio = value / max
  return ratio > 0.5 ? 'text-white' : 'text-slate-700 dark:text-slate-300'
}

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')

  const [currencySummary, setCurrencySummary] = useState<CurrencySummary[]>([])
  const [igtf, setIgtf] = useState<IGTFCalculation | null>(null)
  const [heatmapData, setHeatmapData] = useState<HourlyHeatmapData[]>([])
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([])
  const [totalSalesUSD, setTotalSalesUSD] = useState(0)
  const [totalSalesBS, setTotalSalesBS] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [avgTicketUSD, setAvgTicketUSD] = useState(0)

  const dateRange = useMemo(() => {
    const now = new Date()
    let start: string
    let end = now.toISOString().split('T')[0]

    switch (period) {
      case 'today':
        start = end
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        start = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        start = monthAgo.toISOString().split('T')[0]
        break
      case 'custom':
        start = customStart || end
        end = customEnd || end
        break
      default:
        start = end
    }

    return { start, end }
  }, [period, customStart, customEnd])

  const loadData = useCallback(async () => {
    setLoading(true)
    const currentStoreId = await venematicDB.getSetting<string>('current_store_id') || 'default_store'
    setStoreId(currentStoreId)

    const data = await AnalyticsService.getAnalyticsData(
      currentStoreId,
      dateRange.start,
      dateRange.end
    )

    setCurrencySummary(data.currencySummary)
    setIgtf(data.igtf)
    setHeatmapData(data.heatmapData)
    setDailyTrends(data.dailyTrends)
    setTotalSalesUSD(data.totalSalesUSD)
    setTotalSalesBS(data.totalSalesBS)
    setTotalTransactions(data.totalTransactions)
    setAvgTicketUSD(data.avgTicketUSD)
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const maxHeatmapValue = useMemo(
    () => Math.max(...heatmapData.map((d) => d.transactionCount), 1),
    [heatmapData]
  )

  const peakHours = useMemo(
    () => AnalyticsService.getPeakHours(heatmapData),
    [heatmapData]
  )

  const peakDays = useMemo(
    () => AnalyticsService.getPeakDays(heatmapData),
    [heatmapData]
  )

  const salesTrendData = useMemo(() => {
    const labels = dailyTrends.map((d) => {
      const date = new Date(d.date + 'T12:00:00')
      return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Ventas USD',
          data: dailyTrends.map((d) => d.salesUSD),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#059669',
          borderWidth: 2,
        },
        {
          label: 'Transacciones',
          data: dailyTrends.map((d) => d.transactions),
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    }
  }, [dailyTrends])

  const paymentChartData = useMemo(() => {
    return {
      labels: currencySummary.map((c) => c.label),
      datasets: [
        {
          label: 'Monto USD',
          data: currencySummary.map((c) => c.totalUSD),
          backgroundColor: [
            '#059669', '#10b981', '#34d399', '#6ee7b7',
            '#475569', '#64748b', '#94a3b8',
          ],
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    }
  }, [currencySummary])

  const igtfTrendData = useMemo(() => {
    if (!igtf || igtf.byDate.length === 0) return null

    return {
      labels: igtf.byDate.map((d) => {
        const date = new Date(d.date + 'T12:00:00')
        return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
      }),
      datasets: [
        {
          label: 'IGTF USD',
          data: igtf.byDate.map((d) => d.igtfUSD),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    }
  }, [igtf])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { family: 'Montserrat', size: 11 },
          color: '#64748b',
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { family: 'Montserrat', size: 10 }, color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: { font: { family: 'Montserrat', size: 10 }, color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y1: {
        position: 'right' as const,
        ticks: { font: { family: 'Montserrat', size: 10 }, color: '#94a3b8' },
        grid: { display: false },
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y1: undefined,
    },
  }

  const downloadCurrencyReport = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Resumen de Divisas', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${dateRange.start} - ${dateRange.end}`, 105, 30, { align: 'center' })

    const tableData = currencySummary.map((c) => [
      `${c.icon} ${c.label}`,
      `$${c.totalUSD.toFixed(2)}`,
      `Bs. ${c.totalBS.toFixed(2)}`,
      c.transactionCount.toString(),
      `${c.percentage}%`,
    ])

    autoTable(doc, {
      startY: 40,
      head: [['Método', 'Total USD', 'Total BS', 'Transacciones', 'Porcentaje']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    })

    if (igtf) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Concepto', 'Monto']],
        body: [
          ['Total Ventas con IGTF', `$${igtf.totalSalesWithIGTF.toFixed(2)}`],
          ['IGTF Recaudado USD', `$${igtf.igtfCollectedUSD.toFixed(2)}`],
          ['IGTF Recaudado BS', `Bs. ${igtf.igtfCollectedBS.toFixed(2)}`],
          ['Transacciones Gravadas', igtf.taxableTransactions.toString()],
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
      })
    }

    doc.save(`reporte-divisas-${dateRange.start}-${dateRange.end}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b1329] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Cargando análisis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1329] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Análisis y Métricas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {dateRange.start} → {dateRange.end}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' },
                { key: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    period === p.key
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input-field text-xs py-1.5 w-36"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input-field text-xs py-1.5 w-36"
                />
              </div>
            )}

            <button onClick={downloadCurrencyReport} className="btn-secondary text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Ventas USD</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">${totalSalesUSD.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Ventas BS</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">Bs. {totalSalesBS.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Transacciones</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{totalTransactions}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ticket Promedio</p>
            <p className="text-xl font-bold text-emerald-600">${avgTicketUSD.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">💱</span>
              Resumen de Divisas
            </h2>
            <div className="space-y-3">
              {currencySummary.map((item) => (
                <div key={item.method} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.transactionCount} transacciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">${item.totalUSD.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bs. {item.totalBS.toFixed(2)}</p>
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mt-1 ml-auto">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {currencySummary.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">Sin datos para este período</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Distribución por Método de Pago
            </h2>
            <div className="h-64">
              {currencySummary.length > 0 ? (
                <Bar data={paymentChartData} options={barChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm">Sin datos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {igtf && igtf.taxableTransactions > 0 && (
          <div className="card mb-6 border-red-200 dark:border-red-900/30">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🧾</span>
              Cálculo de IGTF (3%) — Período Fiscal: {igtf.fiscalPeriod}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${igtf.igtfCollectedUSD.toFixed(2)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">IGTF Recaudado USD</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">Bs. {igtf.igtfCollectedBS.toFixed(2)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">IGTF Recaudado BS</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{igtf.taxableTransactions}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Transacciones Gravadas</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">${igtf.totalSalesWithIGTF.toFixed(2)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Base Imponible USD</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">IGTF por Método de Pago</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-2 text-slate-500 dark:text-slate-400">Método</th>
                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400">Trans.</th>
                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400">Base USD</th>
                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400">IGTF USD</th>
                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400">IGTF BS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {igtf.byMethod.map((m) => (
                        <tr key={m.method} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-2 px-2 text-slate-700 dark:text-slate-300 capitalize">{m.method}</td>
                          <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">{m.transactions}</td>
                          <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">${m.subtotalUSD.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-medium text-red-600">${m.igtfUSD.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">Bs. {m.igtfBS.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {igtfTrendData && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tendencia IGTF Diario</h3>
                  <div className="h-48">
                    <Line data={igtfTrendData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Nota fiscal:</strong> El IGTF (Impuesto a las Grandes Transacciones Financieras) del 3% se aplica a pagos en divisas distintas al Bolívar. Este desglose es para fines de declaración ante el SENIAT.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📈</span>
              Tendencia de Ventas
            </h2>
            <div className="h-64">
              {dailyTrends.length > 0 ? (
                <Line data={salesTrendData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm">Sin datos para el período seleccionado</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              Horas Pico
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">TOP 5 Horas con Más Ingresos</h3>
                {peakHours.map((ph, i) => (
                  <div key={ph.hour} className="flex items-center gap-3 py-2">
                    <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">
                      {String(ph.hour).padStart(2, '0')}:00
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${peakHours[0]?.avgRevenue > 0 ? (ph.avgRevenue / peakHours[0].avgRevenue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16 text-right">
                      ${ph.avgRevenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Días con Más Ventas</h3>
                <div className="flex gap-2">
                  {peakDays.map((pd) => (
                    <div key={pd.day} className="flex-1 text-center">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{DAY_SHORT[pd.day]}</p>
                      <p className="text-sm font-bold text-emerald-600">${pd.totalRevenue.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            Mapa de Calor — Actividad por Hora y Día
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Intensidad de transacciones. Las zonas más oscuras indican mayor actividad — considere agregar más cajeros en esas horas.
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-18 gap-0.5 mb-1">
                <div className="w-10" />
                {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => (
                  <div key={hour} className="text-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    {String(hour).padStart(2, '0')}
                  </div>
                ))}
              </div>

              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <div key={day} className="grid grid-cols-18 gap-0.5 mb-0.5">
                  <div className="w-10 text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center">
                    {DAY_SHORT[day]}
                  </div>
                  {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
                    const cell = heatmapData.find((d) => d.dayOfWeek === day && d.hour === hour)
                    const value = cell?.transactionCount || 0
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`aspect-square rounded-sm ${getHeatmapColor(value, maxHeatmapValue)} flex items-center justify-center cursor-default transition-colors hover:ring-1 hover:ring-emerald-400`}
                        title={`${DAY_LABELS[day]} ${String(hour).padStart(2, '0')}:00 — ${value} transacciones, $${cell?.revenueUSD.toFixed(2) || '0.00'}`}
                      >
                        {value > 0 && (
                          <span className={`text-[8px] font-bold ${getHeatmapTextColor(value, maxHeatmapValue)}`}>
                            {value}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-[10px] text-slate-400">Menos</span>
            <div className="flex gap-0.5">
              {['bg-slate-100 dark:bg-slate-800', 'bg-emerald-100 dark:bg-emerald-900/20', 'bg-emerald-300 dark:bg-emerald-800/40', 'bg-emerald-500 dark:bg-emerald-600/60', 'bg-emerald-700 dark:bg-emerald-400/80'].map((color, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${color}`} />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">Más</span>
          </div>
        </div>
      </div>
    </div>
  )
}

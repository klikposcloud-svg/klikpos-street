import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Sale, Report } from '@/types'

export class ReportGenerator {
  static generateDailyReport(sales: Sale[], storeName: string, date: string): jsPDF {
    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(storeName, 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Reporte Diario de Ventas - ${date}`, 105, 30, { align: 'center' })

    const totalUSD = sales.reduce((sum, s) => sum + s.totalUSD, 0)
    const totalBS = sales.reduce((sum, s) => sum + s.totalBS, 0)
    const avgTicket = sales.length > 0 ? totalUSD / sales.length : 0

    doc.setFontSize(10)
    doc.text(`Total Ventas: ${sales.length}`, 14, 45)
    doc.text(`Total USD: $${totalUSD.toFixed(2)}`, 14, 52)
    doc.text(`Total BS: Bs.${totalBS.toFixed(2)}`, 14, 59)
    doc.text(`Ticket Promedio: $${avgTicket.toFixed(2)}`, 14, 66)

    const tableData = sales.map((s) => [
      s.receiptNumber,
      s.cashierName,
      s.items.length.toString(),
      `$${s.totalUSD.toFixed(2)}`,
      `Bs.${s.totalBS.toFixed(2)}`,
      s.paymentMethod,
      new Date(s.createdAt).toLocaleTimeString(),
    ])

    autoTable(doc, {
      startY: 75,
      head: [['Recibo', 'Cajero', 'Items', 'Total USD', 'Total BS', 'Pago', 'Hora']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    })

    const paymentMethods: Record<string, number> = {}
    sales.forEach((s) => {
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + s.totalUSD
    })

    const paymentBreakdown = Object.entries(paymentMethods).map(([method, total]) => [
      method,
      `$${total.toFixed(2)}`,
      `${((total / totalUSD) * 100).toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Método de Pago', 'Total', 'Porcentaje']],
      body: paymentBreakdown,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
      },
    })

    doc.setFontSize(8)
    doc.text(`Generado por Venematic - ${new Date().toISOString()}`, 105, doc.internal.pageSize.height - 10, {
      align: 'center',
    })

    return doc
  }

  static generateInventoryReport(
    products: Array<{ name: string; barcode: string; stock: number; priceUSD: number; costUSD: number; category: string }>,
    storeName: string,
    date: string
  ): jsPDF {
    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(storeName, 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Reporte de Inventario - ${date}`, 105, 30, { align: 'center' })

    const totalValue = products.reduce((sum, p) => sum + p.priceUSD * p.stock, 0)
    const totalCost = products.reduce((sum, p) => sum + p.costUSD * p.stock, 0)
    const lowStock = products.filter((p) => p.stock <= (p as any).minStock || 0).length

    doc.setFontSize(10)
    doc.text(`Total Productos: ${products.length}`, 14, 45)
    doc.text(`Valor del Inventario: $${totalValue.toFixed(2)}`, 14, 52)
    doc.text(`Costo del Inventario: $${totalCost.toFixed(2)}`, 14, 59)
    doc.text(`Productos con Stock Bajo: ${lowStock}`, 14, 66)

    const tableData = products.map((p) => [
      p.name,
      p.barcode || 'N/A',
      p.category,
      p.stock.toString(),
      `$${p.priceUSD.toFixed(2)}`,
      `$${(p.priceUSD * p.stock).toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: 75,
      head: [['Producto', 'Código', 'Categoría', 'Stock', 'Precio', 'Valor Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    })

    doc.setFontSize(8)
    doc.text(`Generado por Venematic - ${new Date().toISOString()}`, 105, doc.internal.pageSize.height - 10, {
      align: 'center',
    })

    return doc
  }

  static generateReportSummary(report: Report, storeName: string): jsPDF {
    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(storeName, 105, 20, { align: 'center' })

    doc.setFontSize(14)
    doc.text(`Reporte ${report.type}`, 105, 32, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${report.startDate} - ${report.endDate}`, 14, 45)

    const metrics = [
      ['Total Ventas', `$${report.totalSalesUSD.toFixed(2)}`, `Bs.${report.totalSalesBS.toFixed(2)}`],
      ['Transacciones', report.totalTransactions.toString(), ''],
      ['Ticket Promedio', `$${report.avgTicketUSD.toFixed(2)}`, ''],
      ['Items Vendidos', report.totalItems.toString(), ''],
    ]

    autoTable(doc, {
      startY: 55,
      head: [['Métrica', 'USD', 'BS']],
      body: metrics,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
      },
    })

    if (report.topProducts.length > 0) {
      const topProductsData = report.topProducts.map((p) => [
        p.name,
        p.quantity.toString(),
        `$${p.revenueUSD.toFixed(2)}`,
      ])

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Producto', 'Cantidad', 'Ingreso']],
        body: topProductsData,
        theme: 'grid',
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontStyle: 'bold',
        },
      })
    }

    if (report.paymentBreakdown.length > 0) {
      const paymentData = report.paymentBreakdown.map((p) => [
        p.method,
        `$${p.totalUSD.toFixed(2)}`,
        `${p.percentage.toFixed(1)}%`,
      ])

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Método', 'Total', 'Porcentaje']],
        body: paymentData,
        theme: 'grid',
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontStyle: 'bold',
        },
      })
    }

    doc.setFontSize(8)
    doc.text(`Generado por Venematic - ${new Date().toISOString()}`, 105, doc.internal.pageSize.height - 10, {
      align: 'center',
    })

    return doc
  }
}

import nodemailer from 'nodemailer'
import type { Report } from '@/types'
import { ReportGenerator } from './report-generator'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  initialize(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
  }

  async sendReport(
    to: string,
    subject: string,
    report: Report,
    storeName: string
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized')
      return false
    }

    try {
      const pdfDoc = ReportGenerator.generateReportSummary(report, storeName)
      const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@venematic.com',
        to,
        subject,
        text: `Adjunto encontrará el reporte ${report.type} generado el ${report.startDate} - ${report.endDate}.`,
        html: `
          <div style="font-family: Montserrat, sans-serif; padding: 20px;">
            <h2 style="color: #059669;">${storeName}</h2>
            <p>Reporte ${report.type}: ${report.startDate} - ${report.endDate}</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Ventas USD</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${report.totalSalesUSD.toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Ventas BS</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">Bs.${report.totalSalesBS.toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Transacciones</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">${report.totalTransactions}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Ticket Promedio</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${report.avgTicketUSD.toFixed(2)}</td></tr>
            </table>
            <p style="color: #64748b; font-size: 12px;">Generado por Venematic</p>
          </div>
        `,
        attachments: [
          {
            filename: `reporte-${report.type}-${report.startDate}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendDailyReport(
    to: string,
    sales: any[],
    storeName: string,
    date: string
  ): Promise<boolean> {
    if (!this.transporter) return false

    try {
      const pdfDoc = ReportGenerator.generateDailyReport(sales, storeName, date)
      const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@venematic.com',
        to,
        subject: `Reporte Diario de Ventas - ${storeName} - ${date}`,
        text: `Reporte diario de ventas adjunto.`,
        attachments: [
          {
            filename: `ventas-diarias-${date}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      return true
    } catch (error) {
      console.error('Failed to send daily report:', error)
      return false
    }
  }
}

export const emailService = new EmailService()

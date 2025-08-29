import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content?: Buffer | string
    path?: string
    contentType?: string
  }>
}

export interface NotificationEmailData {
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  actionUrl?: string
  recipientName?: string
  franchiseName?: string
  data?: Record<string, any>
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isInitialized = false

  private async initializeTransporter() {
    if (this.isInitialized) return

    try {
      if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        )

        oauth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN
        })

        const accessToken = await oauth2Client.getAccessToken()

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.SMTP_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token || undefined,
          },
        })
      } else {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      }

      await this.transporter.verify()
      this.isInitialized = true
      console.log('Email service initialized successfully')
    } catch (error) {
      console.error('Error initializing email service:', error)
      throw new Error('Unable to initialize email service')
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Initializing email service...')
      await this.initializeTransporter()

      if (!this.transporter) {
        throw new Error('Email transport not initialized')
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'DrivnCook'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      }

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasText: !!mailOptions.text,
        hasHtml: !!mailOptions.html
      })

      const result = await this.transporter.sendMail(mailOptions)

      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      console.error('❌ Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendNotificationEmail(
    email: string,
    notificationData: NotificationEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { type, priority, title, message, actionUrl, recipientName, franchiseName, data } = notificationData

    const html = this.generateNotificationHtml({
      type,
      priority,
      title,
      message,
      actionUrl,
      recipientName,
      franchiseName,
      data,
    })

    const text = this.generateNotificationText({
      type,
      priority,
      title,
      message,
      actionUrl,
      recipientName,
      franchiseName,
      data,
    })

    const priorityPrefix = this.getPriorityPrefix(priority)
    const subject = `${priorityPrefix}${title} - DRIV'N COOK`

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html,
    })
  }

  private getPriorityPrefix(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'URGENT: '
      case NotificationPriority.HIGH:
        return 'IMPORTANT: '
      case NotificationPriority.MEDIUM:
        return 'NORMAL: '
      case NotificationPriority.LOW:
        return 'INFORMATION: '
      default:
        return ''
    }
  }

  private generateNotificationHtml(data: NotificationEmailData): string {
    const { type, priority, title, message, actionUrl, recipientName, franchiseName } = data

    const priorityColor = this.getPriorityColor(priority)
    const priorityLabel = this.getPriorityLabel(priority)

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
          --brand-primary: #dc2626;
          --brand-primary-dark: #b91c1c;
          --text: #0f172a;
          --muted: #64748b;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
        }
        html, body { margin: 0; padding: 0; background: var(--bg); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji'; color: var(--text); }
        .container { max-width: 640px; margin: 0 auto; padding: 24px; }
        .card { background: var(--card); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); border: 1px solid var(--border); }
        .header { background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%); padding: 28px 24px; color: white; }
        .brand { font-weight: 800; letter-spacing: 0.5px; font-size: 18px; opacity: 0.95; }
        .headline { margin-top: 6px; font-size: 14px; opacity: 0.85; }
        .content { padding: 24px; }
        .title { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }
        .meta { display: inline-flex; align-items: center; gap: 8px; background: ${priorityColor}1a; color: ${priorityColor}; border: 1px solid ${priorityColor}33; padding: 6px 10px; border-radius: 999px; font-weight: 600; font-size: 12px; }
        .paragraph { margin: 16px 0; line-height: 1.7; color: var(--muted); font-size: 14px; }
        .callout { background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: 12px; margin: 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%); color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; letter-spacing: 0.2px; }
        .btn:hover { filter: brightness(1.05); }
        .details { background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: 12px; margin-top: 20px; }
        .details h4 { margin: 0 0 8px 0; font-size: 14px; }
        .footer { padding: 18px 24px; border-top: 1px solid var(--border); color: #94a3b8; font-size: 12px; text-align: center; }
        .muted { color: var(--muted); }
        .spacer { height: 8px; }
        .link { color: var(--brand-primary); text-decoration: underline; }
    </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">DRIV'N COOK</div>
        <div class="headline">Système de gestion de franchise</div>
      </div>
      <div class="content">
        <div class="meta">${priorityLabel}</div>
        <div class="spacer"></div>
        <h1 class="title">${title}</h1>
        ${recipientName ? `<p class="paragraph">Bonjour ${recipientName},</p>` : ''}
        <p class="paragraph">${message}</p>
        ${franchiseName ? `<p class="paragraph"><strong>Franchise:</strong> ${franchiseName}</p>` : ''}
        ${actionUrl ? `<p style="margin: 18px 0;"><a href="${actionUrl}" class="btn">Voir les détails</a></p>` : ''}
        ${this.generateAdditionalDetails(data)}
        ${actionUrl ? `<p class="paragraph muted">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur:<br/><span class="link">${actionUrl}</span></p>` : ''}
      </div>
      <div class="footer">
        <div>Cet email a été envoyé automatiquement par le système DRIV'N COOK.</div>
        <div>© ${new Date().getFullYear()} DRIV'N COOK. Tous droits réservés.</div>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  private generateNotificationText(data: NotificationEmailData): string {
    const { title, message, actionUrl, recipientName, franchiseName } = data

    let text = `
=== DRIV'N COOK - Notification ===

${recipientName ? `Bonjour ${recipientName},` : 'Bonjour,'}

${title}

${message}

${franchiseName ? `Franchise: ${franchiseName}` : ''}

${actionUrl ? `Pour plus de détails, visitez: ${actionUrl}` : ''}

---
Cet email a été envoyé automatiquement par le système DRIV'N COOK.
© ${new Date().getFullYear()} DRIV'N COOK. Tous droits réservés.
    `

    return text.trim()
  }

  private getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.URGENT:
        return '#dc2626' // Rouge
      case NotificationPriority.HIGH:
        return '#ea580c' // Orange
      case NotificationPriority.MEDIUM:
        return '#2563eb' // Bleu
      case NotificationPriority.LOW:
        return '#16a34a' // Vert
      default:
        return '#6b7280' // Gris
    }
  }

  private getPriorityLabel(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'Urgent'
      case NotificationPriority.HIGH:
        return 'Important'
      case NotificationPriority.MEDIUM:
        return 'Normal'
      case NotificationPriority.LOW:
        return 'Information'
      default:
        return 'Notification'
    }
  }

  private generateAdditionalDetails(data: NotificationEmailData): string {
    if (!data.data || Object.keys(data.data).length === 0) {
      return ''
    }

    const details = Object.entries(data.data)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const label = this.formatFieldLabel(key)
        const formattedValue = this.formatFieldValue(key, value)
        return `<p><strong>${label}:</strong> ${formattedValue}</p>`
      })
      .join('')

    if (!details) return ''

    return `
      <div class="details">
        <h4>Détails supplémentaires</h4>
        ${details}
      </div>
    `
  }

  private formatFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      orderNumber: 'Numéro de commande',
      licensePlate: 'Plaque d\'immatriculation',
      invoiceNumber: 'Numéro de facture',
      amount: 'Montant',
      userName: 'Utilisateur',
      franchiseName: 'Franchise',
      productName: 'Produit',
      businessName: 'Entreprise',
      vehicleId: 'ID Véhicule',
      maintenanceDate: 'Date de maintenance',
      inspectionDate: 'Date d\'inspection',
    }

    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  private formatFieldValue(key: string, value: any): string {
    if (key === 'amount' && typeof value === 'number') {
      return `${value.toFixed(2)}€`
    }

    if (key.includes('Date') && value) {
      const date = new Date(value)
      return date.toLocaleDateString('fr-FR')
    }

    return String(value)
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<{
    success: boolean
    results: Array<{ success: boolean; messageId?: string; error?: string }>
    successCount: number
    errorCount: number
  }> {
    const results = await Promise.all(
      emails.map(email => this.sendEmail(email))
    )

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return {
      success: errorCount === 0,
      results,
      successCount,
      errorCount,
    }
  }

  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTransporter()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de configuration',
      }
    }
  }
}

export const emailService = new EmailService()
export default emailService

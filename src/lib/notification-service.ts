import { emailService, NotificationEmailData } from './email-service'
import { prisma } from '@/lib/prisma'
import { Notification as PrismaNotification, $Enums as PrismaEnums } from '@prisma/client'
import {
  NotificationData,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationCreateRequest,
  NotificationUpdateRequest,
  NotificationFilters,
  NotificationResponse
} from '@/types/notifications'

export interface EmailNotificationConfig {
  sendEmail: boolean
  emailRecipients?: string[]
  includeDefaultRecipients?: boolean
}

export interface UserEmailInfo {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'FRANCHISEE'
  franchiseId?: string
}

interface NotificationChannel {
  send(notification: NotificationData, config?: any, userEmailInfo?: UserEmailInfo): Promise<{ success: boolean; error?: string }>
}

class EmailChannel implements NotificationChannel {
  constructor(private service: NotificationService) {}

  async send(notification: NotificationData, config?: EmailNotificationConfig, userEmailInfo?: UserEmailInfo): Promise<{ success: boolean; error?: string }> {
    const emailInfo = userEmailInfo || await this.service.getUserEmailInfo(notification)
    const finalConfig = config || this.service.getEmailConfig(notification.type)
    
    if (!finalConfig.sendEmail) {
      return { success: true }
    }

    if (notification.targetRole === 'FRANCHISEE' && !emailInfo?.email && !finalConfig.emailRecipients?.length) {
      console.warn('Notification franchisé sans email destinataire:', {
        notificationId: notification.id,
        franchiseId: notification.franchiseId,
        targetUserId: notification.targetUserId
      })
      return { success: false, error: 'Email du franchisé non trouvé' }
    }

    const recipients = await this.service.getEmailRecipients(notification, emailInfo, finalConfig)
    
    if (recipients.length === 0) {
      return { success: false, error: 'Aucun destinataire d\'email trouvé' }
    }

    console.log('Envoi email notification:', {
      type: notification.type,
      targetRole: notification.targetRole,
      recipients: recipients,
      emailInfo: emailInfo ? { email: emailInfo.email, name: emailInfo.name } : 'none'
    })

    const recipientName = emailInfo?.name || (notification.targetRole === 'FRANCHISEE' ? 'Franchisé' : 'Administrateur')
    const subject = `${notification.title} - DRIV'N COOK`
    const introMessage = notification.targetRole === 'FRANCHISEE' 
      ? `Bonjour ${recipientName},`
      : `Bonjour,`
    
    const ctaText = notification.targetRole === 'FRANCHISEE' 
      ? 'Accéder à mon espace franchisé'
      : 'Accéder au tableau de bord admin'

    const simpleHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${notification.title}</title>
  <style>
    :root { --brand1:#be123c; --brand2:#dc2626; --brand3:#ef4444; --text:#0f172a; --muted:#475569; --bg:#f8fafc; --card:#ffffff; --border:#e2e8f0; }
    html, body { margin:0; padding:0; background:var(--bg); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; color:var(--text); }
    .container{ max-width:680px; margin:0 auto; padding:24px; }
    .card{ background:var(--card); border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.06); border:1px solid var(--border); }
    .header{ background:linear-gradient(135deg, var(--brand1) 0%, var(--brand2) 50%, var(--brand3) 100%); padding:28px 24px; color:#fff; }
    .brand{ font-weight:800; letter-spacing:0.5px; font-size:18px; opacity:0.95; }
    .headline{ margin-top:6px; font-size:13px; opacity:0.9; }
    .content{ padding:26px; }
    .title{ font-size:20px; font-weight:800; margin:0 0 10px 0; }
    .paragraph{ margin:12px 0; line-height:1.7; color:var(--muted); font-size:14px; white-space: pre-line; }
    .cta{ display:inline-block; background:linear-gradient(135deg, var(--brand1) 0%, var(--brand2) 50%, var(--brand3) 100%); color:#fff; text-decoration:none; padding:12px 18px; border-radius:12px; font-weight:800; }
    .footer{ padding:18px 24px; border-top:1px solid var(--border); color:#94a3b8; font-size:12px; text-align:center; }
    .link { color: var(--brand2); text-decoration: underline; }
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
          <p class="paragraph">${introMessage}</p>
          <h1 class="title">${notification.title}</h1>
          <p class="paragraph">${notification.message}</p>
          ${notification.actionUrl ? `<p style="margin:18px 0;"><a href="${notification.actionUrl}" class="cta">${ctaText}</a></p>` : ''}
          ${notification.actionUrl ? `<p class="paragraph">Si le bouton ne fonctionne pas, copiez ce lien :<br/><span class="link">${notification.actionUrl}</span></p>` : ''}
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

    const results = await Promise.all(
      recipients.map(email => emailService.sendEmail({
        to: email,
        subject,
        html: simpleHtml,
        text: `${notification.title}\n\n${notification.message}${notification.actionUrl ? `\n\nAccédez à votre espace: ${notification.actionUrl}` : ''}`
      }))
    )

    const failures = results.filter(r => !r.success)
    if (failures.length === 0) {
      return { success: true }
    }
    if (failures.length < results.length) {
      return { success: true, error: `${failures.length}/${results.length} emails ont échoué` }
    }
    return { success: false, error: failures[0]?.error || 'Echec envoi' }
  }
}

export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map()
  private defaultAdminEmails = [
    process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@drivncook.com'
  ].filter(Boolean)

  private defaultEmailConfig: Record<NotificationType, EmailNotificationConfig> = {
    [NotificationType.SYSTEM]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.ORDER_CREATED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.ORDER_CONFIRMED]: { sendEmail: true },
    [NotificationType.ORDER_SHIPPED]: { sendEmail: true },
    [NotificationType.ORDER_DELIVERED]: { sendEmail: true },
    [NotificationType.ORDER_CANCELLED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.ORDER_OVERDUE]: { sendEmail: true, includeDefaultRecipients: true },
    
    [NotificationType.VEHICLE_MAINTENANCE_DUE]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.VEHICLE_INSPECTION_DUE]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.VEHICLE_ASSIGNED]: { sendEmail: true },
    [NotificationType.VEHICLE_BREAKDOWN]: { sendEmail: true, includeDefaultRecipients: true },
    
    [NotificationType.INVOICE_GENERATED]: { sendEmail: true },
    [NotificationType.INVOICE_OVERDUE]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.PAYMENT_RECEIVED]: { sendEmail: true },
    [NotificationType.PAYMENT_FAILED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.ROYALTY_PROCESSED]: { sendEmail: true, includeDefaultRecipients: true },
    
    [NotificationType.FRANCHISE_APPROVED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.FRANCHISE_SUSPENDED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.FRANCHISE_TERMINATED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.FRANCHISE_PERFORMANCE_ALERT]: { sendEmail: true, includeDefaultRecipients: true },
    
    [NotificationType.STOCK_LOW]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.STOCK_OUT]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.STOCK_RECEIVED]: { sendEmail: false },
    
    [NotificationType.USER_REGISTERED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.USER_PROFILE_UPDATED]: { sendEmail: false },
    [NotificationType.PASSWORD_CHANGED]: { sendEmail: true },
    
    [NotificationType.REPORT_GENERATED]: { sendEmail: true },
    [NotificationType.SALES_TARGET_MISSED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.SALES_TARGET_ACHIEVED]: { sendEmail: true, includeDefaultRecipients: true },
    [NotificationType.DOCUMENT_TRANSMITTED]: { sendEmail: true, includeDefaultRecipients: true },
  }

  constructor() {
    this.channels.set('email', new EmailChannel(this))
  }

  private getApiBase(): string {
    if (typeof window !== 'undefined') return '/api'
    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL
    if (origin) {
      const normalized = origin.startsWith('http') ? origin : `https://${origin}`
      return `${normalized}/api`
    }
    const host = process.env.HOST || 'localhost'
    const port = process.env.PORT || '3000'
    return `http://${host}:${port}/api`
  }

  /**
   * Crée une notification et envoie automatiquement des emails
   */
  async createNotification(
    notificationRequest: NotificationCreateRequest,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ): Promise<{
    success: boolean
    data?: { notification: NotificationData }
    error?: string
    channelResults?: Record<string, { success: boolean; error?: string }>
  }> {
    try {
      let enrichedData: Record<string, any> = { ...(notificationRequest.data || {}) }

      if (userEmailInfo?.name && !enrichedData.userName) {
        enrichedData.userName = userEmailInfo.name
      }

      if (notificationRequest.franchiseId && (!enrichedData.franchiseName || !enrichedData.userName)) {
        try {
          const fr = await prisma.franchise.findUnique({
            where: { id: notificationRequest.franchiseId },
            select: { businessName: true, user: { select: { firstName: true, lastName: true } } }
          })
          if (fr) {
            if (!enrichedData.franchiseName) enrichedData.franchiseName = fr.businessName
            if (!enrichedData.userName && fr.user) enrichedData.userName = `${fr.user.firstName} ${fr.user.lastName}`
          }
        } catch {}
      }

      const created = await prisma.notification.create({
        data: {
          type: notificationRequest.type as any,
          priority: (notificationRequest.priority || NotificationPriority.MEDIUM) as any,
          status: NotificationStatus.UNREAD as any,
          title: notificationRequest.title,
          message: notificationRequest.message,
          data: Object.keys(enrichedData).length > 0 ? JSON.stringify(enrichedData) : null,
          targetUserId: notificationRequest.targetUserId,
          targetRole: notificationRequest.targetRole as any,
          franchiseId: notificationRequest.franchiseId,
          relatedEntityId: notificationRequest.relatedEntityId,
          relatedEntityType: notificationRequest.relatedEntityType,
          actionUrl: notificationRequest.actionUrl,
          expiresAt: notificationRequest.expiresAt
        }
      })

      const notification = this.convertPrismaToNotificationData(created)

      let finalUserEmailInfo = userEmailInfo
      if (!finalUserEmailInfo && (notification.targetUserId || notification.franchiseId)) {
        finalUserEmailInfo = await this.getUserEmailInfo(notification)
      }

      const channelResults: Record<string, { success: boolean; error?: string }> = {}
      
      for (const [channelName, channel] of this.channels) {
        try {
          const result = await channel.send(notification, emailConfig, finalUserEmailInfo)
          channelResults[channelName] = result
        } catch (error) {
          channelResults[channelName] = {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          }
        }
      }

      return {
        success: true,
        data: { notification },
        channelResults
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la notification'
      }
    }
  }

  /**
   * API: Crée une notification admin
   */
  async createAdminNotification(notification: NotificationCreateRequest): Promise<{ success: boolean; data?: { notification: NotificationData }; error?: string }> {
    const result = await this.createNotification({
      ...notification,
      targetRole: 'ADMIN'
    })
    
    return {
      success: result.success,
      data: result.data,
      error: result.error
    }
  }

  /**
   * API: Crée une notification franchise
   */
  async createFranchiseNotification(notification: NotificationCreateRequest): Promise<{ success: boolean; data?: { notification: NotificationData }; error?: string }> {
    const result = await this.createNotification({
      ...notification,
      targetRole: 'FRANCHISEE'
    })
    
    return {
      success: result.success,
      data: result.data,
      error: result.error
    }
  }

  /**
   * API: Récupère les notifications admin
   */
  async getAdminNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type.join(','))
    if (filters?.priority) params.append('priority', filters.priority.join(','))
    if (filters?.status) params.append('status', filters.status.join(','))
    if (filters?.franchiseId) params.append('franchiseId', filters.franchiseId)
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const response = await fetch(`${this.getApiBase()}/admin/notifications?${params}`, { credentials: 'include', cache: 'no-store' })
    return response.json()
  }

  /**
   * API: Récupère les notifications franchise
   */
  async getFranchiseNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type.join(','))
    if (filters?.priority) params.append('priority', filters.priority.join(','))
    if (filters?.status) params.append('status', filters.status.join(','))
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const response = await fetch(`${this.getApiBase()}/franchise/notifications?${params}`, { credentials: 'include', cache: 'no-store' })
    return response.json()
  }

  /**
   * API: Met à jour les notifications admin
   */
  async updateAdminNotifications(ids: string[], updates: NotificationUpdateRequest): Promise<{ success: boolean; data?: { updatedCount: number; updatedIds: string[] }; error?: string }> {
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))

    const response = await fetch(`${this.getApiBase()}/admin/notifications?${params}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      credentials: 'include'
    })
    return response.json()
  }

  /**
   * API: Met à jour les notifications franchise
   */
  async updateFranchiseNotifications(ids: string[], updates: NotificationUpdateRequest): Promise<{ success: boolean; data?: { updatedCount: number; updatedIds: string[] }; error?: string }> {
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))

    const response = await fetch(`${this.getApiBase()}/franchise/notifications?${params}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      credentials: 'include'
    })
    return response.json()
  }

  /**
   * API: Marque comme lu
   */
  async markAsRead(ids: string[], userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
    const updates = { status: NotificationStatus.READ, readAt: new Date() }
    
    if (userRole === 'ADMIN') {
      return this.updateAdminNotifications(ids, updates)
    } else {
      return this.updateFranchiseNotifications(ids, updates)
    }
  }

  /**
   * API: Marque tout comme lu
   */
  async markAllAsRead(userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
    try {
      const filters = { status: [NotificationStatus.UNREAD], limit: 1000 }
      const response = userRole === 'ADMIN' 
        ? await this.getAdminNotifications(filters)
        : await this.getFranchiseNotifications(filters)

      if (!response.success || !response.data) {
        return { success: false, error: 'Failed to fetch notifications' }
      }

      const unreadIds = response.data.notifications.map(n => n.id)
      
      if (unreadIds.length === 0) {
        return { success: true }
      }

      return this.markAsRead(unreadIds, userRole)
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Convertit les notifications pour le format des composants UI
   */
  convertToComponentFormat(apiNotifications: NotificationData[]): any[] {
    return apiNotifications.map(notification => ({
      id: parseInt((notification.id || '').toString().replace(/\D/g, '') || '0', 10),
      user: this.getNotificationUser(notification),
      action: this.getNotificationAction(notification),
      target: this.getNotificationTarget(notification),
      timestamp: this.formatTimestamp((notification as any).createdAt),
      unread: notification.status === NotificationStatus.UNREAD
    }))
  }

  /**
   * Récupère les informations email d'un utilisateur depuis une notification
   */
  async getUserEmailInfo(notification: NotificationData): Promise<UserEmailInfo | undefined> {
    if (notification.targetUserId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: notification.targetUserId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            franchiseId: true
          }
        })

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role as 'ADMIN' | 'FRANCHISEE',
            franchiseId: user.franchiseId || undefined
          }
        }
      } catch {}
    }

    if (notification.franchiseId) {
      try {
        const franchise = await prisma.franchise.findUnique({
          where: { id: notification.franchiseId },
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                franchiseId: true
              }
            }
          }
        })

        if (franchise?.user) {
          return {
            id: franchise.user.id,
            email: franchise.user.email,
            name: `${franchise.user.firstName} ${franchise.user.lastName}`,
            role: franchise.user.role as 'ADMIN' | 'FRANCHISEE',
            franchiseId: franchise.user.franchiseId || undefined
          }
        }
      } catch {}
    }

    return undefined
  }

  /**
   * Détermine les destinataires email
   */
  async getEmailRecipients(
    notification: NotificationData,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ): Promise<string[]> {
    const recipients: Set<string> = new Set()

    if (emailConfig?.emailRecipients) {
      emailConfig.emailRecipients.forEach(email => recipients.add(email))
    }

    if (userEmailInfo?.email) {
      recipients.add(userEmailInfo.email)
    }

    if (notification.targetRole === 'ADMIN') {
      this.defaultAdminEmails.forEach(email => recipients.add(email))
    }
    // Si la notification vise un franchisé, ne jamais ajouter les emails admin par défaut
    // Cela évite que les emails FRANCHISEE arrivent chez l'admin par défaut
    
    const additionalEmails = await this.getAdditionalEmailsByType(notification)
    additionalEmails.forEach(email => recipients.add(email))

    return Array.from(recipients).filter(email => this.isValidEmail(email))
  }

  /**
   * Configuration email pour un type
   */
  getEmailConfig(type: NotificationType): EmailNotificationConfig {
    return this.defaultEmailConfig[type] || { sendEmail: false }
  }

  /**
   * Met à jour la configuration email
   */
  setEmailConfig(type: NotificationType, config: EmailNotificationConfig): void {
    this.defaultEmailConfig[type] = config
  }

  /**
   * Ajoute un nouveau canal de notification
   */
  addChannel(name: string, channel: NotificationChannel): void {
    this.channels.set(name, channel)
  }

  /**
   * Supprime un canal de notification
   */
  removeChannel(name: string): void {
    this.channels.delete(name)
  }

  private convertPrismaToNotificationData(prismaNotification: PrismaNotification): NotificationData {
    return {
      id: prismaNotification.id,
      type: prismaNotification.type as unknown as NotificationType,
      priority: prismaNotification.priority as unknown as NotificationPriority,
      status: prismaNotification.status as unknown as NotificationStatus,
      title: prismaNotification.title,
      message: prismaNotification.message,
      data: prismaNotification.data ? JSON.parse(prismaNotification.data) : undefined,
      createdAt: prismaNotification.createdAt,
      readAt: prismaNotification.readAt || undefined,
      targetUserId: prismaNotification.targetUserId || undefined,
      targetRole: prismaNotification.targetRole as 'ADMIN' | 'FRANCHISEE',
      franchiseId: prismaNotification.franchiseId || undefined,
      relatedEntityId: prismaNotification.relatedEntityId || undefined,
      relatedEntityType: prismaNotification.relatedEntityType || undefined,
      actionUrl: prismaNotification.actionUrl || undefined,
      expiresAt: prismaNotification.expiresAt || undefined
    }
  }

  private getNotificationUser(notification: NotificationData): string {
    if (notification.data?.userName) return notification.data.userName
    if (notification.data?.franchiseName) return notification.data.franchiseName
    if ((notification as any).targetRole === 'FRANCHISEE') return 'Franchise'
    return 'Admin'
  }

  private getNotificationAction(notification: NotificationData): string {
    if (notification.type === 'PAYMENT_RECEIVED') {
      if (typeof notification.data?.entityNumber === 'string' && notification.data.entityNumber.startsWith('ENTRY_FEE')) {
        return 'a payé le'
      }
      return 'a reçu le paiement de'
    }
    const actionMap: Record<string, string> = {
      'ORDER_CREATED': 'a créé la commande',
      'ORDER_CONFIRMED': 'a confirmé la commande',
      'ORDER_SHIPPED': 'a expédié la commande',
      'ORDER_DELIVERED': 'a livré la commande',
      'ORDER_CANCELLED': 'a annulé la commande',
      'ORDER_OVERDUE': 'a une commande en retard',
      'VEHICLE_MAINTENANCE_DUE': 'doit programmer la maintenance de',
      'VEHICLE_INSPECTION_DUE': 'doit programmer l\'inspection de',
      'VEHICLE_ASSIGNED': 'a été assigné le véhicule',
      'VEHICLE_BREAKDOWN': 'signale une panne sur',
      'INVOICE_GENERATED': 'a reçu la facture',
      'INVOICE_OVERDUE': 'a une facture en retard',
      'PAYMENT_FAILED': 'a un échec de paiement pour',
      'FRANCHISE_APPROVED': 'a été approuvé pour',
      'STOCK_LOW': 'a un stock faible de',
      'SALES_TARGET_ACHIEVED': 'a atteint l\'objectif de',
      'SALES_TARGET_MISSED': 'n\'a pas atteint l\'objectif de',
      'USER_REGISTERED': 's\'est inscrit pour',
      'SYSTEM': 'informe sur'
    }
    return actionMap[notification.type] || 'a une notification concernant'
  }

  private getNotificationTarget(notification: NotificationData): string {
    if (notification.type === 'PAYMENT_RECEIVED') {
      if (typeof notification.data?.entityNumber === 'string' && notification.data.entityNumber.startsWith('ENTRY_FEE')) {
        return "Droit d'entrée"
      }
    }
    if (notification.data?.orderNumber) return notification.data.orderNumber
    if (notification.data?.licensePlate) return notification.data.licensePlate
    if (notification.data?.invoiceNumber) return notification.data.invoiceNumber
    if (notification.data?.productName) return notification.data.productName
    if (notification.data?.franchiseName) return notification.data.franchiseName
    if (notification.data?.businessName) return notification.data.businessName
    return notification.title
  }

  private formatTimestamp(rawDate: unknown): string {
    const date = rawDate instanceof Date ? rawDate : new Date(String(rawDate))
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `${diffHours} heure${diffHours > 1 ? 's' : ''}`
    if (diffDays < 7) return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
    return date.toLocaleDateString('fr-FR')
  }

  private async getAdditionalEmailsByType(notification: NotificationData): Promise<string[]> {
    // Ne jamais ajouter d'emails supplémentaires pour les notifications destinées aux franchisés
    if (notification.targetRole === 'FRANCHISEE') {
      return []
    }

    const emails: string[] = []

    // Pour les notifications ADMIN, on peut ajouter des emails supplémentaires selon le type
    switch (notification.type) {
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_OVERDUE:
        emails.push(...await this.getAdminEmails())
        break

      case NotificationType.VEHICLE_BREAKDOWN:
      case NotificationType.VEHICLE_MAINTENANCE_DUE:
        emails.push(...await this.getAdminEmails())
        break

      case NotificationType.INVOICE_OVERDUE:
      case NotificationType.PAYMENT_FAILED:
        emails.push(...await this.getAdminEmails())
        break

      default:
        break
    }

    return emails
  }

  private async getAdminEmails(): Promise<string[]> {
    try {
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true
        },
        select: { email: true }
      })

      return admins.map(user => user.email).filter(Boolean)
    } catch (error) {
      console.error('Erreur lors de la récupération des emails administrateurs:', error)
      return []
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

export const notificationService = new NotificationService()

export const NotificationAPI = {
  getAdminNotifications: (filters?: NotificationFilters) => notificationService.getAdminNotifications(filters),
  createAdminNotification: (notification: NotificationCreateRequest) => notificationService.createAdminNotification(notification),
  updateAdminNotifications: (ids: string[], updates: NotificationUpdateRequest) => notificationService.updateAdminNotifications(ids, updates),
  getFranchiseNotifications: (filters?: NotificationFilters) => notificationService.getFranchiseNotifications(filters),
  createFranchiseNotification: (notification: NotificationCreateRequest) => notificationService.createFranchiseNotification(notification),
  updateFranchiseNotifications: (ids: string[], updates: NotificationUpdateRequest) => notificationService.updateFranchiseNotifications(ids, updates),
  markAsRead: (ids: string[], userRole: 'ADMIN' | 'FRANCHISEE') => notificationService.markAsRead(ids, userRole),
  markAllAsRead: (userRole: 'ADMIN' | 'FRANCHISEE') => notificationService.markAllAsRead(userRole),
  convertToComponentFormat: (apiNotifications: NotificationData[]) => notificationService.convertToComponentFormat(apiNotifications)
}

export const notificationEmailService = {
  createNotificationWithEmail: (
    notificationRequest: NotificationCreateRequest,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ) => notificationService.createNotification(notificationRequest, userEmailInfo, emailConfig),
  
  sendSimpleNotificationEmailFor: async (
    notification: NotificationData,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ) => {
    const emailChannel = notificationService['channels'].get('email') as any
    if (emailChannel) {
      return await emailChannel.send(notification, emailConfig, userEmailInfo)
    }
    return { success: false, error: 'Email channel not found' }
  },
  
  setEmailConfig: (type: NotificationType, config: EmailNotificationConfig) => 
    notificationService.setEmailConfig(type, config),
    
  getEmailConfig: (type: NotificationType) => 
    notificationService.getEmailConfig(type),
    
  testNotificationEmail: async (email: string, type: NotificationType = NotificationType.SYSTEM) => {
    const testNotification: NotificationData = {
      id: 'test',
      type,
      priority: NotificationPriority.LOW,
      status: NotificationStatus.UNREAD,
      title: 'Email de test - DRIV\'N COOK',
      message: "Ceci est un email de test pour vérifier la configuration de votre service d'email.",
      createdAt: new Date(),
      targetRole: 'ADMIN'
    }
    
    const emailChannel = notificationService['channels'].get('email') as any
    if (emailChannel) {
      return await emailChannel.send(testNotification, { sendEmail: true, emailRecipients: [email] }, undefined)
    }
    return { success: false, error: 'Email channel not found' }
  }
}

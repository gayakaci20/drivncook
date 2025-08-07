import { emailService, NotificationEmailData } from './email-service'
import { NotificationAPI } from './notification-api'
import { prisma } from '@/lib/prisma'
import { 
  NotificationData, 
  NotificationType, 
  NotificationPriority,
  NotificationCreateRequest 
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

class NotificationEmailService {
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
  }

  private defaultAdminEmails = [
    process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@drivncook.com'
  ].filter(Boolean)

  /**
   * Crée une notification et envoie un email si configuré
   */
  async createNotificationWithEmail(
    notificationRequest: NotificationCreateRequest,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ): Promise<{
    notificationResult: { success: boolean; data?: { notification: NotificationData }; error?: string }
    emailResult?: { success: boolean; messageId?: string; error?: string }
  }> {
    const notificationResult = notificationRequest.targetRole === 'ADMIN'
      ? await NotificationAPI.createAdminNotification(notificationRequest)
      : await NotificationAPI.createFranchiseNotification(notificationRequest)

    const finalEmailConfig = emailConfig || this.defaultEmailConfig[notificationRequest.type] || { sendEmail: false }

    let emailResult
    if (finalEmailConfig.sendEmail && notificationResult.success && notificationResult.data) {
      emailResult = await this.sendNotificationEmail(
        notificationResult.data.notification,
        userEmailInfo,
        finalEmailConfig
      )
    }

    return {
      notificationResult,
      emailResult,
    }
  }

  /**
   * Envoie un email pour une notification existante
   */
  async sendNotificationEmail(
    notification: NotificationData,
    userEmailInfo?: UserEmailInfo,
    emailConfig?: EmailNotificationConfig
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const finalEmailConfig = emailConfig || this.defaultEmailConfig[notification.type] || { sendEmail: false }

      if (!finalEmailConfig.sendEmail) {
        return { success: true }
      }

      const recipients = await this.getEmailRecipients(notification, userEmailInfo, finalEmailConfig)

      if (recipients.length === 0) {
        return { success: false, error: 'Aucun destinataire d\'email trouvé' }
      }

      const enhancedTitle = `${notification.title}`
      const enhancedMessage = `${notification.message}`

      const emailData: NotificationEmailData = {
        type: notification.type,
        priority: notification.priority,
        title: enhancedTitle,
        message: enhancedMessage,
        actionUrl: notification.actionUrl,
        recipientName: userEmailInfo?.name,
        franchiseName: await this.getFranchiseName(notification.franchiseId),
        data: {
          preheader: `${notification.title} • DRIV'N COOK`,
          ...notification.data,
        },
      }

      const emailPromises = recipients.map(email =>
        emailService.sendNotificationEmail(email, emailData)
      )

      const results = await Promise.all(emailPromises)
      const failures = results.filter(r => !r.success)

      if (failures.length === 0) {
        return {
          success: true,
          messageId: results[0]?.messageId,
        }
      } else if (failures.length < results.length) {
        return {
          success: true,
          messageId: results.find(r => r.success)?.messageId,
          error: `${failures.length}/${results.length} emails ont échoué`,
        }
      } else {
        return {
          success: false,
          error: `Tous les emails ont échoué: ${failures[0]?.error}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Détermine les destinataires de l'email
   */
  private async getEmailRecipients(
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

    if (emailConfig?.includeDefaultRecipients) {
      this.defaultAdminEmails.forEach(email => recipients.add(email))
    }
    
    const additionalEmails = await this.getAdditionalEmailsByType(notification)
    additionalEmails.forEach(email => recipients.add(email))

    return Array.from(recipients).filter(email => this.isValidEmail(email))
  }

  /**
   * Récupère des emails supplémentaires selon le type de notification
   */
  private async getAdditionalEmailsByType(notification: NotificationData): Promise<string[]> {
    const emails: string[] = []


    switch (notification.type) {
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_OVERDUE:
        emails.push(...await this.getOrderManagerEmails(notification.franchiseId))
        break

      case NotificationType.VEHICLE_BREAKDOWN:
      case NotificationType.VEHICLE_MAINTENANCE_DUE:
        emails.push(...await this.getFleetManagerEmails(notification.franchiseId))
        break

      case NotificationType.INVOICE_OVERDUE:
      case NotificationType.PAYMENT_FAILED:
        emails.push(...await this.getAccountingEmails())
        break

      default:
        break
    }

    return emails
  }

  /**
   * Récupère le nom de la franchise
   */
  private async getFranchiseName(franchiseId?: string): Promise<string | undefined> {
    if (!franchiseId) return undefined

    try {
      const franchise = await prisma.franchise.findUnique({
        where: { id: franchiseId },
        select: { businessName: true }
      })
      
      return franchise?.businessName
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de la franchise:', error)
      return `Franchise ${franchiseId}` // Fallback
    }
  }

  /**
   * Valide un email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Met à jour la configuration email pour un type de notification
   */
  setEmailConfig(type: NotificationType, config: EmailNotificationConfig): void {
    this.defaultEmailConfig[type] = config
  }

  /**
   * Récupère la configuration email pour un type de notification
   */
  getEmailConfig(type: NotificationType): EmailNotificationConfig {
    return this.defaultEmailConfig[type] || { sendEmail: false }
  }

  /**
   * Teste l'envoi d'un email de notification
   */
  async testNotificationEmail(
    email: string,
    type: NotificationType = NotificationType.SYSTEM
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const testEmailData: NotificationEmailData = {
      type,
      priority: NotificationPriority.LOW,
      title: 'Email de test - DRIV&apos;N COOK',
      message: "Ceci est un email de test pour vérifier la configuration de votre service d'email.",
      recipientName: 'Utilisateur Test',
      data: {
        testMessage: 'Configuration réussie !',
        timestamp: new Date().toISOString(),
      },
    }

    return await emailService.sendNotificationEmail(email, testEmailData)
  }

  /**
   * Envoie une notification d'urgence à tous les administrateurs
   */
  async sendUrgentNotificationToAdmins(
    title: string,
    message: string,
    actionUrl?: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; results: any[] }> {
    const emailData: NotificationEmailData = {
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.URGENT,
      title,
      message,
      actionUrl,
      data: additionalData,
    }

    const emailPromises = this.defaultAdminEmails.map(email =>
      emailService.sendNotificationEmail(email, emailData)
    )

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    return {
      success: successCount > 0,
      results,
    }
  }

  /**
   * Récupère les emails des administrateurs pour tous les types de gestion
   */
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

  /**
   * Récupère les emails des responsables de commandes (tous les admins)
   */
  private async getOrderManagerEmails(franchiseId?: string): Promise<string[]> {
    return await this.getAdminEmails()
  }

  /**
   * Récupère les emails des responsables de flotte (tous les admins)
   */
  private async getFleetManagerEmails(franchiseId?: string): Promise<string[]> {
    return await this.getAdminEmails()
  }

  /**
   * Récupère les emails du service comptabilité (tous les admins)
   */
  private async getAccountingEmails(): Promise<string[]> {
    return await this.getAdminEmails()
  }
}

export const notificationEmailService = new NotificationEmailService()
export default notificationEmailService

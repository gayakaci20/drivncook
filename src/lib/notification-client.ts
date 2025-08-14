import { NotificationData, NotificationFilters, NotificationResponse, NotificationStatus } from '@/types/notifications'

export class NotificationAPI {
  private static getApiBase(): string {
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

  static async getAdminNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
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

  static async getFranchiseNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
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

  static async markAsRead(ids: string[], userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
    const updates = { status: NotificationStatus.READ, readAt: new Date() }
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))
    const url = userRole === 'ADMIN' ? `${this.getApiBase()}/admin/notifications?${params}` : `${this.getApiBase()}/franchise/notifications?${params}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      credentials: 'include'
    })
    return response.json()
  }

  static async markAllAsRead(userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
    try {
      const filters = { status: [NotificationStatus.UNREAD], limit: 1000 }
      const response = userRole === 'ADMIN' 
        ? await this.getAdminNotifications(filters)
        : await this.getFranchiseNotifications(filters)

      if (!response.success || !response.data) return { success: false, error: 'Failed to fetch notifications' }
      const unreadIds = response.data.notifications.map(n => n.id)
      if (unreadIds.length === 0) return { success: true }
      return this.markAsRead(unreadIds, userRole)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static convertToComponentFormat(apiNotifications: NotificationData[]): any[] {
    return apiNotifications.map(notification => ({
      id: parseInt((notification.id || '').toString().replace(/\D/g, '') || '0', 10),
      user: this.getNotificationUser(notification),
      action: this.getNotificationAction(notification),
      target: this.getNotificationTarget(notification),
      timestamp: this.formatTimestamp((notification as any).createdAt),
      unread: notification.status === NotificationStatus.UNREAD
    }))
  }

  private static getNotificationUser(notification: NotificationData): string {
    if (notification.data?.userName) return notification.data.userName
    if (notification.data?.franchiseName) return notification.data.franchiseName
    if ((notification as any).targetRole === 'FRANCHISEE') return 'Franchise'
    return 'Admin'
  }

  private static getNotificationAction(notification: NotificationData): string {
    if ((notification as any).type === 'PAYMENT_RECEIVED') {
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
    return actionMap[(notification as any).type] || 'a une notification concernant'
  }

  private static getNotificationTarget(notification: NotificationData): string {
    if ((notification as any).type === 'PAYMENT_RECEIVED') {
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

  private static formatTimestamp(rawDate: unknown): string {
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
}

export default NotificationAPI



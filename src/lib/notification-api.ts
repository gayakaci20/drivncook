import { NotificationData, NotificationFilters, NotificationResponse, NotificationCreateRequest, NotificationUpdateRequest, NotificationStatus } from '@/types/notifications'

export class NotificationAPI {
  private static baseUrl = '/api'

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

    const response = await fetch(`${this.baseUrl}/admin/notifications?${params}`)
    return response.json()
  }

  static async createAdminNotification(notification: NotificationCreateRequest): Promise<{ success: boolean; data?: { notification: NotificationData }; error?: string }> {
    const response = await fetch(`${this.baseUrl}/admin/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
    return response.json()
  }

  static async updateAdminNotifications(ids: string[], updates: NotificationUpdateRequest): Promise<{ success: boolean; data?: { updatedCount: number; updatedIds: string[] }; error?: string }> {
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))

    const response = await fetch(`${this.baseUrl}/admin/notifications?${params}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
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

    const response = await fetch(`${this.baseUrl}/franchise/notifications?${params}`)
    return response.json()
  }

  static async createFranchiseNotification(notification: NotificationCreateRequest): Promise<{ success: boolean; data?: { notification: NotificationData }; error?: string }> {
    const response = await fetch(`${this.baseUrl}/franchise/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
    return response.json()
  }

  static async updateFranchiseNotifications(ids: string[], updates: NotificationUpdateRequest): Promise<{ success: boolean; data?: { updatedCount: number; updatedIds: string[] }; error?: string }> {
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))

    const response = await fetch(`${this.baseUrl}/franchise/notifications?${params}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return response.json()
  }

  static async markAsRead(ids: string[], userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
    const updates = { status: NotificationStatus.READ, readAt: new Date() }
    
    if (userRole === 'ADMIN') {
      return this.updateAdminNotifications(ids, updates)
    } else {
      return this.updateFranchiseNotifications(ids, updates)
    }
  }

  static async markAllAsRead(userRole: 'ADMIN' | 'FRANCHISEE'): Promise<{ success: boolean; error?: string }> {
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

  static convertToComponentFormat(apiNotifications: NotificationData[]): any[] {
    return apiNotifications.map(notification => ({
      id: parseInt(notification.id.replace(/\D/g, '') || '0'),
      user: this.getNotificationUser(notification),
      action: this.getNotificationAction(notification),
      target: this.getNotificationTarget(notification),
      timestamp: this.formatTimestamp(notification.createdAt),
      unread: notification.status === NotificationStatus.UNREAD
    }))
  }

  private static getNotificationUser(notification: NotificationData): string {
    if (notification.data?.userName) return notification.data.userName
    if (notification.data?.franchiseName) return notification.data.franchiseName
    return 'Système'
  }

  private static getNotificationAction(notification: NotificationData): string {
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
      'PAYMENT_RECEIVED': 'a reçu le paiement de',
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

  private static getNotificationTarget(notification: NotificationData): string {
    if (notification.data?.orderNumber) return notification.data.orderNumber
    if (notification.data?.licensePlate) return notification.data.licensePlate
    if (notification.data?.invoiceNumber) return notification.data.invoiceNumber
    if (notification.data?.productName) return notification.data.productName
    if (notification.data?.businessName) return notification.data.businessName
    return notification.title
  }

  private static formatTimestamp(date: Date): string {
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

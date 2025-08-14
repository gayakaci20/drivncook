export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_OVERDUE = 'ORDER_OVERDUE',
  
  VEHICLE_MAINTENANCE_DUE = 'VEHICLE_MAINTENANCE_DUE',
  VEHICLE_INSPECTION_DUE = 'VEHICLE_INSPECTION_DUE',
  VEHICLE_ASSIGNED = 'VEHICLE_ASSIGNED',
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',
  
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ROYALTY_PROCESSED = 'ROYALTY_PROCESSED',
  
  FRANCHISE_APPROVED = 'FRANCHISE_APPROVED',
  FRANCHISE_SUSPENDED = 'FRANCHISE_SUSPENDED',
  FRANCHISE_TERMINATED = 'FRANCHISE_TERMINATED',
  FRANCHISE_PERFORMANCE_ALERT = 'FRANCHISE_PERFORMANCE_ALERT',
  
  STOCK_LOW = 'STOCK_LOW',
  STOCK_OUT = 'STOCK_OUT',
  STOCK_RECEIVED = 'STOCK_RECEIVED',
  
  USER_REGISTERED = 'USER_REGISTERED',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  REPORT_GENERATED = 'REPORT_GENERATED',
  SALES_TARGET_MISSED = 'SALES_TARGET_MISSED',
  SALES_TARGET_ACHIEVED = 'SALES_TARGET_ACHIEVED',
  DOCUMENT_TRANSMITTED = 'DOCUMENT_TRANSMITTED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED'
}

export interface NotificationData {
  id: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  data?: Record<string, any>
  createdAt: Date
  readAt?: Date
  targetUserId?: string
  targetRole?: 'ADMIN' | 'FRANCHISEE'
  franchiseId?: string
  relatedEntityId?: string
  relatedEntityType?: string
  actionUrl?: string
  expiresAt?: Date
}

export interface NotificationFilters {
  type?: NotificationType[]
  priority?: NotificationPriority[]
  status?: NotificationStatus[]
  franchiseId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface NotificationResponse {
  success: boolean
  data?: {
    notifications: NotificationData[]
    total: number
    unreadCount: number
    hasMore: boolean
  }
  error?: string
}

export interface NotificationCreateRequest {
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, any>
  targetUserId?: string
  targetRole?: 'ADMIN' | 'FRANCHISEE'
  franchiseId?: string
  relatedEntityId?: string
  relatedEntityType?: string
  actionUrl?: string
  expiresAt?: Date
}

export interface NotificationUpdateRequest {
  status?: NotificationStatus
  readAt?: Date
}

export class NotificationHelper {
  static createOrderNotification(
    type: NotificationType,
    orderId: string,
    orderNumber: string,
    franchiseId?: string
  ): Omit<NotificationCreateRequest, 'targetUserId' | 'targetRole'> {
    const titles: Record<string, string> = {
      [NotificationType.ORDER_CREATED]: 'Nouvelle commande',
      [NotificationType.ORDER_CONFIRMED]: 'Commande confirmée',
      [NotificationType.ORDER_SHIPPED]: 'Commande expédiée',
      [NotificationType.ORDER_DELIVERED]: 'Commande livrée',
      [NotificationType.ORDER_CANCELLED]: 'Commande annulée',
      [NotificationType.ORDER_OVERDUE]: 'Commande en retard'
    }

    const messages: Record<string, string> = {
      [NotificationType.ORDER_CREATED]: `Nouvelle commande ${orderNumber} créée`,
      [NotificationType.ORDER_CONFIRMED]: `La commande ${orderNumber} a été confirmée`,
      [NotificationType.ORDER_SHIPPED]: `La commande ${orderNumber} a été expédiée`,
      [NotificationType.ORDER_DELIVERED]: `La commande ${orderNumber} a été livrée`,
      [NotificationType.ORDER_CANCELLED]: `La commande ${orderNumber} a été annulée`,
      [NotificationType.ORDER_OVERDUE]: `La commande ${orderNumber} est en retard`
    }

    return {
      type,
      priority: type === NotificationType.ORDER_OVERDUE ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      title: titles[type],
      message: messages[type],
      data: { orderNumber },
      franchiseId,
      relatedEntityId: orderId,
      relatedEntityType: 'order',
      actionUrl: `/orders/${orderId}`
    }
  }

  static createVehicleNotification(
    type: NotificationType,
    vehicleId: string,
    licensePlate: string,
    franchiseId: string
  ): Omit<NotificationCreateRequest, 'targetUserId' | 'targetRole'> {
    const titles: Record<string, string> = {
      [NotificationType.VEHICLE_MAINTENANCE_DUE]: 'Maintenance requise',
      [NotificationType.VEHICLE_INSPECTION_DUE]: 'Inspection requise',
      [NotificationType.VEHICLE_ASSIGNED]: 'Véhicule assigné',
      [NotificationType.VEHICLE_BREAKDOWN]: 'Panne véhicule'
    }

    const messages: Record<string, string> = {
      [NotificationType.VEHICLE_MAINTENANCE_DUE]: `Le véhicule ${licensePlate} nécessite une maintenance`,
      [NotificationType.VEHICLE_INSPECTION_DUE]: `Le véhicule ${licensePlate} doit passer une inspection`,
      [NotificationType.VEHICLE_ASSIGNED]: `Le véhicule ${licensePlate} vous a été assigné`,
      [NotificationType.VEHICLE_BREAKDOWN]: `Panne signalée sur le véhicule ${licensePlate}`
    }

    return {
      type,
      priority: type === NotificationType.VEHICLE_BREAKDOWN ? NotificationPriority.URGENT : NotificationPriority.MEDIUM,
      title: titles[type],
      message: messages[type],
      data: { licensePlate },
      franchiseId,
      relatedEntityId: vehicleId,
      relatedEntityType: 'vehicle',
      actionUrl: `/vehicles/${vehicleId}`
    }
  }

  static createFinancialNotification(
    type: NotificationType,
    entityId: string,
    amount: number,
    entityNumber: string,
    franchiseId?: string
  ): Omit<NotificationCreateRequest, 'targetUserId' | 'targetRole'> {
    const titles: Record<string, string> = {
      [NotificationType.INVOICE_GENERATED]: 'Nouvelle facture',
      [NotificationType.INVOICE_OVERDUE]: 'Facture en retard',
      [NotificationType.PAYMENT_RECEIVED]: 'Paiement reçu',
      [NotificationType.PAYMENT_FAILED]: 'Échec du paiement',
      [NotificationType.ROYALTY_PROCESSED]: 'Redevances traitées'
    }

    const messages: Record<string, string> = {
      [NotificationType.INVOICE_GENERATED]: `Nouvelle facture ${entityNumber} générée (${amount}€)`,
      [NotificationType.INVOICE_OVERDUE]: `La facture ${entityNumber} est en retard (${amount}€)`,
      [NotificationType.PAYMENT_RECEIVED]: `Paiement de ${amount}€ reçu pour ${entityNumber}`,
      [NotificationType.PAYMENT_FAILED]: `Échec du paiement de ${amount}€ pour ${entityNumber}`,
      [NotificationType.ROYALTY_PROCESSED]: `Redevances de ${amount}€ traitées`
    }

    return {
      type,
      priority: type === NotificationType.INVOICE_OVERDUE ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      title: titles[type],
      message: messages[type],
      data: { amount, entityNumber },
      franchiseId,
      relatedEntityId: entityId,
      relatedEntityType: type.includes('INVOICE') ? 'invoice' : 'payment',
      actionUrl: type.includes('INVOICE') ? `/invoices/${entityId}` : `/payments/${entityId}`
    }
  }
}

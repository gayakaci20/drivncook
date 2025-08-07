import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import {
  NotificationData,
  NotificationFilters,
  NotificationResponse,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationCreateRequest,
  NotificationUpdateRequest
} from '@/types/notifications'
import { notificationEmailService } from '@/lib/notification-email-service'

function getMockFranchiseNotifications(franchiseId: string): NotificationData[] {
  return [
    {
      id: '1',
      type: NotificationType.ORDER_CONFIRMED,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: 'Commande confirmée',
      message: 'Votre commande #CMD-2024-0178 a été confirmée et sera livrée demain',
      data: { orderNumber: 'CMD-2024-0178', deliveryDate: '2024-12-20' },
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityId: '178',
      relatedEntityType: 'order',
      actionUrl: '/franchise/orders/178'
    },
    {
      id: '2',
      type: NotificationType.VEHICLE_MAINTENANCE_DUE,
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.UNREAD,
      title: 'Maintenance programmée',
      message: 'Le véhicule FR-456-CD doit passer en maintenance dans 3 jours',
      data: { licensePlate: 'FR-456-CD', maintenanceDate: '2024-12-23', mileage: 45000 },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityId: 'vehicle-456',
      relatedEntityType: 'vehicle',
      actionUrl: '/franchise/vehicle/vehicle-456'
    },
    {
      id: '3',
      type: NotificationType.INVOICE_GENERATED,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: 'Nouvelle facture',
      message: 'Votre facture mensuelle #FAC-2024-0145 est disponible (1,250€)',
      data: { invoiceNumber: 'FAC-2024-0145', amount: 1250, dueDate: '2025-01-15' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityId: 'invoice-145',
      relatedEntityType: 'invoice',
      actionUrl: '/franchise/invoices/invoice-145'
    },
    {
      id: '4',
      type: NotificationType.STOCK_LOW,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.READ,
      title: 'Stock faible',
      message: 'Le stock de "Pâte à pizza 30cm" est faible (8 unités restantes)',
      data: { productName: 'Pâte à pizza 30cm', currentStock: 8, minStock: 20 },
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityId: 'product-123',
      relatedEntityType: 'product',
      actionUrl: '/franchise/products?filter=low-stock'
    },
    {
      id: '5',
      type: NotificationType.SALES_TARGET_ACHIEVED,
      priority: NotificationPriority.LOW,
      status: NotificationStatus.READ,
      title: 'Objectif atteint !',
      message: 'Félicitations ! Vous avez atteint 105% de votre objectif mensuel',
      data: { achievement: 105, target: 100, bonusEarned: 500 },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityType: 'sales_report',
      actionUrl: '/franchise/reports?period=current'
    },
    {
      id: '6',
      type: NotificationType.PAYMENT_RECEIVED,
      priority: NotificationPriority.LOW,
      status: NotificationStatus.READ,
      title: 'Paiement reçu',
      message: 'Votre paiement de 950€ pour la facture #FAC-2024-0134 a été reçu',
      data: { amount: 950, invoiceNumber: 'FAC-2024-0134', paymentMethod: 'Virement bancaire' },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityId: 'payment-789',
      relatedEntityType: 'payment',
      actionUrl: '/franchise/invoices?filter=paid'
    },
    {
      id: '7',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      status: NotificationStatus.READ,
      title: 'Mise à jour système',
      message: 'Une nouvelle version de l\'application sera déployée ce weekend',
      data: { version: '2.1.0', deploymentDate: '2024-12-21', downtime: '2 heures' },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      targetRole: 'FRANCHISEE',
      franchiseId,
      relatedEntityType: 'system',
      actionUrl: '/franchise/support'
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const user = session.user as ExtendedUser

    if (user.role !== UserRole.FRANCHISEE) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux franchisés' }, { status: 403 })
    }

    if (!user.franchiseId) {
      return NextResponse.json({ success: false, error: 'Aucune franchise associée' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    
    const filters: NotificationFilters = {
      type: searchParams.get('type')?.split(',') as NotificationType[] || undefined,
      priority: searchParams.get('priority')?.split(',') as NotificationPriority[] || undefined,
      status: searchParams.get('status')?.split(',') as NotificationStatus[] || undefined,
      franchiseId: user.franchiseId,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    let notifications = getMockFranchiseNotifications(user.franchiseId)

    if (filters.type && filters.type.length > 0) {
      notifications = notifications.filter(n => filters.type!.includes(n.type))
    }
    
    if (filters.priority && filters.priority.length > 0) {
      notifications = notifications.filter(n => filters.priority!.includes(n.priority))
    }
    
    if (filters.status && filters.status.length > 0) {
      notifications = notifications.filter(n => filters.status!.includes(n.status))
    }

    if (filters.startDate) {
      notifications = notifications.filter(n => n.createdAt >= filters.startDate!)
    }
    
    if (filters.endDate) {
      notifications = notifications.filter(n => n.createdAt <= filters.endDate!)
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = notifications.length
    const offset = filters.offset || 0
    const limit = Math.min(filters.limit || 20, 100)
    const paginatedNotifications = notifications.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    const unreadCount = notifications.filter(n => n.status === NotificationStatus.UNREAD).length

    const response: NotificationResponse = {
      success: true,
      data: {
        notifications: paginatedNotifications,
        total,
        unreadCount,
        hasMore
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erreur API franchise notifications:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const user = session.user as ExtendedUser

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body: NotificationCreateRequest = await request.json()

    if (!body.type || !body.title || !body.message || !body.franchiseId) {
      return NextResponse.json({
        success: false,
        error: 'Les champs type, title, message et franchiseId sont requis'
      }, { status: 400 })
    }

    const newNotification: NotificationData = {
      id: `notification-${Date.now()}`,
      type: body.type,
      priority: body.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: body.title,
      message: body.message,
      data: body.data,
      createdAt: new Date(),
      targetUserId: body.targetUserId,
      targetRole: 'FRANCHISEE',
      franchiseId: body.franchiseId,
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType,
      actionUrl: body.actionUrl,
      expiresAt: body.expiresAt
    }

    try {
      const userEmailInfo = session.user.email ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        role: 'FRANCHISEE' as const,
        franchiseId: body.franchiseId
      } : undefined

      notificationEmailService.sendNotificationEmail(
        newNotification,
        userEmailInfo
      ).catch(error => {
        console.error('Erreur envoi email notification franchise:', error)
      })
    } catch (error) {
      console.error('Erreur lors de la préparation de l\'email:', error)
    }

    return NextResponse.json({
      success: true,
      data: { notification: newNotification }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur création notification franchise:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const user = session.user as ExtendedUser

    if (user.role !== UserRole.FRANCHISEE) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux franchisés' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const notificationIds = searchParams.get('ids')?.split(',') || []
    
    if (notificationIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Au moins un ID de notification est requis'
      }, { status: 400 })
    }

    const body: NotificationUpdateRequest = await request.json()

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: notificationIds.length,
        updatedIds: notificationIds
      }
    })

  } catch (error) {
    console.error('Erreur mise à jour notification franchise:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

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
import { notificationEmailService } from '@/lib/notification-service'

function getMockAdminNotifications(): NotificationData[] {
  return [
    {
      id: '1',
      type: NotificationType.FRANCHISE_APPROVED,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: 'Nouvelle franchise approuvée',
      message: 'La franchise "Pizza Express Lyon" a été approuvée et activée',
      data: { franchiseName: 'Pizza Express Lyon', location: 'Lyon' },
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      targetRole: 'ADMIN',
      relatedEntityType: 'franchise',
      actionUrl: '/admin/franchises/123'
    },
    {
      id: '2',
      type: NotificationType.ORDER_OVERDUE,
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.UNREAD,
      title: 'Commande en retard',
      message: 'La commande #CMD-2024-0156 est en retard de livraison',
      data: { orderNumber: 'CMD-2024-0156', daysOverdue: 2 },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      targetRole: 'ADMIN',
      relatedEntityId: '156',
      relatedEntityType: 'order',
      actionUrl: '/admin/orders/156'
    },
    {
      id: '3',
      type: NotificationType.VEHICLE_BREAKDOWN,
      priority: NotificationPriority.URGENT,
      status: NotificationStatus.UNREAD,
      title: 'Panne véhicule urgente',
      message: 'Le véhicule FR-123-AB signale une panne moteur',
      data: { licensePlate: 'FR-123-AB', franchiseName: 'Pizza Express Marseille' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      targetRole: 'ADMIN',
      franchiseId: 'franchise-456',
      relatedEntityId: 'vehicle-789',
      relatedEntityType: 'vehicle',
      actionUrl: '/admin/vehicles/vehicle-789'
    },
    {
      id: '4',
      type: NotificationType.INVOICE_OVERDUE,
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.READ,
      title: 'Factures impayées',
      message: 'La facture #FAC-2024-0089 est en retard de paiement',
      data: { invoiceNumber: 'FAC-2024-0089', amount: 2500, daysOverdue: 7 },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      targetRole: 'ADMIN',
      franchiseId: 'franchise-123',
      relatedEntityId: 'invoice-089',
      relatedEntityType: 'invoice',
      actionUrl: '/admin/finance?filter=overdue'
    },
    {
      id: '5',
      type: NotificationType.SALES_TARGET_MISSED,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.READ,
      title: 'Objectif de vente non atteint',
      message: 'La franchise "Burger King Nice" n\'a atteint que 78% de son objectif mensuel',
      data: { franchiseName: 'Burger King Nice', achievement: 78, target: 100 },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      targetRole: 'ADMIN',
      franchiseId: 'franchise-789',
      relatedEntityType: 'sales_report',
      actionUrl: '/admin/reports?franchise=franchise-789'
    },
    {
      id: '6',
      type: NotificationType.USER_REGISTERED,
      priority: NotificationPriority.LOW,
      status: NotificationStatus.READ,
      title: 'Nouveau franchisé enregistré',
      message: 'Marie Dupont s\'est inscrite et demande l\'approbation de sa franchise',
      data: { userName: 'Marie Dupont', businessName: 'Pasta Corner Toulouse' },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      targetRole: 'ADMIN',
      relatedEntityType: 'user',
      actionUrl: '/admin/franchises?filter=pending'
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

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    const filters: NotificationFilters = {
      type: searchParams.get('type')?.split(',') as NotificationType[] || undefined,
      priority: searchParams.get('priority')?.split(',') as NotificationPriority[] || undefined,
      status: searchParams.get('status')?.split(',') as NotificationStatus[] || undefined,
      franchiseId: searchParams.get('franchiseId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    let notifications: NotificationData[] = []

    try {
      const dbNotifications = await (prisma as any)['notification'].findMany({
        where: {
          OR: [
            { targetRole: 'ADMIN' },
            { targetUserId: session.user.id }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 20,
        skip: filters.offset || 0
      })

      notifications = (dbNotifications as any[]).map((n: any) => ({
        id: n.id,
        type: n.type as NotificationType,
        priority: n.priority as NotificationPriority,
        status: n.status as NotificationStatus,
        title: n.title,
        message: n.message,
        data: n.data as any,
        createdAt: n.createdAt,
        readAt: n.readAt || undefined,
        targetUserId: n.targetUserId || undefined,
        targetRole: n.targetRole as 'ADMIN' | 'FRANCHISEE',
        franchiseId: n.franchiseId || undefined,
        relatedEntityId: n.relatedEntityId || undefined,
        relatedEntityType: n.relatedEntityType || undefined,
        actionUrl: n.actionUrl || undefined,
        expiresAt: n.expiresAt || undefined
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
    }

    if (filters.type && filters.type.length > 0) {
      notifications = notifications.filter(n => filters.type!.includes(n.type))
    }
    
    if (filters.priority && filters.priority.length > 0) {
      notifications = notifications.filter(n => filters.priority!.includes(n.priority))
    }
    
    if (filters.status && filters.status.length > 0) {
      notifications = notifications.filter(n => filters.status!.includes(n.status))
    }
    
    if (filters.franchiseId) {
      notifications = notifications.filter(n => n.franchiseId === filters.franchiseId)
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
    console.error('Erreur API admin notifications:', error)
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

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body: NotificationCreateRequest = await request.json()

    if (!body.type || !body.title || !body.message) {
      return NextResponse.json({
        success: false,
        error: 'Les champs type, title et message sont requis'
      }, { status: 400 })
    }

    const createdNotification = await (prisma as any)['notification'].create({
      data: {
        type: body.type,
        priority: body.priority || NotificationPriority.MEDIUM,
        status: NotificationStatus.UNREAD,
        title: body.title,
        message: body.message,
        data: body.data ? JSON.stringify(body.data) : null,
        targetUserId: body.targetUserId,
        targetRole: body.targetRole || 'ADMIN',
        franchiseId: body.franchiseId,
        relatedEntityId: body.relatedEntityId,
        relatedEntityType: body.relatedEntityType,
        actionUrl: body.actionUrl,
        expiresAt: body.expiresAt
      }
    })

    const newNotification: NotificationData = {
      id: createdNotification.id,
      type: createdNotification.type as NotificationType,
      priority: createdNotification.priority as NotificationPriority,
      status: createdNotification.status as NotificationStatus,
      title: createdNotification.title,
      message: createdNotification.message,
      data: createdNotification.data ? JSON.parse(createdNotification.data) : undefined,
      createdAt: createdNotification.createdAt,
      readAt: createdNotification.readAt || undefined,
      targetUserId: createdNotification.targetUserId || undefined,
      targetRole: createdNotification.targetRole as 'ADMIN' | 'FRANCHISEE',
      franchiseId: createdNotification.franchiseId || undefined,
      relatedEntityId: createdNotification.relatedEntityId || undefined,
      relatedEntityType: createdNotification.relatedEntityType || undefined,
      actionUrl: createdNotification.actionUrl || undefined,
      expiresAt: createdNotification.expiresAt || undefined
    }

    try {
      const userEmailInfo = session.user.email ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        role: 'ADMIN' as const,
        franchiseId: body.franchiseId
      } : undefined

      notificationEmailService.sendSimpleNotificationEmailFor(
        newNotification,
        userEmailInfo,
        { sendEmail: true, includeDefaultRecipients: true }
      ).catch(error => {
        console.error('Erreur envoi email notification admin:', error)
      })
    } catch (error) {
      console.error('Erreur lors de la préparation de l\'email:', error)
    }

    return NextResponse.json({
      success: true,
      data: { notification: newNotification }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur création notification admin:', error)
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

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 })
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

    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.readAt) updateData.readAt = body.readAt

    const result = await (prisma as any)['notification'].updateMany({
      where: {
        id: { in: notificationIds },
        OR: [
          { targetRole: 'ADMIN' },
          { targetUserId: session.user.id }
        ]
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        updatedIds: notificationIds
      }
    })

  } catch (error) {
    console.error('Erreur mise à jour notification admin:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

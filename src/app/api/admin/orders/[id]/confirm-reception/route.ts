import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export const runtime = 'nodejs'

export const POST = withAuth(
  withErrorHandling(async (_request: NextRequest, context: { params: { id: string } }, session: any) => {
    const id = context.params.id
    if (!id) return createErrorResponse('ID manquant', 400)

    const user = session.user as ExtendedUser
    if (user.role !== UserRole.ADMIN) {
      return createErrorResponse('Accès réservé aux administrateurs', 403)
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return createErrorResponse('Commande introuvable', 404)

    const updated = await prisma.order.update({ where: { id }, data: { status: 'CONFIRMED' } })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'orders',
        recordId: id,
        newValues: JSON.stringify({ status: 'CONFIRMED' }),
        userId: user.id
      }
    })

    try {
      const notif = {
        type: NotificationType.ORDER_CONFIRMED,
        priority: NotificationPriority.MEDIUM,
        title: 'Commande confirmée',
        message: `Votre commande ${updated.orderNumber} a été confirmée`,
        data: { orderNumber: updated.orderNumber },
        relatedEntityId: updated.id,
        relatedEntityType: 'order',
        franchiseId: updated.franchiseId,
        actionUrl: `/franchise/orders`
      } as const

      await notificationEmailService.createNotificationWithEmail(
        { ...notif, targetRole: 'FRANCHISEE' }
      )
    } catch (e) {
      console.error('Erreur notification ORDER_CONFIRMED:', e)
    }

    return createSuccessResponse(updated, 'Réception confirmée')
  }),
  [UserRole.ADMIN]
)



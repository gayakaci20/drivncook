import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { orderUpdateSchema } from '@/lib/validations'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: { params: { id: string } }, session: any) => {
    const { params } = await Promise.resolve(context)
    const { id } = params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        franchise: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        createdBy: { select: { firstName: true, lastName: true } },
         orderItems: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
            warehouse: { select: { id: true, name: true, city: true } }
          }
        }
      }
    })
    if (!order) return createErrorResponse('Commande introuvable', 404)

    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && order.franchiseId !== (session.user as ExtendedUser).franchiseId) {
      return createErrorResponse('Permission refusée', 403)
    }

    // Récupérer les URLs transmises depuis le champ de la commande
    let transmittedAttachmentUrls: string[] | undefined
    if (order.transmittedAttachmentUrls) {
      try {
        transmittedAttachmentUrls = JSON.parse(order.transmittedAttachmentUrls)
      } catch {}
    }

    return createSuccessResponse({ ...order, transmittedAttachmentUrls })
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const PUT = withAuth(
  withValidation(
    orderUpdateSchema,
    withErrorHandling(async (request: NextRequest, context: { params: { id: string } }, session: any, validatedData: any) => {
      const { params } = await Promise.resolve(context)
      const { id } = params
      const existing = await prisma.order.findUnique({ where: { id } })
      if (!existing) return createErrorResponse('Commande introuvable', 404)

      if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && existing.franchiseId !== (session.user as ExtendedUser).franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }

      const order = await prisma.order.update({
        where: { id },
        data: {
          status: validatedData.status || existing.status,
          requestedDeliveryDate: validatedData.requestedDeliveryDate ? new Date(validatedData.requestedDeliveryDate) : existing.requestedDeliveryDate,
          notes: validatedData.notes !== undefined ? validatedData.notes : existing.notes
        },
        include: {
          orderItems: true
        }
      })
      try {
        if (validatedData.status && validatedData.status !== existing.status) {
          const status = String(validatedData.status)
          const titleMap: Record<string, string> = {
            CONFIRMED: 'Commande confirmée',
            IN_PREPARATION: 'Commande en préparation',
            SHIPPED: 'Commande expédiée',
            DELIVERED: 'Commande livrée',
            CANCELLED: 'Commande annulée',
            PENDING: 'Commande en attente'
          }
          const notifData = {
            type: status === 'CANCELLED' ? NotificationType.ORDER_CANCELLED : (status === 'DELIVERED' ? NotificationType.ORDER_DELIVERED : (status === 'SHIPPED' ? NotificationType.ORDER_SHIPPED : NotificationType.ORDER_CONFIRMED)),
            priority: NotificationPriority.MEDIUM,
            title: titleMap[status] || `Commande ${status}`,
            message: `Commande ${order.orderNumber}: ${titleMap[status] || status}`,
            data: { orderNumber: order.orderNumber, status },
            relatedEntityId: order.id,
            relatedEntityType: 'order',
            franchiseId: order.franchiseId,
            actionUrl: `/franchise/orders?view=${order.id}`
          } as const

          await notificationEmailService.createNotificationWithEmail(
            { ...notifData, targetRole: 'FRANCHISEE' }
          )

          await notificationEmailService.createNotificationWithEmail(
            { ...notifData, targetRole: 'ADMIN' }
          )
        }
      } catch (e) {
        console.error('Erreur notification statut commande:', e)
      }
      return createSuccessResponse(order, 'Commande mise à jour')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

// NOTE: DELETE handler can be added later if needed
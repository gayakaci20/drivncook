import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'

import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface RouteContext {
  params: {
    id: string
  }
}

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

     
    const where: any = { id }
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.franchiseId = (session.user as ExtendedUser).franchiseId
    }

    const order = await prisma.order.findUnique({
      where,
      include: {
        franchise: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                description: true,
                sku: true,
                unit: true
              }
            },
            warehouse: {
              select: {
                name: true,
                city: true,
                address: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return createErrorResponse('Commande introuvable', 404)
    }

    return createSuccessResponse(order)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const PUT = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params
    const body = await request.json()

     
    const where: any = { id }
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.franchiseId = (session.user as ExtendedUser).franchiseId
    }

    const existingOrder = await prisma.order.findUnique({ where })

    if (!existingOrder) {
      return createErrorResponse('Commande introuvable', 404)
    }

     
    const allowedUpdates: any = {}
    
    if (body.status && ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(body.status)) {
      allowedUpdates.status = body.status
    }

    if (body.requestedDeliveryDate) {
      allowedUpdates.requestedDeliveryDate = new Date(body.requestedDeliveryDate)
    }

    if (body.actualDeliveryDate) {
      allowedUpdates.actualDeliveryDate = new Date(body.actualDeliveryDate)
    }

    if (body.notes) {
      allowedUpdates.notes = body.notes
    }

    allowedUpdates.updatedById = (session.user as ExtendedUser).id

     
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: allowedUpdates,
      include: {
        franchise: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: true,
            warehouse: true
          }
        }
      }
    })

     
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'orders',
        recordId: id,
        oldValues: JSON.stringify(existingOrder),
        newValues: JSON.stringify(updatedOrder),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse(updatedOrder, 'Commande mise à jour avec succès')
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const DELETE = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

     
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    })

    if (!existingOrder) {
      return createErrorResponse('Commande introuvable', 404)
    }

     
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && existingOrder.franchiseId !== (session.user as ExtendedUser).franchiseId) {
      return createErrorResponse('Permission refusée', 403)
    }

     
    if (!['DRAFT', 'PENDING'].includes(existingOrder.status)) {
      return createErrorResponse('Impossible de supprimer une commande en cours de traitement', 400)
    }

     
    await prisma.$transaction(async (tx: any) => {
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      await tx.order.delete({
        where: { id }
      })
    })

     
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        tableName: 'orders',
        recordId: id,
        oldValues: JSON.stringify(existingOrder),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse(null, 'Commande supprimée avec succès')
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
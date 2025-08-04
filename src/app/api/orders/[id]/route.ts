import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { UserRole } from '@/types/prisma-enums'

interface RouteContext {
  params: {
    id: string
  }
}

// GET /api/orders/[id] - Récupérer une commande
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    // Construire les filtres selon le rôle
    const where: any = { id }
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.franchiseId = session.user.franchiseId
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
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// PUT /api/orders/[id] - Mettre à jour une commande
export const PUT = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params
    const body = await request.json()

    // Vérifier si la commande existe et appartient au bon franchisé
    const where: any = { id }
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.franchiseId = session.user.franchiseId
    }

    const existingOrder = await prisma.order.findUnique({ where })

    if (!existingOrder) {
      return createErrorResponse('Commande introuvable', 404)
    }

    // Seules certaines données peuvent être mises à jour selon le statut
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

    allowedUpdates.updatedById = session.user.id

    // Mettre à jour la commande
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

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'orders',
        recordId: id,
        oldValues: JSON.stringify(existingOrder),
        newValues: JSON.stringify(updatedOrder),
        userId: session.user.id
      }
    })

    return createSuccessResponse(updatedOrder, 'Commande mise à jour avec succès')
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// DELETE /api/orders/[id] - Supprimer une commande
export const DELETE = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    })

    if (!existingOrder) {
      return createErrorResponse('Commande introuvable', 404)
    }

    // Vérifier les permissions
    if (session.user.role === UserRole.FRANCHISEE && existingOrder.franchiseId !== session.user.franchiseId) {
      return createErrorResponse('Permission refusée', 403)
    }

    // Seules les commandes en brouillon ou en attente peuvent être supprimées
    if (!['DRAFT', 'PENDING'].includes(existingOrder.status)) {
      return createErrorResponse('Impossible de supprimer une commande en cours de traitement', 400)
    }

    // Supprimer la commande et ses items
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      await tx.order.delete({
        where: { id }
      })
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        tableName: 'orders',
        recordId: id,
        oldValues: JSON.stringify(existingOrder),
        userId: session.user.id
      }
    })

    return createSuccessResponse(null, 'Commande supprimée avec succès')
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)
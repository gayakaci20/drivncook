import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { orderItemSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// POST /api/order-items - Ajouter un article à une commande
export const POST = withAuth(
  withValidation(
    orderItemSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      const { orderId, productId, warehouseId, quantity, unitPrice, notes } = validatedData

      // Vérifier que la commande existe et appartient au bon utilisateur
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { franchise: true }
      })

      if (!order) {
        return createErrorResponse('Commande introuvable', 404)
      }

      // Vérifier les permissions
      if (session.user.role === UserRole.FRANCHISEE && order.franchiseId !== session.user.franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }

      // Vérifier que le produit et l'entrepôt existent
      const [product, warehouse] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.warehouse.findUnique({ where: { id: warehouseId } })
      ])

      if (!product) {
        return createErrorResponse('Produit introuvable', 404)
      }

      if (!warehouse) {
        return createErrorResponse('Entrepôt introuvable', 404)
      }

      // Vérifier la disponibilité du stock
      const stock = await prisma.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId
          }
        }
      })

      if (!stock || (stock.quantity - stock.reservedQty) < quantity) {
        return createErrorResponse('Stock insuffisant', 400)
      }

      // Calculer le prix total
      const totalPrice = unitPrice * quantity

      // Créer l'article de commande
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId,
          productId,
          warehouseId,
          quantity,
          unitPrice,
          totalPrice,
          notes
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unit: true
            }
          },
          warehouse: {
            select: {
              name: true,
              city: true
            }
          }
        }
      })

      // Réserver le stock
      await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId
          }
        },
        data: {
          reservedQty: {
            increment: quantity
          }
        }
      })

      // Mettre à jour le montant total de la commande
      const totalOrderAmount = await prisma.orderItem.aggregate({
        where: { orderId },
        _sum: { totalPrice: true }
      })

      await prisma.order.update({
        where: { id: orderId },
        data: {
          totalAmount: totalOrderAmount._sum.totalPrice || 0
        }
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'order_items',
          recordId: orderItem.id,
          newValues: JSON.stringify(orderItem),
          userId: session.user.id
        }
      })

      return createSuccessResponse(orderItem, 'Article ajouté à la commande avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// GET /api/order-items?orderId=... - Lister les articles d'une commande
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return createErrorResponse('orderId requis', 400)
    }

    // Vérifier que la commande existe et les permissions
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return createErrorResponse('Commande introuvable', 404)
    }

    if (session.user.role === UserRole.FRANCHISEE && order.franchiseId !== session.user.franchiseId) {
      return createErrorResponse('Permission refusée', 403)
    }

    // Récupérer les articles de la commande
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            sku: true,
            unit: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true
          }
        }
      },
      orderBy: { product: { name: 'asc' } }
    })

    return createSuccessResponse(orderItems)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)
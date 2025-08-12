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

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }, session: any) => {
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

    return createSuccessResponse(order)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const PUT = withAuth(
  withValidation(
    orderUpdateSchema,
    withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }, session: any, validatedData: any) => {
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
      return createSuccessResponse(order, 'Commande mise à jour')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

// NOTE: DELETE handler can be added later if needed
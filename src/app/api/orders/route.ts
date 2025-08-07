import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse,
  parsePaginationParams,
  createPaginationResponse
} from '@/lib/api-utils'
import { orderSchema } from '@/lib/validations'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

     
    const where: any = {}
    
     
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.franchiseId = (session.user as ExtendedUser).franchiseId
    } else if (franchiseId) {
      where.franchiseId = franchiseId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { franchise: { businessName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

     
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          createdBy: {
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
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.order.count({ where })
    ])

    const response = createPaginationResponse(orders, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const POST = withAuth(
  withValidation(
    orderSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      let franchiseId = validatedData.franchiseId

       
      if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
        if (!(session.user as ExtendedUser).franchiseId) {
          return createErrorResponse('Franchisé non associé à une franchise', 400)
        }
        franchiseId = (session.user as ExtendedUser).franchiseId
      }

       
      const franchise = await prisma.franchise.findUnique({
        where: { id: franchiseId }
      })

      if (!franchise) {
        return createErrorResponse('Franchise introuvable', 404)
      }

       
      const orderCount = await prisma.order.count()
      const orderNumber = `CMD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`

       
      const order = await prisma.order.create({
        data: {
          orderNumber,
          franchiseId: franchiseId,
          requestedDeliveryDate: validatedData.requestedDeliveryDate ? new Date(validatedData.requestedDeliveryDate) : null,
          notes: validatedData.notes,
          isFromDrivnCook: validatedData.isFromDrivnCook,
          createdById: (session.user as ExtendedUser).id
        },
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
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'orders',
          recordId: order.id,
          newValues: JSON.stringify(order),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(order, 'Commande créée avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
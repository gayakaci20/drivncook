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
import { UserRole } from '@/types/prisma-enums'

// GET /api/orders - Lister les commandes
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

    // Construire les filtres
    const where: any = {}
    
    // Si l'utilisateur est un franchisé, filtrer par son franchise
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.franchiseId = session.user.franchiseId
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

    // Récupérer les commandes avec pagination
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
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// POST /api/orders - Créer une nouvelle commande
export const POST = withAuth(
  withValidation(
    orderSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      let franchiseId = validatedData.franchiseId

      // Si l'utilisateur est un franchisé, utiliser son franchiseId
      if (session.user.role === UserRole.FRANCHISEE) {
        if (!session.user.franchiseId) {
          return createErrorResponse('Franchisé non associé à une franchise', 400)
        }
        franchiseId = session.user.franchiseId
      }

      // Vérifier que la franchise existe
      const franchise = await prisma.franchise.findUnique({
        where: { id: franchiseId }
      })

      if (!franchise) {
        return createErrorResponse('Franchise introuvable', 404)
      }

      // Générer un numéro de commande unique
      const orderCount = await prisma.order.count()
      const orderNumber = `CMD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`

      // Créer la commande
      const order = await prisma.order.create({
        data: {
          orderNumber,
          franchiseId: franchiseId,
          requestedDeliveryDate: validatedData.requestedDeliveryDate ? new Date(validatedData.requestedDeliveryDate) : null,
          notes: validatedData.notes,
          isFromDrivnCook: validatedData.isFromDrivnCook,
          createdById: session.user.id
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

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'orders',
          recordId: order.id,
          newValues: JSON.stringify(order),
          userId: session.user.id
        }
      })

      return createSuccessResponse(order, 'Commande créée avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)
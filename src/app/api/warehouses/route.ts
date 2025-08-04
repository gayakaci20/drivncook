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
import { warehouseSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/warehouses - Lister les entrepôts
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const region = searchParams.get('region') || ''

    // Construire les filtres
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (region) {
      where.region = region
    }

    // Récupérer les entrepôts avec pagination
    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          stocks: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  unit: true
                }
              }
            }
          },
          _count: {
            select: {
              stocks: true,
              orderItems: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.warehouse.count({ where })
    ])

    const response = createPaginationResponse(warehouses, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER]
)

// POST /api/warehouses - Créer un nouvel entrepôt
export const POST = withAuth(
  withValidation(
    warehouseSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      // Créer l'entrepôt
      const warehouse = await prisma.warehouse.create({
        data: validatedData
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'warehouses',
          recordId: warehouse.id,
          newValues: JSON.stringify(warehouse),
          userId: session.user.id
        }
      })

      return createSuccessResponse(warehouse, 'Entrepôt créé avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)
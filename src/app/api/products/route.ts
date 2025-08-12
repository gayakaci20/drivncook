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
import { productSchema } from '@/lib/validations'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const isActive = searchParams.get('isActive')

     
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

     
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          stocks: {
            include: {
              warehouse: {
                select: {
                  id: true,
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
      prisma.product.count({ where })
    ])

    const response = createPaginationResponse(products, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const POST = withAuth(
  withValidation(
    productSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
       
      const existingSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku }
      })

      if (existingSku) {
        return createErrorResponse('Ce SKU est déjà utilisé', 400)
      }

       
      const category = await prisma.productCategory.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!category) {
        return createErrorResponse('Catégorie introuvable', 404)
      }

       
      const product = await prisma.product.create({
        data: validatedData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'products',
          recordId: product.id,
          newValues: JSON.stringify(product),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(product, 'Produit créé avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
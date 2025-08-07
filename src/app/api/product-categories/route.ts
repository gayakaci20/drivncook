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
import { productCategorySchema } from '@/lib/validations'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { User } from 'lucide-react'

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''

     
    const where: any = { isActive: true }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

     
    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 20),
        take: limit || 20,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.productCategory.count({ where })
    ])

    const response = createPaginationResponse(categories, total, page || 1, limit || 20)
    return createSuccessResponse(response)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const POST = withAuth(
  withValidation(
    productCategorySchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
       
      const category = await prisma.productCategory.create({
        data: validatedData
      })

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'product_categories',
          recordId: category.id,
          newValues: JSON.stringify(category),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(category, 'Catégorie créée avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
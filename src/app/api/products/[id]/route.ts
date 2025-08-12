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

interface RouteContext { params: { id: string } }

export const GET = withAuth(
  withErrorHandling(async (_req: NextRequest, context: RouteContext) => {
    const { id } = context.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        stocks: {
          include: {
            warehouse: { select: { id: true, name: true, city: true } }
          }
        }
      }
    })
    if (!product) return createErrorResponse('Produit introuvable', 404)
    return createSuccessResponse(product)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const PUT = withAuth(
  withErrorHandling(async (req: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params
    const body = await req.json()

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Produit introuvable', 404)

    if (body.sku && body.sku !== existing.sku) {
      const dupe = await prisma.product.findUnique({ where: { sku: body.sku } })
      if (dupe && dupe.id !== id) return createErrorResponse('Ce SKU est déjà utilisé', 400)
    }

    if (body.categoryId) {
      const category = await prisma.productCategory.findUnique({ where: { id: body.categoryId } })
      if (!category) return createErrorResponse('Catégorie introuvable', 404)
    }

    const data: any = {}
    if (typeof body.name !== 'undefined') data.name = body.name
    if (typeof body.description !== 'undefined') data.description = body.description
    if (typeof body.sku !== 'undefined') data.sku = body.sku
    if (typeof body.barcode !== 'undefined') data.barcode = body.barcode
    if (typeof body.unitPrice !== 'undefined') data.unitPrice = Number(body.unitPrice)
    if (typeof body.unit !== 'undefined') data.unit = body.unit
    if (typeof body.minStock !== 'undefined') data.minStock = Number(body.minStock)
    if (typeof body.maxStock !== 'undefined') data.maxStock = body.maxStock === null ? null : Number(body.maxStock)
    if (typeof body.imageUrl !== 'undefined') data.imageUrl = body.imageUrl
    if (typeof body.isActive !== 'undefined') data.isActive = !!body.isActive
    if (typeof body.categoryId !== 'undefined') data.categoryId = body.categoryId

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, description: true } }
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'products',
        recordId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(updated),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse(updated, 'Produit mis à jour avec succès')
  }),
  [UserRole.ADMIN]
)

export const DELETE = withAuth(
  withErrorHandling(async (_req: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Produit introuvable', 404)

    await prisma.product.delete({ where: { id } })
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        tableName: 'products',
        recordId: id,
        oldValues: JSON.stringify(existing),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse(null, 'Produit supprimé avec succès')
  }),
  [UserRole.ADMIN]
)



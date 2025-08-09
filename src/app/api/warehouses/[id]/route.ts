import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withAuth,
  withErrorHandling,
  withValidation,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { warehouseSchema } from '@/lib/validations'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, { params }: RouteParams, session: any) => {
    const resolved = await params
    const id = resolved.id

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true, minStock: true, maxStock: true }
            }
          }
        },
        _count: { select: { stocks: true, orderItems: true } }
      }
    })

    if (!warehouse) {
      return createErrorResponse("Entrepôt introuvable", 404)
    }

    return createSuccessResponse(warehouse)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const PUT = withAuth(
  withValidation(
    warehouseSchema,
    withErrorHandling(async (request: NextRequest, { params }: RouteParams, session: any, validatedData: any) => {
      const resolved = await params
      const id = resolved.id

      const existing = await prisma.warehouse.findUnique({ where: { id } })
      if (!existing) {
        return createErrorResponse("Entrepôt introuvable", 404)
      }

      const updated = await prisma.warehouse.update({
        where: { id },
        data: validatedData
      })

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          tableName: 'warehouses',
          recordId: id,
          oldValues: JSON.stringify(existing),
          newValues: JSON.stringify(updated),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(updated, "Entrepôt mis à jour avec succès")
    })
  ),
  [UserRole.ADMIN]
)



import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createSuccessResponse, createErrorResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: { params: { id: string } }, session: any) => {
    const id = context.params.id
    if (!id) return createErrorResponse('ID manquant', 400)

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        franchise: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    })

    if (!invoice) return createErrorResponse('Facture introuvable', 404)

    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
      if ((session.user as ExtendedUser).franchiseId !== invoice.franchiseId) {
        return createErrorResponse('Permissions insuffisantes', 403)
      }
    }

    return createSuccessResponse(invoice)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
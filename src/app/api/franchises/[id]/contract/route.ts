import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createErrorResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { renderToBuffer } from '@react-pdf/renderer'
import { FranchiseContractPdf } from '@/lib/pdf/franchise-contrat'

export const runtime = 'nodejs'

export const GET = withAuth(
  withErrorHandling(async (_request: NextRequest, context: { params: { id: string } }, session: any) => {
    const id = context.params.id
    if (!id) return createErrorResponse('ID manquant', 400)

    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, id: true } }
      }
    })
    if (!franchise) return createErrorResponse('Franchise introuvable', 404)

    if (session.user.role === UserRole.FRANCHISEE) {
      if ((session.user as ExtendedUser).franchiseId !== franchise.id) {
        return createErrorResponse('Permissions insuffisantes', 403)
      }
    }

    const pdfBuffer = await renderToBuffer(
      FranchiseContractPdf({
        data: {
          businessName: franchise.businessName,
          siretNumber: franchise.siretNumber,
          vatNumber: franchise.vatNumber,
          address: franchise.address,
          city: franchise.city,
          postalCode: franchise.postalCode,
          region: franchise.region,
          contactEmail: franchise.contactEmail,
          contactPhone: franchise.contactPhone,
          royaltyRate: Number(franchise.royaltyRate),
          entryFee: Number(franchise.entryFee),
          contractStartDate: franchise.contractStartDate ? franchise.contractStartDate.toISOString() : null,
          contractEndDate: franchise.contractEndDate ? franchise.contractEndDate.toISOString() : null,
          user: {
            firstName: franchise.user.firstName,
            lastName: franchise.user.lastName,
            email: franchise.user.email,
            phone: franchise.user.phone || null
          }
        }
      })
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat-${franchise.businessName}.pdf"`
      }
    })
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)



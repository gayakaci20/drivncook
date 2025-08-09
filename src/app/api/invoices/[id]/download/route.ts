import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createErrorResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-document'

export const runtime = 'nodejs'

export const GET = withAuth(
  withErrorHandling(async (_request: NextRequest, context: { params: { id: string } }, session: any) => {
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

    if (session.user.role === UserRole.FRANCHISEE) {
      if ((session.user as ExtendedUser).franchiseId !== invoice.franchiseId) {
        return createErrorResponse('Permissions insuffisantes', 403)
      }
    }

    const pdfBuffer = await renderToBuffer(
      InvoicePdfDocument({
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          amount: Number(invoice.amount),
          description: invoice.description || null,
          paymentStatus: invoice.paymentStatus as any,
          franchise: {
            businessName: invoice.franchise.businessName,
            user: {
              firstName: invoice.franchise.user.firstName,
              lastName: invoice.franchise.user.lastName,
              email: invoice.franchise.user.email
            }
          }
        }
      })
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    })
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)



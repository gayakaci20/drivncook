import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createErrorResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrderPdfDocument } from '@/lib/pdf/order-document'

export const runtime = 'nodejs'

export const GET = withAuth(
  withErrorHandling(async (_request: NextRequest, context: { params: { id: string } }, session: any) => {
    const id = context.params.id
    if (!id) return createErrorResponse('ID manquant', 400)

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        franchise: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        orderItems: {
          include: {
            product: { select: { name: true, sku: true, unit: true } },
            warehouse: { select: { name: true, city: true } }
          }
        }
      }
    })
    if (!order) return createErrorResponse('Commande introuvable', 404)

    if (session.user.role === UserRole.FRANCHISEE) {
      if ((session.user as ExtendedUser).franchiseId !== order.franchiseId) {
        return createErrorResponse('Permissions insuffisantes', 403)
      }
    }

    const pdfBuffer = await renderToBuffer(
      OrderPdfDocument({
        order: {
          orderNumber: order.orderNumber,
          orderDate: order.orderDate.toISOString(),
          requestedDeliveryDate: order.requestedDeliveryDate ? order.requestedDeliveryDate.toISOString() : null,
          franchise: {
            businessName: order.franchise.businessName,
            address: order.franchise.address,
            postalCode: order.franchise.postalCode,
            city: order.franchise.city,
            region: order.franchise.region,
            user: order.franchise.user,
          },
          items: order.orderItems.map((oi) => ({
            productName: oi.product.name,
            sku: oi.product.sku,
            unit: undefined as any,
            warehouseName: oi.warehouse.name,
            warehouseCity: oi.warehouse.city,
            quantity: oi.quantity,
            unitPrice: Number(oi.unitPrice),
            totalPrice: Number(oi.totalPrice),
          })),
          totalAmount: Number(order.totalAmount),
          notes: order.notes || null,
        }
      })
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.orderNumber}.pdf"`
      }
    })
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)



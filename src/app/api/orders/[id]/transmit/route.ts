import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withErrorHandling, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrderPdfDocument } from '@/lib/pdf/order-document'
import { emailService } from '@/lib/email-service'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export const runtime = 'nodejs'

export const POST = withAuth(
  withErrorHandling(async (request: NextRequest, context: { params: { id: string } }, session: any) => {
    const id = context.params.id
    if (!id) return createErrorResponse('ID manquant', 400)

    const user = session.user as ExtendedUser
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        franchise: { include: { user: { select: { firstName: true, lastName: true, email: true }, }, }, },
        orderItems: {
          include: {
            product: { select: { name: true, sku: true, unit: true } },
            warehouse: { select: { name: true, city: true } }
          }
        }
      }
    })

    if (!order) return createErrorResponse('Commande introuvable', 404)

    if (user.role === UserRole.FRANCHISEE && order.franchiseId !== user.franchiseId) {
      return createErrorResponse('Permissions insuffisantes', 403)
    }

    const body = await request.json().catch(() => ({})) as { attachmentUrls?: string[] }

    // Générer le PDF du bon de commande
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

    // Récupérer les emails des admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true } })
    const to = admins.map(a => a.email).filter(Boolean) as string[]
    if (to.length === 0) {
      return createErrorResponse('Aucun administrateur destinataire', 500)
    }

    const subject = `Transmission bon de commande ${order.orderNumber}`
    const text = `Le franchisé a transmis le bon de commande ${order.orderNumber}.`
    const html = `<p>Le franchisé a transmis le bon de commande <strong>${order.orderNumber}</strong>.</p>`

    const extraAttachments = Array.isArray(body.attachmentUrls) ? body.attachmentUrls
      .filter(u => typeof u === 'string' && u.trim())
      .map(u => ({ filename: u.split('/').pop() || 'document.pdf', path: u, contentType: 'application/pdf' })) : []

    await emailService.sendEmail({
      to,
      subject,
      text,
      html,
      attachments: [
        { filename: `${order.orderNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
        ...extraAttachments
      ]
    })

    if (order.status === 'DRAFT' || (order.status as any) === 'PAID') {
      await prisma.order.update({ 
        where: { id: order.id }, 
        data: { 
          status: 'PENDING' as any,
          transmittedAttachmentUrls: body.attachmentUrls ? JSON.stringify(body.attachmentUrls) : null
        } as any
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'orders',
        recordId: order.id,
        newValues: JSON.stringify({ transmitted: true, attachmentUrls: (body.attachmentUrls || []) }),
        userId: user.id
      }
    })

    try {
      const notifData = {
        type: NotificationType.DOCUMENT_TRANSMITTED,
        priority: NotificationPriority.MEDIUM,
        title: 'Bon de commande transmis',
        message: `Le bon de commande ${order.orderNumber} a été transmis`,
        data: { orderNumber: order.orderNumber },
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        franchiseId: order.franchiseId,
        actionUrl: `/admin/orders/${order.id}`
      } as const
      await notificationEmailService.createNotificationWithEmail(
        { ...notifData, targetRole: 'ADMIN' }
      )
    } catch (e) {
      console.error('Erreur notification transmission:', e)
    }

    return createSuccessResponse({ transmitted: true })
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)



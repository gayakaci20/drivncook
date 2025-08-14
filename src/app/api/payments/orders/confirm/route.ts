import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExtendedUser } from '@/types/auth'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    const user = session.user as ExtendedUser

    const { paymentIntentId } = await request.json().catch(() => ({})) as { paymentIntentId?: string }
    if (!paymentIntentId) return NextResponse.json({ success: false, error: 'paymentIntentId requis' }, { status: 400 })

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return NextResponse.json({ success: false, error: 'Stripe non configuré' }, { status: 500 })
    const stripe = new Stripe(stripeSecret)

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    const meta = (pi.metadata || {}) as any
    if (pi.status !== 'succeeded' || meta.purpose !== 'ORDER') {
      return NextResponse.json({ success: false, error: 'Paiement non confirmé' }, { status: 400 })
    }

    if (user.role === 'FRANCHISEE' && meta.franchiseId !== user.franchiseId) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    await prisma.order.update({ where: { id: meta.orderId }, data: { status: 'PAID' as any } })
    if (meta.invoiceId) {
      await prisma.invoice.update({ where: { id: meta.invoiceId }, data: { paymentStatus: 'PAID', paidDate: new Date() } })
    }

    try {
      const order = await prisma.order.findUnique({ where: { id: meta.orderId } })
      if (order) {
        const notif = {
          type: NotificationType.PAYMENT_RECEIVED,
          priority: NotificationPriority.MEDIUM,
          title: 'Paiement commande reçu',
          message: `Paiement reçu pour la commande ${order.orderNumber}`,
          data: { orderNumber: order.orderNumber },
          relatedEntityId: meta.orderId,
          relatedEntityType: 'order',
          franchiseId: order.franchiseId,
          actionUrl: `/franchise/orders?view=${order.id}`
        } as const
        await notificationEmailService.createNotificationWithEmail(
          { ...notif, targetRole: 'FRANCHISEE' }
        )
        await notificationEmailService.createNotificationWithEmail(
          { ...notif, targetRole: 'ADMIN' }
        )
      }
    } catch (e) {
      console.error('Erreur notification paiement commande:', e)
    }

    return NextResponse.json({ success: true, orderId: meta.orderId, invoiceId: meta.invoiceId })
  } catch (error) {
    console.error('Erreur confirm commande:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export const runtime = 'nodejs'


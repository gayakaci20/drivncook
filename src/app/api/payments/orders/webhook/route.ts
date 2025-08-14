import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret)
  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook commande signature verification failed:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purpose = session.metadata?.purpose
      const orderId = session.metadata?.orderId
      const invoiceId = session.metadata?.invoiceId
      if (purpose === 'ORDER' && orderId) {
        const updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' as any } })
        if (invoiceId) {
          await prisma.invoice.update({ where: { id: invoiceId }, data: { paymentStatus: 'PAID', paidDate: new Date() } })
        }
        try {
          const notif = {
            type: NotificationType.PAYMENT_RECEIVED,
            priority: NotificationPriority.MEDIUM,
            title: 'Paiement commande reçu',
            message: `Paiement reçu pour la commande ${updatedOrder.orderNumber}`,
            data: { orderNumber: updatedOrder.orderNumber },
            relatedEntityId: updatedOrder.id,
            relatedEntityType: 'order',
            franchiseId: updatedOrder.franchiseId,
            actionUrl: `/franchise/orders?view=${updatedOrder.id}`
          } as const
          await notificationEmailService.createNotificationWithEmail(
            { ...notif, targetRole: 'FRANCHISEE' }
          )
          await notificationEmailService.createNotificationWithEmail(
            { ...notif, targetRole: 'ADMIN' }
          )
        } catch (e) {
          console.error('Erreur notif webhook order payment:', e)
        }
      }
    }
  } catch (err) {
    console.error('Erreur traitement webhook commande:', err)
  }

  return NextResponse.json({ received: true })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

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
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purpose = session.metadata?.purpose
      const franchiseId = session.metadata?.franchiseId
      if (purpose === 'ENTRY_FEE' && franchiseId) {
        await prisma.franchise.update({
          where: { id: franchiseId },
          data: { entryFeePaid: true, entryFeeDate: new Date(), status: 'ACTIVE' },
        })
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent
      const purpose = (pi.metadata as any)?.purpose
      const franchiseId = (pi.metadata as any)?.franchiseId
      if (purpose === 'ENTRY_FEE' && franchiseId) {
        await prisma.franchise.update({
          where: { id: franchiseId },
          data: { entryFeePaid: true, entryFeeDate: new Date(), status: 'ACTIVE' },
        })
      }
    }
  } catch (err) {
    console.error('Erreur traitement webhook:', err)
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


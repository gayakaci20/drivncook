import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExtendedUser } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

    const user = session.user as ExtendedUser
    const { orderId } = await request.json().catch(() => ({})) as { orderId?: string }
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 })
    if (user.role === 'FRANCHISEE' && user.franchiseId !== order.franchiseId) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const amountInCents = Math.round(Number(order.totalAmount) * 100)
    if (!amountInCents || amountInCents <= 0) {
      return NextResponse.json({ success: false, error: 'Montant invalide' }, { status: 400 })
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return NextResponse.json({ success: false, error: 'Stripe non configuré' }, { status: 500 })
    const stripe = new Stripe(stripeSecret)

    let invoice = await prisma.invoice.findFirst({ where: { description: { equals: `Commande ${order.orderNumber}` }, franchiseId: order.franchiseId } })
    if (!invoice) {
      const invoiceCount = await prisma.invoice.count()
      const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          dueDate,
          amount: order.totalAmount,
          description: `Commande ${order.orderNumber}`,
          franchiseId: order.franchiseId
        }
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        purpose: 'ORDER',
        orderId: order.id,
        invoiceId: invoice.id,
        franchiseId: order.franchiseId,
        userId: user.id,
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ success: true, clientSecret: paymentIntent.client_secret, invoiceId: invoice.id })
  } catch (error) {
    console.error('Erreur PI commande:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export const runtime = 'nodejs'


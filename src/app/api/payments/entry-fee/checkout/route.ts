import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExtendedUser } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const user = session.user as ExtendedUser
    if (!user.franchiseId) {
      return NextResponse.json({ success: false, error: 'Aucune franchise associée' }, { status: 400 })
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id: user.franchiseId },
      select: { id: true, businessName: true, entryFee: true, entryFeePaid: true }
    })

    if (!franchise) {
      return NextResponse.json({ success: false, error: 'Franchise introuvable' }, { status: 404 })
    }

    if (franchise.entryFeePaid) {
      return NextResponse.json({ success: false, error: 'Frais d\'entrée déjà réglés' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({})) as {
      amountInCents?: number
      description?: string
      couponCode?: string
      successUrl?: string
      cancelUrl?: string
    }

    const defaultAmount = Math.round(Number(franchise.entryFee))
    const amountInCents = typeof body.amountInCents === 'number' && body.amountInCents > 0
      ? Math.floor(body.amountInCents)
      : defaultAmount

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      console.error('STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ success: false, error: 'Configuration Stripe manquante' }, { status: 500 })
    }
    const stripe = new Stripe(stripeSecret)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = body.successUrl || `${baseUrl}/franchise/dashboard?payment=success`
    const cancelUrl = body.cancelUrl || `${baseUrl}/franchise/dashboard?payment=cancelled`

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountInCents,
            product_data: {
              name: body.description || `Frais d'entrée - ${franchise.businessName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        franchiseId: franchise.id,
        userId: user.id,
        purpose: 'ENTRY_FEE',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ success: true, url: sessionCheckout.url })
  } catch (error) {
    console.error('Erreur Stripe checkout:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}



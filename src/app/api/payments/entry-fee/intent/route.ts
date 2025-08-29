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
      return NextResponse.json({ success: false, error: 'Frais déjà réglés' }, { status: 400 })
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      return NextResponse.json({ success: false, error: 'Configuration Stripe manquante' }, { status: 500 })
    }
    const stripe = new Stripe(stripeSecret)

    const amount = Math.round(Number(franchise.entryFee))

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: {
        purpose: 'ENTRY_FEE',
        franchiseId: franchise.id,
        userId: user.id,
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ success: true, clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Erreur creation PaymentIntent:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
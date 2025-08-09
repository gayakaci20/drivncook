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
    if (!user.franchiseId) return NextResponse.json({ success: false, error: 'Aucune franchise' }, { status: 400 })

    const { paymentIntentId } = await request.json().catch(() => ({})) as { paymentIntentId?: string }
    if (!paymentIntentId) return NextResponse.json({ success: false, error: 'paymentIntentId requis' }, { status: 400 })

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return NextResponse.json({ success: false, error: 'Stripe non configuré' }, { status: 500 })
    const stripe = new Stripe(stripeSecret)

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    const meta = (pi.metadata || {}) as any
    if (pi.status !== 'succeeded' || meta.purpose !== 'ENTRY_FEE' || meta.franchiseId !== user.franchiseId) {
      return NextResponse.json({ success: false, error: 'Paiement non confirmé' }, { status: 400 })
    }

    await prisma.franchise.update({
      where: { id: user.franchiseId },
      data: { entryFeePaid: true, entryFeeDate: new Date(), status: 'ACTIVE' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur confirm entry-fee:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
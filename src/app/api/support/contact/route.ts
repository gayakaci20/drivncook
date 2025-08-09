import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const { subject, message } = await request.json()
    if (!message || !subject) {
      return NextResponse.json({ success: false, error: 'Sujet et message requis' }, { status: 400 })
    }

    const html = `
      <p>Message support reçu depuis l'espace franchisé.</p>
      <p><strong>Utilisateur:</strong> ${session.user.name || session.user.email}</p>
      <p><strong>Email:</strong> ${session.user.email}</p>
      <p><strong>Objet:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <pre>${String(message).replace(/</g, '&lt;')}</pre>
    `

    const to = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'support@drivncook.com'
    const result = await emailService.sendEmail({ to, subject: `[Support] ${subject}`, html })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Échec envoi email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 })
  }
}



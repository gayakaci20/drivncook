import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'L\'adresse email est requise' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        isActive: true 
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation'
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: user.email,
        value: resetToken,
        expiresAt: resetTokenExpiry,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`

    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: 'DRIV\'N COOK - Réinitialisation de votre mot de passe',
      html: generateResetPasswordHTML({
        firstName: user.firstName,
        lastName: user.lastName,
        resetUrl,
        expiryTime: '1 heure'
      }),
      text: generateResetPasswordText({
        firstName: user.firstName,
        lastName: user.lastName,
        resetUrl,
        expiryTime: '1 heure'
      })
    })

    if (!emailResult.success) {
      console.error('Error sending reset password email:', emailResult.error)
      return NextResponse.json(
        { success: false, error: 'Error sending reset password email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Un email de réinitialisation a été envoyé'
    })

  } catch (error) {
    console.error('Erreur API forgot-password:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

function generateResetPasswordHTML({
  firstName,
  lastName,
  resetUrl,
  expiryTime
}: {
  firstName: string
  lastName: string
  resetUrl: string
  expiryTime: string
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
    <style>
        :root {
          --brand-primary: #dc2626;
          --brand-primary-2: #ef4444;
          --brand-primary-3: #be123c;
          --text: #0f172a;
          --muted: #475569;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
        }
        html, body { margin: 0; padding: 0; background: var(--bg); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; color: var(--text); }
        .container { max-width: 680px; margin: 0 auto; padding: 24px; }
        .card { background: var(--card); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); border: 1px solid var(--border); }
        .header { background: linear-gradient(135deg, var(--brand-primary-3) 0%, var(--brand-primary) 40%, var(--brand-primary-2) 100%); padding: 28px 24px; color: #fff; text-align: left; }
        .brand { font-weight: 800; letter-spacing: 0.5px; font-size: 18px; opacity: 0.95; }
        .headline { margin-top: 6px; font-size: 13px; opacity: 0.9; }
        .content { padding: 26px; }
        .title { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; }
        .paragraph { margin: 14px 0; line-height: 1.7; color: var(--muted); font-size: 14px; }
        .pill { display: inline-flex; align-items: center; gap: 8px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
        .cta { display: inline-block; background: linear-gradient(135deg, var(--brand-primary-3) 0%, var(--brand-primary) 50%, var(--brand-primary-2) 100%); color: #fff; text-decoration: none; padding: 14px 22px; border-radius: 12px; font-weight: 800; letter-spacing: 0.2px; }
        .cta:hover { filter: brightness(1.05); }
        .callout { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; padding: 12px 14px; border-radius: 12px; font-weight: 700; text-align: center; margin: 18px 0; }
        .info { background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: 12px; margin: 16px 0; }
        .footer { padding: 18px 24px; border-top: 1px solid var(--border); color: #94a3b8; font-size: 12px; text-align: center; }
        .link { color: var(--brand-primary); text-decoration: underline; }
    </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">DRIV'N COOK</div>
        <div class="headline">Système de gestion de franchise</div>
      </div>
      <div class="content">
        <div class="pill">Réinitialisation de mot de passe</div>
        <h1 class="title">Réinitialisation de votre mot de passe</h1>
        <p class="paragraph">Bonjour ${firstName} ${lastName},</p>
        <p class="paragraph">Vous avez demandé la réinitialisation de votre mot de passe pour votre compte DRIV'N COOK.</p>
        <p class="paragraph">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <p style="margin: 22px 0;"><a href="${resetUrl}" class="cta">Réinitialiser mon mot de passe</a></p>
        <div class="callout">Ce lien expire dans ${expiryTime}</div>
        <div class="info">
          <strong>Informations de sécurité</strong>
          <ul style="margin: 8px 0 0 18px; padding: 0; color: var(--muted);">
            <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
            <li>Ne partagez jamais ce lien avec qui que ce soit</li>
            <li>Ce lien n'est valable qu'une seule fois</li>
          </ul>
        </div>
        <p class="paragraph">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/><span class="link">${resetUrl}</span></p>
      </div>
      <div class="footer">
        <div>Cet email a été envoyé automatiquement par le système DRIV'N COOK.</div>
        <div>© ${new Date().getFullYear()} DRIV'N COOK. Tous droits réservés.</div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

function generateResetPasswordText({
  firstName,
  lastName,
  resetUrl,
  expiryTime
}: {
  firstName: string
  lastName: string
  resetUrl: string
  expiryTime: string
}) {
  return `
=== DRIV'N COOK - Réinitialisation de mot de passe ===

Bonjour ${firstName} ${lastName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte DRIV'N COOK.

Pour créer un nouveau mot de passe, cliquez sur le lien suivant :
${resetUrl}

IMPORTANT : Ce lien expire dans ${expiryTime}

SÉCURITÉ :
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec qui que ce soit
- Ce lien n'est valable qu'une seule fois

---
Cet email a été envoyé automatiquement par le système DRIV'N COOK.
© ${new Date().getFullYear()} DRIV'N COOK. Tous droits réservés.
  `.trim()
}

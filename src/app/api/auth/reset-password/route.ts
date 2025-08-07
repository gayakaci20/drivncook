import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier le token de réinitialisation
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email.toLowerCase(),
        value: token,
        expiresAt: {
          gt: new Date() // Token non expiré
        }
      }
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Supprimer le token utilisé
    await prisma.verification.delete({
      where: { id: verification.id }
    })

    // Supprimer tous les autres tokens de réinitialisation pour cet utilisateur
    await prisma.verification.deleteMany({
      where: {
        identifier: email.toLowerCase(),
        expiresAt: {
          gt: new Date()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API reset-password:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

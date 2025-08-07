import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { notificationEmailService } from '@/lib/notification-email-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

const requestDocumentsSchema = z.object({
  missingDocuments: z.array(z.string()).optional(),
  customMessage: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validationResult = requestDocumentsSchema.safeParse(body)
    
    if (!validationResult.success) {
      return createErrorResponse(
        `Données invalides: ${validationResult.error.issues.map(issue => issue.message).join(', ')}`,
        400
      )
    }

    const { missingDocuments, customMessage } = validationResult.data
    const franchiseId = params.id

    // Récupérer les informations de la franchise
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!franchise) {
      return createErrorResponse('Franchise non trouvée', 404)
    }

    // Déterminer les documents manquants automatiquement si non spécifiés
    const autoDetectedMissingDocs = []
    if (!franchise.kbisDocument) {
      autoDetectedMissingDocs.push('Document KBIS')
    }
    if (!franchise.idCardDocument) {
      autoDetectedMissingDocs.push('Carte d\'identité')
    }

    const finalMissingDocuments = missingDocuments?.length 
      ? missingDocuments 
      : autoDetectedMissingDocs

    if (finalMissingDocuments.length === 0) {
      return createErrorResponse('Aucun document manquant détecté', 400)
    }

    // Préparer le message
    const documentsListText = finalMissingDocuments.map(doc => `• ${doc}`).join('\n')
    
    const defaultMessage = `Bonjour ${franchise.user.firstName},\n\nNous avons examiné votre dossier de franchise et nous avons besoin des documents suivants pour finaliser votre validation :\n\n${documentsListText}\n\nMerci de nous faire parvenir ces documents dès que possible via votre espace franchisé ou par email en réponse à ce message.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nL'équipe DRIV'N COOK`
    
    const emailMessage = customMessage || defaultMessage

    // Envoyer l'email via le service de notifications
    const emailResult = await notificationEmailService.createNotificationWithEmail(
      {
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: 'Documents requis pour votre franchise DRIV\'N COOK',
        message: emailMessage,
        targetUserId: franchise.user.id,
        targetRole: 'FRANCHISEE',
        franchiseId: franchise.id,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/franchise/profile`,
        data: {
          missingDocuments: finalMissingDocuments,
          businessName: franchise.businessName,
          siretNumber: franchise.siretNumber,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'), // 7 jours
        }
      },
      {
        id: franchise.user.id,
        email: franchise.user.email,
        name: `${franchise.user.firstName} ${franchise.user.lastName}`,
        role: 'FRANCHISEE',
        franchiseId: franchise.id
      }
    )

    if (!emailResult.emailResult?.success) {
      return createErrorResponse(
        `Erreur lors de l'envoi de l'email: ${emailResult.emailResult?.error || 'Erreur inconnue'}`,
        500
      )
    }

    // Enregistrer la demande dans les logs/historique si nécessaire
    await prisma.franchise.update({
      where: { id: franchiseId },
      data: {
        // On pourrait ajouter un champ lastDocumentRequest ou similar
        updatedAt: new Date()
      }
    })

    return createSuccessResponse(
      {
        success: true,
        emailSent: true,
        missingDocuments: finalMissingDocuments,
        recipientEmail: franchise.user.email,
        messageId: emailResult.emailResult?.messageId
      },
      `Email de demande de documents envoyé avec succès à ${franchise.user.firstName} ${franchise.user.lastName}`
    )

  } catch (error) {
    console.error('Erreur lors de la demande de documents:', error)
    return createErrorResponse('Erreur interne du serveur', 500)
  }
}

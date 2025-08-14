    import { NextRequest } from 'next/server'
    import { prisma } from '@/lib/prisma'
    import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
    import { notificationEmailService } from '@/lib/notification-service'
    import { NotificationType, NotificationPriority } from '@/types/notifications'

    export async function POST(
    request: NextRequest,
    context: { params: { id: string } }
    ) {
    try {
        const { params } = await Promise.resolve(context)
        const franchiseId = params.id

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

        const missingDocuments = []
        if (!franchise.kbisDocument) {
        missingDocuments.push('Document KBIS')
        }
        if (!franchise.idCardDocument) {
        missingDocuments.push('Carte d\'identité')
        }

        if (missingDocuments.length > 0) {
        return createErrorResponse(
            `Documents manquants: ${missingDocuments.join(', ')}. Tous les documents doivent être présents avant validation.`,
            400
        )
        }

        let statusUpdated = false
        if (franchise.status === 'PENDING') {
        await prisma.franchise.update({
            where: { id: franchiseId },
            data: {
            status: 'ACTIVE',
            updatedAt: new Date()
            }
        })
        statusUpdated = true

        await prisma.user.update({
            where: { id: franchise.user.id },
            data: {
            isActive: true,
            franchiseId: franchiseId
            }
        })
        }

        try {
        const emailResult = await notificationEmailService.createNotificationWithEmail(
            {
            type: NotificationType.FRANCHISE_APPROVED,
            priority: NotificationPriority.HIGH,
            title: statusUpdated ? 'Félicitations ! Votre franchise est validée' : 'Documents validés avec succès',
            message: statusUpdated 
                ? `Bonjour ${franchise.user.firstName},\n\nNous avons le plaisir de vous informer que votre franchise ${franchise.businessName} a été approuvée et validée !\n\nTous vos documents ont été vérifiés et acceptés. Votre compte est maintenant actif et vous pouvez commencer vos activités.\n\nVoici ce qui vous attend :\n• Accès complet à votre espace franchisé\n• Commande de produits et équipements\n• Gestion de vos véhicules\n• Suivi de vos ventes et rapports\n\nBienvenue dans le réseau DRIV'N COOK ! Notre équipe reste à votre disposition pour vous accompagner.\n\nCordialement,\nL'équipe DRIV'N COOK`
                : `Bonjour ${franchise.user.firstName},\n\nNous vous confirmons que tous vos documents ont été validés avec succès !\n\nDocuments validés :\n• Document KBIS ✓\n• Carte d'identité ✓\n\nVotre dossier est maintenant complet et conforme.\n\nCordialement,\nL'équipe DRIV'N COOK`,
            targetUserId: franchise.user.id,
            targetRole: 'FRANCHISEE',
            franchiseId: franchise.id,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/franchise/dashboard`,
            data: {
                businessName: franchise.businessName,
                siretNumber: franchise.siretNumber,
                newStatus: statusUpdated ? 'ACTIVE' : franchise.status,
                documentsValidated: ['KBIS', 'Carte d\'identité'],
                validationDate: new Date().toLocaleDateString('fr-FR')
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

        if (statusUpdated) {
            await notificationEmailService.createNotificationWithEmail(
            {
                type: NotificationType.FRANCHISE_APPROVED,
                priority: NotificationPriority.MEDIUM,
                title: 'Nouvelle franchise activée',
                message: `La franchise ${franchise.businessName} (${franchise.user.firstName} ${franchise.user.lastName}) a été validée et activée avec succès.\n\nDétails :\n- SIRET : ${franchise.siretNumber}\n- Email : ${franchise.user.email}\n- Région : ${franchise.region}\n- Statut : ACTIVE\n\nLe franchisé a reçu un email de confirmation et peut maintenant accéder à toutes les fonctionnalités de la plateforme.`,
                targetRole: 'ADMIN',
                franchiseId: franchise.id,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/franchises/${franchise.id}`,
                data: {
                businessName: franchise.businessName,
                contactName: `${franchise.user.firstName} ${franchise.user.lastName}`,
                contactEmail: franchise.user.email,
                siretNumber: franchise.siretNumber,
                region: franchise.region,
                validationDate: new Date().toLocaleDateString('fr-FR')
                }
            },
            undefined,
            { sendEmail: true, includeDefaultRecipients: true }
            )
        }

        } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de validation:', emailError)
        }

        return createSuccessResponse(
        {
            success: true,
            statusUpdated,
            newStatus: statusUpdated ? 'ACTIVE' : franchise.status,
            documentsValidated: ['KBIS', 'Carte d\'identité'],
            recipientEmail: franchise.user.email,
            validationDate: new Date().toISOString()
        },
        statusUpdated 
            ? `Franchise validée et activée avec succès ! ${franchise.user.firstName} ${franchise.user.lastName} a reçu un email de confirmation.`
            : `Documents validés avec succès ! ${franchise.user.firstName} ${franchise.user.lastName} a reçu un email de confirmation.`
        )

    } catch (error) {
        console.error('Erreur lors de la validation des documents:', error)
        return createErrorResponse('Erreur interne du serveur', 500)
    }
    }

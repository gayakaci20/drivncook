import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

import { auth } from '@/lib/auth'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { notificationEmailService } from '@/lib/notification-email-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

 
const adminRegistrationSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

 
const franchiseeRegistrationSchema = z.object({
   
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  personalPhone: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  drivingLicense: z.string().optional(),
  
   
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siretNumber: z.string().min(14, 'Le numéro SIRET doit contenir 14 chiffres'),
  vatNumber: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().min(5, 'Le code postal est requis'),
  region: z.string().min(2, 'La région est requise'),
  contactEmail: z.string().email('Email de contact invalide'),
  contactPhone: z.string().min(10, 'Le téléphone de contact est requis'),
  
   
  kbisDocument: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string().url(),
  })).optional(),
  idCardDocument: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string().url(),
  })).optional(),
  
   
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  
   
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions générales'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
     
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN }
    })

    const isFirstUser = adminCount === 0

     
    const schema = isFirstUser ? adminRegistrationSchema : franchiseeRegistrationSchema
    const validationResult = schema.safeParse(body)
    
    if (!validationResult.success) {
      return createErrorResponse(
        `Données invalides: ${validationResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        400
      )
    } 

    const data = validationResult.data

     
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return createErrorResponse('Cette adresse email est déjà utilisée', 400)
    }

    if (isFirstUser) {
       
      const authResult = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName: data.lastName,
          role: UserRole.ADMIN,
          isActive: true  
        }
      })

      if (!authResult) {
        return createErrorResponse('Erreur lors de la création du compte administrateur', 500)
      }

      // Envoyer un email de bienvenue à l'administrateur
      try {
        const user = authResult.user as ExtendedUser
        await notificationEmailService.createNotificationWithEmail(
          {
            type: NotificationType.USER_REGISTERED,
            priority: NotificationPriority.HIGH,
            title: 'Bienvenue sur DRIV\'N COOK !',
            message: `Bonjour ${user.firstName},\n\nVotre compte administrateur a été créé avec succès ! Vous pouvez maintenant vous connecter et commencer à gérer votre plateforme DRIV'N COOK.\n\nVos informations de connexion :\n- Email : ${user.email}\n- Rôle : Administrateur\n\nNous vous recommandons de vous connecter dès maintenant pour configurer votre plateforme.`,
            targetUserId: user.id,
            targetRole: 'ADMIN',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
            data: {
              userRole: 'Administrateur',
              loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
            }
          },
          {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: 'ADMIN'
          }
        )
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue administrateur:', emailError)
        // On ne fait pas échouer l'inscription si l'email ne peut pas être envoyé
      }

      return createSuccessResponse(
        { 
          user: {
            id: authResult.user.id,
            email: (authResult.user as ExtendedUser).email,
            firstName: (authResult.user as ExtendedUser).firstName,
            lastName: (authResult.user as ExtendedUser).lastName,
            role: (authResult.user as ExtendedUser).role,
            isActive: (authResult.user as ExtendedUser).isActive,
            createdAt: (authResult.user as ExtendedUser).createdAt
          }
        },
        'Compte administrateur créé avec succès ! Un email de bienvenue vous a été envoyé. Vous pouvez maintenant vous connecter.'
      )
    } else {
       
      
       
      const franchiseData = data as z.infer<typeof franchiseeRegistrationSchema>
      if (franchiseData.contactEmail !== franchiseData.email) {
        const existingContactEmail = await prisma.franchise.findFirst({
          where: { contactEmail: franchiseData.contactEmail }
        })

        if (existingContactEmail) {
          return createErrorResponse('Cette adresse email de contact est déjà utilisée', 400)
        }
      }

       
      const existingSiret = await prisma.franchise.findUnique({
        where: { siretNumber: franchiseData.siretNumber }
      })

      if (existingSiret) {
        return createErrorResponse('Ce numéro SIRET est déjà utilisé', 400)
      }

       
      const authResult = await auth.api.signUpEmail({
        body: {
          email: franchiseData.email,
          password: franchiseData.password,
          name: `${franchiseData.firstName} ${franchiseData.lastName}`,
          firstName: franchiseData.firstName,
          lastName: franchiseData.lastName,
          phone: franchiseData.personalPhone,
          role: UserRole.FRANCHISEE,
          isActive: false  
        }
      })

      if (!authResult) {
        return createErrorResponse('Erreur lors de la création du compte', 500)
      }

       
      const result = await prisma.$transaction(async (tx: any) => {
         
        const franchise = await tx.franchise.create({
          data: {
            userId: authResult.user.id,
            businessName: franchiseData.businessName,
            siretNumber: franchiseData.siretNumber,
            vatNumber: franchiseData.vatNumber,
            address: franchiseData.address,
            city: franchiseData.city,
            postalCode: franchiseData.postalCode,
            region: franchiseData.region,
            contactEmail: franchiseData.contactEmail,
            contactPhone: franchiseData.contactPhone,
            status: 'PENDING',  
            personalEmail: franchiseData.personalEmail || null,
            drivingLicense: franchiseData.drivingLicense || null,
            kbisDocument: franchiseData.kbisDocument && franchiseData.kbisDocument.length > 0 ? franchiseData.kbisDocument[0].url : null,
            idCardDocument: franchiseData.idCardDocument && franchiseData.idCardDocument.length > 0 ? franchiseData.idCardDocument[0].url : null
          },
        })

        // Mettre à jour l'utilisateur avec le franchiseId
        await tx.user.update({
          where: { id: authResult.user.id },
          data: { franchiseId: franchise.id }
        })

        return franchise
      })

      // Envoyer un email de confirmation d'inscription au franchisé
      try {
        const user = authResult.user as ExtendedUser
        await notificationEmailService.createNotificationWithEmail(
          {
            type: NotificationType.USER_REGISTERED,
            priority: NotificationPriority.HIGH,
            title: 'Inscription reçue - DRIV\'N COOK',
            message: `Bonjour ${user.firstName},\n\nNous avons bien reçu votre demande d'inscription en tant que franchisé DRIV'N COOK.\n\nInformations de votre demande :\n- Entreprise : ${franchiseData.businessName}\n- Email professionnel : ${user.email}\n- SIRET : ${franchiseData.siretNumber}\n- Statut : En cours de traitement\n\nNotre équipe va maintenant examiner votre dossier. Vous recevrez un email de confirmation une fois votre compte validé et activé.\n\nMerci de votre confiance !`,
            targetUserId: user.id,
            targetRole: 'FRANCHISEE',
            franchiseId: result.id,
            data: {
              businessName: franchiseData.businessName,
              siretNumber: franchiseData.siretNumber,
              status: 'PENDING',
              userRole: 'Franchisé'
            }
          },
          {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: 'FRANCHISEE',
            franchiseId: result.id
          }
        )

        // Notifier les administrateurs de la nouvelle demande
        await notificationEmailService.createNotificationWithEmail(
          {
            type: NotificationType.FRANCHISE_APPROVED, // Utiliser ce type pour les nouvelles demandes
            priority: NotificationPriority.HIGH,
            title: 'Nouvelle demande de franchise',
            message: `Une nouvelle demande de franchise a été soumise :\n\n- Entreprise : ${franchiseData.businessName}\n- Contact : ${user.firstName} ${user.lastName}\n- Email : ${user.email}\n- SIRET : ${franchiseData.siretNumber}\n- Région : ${franchiseData.region}\n\nVeuillez examiner et traiter cette demande dans l'interface d'administration.`,
            targetRole: 'ADMIN',
            franchiseId: result.id,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/franchises/${result.id}`,
            data: {
              businessName: franchiseData.businessName,
              contactName: `${user.firstName} ${user.lastName}`,
              contactEmail: user.email,
              siretNumber: franchiseData.siretNumber,
              region: franchiseData.region,
              franchiseId: result.id
            }
          },
          undefined, // Les administrateurs seront automatiquement inclus
          { sendEmail: true, includeDefaultRecipients: true }
        )
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi des emails d\'inscription franchisé:', emailError)
        // On ne fait pas échouer l'inscription si l'email ne peut pas être envoyé
      }

      return createSuccessResponse(
        { 
          id: result.id,
          businessName: result.businessName,
          status: result.status,
          user: {
            id: authResult.user.id,
            email: (authResult.user as ExtendedUser).email,
            firstName: (authResult.user as ExtendedUser).firstName,
            lastName: (authResult.user as ExtendedUser).lastName,
            phone: (authResult.user as ExtendedUser).phone,
            isActive: (authResult.user as ExtendedUser).isActive,
            createdAt: (authResult.user as ExtendedUser).createdAt
          }
        },
        'Inscription réussie ! Un email de confirmation vous a été envoyé. Votre demande est en cours de traitement.'
      )
    }

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return createErrorResponse('Erreur interne du serveur', 500)
  }
}
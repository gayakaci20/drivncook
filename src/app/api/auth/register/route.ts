import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { UserRole } from '@prisma/client'

const registerSchema = z.object({
  // Informations personnelles
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  personalPhone: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  drivingLicense: z.string().optional(),
  
  // Informations entreprise
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siretNumber: z.string().min(14, 'Le numéro SIRET doit contenir 14 chiffres'),
  vatNumber: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().min(5, 'Le code postal est requis'),
  region: z.string().min(2, 'La région est requise'),
  contactEmail: z.string().email('Email de contact invalide'),
  contactPhone: z.string().min(10, 'Le téléphone de contact est requis'),
  
  // Sécurité
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  
  // Acceptation
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
    
    // Validation des données
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        `Données invalides: ${validationResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        400
      )
    } 

    const data = validationResult.data

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return createErrorResponse('Cette adresse email est déjà utilisée', 400)
    }

    // Vérifier si l'email de contact existe déjà
    if (data.contactEmail !== data.email) {
      const existingContactEmail = await prisma.franchise.findFirst({
        where: { contactEmail: data.contactEmail }
      })

      if (existingContactEmail) {
        return createErrorResponse('Cette adresse email de contact est déjà utilisée', 400)
      }
    }

    // Vérifier si le SIRET existe déjà
    const existingSiret = await prisma.franchise.findUnique({
      where: { siretNumber: data.siretNumber }
    })

    if (existingSiret) {
      return createErrorResponse('Ce numéro SIRET est déjà utilisé', 400)
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Créer l'utilisateur et le franchisé en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.personalPhone,
          role: UserRole.FRANCHISEE,
          isActive: false // En attente de validation
        }
      })

      // Créer le franchisé
      const franchise = await tx.franchise.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          siretNumber: data.siretNumber,
          vatNumber: data.vatNumber,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          region: data.region,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          status: 'PENDING', // En attente de validation
          personalEmail: data.personalEmail || null,
          drivingLicense: data.drivingLicense || null
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              createdAt: true
            }
          }
        }
      })

      return franchise
    })

    return createSuccessResponse(
      { 
        id: result.id,
        businessName: result.businessName,
        status: result.status,
        user: result.user
      },
      'Inscription réussie ! Votre demande est en cours de traitement. Vous recevrez un email de confirmation une fois votre compte validé.'
    )

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return createErrorResponse('Erreur interne du serveur', 500)
  }
}
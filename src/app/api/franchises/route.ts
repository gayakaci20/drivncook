import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse,
  parsePaginationParams,
  createPaginationResponse
} from '@/lib/api-utils'
import { franchiseSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET /api/franchises - Lister les franchisés
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Construire les filtres
    const where: any = {}
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    // Récupérer les franchisés avec pagination
    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        where,
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
          },
          vehicles: {
            select: {
              id: true,
              licensePlate: true,
              brand: true,
              model: true,
              status: true
            }
          },
          _count: {
            select: {
              orders: true,
              salesReports: true,
              invoices: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.franchise.count({ where })
    ])

    const response = createPaginationResponse(franchises, total, page, limit)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)

// POST /api/franchises - Créer un nouveau franchisé
export const POST = withAuth(
  withValidation(
    franchiseSchema.extend({
      userData: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        phone: z.string().optional()
      })
    }),
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      const { userData, ...franchiseData } = validatedData

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        return createErrorResponse('Cette adresse email est déjà utilisée', 400)
      }

      // Vérifier si le SIRET existe déjà
      const existingSiret = await prisma.franchise.findUnique({
        where: { siretNumber: franchiseData.siretNumber }
      })

      if (existingSiret) {
        return createErrorResponse('Ce numéro SIRET est déjà utilisé', 400)
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Créer l'utilisateur et le franchisé en transaction
      const franchise = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            role: UserRole.FRANCHISEE
          }
        })

        return await tx.franchise.create({
          data: {
            ...franchiseData,
            userId: user.id,
            entryFeeDate: franchiseData.entryFeeDate ? new Date(franchiseData.entryFeeDate) : null,
            contractStartDate: franchiseData.contractStartDate ? new Date(franchiseData.contractStartDate) : null,
            contractEndDate: franchiseData.contractEndDate ? new Date(franchiseData.contractEndDate) : null
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
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'franchises',
          recordId: franchise.id,
          newValues: JSON.stringify(franchise),
          userId: session.user.id
        }
      })

      return createSuccessResponse(franchise, 'Franchisé créé avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)
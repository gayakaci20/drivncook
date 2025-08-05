import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse,
  parsePaginationParams,
  createPaginationResponse
} from '@/lib/api-utils'
import { vehicleSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/vehicles - Lister les véhicules
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les permissions
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'FRANCHISE_MANAGER', 'FRANCHISEE']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

    // Construire les filtres
    const where: any = {}
    
    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    // Gestion des permissions pour les franchisés
    if (session.user.role === 'FRANCHISEE') {
      // Les franchisés ne peuvent voir que leurs propres véhicules
      if (session.user.franchiseId) {
        where.franchiseId = session.user.franchiseId
      } else {
        // Si le franchisé n'a pas de franchise associée, ne retourner aucun véhicule
        where.franchiseId = 'non-existent-id'
      }
    } else if (franchiseId) {
      // Pour les admins et managers, respecter le filtre franchiseId s'il est fourni
      where.franchiseId = franchiseId
    }

    // Récupérer les véhicules avec pagination
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          franchise: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          maintenances: {
            select: {
              id: true,
              type: true,
              status: true,
              title: true,
              scheduledDate: true,
              completedDate: true,
              cost: true
            },
            orderBy: { scheduledDate: 'desc' },
            take: 5
          },
          _count: {
            select: {
              maintenances: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.vehicle.count({ where })
    ])

    const response = createPaginationResponse(vehicles, total || 0, page || 1, limit || 10)
    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Erreur API vehicles:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}



// POST /api/vehicles - Créer un nouveau véhicule
export const POST = withAuth(
  withValidation(
    vehicleSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      // Vérifier si la plaque d'immatriculation existe déjà
      const existingPlate = await prisma.vehicle.findUnique({
        where: { licensePlate: validatedData.licensePlate }
      })

      if (existingPlate) {
        return createErrorResponse('Cette plaque d\'immatriculation est déjà utilisée', 400)
      }

      // Vérifier si le VIN existe déjà
      const existingVin = await prisma.vehicle.findUnique({
        where: { vin: validatedData.vin }
      })

      if (existingVin) {
        return createErrorResponse('Ce numéro VIN est déjà utilisé', 400)
      }

      // Si un franchisé est assigné, vérifier qu'il existe
      if (validatedData.franchiseId) {
        const franchise = await prisma.franchise.findUnique({
          where: { id: validatedData.franchiseId }
        })

        if (!franchise) {
          return createErrorResponse('Franchisé introuvable', 400)
        }
      }

      // Préparer les données
      const vehicleData = {
        ...validatedData,
        purchaseDate: new Date(validatedData.purchaseDate),
        lastInspectionDate: validatedData.lastInspectionDate ? new Date(validatedData.lastInspectionDate) : null,
        nextInspectionDate: validatedData.nextInspectionDate ? new Date(validatedData.nextInspectionDate) : null,
        insuranceExpiry: validatedData.insuranceExpiry ? new Date(validatedData.insuranceExpiry) : null
      }

      // Créer le véhicule
      const vehicle = await prisma.vehicle.create({
        data: vehicleData,
        include: {
          franchise: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'vehicles',
          recordId: vehicle.id,
          newValues: JSON.stringify(vehicle),
          userId: session.user.id
        }
      })

      return createSuccessResponse(vehicle, 'Véhicule créé avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)
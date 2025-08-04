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
import { vehicleSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/vehicles - Lister les véhicules
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
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

    if (franchiseId) {
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
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER]
)

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
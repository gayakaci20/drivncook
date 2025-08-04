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
import { maintenanceSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/maintenance - Lister les maintenances
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const vehicleId = searchParams.get('vehicleId') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

    // Construire les filtres
    const where: any = {}
    
    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    // Filtrer par franchise si nécessaire
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.vehicle = {
        franchiseId: session.user.franchiseId
      }
    } else if (franchiseId) {
      where.vehicle = {
        franchiseId: franchiseId
      }
    }

    // Récupérer les maintenances avec pagination
    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        include: {
          vehicle: {
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
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.maintenance.count({ where })
    ])

    const response = createPaginationResponse(maintenances, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// POST /api/maintenance - Créer une nouvelle maintenance
export const POST = withAuth(
  withValidation(
    maintenanceSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      // Vérifier que le véhicule existe
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: validatedData.vehicleId },
        include: {
          franchise: true
        }
      })

      if (!vehicle) {
        return createErrorResponse('Véhicule introuvable', 404)
      }

      // Vérifier les permissions
      if (session.user.role === UserRole.FRANCHISEE && vehicle.franchiseId !== session.user.franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }

      // Créer la maintenance
      const maintenance = await prisma.maintenance.create({
        data: {
          type: validatedData.type,
          status: validatedData.status,
          title: validatedData.title,
          description: validatedData.description,
          scheduledDate: new Date(validatedData.scheduledDate),
          completedDate: validatedData.completedDate ? new Date(validatedData.completedDate) : null,
          cost: validatedData.cost,
          mileage: validatedData.mileage,
          parts: validatedData.parts,
          laborHours: validatedData.laborHours,
          notes: validatedData.notes,
          nextMaintenanceDate: validatedData.nextMaintenanceDate ? new Date(validatedData.nextMaintenanceDate) : null,
          vehicleId: validatedData.vehicleId,
          createdById: session.user.id
        },
        include: {
          vehicle: {
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
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'maintenances',
          recordId: maintenance.id,
          newValues: JSON.stringify(maintenance),
          userId: session.user.id
        }
      })

      return createSuccessResponse(maintenance, 'Maintenance créée avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)
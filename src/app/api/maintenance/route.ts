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
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const vehicleId = searchParams.get('vehicleId') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

     
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

     
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.vehicle = {
        franchiseId: (session.user as ExtendedUser).franchiseId
      }
    } else if (franchiseId) {
      where.vehicle = {
        franchiseId: franchiseId
      }
    }

     
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
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const POST = withAuth(
  withValidation(
    maintenanceSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
       
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: validatedData.vehicleId },
        include: {
          franchise: true
        }
      })

      if (!vehicle) {
        return createErrorResponse('Véhicule introuvable', 404)
      }

       
      if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && vehicle.franchiseId !== (session.user as ExtendedUser).franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }

       
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
          createdById: (session.user as ExtendedUser).id
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

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'maintenances',
          recordId: maintenance.id,
          newValues: JSON.stringify(maintenance),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(maintenance, 'Maintenance créée avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
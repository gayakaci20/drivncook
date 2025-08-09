import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

 
export async function GET(request: NextRequest) {
  try {
     
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

     
    const allowedRoles = [UserRole.ADMIN, UserRole.FRANCHISEE]
    if (!allowedRoles.includes((session.user as ExtendedUser).role)) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const franchiseId = searchParams.get('franchiseId') || ''

     
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

     
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
       
      if ((session.user as ExtendedUser).franchiseId) {
        where.franchiseId = (session.user as ExtendedUser).franchiseId
      } else {
         
        where.franchiseId = 'non-existent-id'
      }
    } else if (franchiseId) {
       
      where.franchiseId = franchiseId
    }

     
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



 
export const POST = withAuth(
  withValidation(
    vehicleSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
       
      const existingPlate = await prisma.vehicle.findUnique({
        where: { licensePlate: validatedData.licensePlate }
      })

      if (existingPlate) {
        return createErrorResponse('Cette plaque d\'immatriculation est déjà utilisée', 400)
      }

       
      const existingVin = await prisma.vehicle.findUnique({
        where: { vin: validatedData.vin }
      })

      if (existingVin) {
        return createErrorResponse('Ce numéro VIN est déjà utilisé', 400)
      }

       
      if (validatedData.franchiseId) {
        const franchise = await prisma.franchise.findUnique({
          where: { id: validatedData.franchiseId }
        })

        if (!franchise) {
          return createErrorResponse('Franchisé introuvable', 400)
        }
      }

       
      const vehicleData = {
        ...validatedData,
        franchiseId: validatedData.franchiseId?.trim() ? validatedData.franchiseId.trim() : undefined,
        purchaseDate: new Date(validatedData.purchaseDate),
        lastInspectionDate: validatedData.lastInspectionDate ? new Date(validatedData.lastInspectionDate) : null,
        nextInspectionDate: validatedData.nextInspectionDate ? new Date(validatedData.nextInspectionDate) : null,
        insuranceExpiry: validatedData.insuranceExpiry ? new Date(validatedData.insuranceExpiry) : null
      }

       
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

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'vehicles',
          recordId: vehicle.id,
          newValues: JSON.stringify(vehicle),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(vehicle, 'Véhicule créé avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
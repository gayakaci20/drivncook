import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { notificationEmailService } from '@/lib/notification-service'
import { NotificationType, NotificationPriority } from '@/types/notifications'

interface RouteContext {
  params: { id: string }
}

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    const where: any = { id }
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.franchiseId = (session.user as ExtendedUser).franchiseId
    }

    const vehicle = await prisma.vehicle.findUnique({
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
            cost: true,
            mileage: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10
        }
      }
    })

    if (!vehicle) {
      return createErrorResponse('Véhicule introuvable', 404)
    }

    return createSuccessResponse(vehicle)
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const PUT = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params
    const body = await request.json()

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing) {
      return createErrorResponse('Véhicule introuvable', 404)
    }

    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
      if (!existing.franchiseId || existing.franchiseId !== (session.user as ExtendedUser).franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }
    }

    if (body.licensePlate && body.licensePlate !== existing.licensePlate) {
      const dupePlate = await prisma.vehicle.findUnique({ where: { licensePlate: body.licensePlate } })
      if (dupePlate && dupePlate.id !== id) {
        return createErrorResponse("Cette plaque d'immatriculation est déjà utilisée", 400)
      }
    }

    if (body.vin && body.vin !== existing.vin) {
      const dupeVin = await prisma.vehicle.findUnique({ where: { vin: body.vin } })
      if (dupeVin && dupeVin.id !== id) {
        return createErrorResponse('Ce numéro VIN est déjà utilisé', 400)
      }
    }

    if (typeof body.franchiseId !== 'undefined' && body.franchiseId !== null) {
      const fid: string | undefined = typeof body.franchiseId === 'string' && body.franchiseId.trim() === ''
        ? undefined
        : body.franchiseId
      if (fid) {
        const franchise = await prisma.franchise.findUnique({ where: { id: fid } })
        if (!franchise) {
          return createErrorResponse('Franchisé introuvable', 400)
        }
      }
    }

    const data: any = {}
    if (typeof body.licensePlate !== 'undefined') data.licensePlate = body.licensePlate
    if (typeof body.brand !== 'undefined') data.brand = body.brand
    if (typeof body.model !== 'undefined') data.model = body.model
    if (typeof body.year !== 'undefined') data.year = Number(body.year)
    if (typeof body.vin !== 'undefined') data.vin = body.vin
    if (typeof body.status !== 'undefined') data.status = body.status
    if (typeof body.purchaseDate !== 'undefined') data.purchaseDate = new Date(body.purchaseDate)
    if (typeof body.purchasePrice !== 'undefined') data.purchasePrice = Number(body.purchasePrice)
    if (typeof body.currentMileage !== 'undefined') data.currentMileage = body.currentMileage === null ? null : Number(body.currentMileage)
    if (typeof body.lastInspectionDate !== 'undefined') data.lastInspectionDate = body.lastInspectionDate ? new Date(body.lastInspectionDate) : null
    if (typeof body.nextInspectionDate !== 'undefined') data.nextInspectionDate = body.nextInspectionDate ? new Date(body.nextInspectionDate) : null
    if (typeof body.insuranceNumber !== 'undefined') data.insuranceNumber = body.insuranceNumber
    if (typeof body.insuranceExpiry !== 'undefined') data.insuranceExpiry = body.insuranceExpiry ? new Date(body.insuranceExpiry) : null
    if (typeof body.assignmentDate !== 'undefined') data.assignmentDate = body.assignmentDate ? new Date(body.assignmentDate) : null
    if (typeof body.latitude !== 'undefined') data.latitude = body.latitude === null ? null : Number(body.latitude)
    if (typeof body.longitude !== 'undefined') data.longitude = body.longitude === null ? null : Number(body.longitude)
    if (typeof body.franchiseId !== 'undefined') data.franchiseId = body.franchiseId && String(body.franchiseId).trim() !== '' ? body.franchiseId : null

    const updated = await prisma.vehicle.update({
      where: { id },
      data,
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
        action: 'UPDATE',
        tableName: 'vehicles',
        recordId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(updated),
        userId: (session.user as ExtendedUser).id
      }
    })

    try {
      if (typeof body.franchiseId !== 'undefined' && body.franchiseId !== existing.franchiseId) {
        const notif = {
          type: NotificationType.VEHICLE_ASSIGNED,
          priority: NotificationPriority.MEDIUM,
          title: 'Véhicule assigné',
          message: `Le véhicule ${updated.licensePlate} a été assigné`,
          data: { licensePlate: updated.licensePlate },
          relatedEntityId: updated.id,
          relatedEntityType: 'vehicle',
          franchiseId: updated.franchiseId || undefined,
          actionUrl: updated.franchiseId ? `/franchise/vehicle` : `/admin/vehicles/${updated.id}`
        } as const
        if (updated.franchiseId) {
          await notificationEmailService.createNotificationWithEmail(
            { ...notif, targetRole: 'FRANCHISEE' }
          )
        }
        await notificationEmailService.createNotificationWithEmail(
          { ...notif, targetRole: 'ADMIN' }
        )
      }
    } catch (e) {
      console.error('Erreur notification VEHICLE_ASSIGNED:', e)
    }

    return createSuccessResponse(updated, 'Véhicule mis à jour avec succès')
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

export const DELETE = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    const existing = await prisma.vehicle.findUnique({ where: { id }, include: { maintenances: true } })
    if (!existing) {
      return createErrorResponse('Véhicule introuvable', 404)
    }

    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
      if (!existing.franchiseId || existing.franchiseId !== (session.user as ExtendedUser).franchiseId) {
        return createErrorResponse('Permission refusée', 403)
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.maintenance.deleteMany({ where: { vehicleId: id } })
      await tx.vehicle.delete({ where: { id } })
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        tableName: 'vehicles',
        recordId: id,
        oldValues: JSON.stringify(existing),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse(null, 'Véhicule supprimé avec succès')
  }),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
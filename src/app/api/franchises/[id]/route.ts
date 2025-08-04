import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling, 
  withValidation,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/api-utils'
import { franchiseSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

interface RouteContext {
  params: {
    id: string
  }
}

// GET /api/franchises/[id] - Récupérer un franchisé
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
        vehicles: {
          select: {
            id: true,
            licensePlate: true,
            brand: true,
            model: true,
            year: true,
            status: true,
            currentMileage: true,
            lastInspectionDate: true,
            nextInspectionDate: true
          }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            orderDate: true,
            totalAmount: true
          },
          orderBy: { orderDate: 'desc' },
          take: 10
        },
        salesReports: {
          select: {
            id: true,
            reportDate: true,
            dailySales: true,
            transactionCount: true,
            royaltyAmount: true,
            paymentStatus: true
          },
          orderBy: { reportDate: 'desc' },
          take: 10
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            dueDate: true,
            amount: true,
            paymentStatus: true
          },
          orderBy: { issueDate: 'desc' },
          take: 10
        },
        _count: {
          select: {
            orders: true,
            salesReports: true,
            invoices: true,
            vehicles: true
          }
        }
      }
    })

    if (!franchise) {
      return createErrorResponse('Franchisé introuvable', 404)
    }

    return createSuccessResponse(franchise)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)

// PUT /api/franchises/[id] - Mettre à jour un franchisé
export const PUT = withAuth(
  withValidation(
    franchiseSchema.partial(),
    withErrorHandling(async (request: NextRequest, context: RouteContext, session: any, validatedData: any) => {
      const { id } = context.params

      // Vérifier si le franchisé existe
      const existingFranchise = await prisma.franchise.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!existingFranchise) {
        return createErrorResponse('Franchisé introuvable', 404)
      }

      // Si on change le SIRET, vérifier qu'il n'existe pas déjà
      if (validatedData.siretNumber && validatedData.siretNumber !== existingFranchise.siretNumber) {
        const existingSiret = await prisma.franchise.findUnique({
          where: { siretNumber: validatedData.siretNumber }
        })

        if (existingSiret) {
          return createErrorResponse('Ce numéro SIRET est déjà utilisé', 400)
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = { ...validatedData }
      
      if (updateData.entryFeeDate) {
        updateData.entryFeeDate = new Date(updateData.entryFeeDate)
      }
      if (updateData.contractStartDate) {
        updateData.contractStartDate = new Date(updateData.contractStartDate)
      }
      if (updateData.contractEndDate) {
        updateData.contractEndDate = new Date(updateData.contractEndDate)
      }

      // Mettre à jour le franchisé
      const updatedFranchise = await prisma.franchise.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          tableName: 'franchises',
          recordId: id,
          oldValues: JSON.stringify(existingFranchise),
          newValues: JSON.stringify(updatedFranchise),
          userId: session.user.id
        }
      })

      return createSuccessResponse(updatedFranchise, 'Franchisé mis à jour avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)

// DELETE /api/franchises/[id] - Supprimer un franchisé
export const DELETE = withAuth(
  withErrorHandling(async (request: NextRequest, context: RouteContext, session: any) => {
    const { id } = context.params

    // Vérifier si le franchisé existe
    const existingFranchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        user: true,
        vehicles: true,
        orders: true,
        salesReports: true,
        invoices: true
      }
    })

    if (!existingFranchise) {
      return createErrorResponse('Franchisé introuvable', 404)
    }

    // Vérifier s'il y a des contraintes qui empêchent la suppression
    if (existingFranchise.vehicles.length > 0) {
      return createErrorResponse('Impossible de supprimer : des véhicules sont encore assignés à ce franchisé', 400)
    }

    if (existingFranchise.orders.length > 0) {
      return createErrorResponse('Impossible de supprimer : ce franchisé a des commandes en cours', 400)
    }

    // Supprimer en cascade (soft delete pour l'utilisateur)
    await prisma.$transaction(async (tx: any) => {
      // Supprimer les rapports de vente
      await tx.salesReport.deleteMany({
        where: { franchiseId: id }
      })

      // Supprimer les factures
      await tx.invoice.deleteMany({
        where: { franchiseId: id }
      })

      // Supprimer le franchisé
      await tx.franchise.delete({
        where: { id }
      })

      // Désactiver l'utilisateur au lieu de le supprimer
      await tx.user.update({
        where: { id: existingFranchise.userId },
        data: { isActive: false }
      })
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        tableName: 'franchises',
        recordId: id,
        oldValues: JSON.stringify(existingFranchise),
        userId: session.user.id
      }
    })

    return createSuccessResponse(null, 'Franchisé supprimé avec succès')
  }),
  [UserRole.SUPER_ADMIN]
)
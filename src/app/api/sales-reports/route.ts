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
import { salesReportSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/sales-reports - Lister les rapports de vente
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const franchiseId = searchParams.get('franchiseId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''

    // Construire les filtres
    const where: any = {}
    
    // Si l'utilisateur est un franchisé, filtrer par son franchise
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.franchiseId = session.user.franchiseId
    } else if (franchiseId) {
      where.franchiseId = franchiseId
    }

    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.reportDate = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      where.reportDate = {
        lte: new Date(endDate)
      }
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    // Récupérer les rapports avec pagination
    const [salesReports, total] = await Promise.all([
      prisma.salesReport.findMany({
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
      prisma.salesReport.count({ where })
    ])

    const response = createPaginationResponse(salesReports, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// POST /api/sales-reports - Créer un nouveau rapport de vente
export const POST = withAuth(
  withValidation(
    salesReportSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      let franchiseId = validatedData.franchiseId

      // Si l'utilisateur est un franchisé, utiliser son franchiseId
      if (session.user.role === UserRole.FRANCHISEE) {
        if (!session.user.franchiseId) {
          return createErrorResponse('Franchisé non associé à une franchise', 400)
        }
        franchiseId = session.user.franchiseId
      }

      // Vérifier que la franchise existe
      const franchise = await prisma.franchise.findUnique({
        where: { id: franchiseId }
      })

      if (!franchise) {
        return createErrorResponse('Franchise introuvable', 404)
      }

      // Vérifier qu'il n'y a pas déjà un rapport pour cette date
      const existingReport = await prisma.salesReport.findUnique({
        where: {
          franchiseId_reportDate: {
            franchiseId: franchiseId,
            reportDate: new Date(validatedData.reportDate)
          }
        }
      })

      if (existingReport) {
        return createErrorResponse('Un rapport de vente existe déjà pour cette date', 400)
      }

      // Calculer la redevance (4% du CA)
      const royaltyAmount = validatedData.dailySales * (Number(franchise.royaltyRate) / 100)

      // Calculer le ticket moyen si pas fourni
      let averageTicket = validatedData.averageTicket
      if (!averageTicket && validatedData.transactionCount > 0) {
        averageTicket = validatedData.dailySales / validatedData.transactionCount
      }

      // Créer le rapport de vente
      const salesReport = await prisma.salesReport.create({
        data: {
          franchiseId: franchiseId,
          reportDate: new Date(validatedData.reportDate),
          dailySales: validatedData.dailySales,
          transactionCount: validatedData.transactionCount,
          averageTicket: averageTicket,
          location: validatedData.location,
          notes: validatedData.notes,
          royaltyAmount: royaltyAmount,
          createdById: session.user.id
        },
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
          tableName: 'sales_reports',
          recordId: salesReport.id,
          newValues: JSON.stringify(salesReport),
          userId: session.user.id
        }
      })

      return createSuccessResponse(salesReport, 'Rapport de vente créé avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)
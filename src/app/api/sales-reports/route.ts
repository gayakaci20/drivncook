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
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

 
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const franchiseId = searchParams.get('franchiseId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''

     
    const where: any = {}
    
     
    if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
      where.franchiseId = (session.user as ExtendedUser).franchiseId
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
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)

 
export const POST = withAuth(
  withValidation(
    salesReportSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      let franchiseId = validatedData.franchiseId

       
      if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE) {
        if (!(session.user as ExtendedUser).franchiseId) {
          return createErrorResponse('Franchisé non associé à une franchise', 400)
        }
        franchiseId = (session.user as ExtendedUser).franchiseId
      }

       
      const franchise = await prisma.franchise.findUnique({
        where: { id: franchiseId }
      })

      if (!franchise) {
        return createErrorResponse('Franchise introuvable', 404)
      }

       
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

       
      const royaltyAmount = validatedData.dailySales * (Number(franchise.royaltyRate) / 100)

       
      let averageTicket = validatedData.averageTicket
      if (!averageTicket && validatedData.transactionCount > 0) {
        averageTicket = validatedData.dailySales / validatedData.transactionCount
      }

       
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
          createdById: (session.user as ExtendedUser).id
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

       
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'sales_reports',
          recordId: salesReport.id,
          newValues: JSON.stringify(salesReport),
          userId: (session.user as ExtendedUser).id
        }
      })

      return createSuccessResponse(salesReport, 'Rapport de vente créé avec succès')
    })
  ),
  [UserRole.ADMIN, UserRole.FRANCHISEE]
)
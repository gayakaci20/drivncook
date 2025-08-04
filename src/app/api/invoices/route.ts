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
import { invoiceSchema } from '@/lib/validations'
import { UserRole } from '@/types/prisma-enums'

// GET /api/invoices - Lister les factures
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const franchiseId = searchParams.get('franchiseId') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Construire les filtres
    const where: any = {}
    
    // Si l'utilisateur est un franchisé, filtrer par son franchise
    if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
      where.franchiseId = session.user.franchiseId
    } else if (franchiseId) {
      where.franchiseId = franchiseId
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (startDate && endDate) {
      where.issueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.issueDate = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      where.issueDate = {
        lte: new Date(endDate)
      }
    }

    // Récupérer les factures avec pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          }
        },
        skip: ((page || 1) - 1) * (limit || 10),
        take: limit || 10,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    const response = createPaginationResponse(invoices, total, page || 1, limit || 10)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// POST /api/invoices - Créer une nouvelle facture
export const POST = withAuth(
  withValidation(
    invoiceSchema,
    withErrorHandling(async (request: NextRequest, context: any, session: any, validatedData: any) => {
      // Vérifier que la franchise existe
      const franchise = await prisma.franchise.findUnique({
        where: { id: validatedData.franchiseId }
      })

      if (!franchise) {
        return createErrorResponse('Franchise introuvable', 404)
      }

      // Générer un numéro de facture unique
      const invoiceCount = await prisma.invoice.count()
      const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`

      // Créer la facture
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          dueDate: new Date(validatedData.dueDate),
          amount: validatedData.amount,
          description: validatedData.description,
          franchiseId: validatedData.franchiseId
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
          }
        }
      })

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'invoices',
          recordId: invoice.id,
          newValues: JSON.stringify(invoice),
          userId: session.user.id
        }
      })

      return createSuccessResponse(invoice, 'Facture créée avec succès')
    })
  ),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)
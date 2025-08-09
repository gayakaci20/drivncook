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

function parsePeriod(period?: string) {
  const iso = period && /^\d{4}-\d{2}$/.test(period) ? period : new Date().toISOString().slice(0, 7)
  const [y, m] = iso.split('-').map((v) => parseInt(v, 10))
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
  const nextMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0))
  return { iso, start, nextMonth }
}

export const POST = withAuth(
  withErrorHandling(async (request: NextRequest, _context: any, session: any) => {
    const body = await request.json().catch(() => null)
    if (!body || !body.franchiseId) {
      return createErrorResponse('Données invalides: franchiseId requis', 400)
    }

    const { franchiseId, period } = body as { franchiseId: string; period?: string }
    const { iso, start, nextMonth } = parsePeriod(period)

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } })
    if (!franchise) {
      return createErrorResponse('Franchise introuvable', 404)
    }

    const existing = await prisma.invoice.findFirst({
      where: {
        franchiseId,
        description: { equals: `Redevances ${iso}` }
      }
    })
    if (existing) {
      return createErrorResponse('Une facture pour cette période existe déjà', 400)
    }

    const aggregation = await prisma.salesReport.aggregate({
      where: {
        franchiseId,
        reportDate: {
          gte: start,
          lt: nextMonth
        }
      },
      _sum: { royaltyAmount: true },
      _count: true
    })

    const reportCount = aggregation._count || 0
    const totalRoyalty = Number(aggregation._sum.royaltyAmount || 0)

    if (reportCount === 0 || totalRoyalty <= 0) {
      return createErrorResponse('Aucune redevance à facturer pour cette période', 400)
    }

    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        dueDate,
        amount: totalRoyalty,
        description: `Redevances ${iso}`,
        franchiseId
      },
      include: {
        franchise: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        tableName: 'invoices',
        recordId: invoice.id,
        newValues: JSON.stringify({ ...invoice, generatedFrom: { period: iso, reportCount } }),
        userId: (session.user as ExtendedUser).id
      }
    })

    return createSuccessResponse({ invoice, period: iso, reportCount })
  }),
  [UserRole.ADMIN]
)



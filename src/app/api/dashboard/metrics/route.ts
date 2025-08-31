import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
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

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    const startDate = new Date()
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(startDate.getMonth() - 1)
    }

    try {
      const [
        totalFranchises,
        activeFranchises,
        totalVehicles,
        totalSales,
        totalRoyalties,
        averageTicket,
        bestPerformers,
        worstPerformers,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        pendingInvoices,
        overdueInvoices,
        outstandingInvoices,
        paidInvoicesWithDates,
        stockData,
        lowStockCount,
        maintenanceAlerts,
        vehiclesMaintenanceDue
      ] = await Promise.all([
        prisma.franchise.count(),
        prisma.franchise.count({ where: { status: 'ACTIVE' } }),
        prisma.vehicle.count(),
        prisma.salesReport.aggregate({
          where: { reportDate: { gte: startDate } },
          _sum: { dailySales: true }
        }),
        prisma.salesReport.aggregate({
          where: { reportDate: { gte: startDate } },
          _sum: { royaltyAmount: true }
        }),
        prisma.salesReport.aggregate({
          where: { reportDate: { gte: startDate } },
          _avg: { averageTicket: true }
        }),
        prisma.salesReport.groupBy({
          by: ['franchiseId'],
          where: { reportDate: { gte: startDate } },
          _sum: { dailySales: true },
          orderBy: { _sum: { dailySales: 'desc' } },
          take: 3
        }),
        prisma.salesReport.groupBy({
          by: ['franchiseId'],
          where: { reportDate: { gte: startDate } },
          _sum: { dailySales: true },
          orderBy: { _sum: { dailySales: 'asc' } },
          take: 3
        }),
        prisma.order.count(),
        prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PREPARATION'] } } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.invoice.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.invoice.count({ where: { paymentStatus: 'OVERDUE' } }),
        prisma.invoice.aggregate({
          where: { paymentStatus: { in: ['PENDING', 'OVERDUE'] } },
          _sum: { amount: true }
        }),
        prisma.invoice.findMany({
          where: { 
            paymentStatus: 'PAID',
            paidDate: { not: null },
            issueDate: { gte: startDate }
          },
          select: {
            issueDate: true,
            paidDate: true
          }
        }),
        prisma.stock.findMany({
          include: {
            product: {
              select: {
                unitPrice: true,
                minStock: true
              }
            }
          }
        }),
        prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM stocks s 
          INNER JOIN products p ON s.productId = p.id 
          WHERE s.quantity < p.minStock AND p.minStock > 0
        `,
        prisma.maintenance.count({
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
          }
        }),
        prisma.vehicle.count({
          where: {
            OR: [
              {
                nextRevisionDate: {
                  lte: new Date()
                }
              },
              {
                nextInspectionDate: {
                  lte: new Date()
                }
              }
            ]
          }
        })
      ])

      const bestPerformersWithDetails = await Promise.all(
        bestPerformers.map(async (item, index) => {
          const franchise = await prisma.franchise.findUnique({
            where: { id: item.franchiseId },
            include: { user: { select: { firstName: true, lastName: true } } }
          })

          const currentFranchiseSales = Number(item._sum.dailySales || 0)
          const previousFranchiseSales = await prisma.salesReport.aggregate({
            where: { 
              franchiseId: item.franchiseId,
              reportDate: { 
                gte: previousStartDate,
                lt: startDate
              }
            },
            _sum: { dailySales: true }
          })
          
          const previousAmount = Number(previousFranchiseSales._sum.dailySales || 0)
          let franchiseGrowthRate = 0
          if (previousAmount > 0) {
            franchiseGrowthRate = ((currentFranchiseSales - previousAmount) / previousAmount) * 100
          } else if (currentFranchiseSales > 0) {
            franchiseGrowthRate = 100
          }

          return {
            franchiseId: item.franchiseId,
            franchiseName: franchise ? `${franchise.user.firstName} ${franchise.user.lastName}` : 'Inconnu',
            sales: currentFranchiseSales,
            growth: Math.round(franchiseGrowthRate * 10) / 10,
            rank: index + 1
          }
        })
      )

      const worstPerformersWithDetails = await Promise.all(
        worstPerformers.map(async (item, index) => {
          const franchise = await prisma.franchise.findUnique({
            where: { id: item.franchiseId },
            include: { user: { select: { firstName: true, lastName: true } } }
          })

          const currentFranchiseSales = Number(item._sum.dailySales || 0)
          const previousFranchiseSales = await prisma.salesReport.aggregate({
            where: { 
              franchiseId: item.franchiseId,
              reportDate: { 
                gte: previousStartDate,
                lt: startDate
              }
            },
            _sum: { dailySales: true }
          })
          
          const previousAmount = Number(previousFranchiseSales._sum.dailySales || 0)
          let franchiseGrowthRate = 0
          if (previousAmount > 0) {
            franchiseGrowthRate = ((currentFranchiseSales - previousAmount) / previousAmount) * 100
          } else if (currentFranchiseSales > 0) {
            franchiseGrowthRate = 100
          }

          return {
            franchiseId: item.franchiseId,
            franchiseName: franchise ? `${franchise.user.firstName} ${franchise.user.lastName}` : 'Inconnu',
            sales: currentFranchiseSales,
            growth: Math.round(franchiseGrowthRate * 10) / 10,
            rank: index + 1
          }
        })
      )

      const currentSales = Number(totalSales._sum.dailySales || 0)
      
      const previousStartDate = new Date(startDate)
      const periodDuration = new Date().getTime() - startDate.getTime()
      previousStartDate.setTime(previousStartDate.getTime() - periodDuration)
      
      const previousSales = await prisma.salesReport.aggregate({
        where: { 
          reportDate: { 
            gte: previousStartDate,
            lt: startDate
          }
        },
        _sum: { dailySales: true }
      })
      
      const previousSalesAmount = Number(previousSales._sum.dailySales || 0)
      let growthRate = 0
      if (previousSalesAmount > 0) {
        growthRate = ((currentSales - previousSalesAmount) / previousSalesAmount) * 100
      } else if (currentSales > 0) {
        growthRate = 100 
      }

      let averagePaymentDelay = 0
      if (paidInvoicesWithDates.length > 0) {
        const totalDelays = paidInvoicesWithDates.reduce((sum, invoice) => {
          if (invoice.paidDate) {
            const delay = Math.ceil((new Date(invoice.paidDate).getTime() - new Date(invoice.issueDate).getTime()) / (1000 * 60 * 60 * 24))
            return sum + delay
          }
          return sum
        }, 0)
        averagePaymentDelay = Math.round(totalDelays / paidInvoicesWithDates.length)
      }

      const inventoryValue = stockData.reduce((total, stock) => {
        const value = stock.quantity * Number(stock.product.unitPrice)
        return total + value
      }, 0)

      const lowStockAlerts = Array.isArray(lowStockCount) && lowStockCount[0] ? Number(lowStockCount[0].count) : 0

      const totalMaintenanceAlerts = maintenanceAlerts + vehiclesMaintenanceDue

      const metrics = {
        networkOverview: {
          totalFranchises,
          activeFranchises,
          totalVehicles,
          totalSales: currentSales,
          totalRoyalties: Number(totalRoyalties._sum.royaltyAmount || 0),
          averageTicket: Number(averageTicket._avg.averageTicket || 0),
          growthRate: Math.round(growthRate * 10) / 10
        },
        performance: {
          bestPerformers: bestPerformersWithDetails,
          worstPerformers: worstPerformersWithDetails
        },
        operations: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          inventoryValue: Math.round(inventoryValue),
          lowStockAlerts,
          maintenanceAlerts: totalMaintenanceAlerts
        },
        financial: {
          totalRevenue: currentSales,
          pendingInvoices,
          overdueInvoices,
          averagePaymentDelay,
          outstandingAmount: Number(outstandingInvoices._sum.amount || 0)
        }
      }

      return NextResponse.json({
        success: true,
        data: metrics
      })

    } catch (dbError) {
      console.error('Erreur base de données:', dbError)
      
      const fallbackMetrics = {
        networkOverview: {
          totalFranchises: 0,
          activeFranchises: 0,
          totalVehicles: 0,
          totalSales: 0,
          totalRoyalties: 0,
          averageTicket: 0,
          growthRate: 0
        },
        performance: {
          bestPerformers: [],
          worstPerformers: []
        },
        operations: {
          totalOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          inventoryValue: 0,
          lowStockAlerts: 0,
          maintenanceAlerts: 0
        },
        financial: {
          totalRevenue: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          averagePaymentDelay: 0,
          outstandingAmount: 0
        }
      }

      return NextResponse.json({
        success: true,
        data: fallbackMetrics
      })
    }

  } catch (error) {
    console.error('Erreur API dashboard metrics:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

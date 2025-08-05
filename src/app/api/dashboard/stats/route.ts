import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/prisma-enums'

// GET /api/dashboard/stats - Récupérer les statistiques du dashboard
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'FRANCHISE_MANAGER', 'FRANCHISEE'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30' // jours
  const franchiseId = searchParams.get('franchiseId') || ''

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(period))

  // Définir les filtres selon le rôle
  let franchiseFilter: any = {}
  if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
    franchiseFilter = { franchiseId: session.user.franchiseId }
  } else if (franchiseId) {
    franchiseFilter = { franchiseId: franchiseId }
  }

  // Statistiques générales pour les admins
  if (session.user.role === UserRole.SUPER_ADMIN || session.user.role === UserRole.ADMIN) {
    const [
      totalFranchises,
      activeFranchises,
      totalVehicles,
      availableVehicles,
      pendingOrders,
      recentSales,
      unpaidInvoices,
      monthlyRevenue
    ] = await Promise.all([
      // Total des franchises
      prisma.franchise.count(),
      
      // Franchises actives
      prisma.franchise.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total des véhicules
      prisma.vehicle.count(),
      
      // Véhicules disponibles
      prisma.vehicle.count({
        where: { status: 'AVAILABLE' }
      }),
      
      // Commandes en attente
      prisma.order.count({
        where: { 
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PREPARATION'] }
        }
      }),
      
      // Ventes récentes
      prisma.salesReport.aggregate({
        where: {
          reportDate: { gte: startDate }
        },
        _sum: { dailySales: true },
        _count: true
      }),
      
      // Factures impayées
      prisma.invoice.aggregate({
        where: {
          paymentStatus: { in: ['PENDING', 'OVERDUE'] }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Revenus mensuels (redevances)
      prisma.salesReport.aggregate({
        where: {
          reportDate: { gte: startDate }
        },
        _sum: { royaltyAmount: true }
      })
    ])

    // Évolution des ventes par jour (30 derniers jours)
    const dailySales = await prisma.salesReport.groupBy({
      by: ['reportDate'],
      where: {
        reportDate: { gte: startDate }
      },
      _sum: {
        dailySales: true,
        royaltyAmount: true
      },
      orderBy: {
        reportDate: 'asc'
      }
    })

    // Top 5 des franchises par CA
    const topFranchises = await prisma.salesReport.groupBy({
      by: ['franchiseId'],
      where: {
        reportDate: { gte: startDate }
      },
      _sum: {
        dailySales: true,
        royaltyAmount: true
      },
      orderBy: {
        _sum: {
          dailySales: 'desc'
        }
      },
      take: 5
    })

    // Enrichir avec les infos des franchises
    const topFranchisesWithDetails = await Promise.all(
      topFranchises.map(async (item: any) => {
        const franchise = await prisma.franchise.findUnique({
          where: { id: item.franchiseId },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        })
        return {
          ...item,
          franchise
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFranchises,
          activeFranchises,
          totalVehicles,
          availableVehicles,
          pendingOrders,
          totalSales: Number(recentSales._sum.dailySales || 0),
          salesCount: recentSales._count,
          unpaidAmount: Number(unpaidInvoices._sum.amount || 0),
          unpaidCount: unpaidInvoices._count,
          monthlyRoyalties: Number(monthlyRevenue._sum.royaltyAmount || 0)
        },
        charts: {
          dailySales: dailySales.map((item: any) => ({
            date: item.reportDate,
            sales: Number(item._sum.dailySales || 0),
            royalties: Number(item._sum.royaltyAmount || 0)
          })),
          topFranchises: topFranchisesWithDetails.map((item: any) => ({
            franchiseId: item.franchiseId,
            franchiseName: `${item.franchise?.user.firstName} ${item.franchise?.user.lastName}`,
            businessName: item.franchise?.businessName,
            totalSales: Number(item._sum.dailySales || 0),
            totalRoyalties: Number(item._sum.royaltyAmount || 0)
          }))
        }
      }
    })
  }

  // Statistiques pour les franchisés
  if (session.user.role === UserRole.FRANCHISEE && session.user.franchiseId) {
    const [
      myVehicles,
      myOrders,
      mySales,
      myInvoices,
      recentReports
    ] = await Promise.all([
      // Mes véhicules
      prisma.vehicle.findMany({
        where: { franchiseId: session.user.franchiseId },
        select: {
          id: true,
          licensePlate: true,
          brand: true,
          model: true,
          status: true,
          currentMileage: true,
          nextInspectionDate: true
        }
      }),
      
      // Mes commandes récentes
      prisma.order.findMany({
        where: { 
          franchiseId: session.user.franchiseId,
          orderDate: { gte: startDate }
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          orderDate: true,
          totalAmount: true
        },
        orderBy: { orderDate: 'desc' },
        take: 10
      }),
      
      // Mes ventes
      prisma.salesReport.aggregate({
        where: {
          franchiseId: session.user.franchiseId,
          reportDate: { gte: startDate }
        },
        _sum: { 
          dailySales: true,
          royaltyAmount: true,
          transactionCount: true
        },
        _avg: { averageTicket: true }
      }),
      
      // Mes factures
      prisma.invoice.findMany({
        where: { franchiseId: session.user.franchiseId },
        select: {
          id: true,
          invoiceNumber: true,
          issueDate: true,
          dueDate: true,
          amount: true,
          paymentStatus: true
        },
        orderBy: { issueDate: 'desc' },
        take: 5
      }),
      
      // Évolution de mes ventes
      prisma.salesReport.findMany({
        where: {
          franchiseId: session.user.franchiseId,
          reportDate: { gte: startDate }
        },
        select: {
          reportDate: true,
          dailySales: true,
          transactionCount: true,
          averageTicket: true,
          royaltyAmount: true
        },
        orderBy: { reportDate: 'asc' }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalVehicles: myVehicles.length,
          activeVehicles: myVehicles.filter((v: any) => v.status === 'ASSIGNED').length,
          totalSales: Number(mySales._sum.dailySales || 0),
          totalTransactions: Number(mySales._sum.transactionCount || 0),
          averageTicket: Number(mySales._avg.averageTicket || 0),
          totalRoyalties: Number(mySales._sum.royaltyAmount || 0),
          pendingInvoices: myInvoices.filter((i: any) => i.paymentStatus === 'PENDING').length
        },
        vehicles: myVehicles.map((v: any) => ({
          ...v,
          currentMileage: v.currentMileage ? Number(v.currentMileage) : null
        })),
        recentOrders: myOrders.map((o: any) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        })),
        recentInvoices: myInvoices.map((i: any) => ({
          ...i,
          amount: Number(i.amount)
        })),
        charts: {
          salesEvolution: recentReports.map((report: any) => ({
            date: report.reportDate,
            sales: Number(report.dailySales),
            transactions: Number(report.transactionCount),
            averageTicket: Number(report.averageTicket),
            royalties: Number(report.royaltyAmount)
          }))
        }
      }
    })
  }

  return NextResponse.json({ success: true, data: {} })

  } catch (error) {
    console.error('Erreur API dashboard stats:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}
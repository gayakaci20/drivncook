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

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN && (session.user as ExtendedUser).role !== UserRole.FRANCHISEE) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30'  
  const franchiseId = searchParams.get('franchiseId') || ''

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(period))

   
  let franchiseFilter: any = {}
  if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
    franchiseFilter = { franchiseId: (session.user as ExtendedUser).franchiseId }
  } else if (franchiseId) {
    franchiseFilter = { franchiseId: franchiseId }
  }

   
  if ((session.user as ExtendedUser).role === UserRole.ADMIN) {
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
       
      prisma.franchise.count(),
      
       
      prisma.franchise.count({
        where: { status: 'ACTIVE' }
      }),
      
       
      prisma.vehicle.count(),
      
       
      prisma.vehicle.count({
        where: { status: 'AVAILABLE' }
      }),
      
       
      prisma.order.count({
        where: { 
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PREPARATION'] }
        }
      }),
      
       
      prisma.salesReport.aggregate({
        where: {
          reportDate: { gte: startDate }
        },
        _sum: { dailySales: true },
        _count: true
      }),
      
       
      prisma.invoice.aggregate({
        where: {
          paymentStatus: { in: ['PENDING', 'OVERDUE'] }
        },
        _sum: { amount: true },
        _count: true
      }),
      
       
      prisma.salesReport.aggregate({
        where: {
          reportDate: { gte: startDate }
        },
        _sum: { royaltyAmount: true }
      })
    ])

     
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

   
  if ((session.user as ExtendedUser).role === UserRole.FRANCHISEE && (session.user as ExtendedUser).franchiseId) {
    const [
      myVehicles,
      myOrders,
      mySales,
      myInvoices,
      recentReports
    ] = await Promise.all([
       
      prisma.vehicle.findMany({
        where: { franchiseId: (session.user as ExtendedUser).franchiseId },
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
      
       
      prisma.order.findMany({
        where: { 
          franchiseId: (session.user as ExtendedUser).franchiseId as string,
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
      
       
      prisma.salesReport.aggregate({
        where: {
          franchiseId: (session.user as ExtendedUser).franchiseId as string,
          reportDate: { gte: startDate }
        },
        _sum: { 
          dailySales: true,
          royaltyAmount: true,
          transactionCount: true
        },
        _avg: { averageTicket: true }
      }),
      
       
      prisma.invoice.findMany({
        where: { franchiseId: (session.user as ExtendedUser).franchiseId as string },
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
      
       
      prisma.salesReport.findMany({
        where: {
          franchiseId: (session.user as ExtendedUser).franchiseId as string,
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
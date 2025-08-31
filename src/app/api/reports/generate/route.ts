import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { prisma } from '@/lib/prisma'
import PDFGenerator from '@/lib/pdf-generator'
import { uploadFiles } from '@/lib/uploadthing'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { type, period } = body

    if (!type || !period) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type et période requis' 
      }, { status: 400 })
    }

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

    const [salesData, topFranchises, invoicesData, unpaidInvoices] = await Promise.all([
      prisma.salesReport.aggregate({
        where: { reportDate: { gte: startDate } },
        _sum: {
          dailySales: true,
          transactionCount: true,
          royaltyAmount: true
        },
        _avg: {
          averageTicket: true
        }
      }),
      prisma.salesReport.groupBy({
        by: ['franchiseId'],
        where: { reportDate: { gte: startDate } },
        _sum: {
          dailySales: true,
          royaltyAmount: true
        },
        orderBy: { _sum: { dailySales: 'desc' } },
        take: 10
      }),
      prisma.invoice.aggregate({
        where: { issueDate: { gte: startDate } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: { 
          paymentStatus: { in: ['PENDING', 'OVERDUE'] },
          issueDate: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      })
    ])

    const topFranchisesWithDetails = await Promise.all(
      topFranchises.map(async (item) => {
        const franchise = await prisma.franchise.findUnique({
          where: { id: item.franchiseId },
          include: { user: { select: { firstName: true, lastName: true } } }
        })
        
        const previousStartDate = new Date(startDate)
        const periodDuration = new Date().getTime() - startDate.getTime()
        previousStartDate.setTime(previousStartDate.getTime() - periodDuration)
        
        const previousSales = await prisma.salesReport.aggregate({
          where: { 
            franchiseId: item.franchiseId,
            reportDate: { 
              gte: previousStartDate,
              lt: startDate
            }
          },
          _sum: { dailySales: true }
        })
        
        const currentSales = Number(item._sum.dailySales || 0)
        const previousAmount = Number(previousSales._sum.dailySales || 0)
        let growthRate = 0
        if (previousAmount > 0) {
          growthRate = ((currentSales - previousAmount) / previousAmount) * 100
        } else if (currentSales > 0) {
          growthRate = 100
        }

        return {
          name: franchise ? `${franchise.user.firstName} ${franchise.user.lastName}` : 'Inconnu',
          sales: currentSales,
          growth: Math.round(growthRate * 10) / 10
        }
      })
    )

    const currentTotalSales = Number(salesData._sum.dailySales || 0)
    const globalPreviousStartDate = new Date(startDate)
    const globalPeriodDuration = new Date().getTime() - startDate.getTime()
    globalPreviousStartDate.setTime(globalPreviousStartDate.getTime() - globalPeriodDuration)
    
    const globalPreviousSales = await prisma.salesReport.aggregate({
      where: { 
        reportDate: { 
          gte: globalPreviousStartDate,
          lt: startDate
        }
      },
      _sum: { dailySales: true }
    })
    
    const globalPreviousAmount = Number(globalPreviousSales._sum.dailySales || 0)
    let globalGrowthRate = 0
    if (globalPreviousAmount > 0) {
      globalGrowthRate = ((currentTotalSales - globalPreviousAmount) / globalPreviousAmount) * 100
    } else if (currentTotalSales > 0) {
      globalGrowthRate = 100
    }

    const reportData = {
      title: `Rapport ${type === 'sales' ? 'de ventes' : type === 'financial' ? 'financier' : 'opérationnel'}`,
      subtitle: `Période : ${period === 'week' ? 'Dernière semaine' : period === 'month' ? 'Dernier mois' : period === 'quarter' ? 'Dernier trimestre' : 'Dernière année'}`,
      period: period,
      generatedAt: new Date().toISOString(),
      company: {
        name: "Driv'n Cook",
        address: "Siège social - France"
      },
      data: {
        totalSales: currentTotalSales,
        totalTransactions: Number(salesData._sum.transactionCount || 0),
        averageTicket: Number(salesData._avg.averageTicket || 0),
        growthRate: Math.round(globalGrowthRate * 10) / 10,
        totalRevenue: Number(invoicesData._sum.amount || 0),
        totalRoyalties: Number(salesData._sum.royaltyAmount || 0),
        unpaidInvoices: Number(unpaidInvoices._sum.amount || 0),
        unpaidCount: unpaidInvoices._count,
        pendingRoyalties: Number(salesData._sum.royaltyAmount || 0) * 0.2, // 20% estimé en attente
        overdueCount: unpaidInvoices._count,
        otherRevenue: 0,
        topFranchises: topFranchisesWithDetails,
        topProducts: [
          { name: 'Pizza Margherita', quantity: 150, revenue: 1800 },
          { name: 'Burger Classic', quantity: 120, revenue: 1440 },
          { name: 'Salade César', quantity: 90, revenue: 810 },
          { name: 'Pâtes Carbonara', quantity: 75, revenue: 675 },
          { name: 'Sandwich Jambon', quantity: 60, revenue: 480 }
        ],
        regionalData: [
          { region: 'Île-de-France', sales: currentTotalSales * 0.35, franchises: Math.ceil(topFranchises.length * 0.4) },
          { region: 'Rhône-Alpes', sales: currentTotalSales * 0.25, franchises: Math.ceil(topFranchises.length * 0.3) },
          { region: 'PACA', sales: currentTotalSales * 0.2, franchises: Math.ceil(topFranchises.length * 0.2) },
          { region: 'Autres', sales: currentTotalSales * 0.2, franchises: Math.ceil(topFranchises.length * 0.1) }
        ]
      }
    }

    let pdfBuffer: Buffer
    switch (type) {
      case 'sales':
        pdfBuffer = await PDFGenerator.generateSalesReport(reportData)
        break
      case 'financial':
        pdfBuffer = await PDFGenerator.generateFinancialReport(reportData)
        break
      case 'operational':
        pdfBuffer = await PDFGenerator.generateOperationalReport(reportData)
        break
      default:
        pdfBuffer = await PDFGenerator.generateSalesReport(reportData)
    }

    const reportId = `${type}_${period}_${Date.now()}`
    const fileName = `rapport_${reportId}.pdf`
    
    const pdfFile = new File([pdfBuffer], fileName, {
      type: 'application/pdf'
    })

    try {
      const uploadResult = await uploadFiles("documentUploader", {
        files: [pdfFile]
      })

      if (uploadResult && uploadResult.length > 0) {
        const uploadedFile = uploadResult[0]
        
        return NextResponse.json({
          success: true,
          data: {
            id: reportId,
            title: reportData.title,
            type,
            period,
            generatedAt: reportData.generatedAt,
            fileUrl: uploadedFile.url,
            fileKey: uploadedFile.key,
            fileName: uploadedFile.name,
            status: 'GENERATED',
            message: 'Rapport généré et sauvegardé avec succès'
          }
        })
      } else {
        throw new Error('Échec de l\'upload du PDF')
      }
    } catch (uploadError) {
      console.error('Erreur upload UploadThing:', uploadError)
      
      return NextResponse.json({
        success: true,
        data: {
          id: reportId,
          title: reportData.title,
          type,
          period,
          generatedAt: reportData.generatedAt,
          fileUrl: null,
          status: 'GENERATED_NO_UPLOAD',
          message: 'Rapport généré mais non sauvegardé',
          pdfSize: pdfBuffer.length
        }
      })
    }

  } catch (error) {
    console.error('Erreur génération rapport:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}
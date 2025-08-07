import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

 
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
     
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }
    
    const resolvedParams = await params
    const franchiseId = resolvedParams.id
    
    const user = session.user as ExtendedUser
    if (user.role === UserRole.ADMIN) {
    } else if (user.role === UserRole.FRANCHISEE) {
      if (user.franchiseId !== franchiseId) {
        return NextResponse.json({ success: false, error: 'Accès refusé à cette franchise' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

     
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true
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
            totalAmount: true,
            isFromDrivnCook: true
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
      return NextResponse.json({
        success: false,
        error: 'Franchisé introuvable'
      }, { status: 404 })
    }

     
    const serializedFranchise = {
      ...franchise,
      entryFee: Number(franchise.entryFee),
      royaltyRate: Number(franchise.royaltyRate),
      orders: franchise.orders.map((order: any) => ({
        ...order,
        totalAmount: Number(order.totalAmount)
      })),
      salesReports: franchise.salesReports.map((report: any) => ({
        ...report,
        dailySales: Number(report.dailySales),
        royaltyAmount: Number(report.royaltyAmount)
      })),
      invoices: franchise.invoices.map((invoice: any) => ({
        ...invoice,
        amount: Number(invoice.amount)
      })),
      _count: {
        orders: Number(franchise._count.orders),
        salesReports: Number(franchise._count.salesReports),
        invoices: Number(franchise._count.invoices),
        vehicles: Number(franchise._count.vehicles)
      }
    }

    return NextResponse.json({
      success: true,
      data: serializedFranchise
    })

  } catch (error) {
    console.error('Erreur dans GET /api/franchises/[id]:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

 
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const resolvedParams = await params
    const franchiseId = resolvedParams.id

     
    const existingFranchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: { user: true }
    })

    if (!existingFranchise) {
      return NextResponse.json({
        success: false,
        error: 'Franchisé introuvable'
      }, { status: 404 })
    }

     
    await prisma.$transaction(async (tx: any) => {
       
      await tx.franchise.delete({
        where: { id: franchiseId }
      })

       
      await tx.user.delete({
        where: { id: existingFranchise.userId }
      })

       
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          tableName: 'franchises',
          recordId: franchiseId,
          oldValues: JSON.stringify({
            franchise: {
              id: existingFranchise.id,
              businessName: existingFranchise.businessName,
              status: existingFranchise.status
            },
            user: {
              id: existingFranchise.user.id,
              email: existingFranchise.user.email,
              firstName: existingFranchise.user.firstName,
              lastName: existingFranchise.user.lastName
            }
          }),
          userId: (session.user as ExtendedUser).id
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Franchisé supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur dans DELETE /api/franchises/[id]:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
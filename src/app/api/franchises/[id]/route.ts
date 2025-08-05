import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, canAccessFranchise } from '@/lib/auth'
import { UserRole } from '@/types/prisma-enums'

// GET /api/franchises/[id] - Récupérer un franchisé spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier les permissions avec la fonction utilitaire
    if (!canAccessFranchise(session.user.role, session.user.franchiseId, id)) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Récupérer le franchisé avec toutes les relations
    const franchise: any = await prisma.franchise.findUnique({
      where: {
        id: id
      },
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
            vin: true,
            status: true,
            purchaseDate: true,
            purchasePrice: true,
            currentMileage: true,
            lastInspectionDate: true,
            nextInspectionDate: true,
            insuranceNumber: true,
            insuranceExpiry: true
          }
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            requestedDeliveryDate: true,
            createdAt: true
          }
        },
        salesReports: {
          take: 5,
          orderBy: { reportDate: 'desc' },
          select: {
            id: true,
            reportDate: true,
            dailySales: true,
            transactionCount: true,
            averageTicket: true,
            location: true
          }
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
            dueDate: true,
            description: true,
            createdAt: true
          }
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
        error: 'Franchisé non trouvé' 
      }, { status: 404 })
    }

    // Convertir les BigInt en nombres pour éviter les erreurs de sérialisation
    const serializedFranchise = {
      ...franchise,
      entryFee: Number(franchise.entryFee),
      royaltyRate: Number(franchise.royaltyRate),
      vehicles: franchise.vehicles.map((vehicle: any) => ({
        ...vehicle,
        year: Number(vehicle.year),
        purchasePrice: Number(vehicle.purchasePrice),
        currentMileage: vehicle.currentMileage ? Number(vehicle.currentMileage) : null
      })),
      orders: franchise.orders.map((order: any) => ({
        ...order,
        totalAmount: Number(order.totalAmount)
      })),
      salesReports: franchise.salesReports.map((report: any) => ({
        ...report,
        dailySales: Number(report.dailySales),
        transactionCount: Number(report.transactionCount),
        averageTicket: Number(report.averageTicket)
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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

// DELETE /api/franchises/[id] - Supprimer un franchisé
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    // Seuls les SUPER_ADMIN peuvent supprimer
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier que le franchisé existe
    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!franchise) {
      return NextResponse.json({ 
        success: false, 
        error: 'Franchisé non trouvé' 
      }, { status: 404 })
    }

    // Supprimer le franchisé et l'utilisateur associé dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer le franchisé (cela supprimera automatiquement les relations)
      await tx.franchise.delete({
        where: { id }
      })

      // Supprimer l'utilisateur associé
      await tx.user.delete({
        where: { id: franchise.userId }
      })

      // Créer un log d'audit
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          tableName: 'franchises',
          recordId: id,
          oldValues: JSON.stringify(franchise),
          userId: session.user.id
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Franchisé supprimé avec succès'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}
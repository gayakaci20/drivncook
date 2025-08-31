import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { prisma } from '@/lib/prisma'

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

    // Vérifier si des données existent déjà
    const existingSalesReports = await prisma.salesReport.count()
    const existingFranchises = await prisma.franchise.count()

    if (existingSalesReports > 0) {
      return NextResponse.json({
        success: false,
        error: 'Des données existent déjà. Utilisez DELETE d\'abord pour nettoyer.',
        existingData: {
          salesReports: existingSalesReports,
          franchises: existingFranchises
        }
      })
    }

    // Créer des utilisateurs de test
    const testUsers = []
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          email: `franchise${i}@test.com`,
          firstName: `Franchisé${i}`,
          lastName: `Test`,
          phone: `+33${String(i).padStart(9, '0')}`,
          role: UserRole.FRANCHISEE,
          isActive: true
        }
      })
      testUsers.push(user)
    }

    // Créer des franchises de test
    const testFranchises = []
    for (let i = 0; i < testUsers.length; i++) {
      const franchise = await prisma.franchise.create({
        data: {
          businessName: `Driv'n Cook ${testUsers[i].firstName}`,
          siretNumber: `${123456789 + i}${String(i).padStart(5, '0')}`,
          vatNumber: `FR${String(i).padStart(11, '0')}`,
          address: `${i + 1} Rue de la Franchise`,
          city: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'][i],
          postalCode: `${75000 + i}`,
          region: ['Île-de-France', 'Rhône-Alpes', 'PACA', 'Occitanie', 'PACA'][i],
          contactEmail: testUsers[i].email,
          contactPhone: testUsers[i].phone || '',
          userId: testUsers[i].id,
          status: 'ACTIVE',
          royaltyRate: 4.0,
          entryFee: 15000 + (i * 1000),
          entryFeePaid: true,
          entryFeeDate: new Date(),
          contractStartDate: new Date(),
          contractEndDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // +3 ans
          isActive: true
        }
      })
      testFranchises.push(franchise)
    }

    // Créer des véhicules de test
    const testVehicles = []
    for (let i = 0; i < testFranchises.length; i++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          licensePlate: `AB-${String(123 + i)}-CD`,
          brand: ['Renault', 'Peugeot', 'Citroen', 'Ford', 'Mercedes'][i],
          model: ['Master', 'Boxer', 'Jumper', 'Transit', 'Sprinter'][i],
          year: 2020 + (i % 4),
          vin: `VF1234567890${String(i).padStart(5, '0')}`,
          status: 'ASSIGNED',
          purchaseDate: new Date(2023, i, 15),
          purchasePrice: 25000 + (i * 2000),
          currentMileage: 50000 + (i * 10000),
          lastRevisionDate: new Date(2024, 10, 1),
          nextRevisionDate: new Date(2025, 4, 1),
          lastInspectionDate: new Date(2024, 8, 15),
          nextInspectionDate: new Date(2025, 8, 15),
          franchiseId: testFranchises[i].id,
          assignmentDate: new Date(),
          isActive: true
        }
      })
      testVehicles.push(vehicle)
    }

    // Créer des rapports de ventes de test pour les 30 derniers jours
    const salesReports = []
    for (let day = 0; day < 30; day++) {
      const reportDate = new Date()
      reportDate.setDate(reportDate.getDate() - day)
      
      for (const franchise of testFranchises) {
        // Générer des ventes aléatoires mais réalistes
        const dailySales = Math.random() * 800 + 200 // Entre 200€ et 1000€
        const transactionCount = Math.floor(Math.random() * 20) + 5 // Entre 5 et 25 transactions
        const averageTicket = dailySales / transactionCount
        const royaltyAmount = dailySales * 0.04 // 4% de redevances

        const salesReport = await prisma.salesReport.create({
          data: {
            reportDate,
            dailySales,
            transactionCount,
            averageTicket,
            royaltyAmount,
            location: franchise.city,
            notes: `Rapport généré automatiquement pour ${franchise.businessName}`,
            paymentStatus: Math.random() > 0.2 ? 'PAID' : 'PENDING', // 80% payés
            franchiseId: franchise.id,
            createdById: testUsers[0].id // Premier user comme créateur
          }
        })
        salesReports.push(salesReport)
      }
    }

    // Créer des factures de test
    const invoices = []
    for (let i = 0; i < 20; i++) {
      const franchise = testFranchises[Math.floor(Math.random() * testFranchises.length)]
      const amount = Math.random() * 1000 + 100 // Entre 100€ et 1100€
      const issueDate = new Date()
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30))
      
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + 30)

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2024-${String(1000 + i)}`,
          issueDate,
          dueDate,
          amount,
          description: `Facture redevances ${franchise.businessName}`,
          paymentStatus: Math.random() > 0.3 ? 'PAID' : Math.random() > 0.5 ? 'PENDING' : 'OVERDUE',
          paidDate: Math.random() > 0.5 ? new Date() : null,
          franchiseId: franchise.id,
          createdById: testUsers[0].id
        }
      })
      invoices.push(invoice)
    }

    // Créer des commandes de test
    const orders = []
    for (let i = 0; i < 15; i++) {
      const franchise = testFranchises[Math.floor(Math.random() * testFranchises.length)]
      const totalAmount = Math.random() * 500 + 50 // Entre 50€ et 550€
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 14))

      const order = await prisma.order.create({
        data: {
          orderNumber: `CMD-${String(Date.now() + i)}`,
          orderDate,
          status: ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'DELIVERED'][Math.floor(Math.random() * 4)] as any,
          totalAmount,
          notes: `Commande test pour ${franchise.businessName}`,
          isFromDrivnCook: Math.random() > 0.3,
          franchiseId: franchise.id,
          createdById: testUsers[0].id
        }
      })
      orders.push(order)
    }

    return NextResponse.json({
      success: true,
      message: 'Données de test créées avec succès',
      data: {
        users: testUsers.length,
        franchises: testFranchises.length,
        vehicles: testVehicles.length,
        salesReports: salesReports.length,
        invoices: invoices.length,
        orders: orders.length
      }
    })

  } catch (error) {
    console.error('Erreur création données test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Supprimer toutes les données de test dans l'ordre inverse des dépendances
    await prisma.salesReport.deleteMany({})
    await prisma.invoice.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.vehicle.deleteMany({})
    await prisma.franchise.deleteMany({})
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Toutes les données de test ont été supprimées'
    })

  } catch (error) {
    console.error('Erreur suppression données test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}

#!/usr/bin/env ts-node

/**
 * Script pour créer des données de test
 * Usage: npx ts-node src/scripts/create-test-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('🚀 Création des données de test...')

    // Vérifier si des données existent déjà
    const existingFranchises = await prisma.franchise.count()
    if (existingFranchises > 0) {
      console.log('⚠️  Des données existent déjà. Souhaitez-vous les supprimer d\'abord ?')
      console.log('Utilisez: npx ts-node src/scripts/clear-test-data.ts')
      return
    }

    // Créer un utilisateur admin s'il n'existe pas
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@drivncook.com',
          firstName: 'Admin',
          lastName: 'Driv\'n Cook',
          role: 'ADMIN',
          isActive: true
        }
      })
      console.log('✅ Utilisateur admin créé')
    }

    // Créer des utilisateurs franchisés
    const franchiseUsers = []
    for (let i = 1; i <= 8; i++) {
      const user = await prisma.user.create({
        data: {
          email: `franchise${i}@test.com`,
          firstName: ['Pierre', 'Marie', 'Jean', 'Sophie', 'Michel', 'Claire', 'David', 'Isabelle'][i-1],
          lastName: ['Martin', 'Dupont', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Petit', 'Roux'][i-1],
          phone: `+33${String(600000000 + i)}`,
          role: 'FRANCHISEE',
          isActive: true
        }
      })
      franchiseUsers.push(user)
    }
    console.log(`✅ ${franchiseUsers.length} utilisateurs franchisés créés`)

    // Créer des franchises
    const franchises = []
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier']
    const regions = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Provence-Alpes-Côte d\'Azur', 'Pays de la Loire', 'Grand Est', 'Occitanie']
    
    for (let i = 0; i < franchiseUsers.length; i++) {
      const franchise = await prisma.franchise.create({
        data: {
          businessName: `Driv'n Cook ${cities[i]}`,
          siretNumber: `${123456789 + i}${String(i).padStart(5, '0')}`,
          vatNumber: `FR${String(12345678900 + i)}`,
          address: `${i + 1} Avenue de la Gastronomie`,
          city: cities[i],
          postalCode: `${75000 + i * 1000}`,
          region: regions[i],
          contactEmail: franchiseUsers[i].email,
          contactPhone: franchiseUsers[i].phone || '',
          userId: franchiseUsers[i].id,
          status: 'ACTIVE',
          royaltyRate: 4.0,
          entryFee: 15000 + (i * 1000),
          entryFeePaid: i < 6, // 6 sur 8 ont payé
          entryFeeDate: i < 6 ? new Date() : null,
          contractStartDate: new Date(2024, 0, 1 + i),
          contractEndDate: new Date(2027, 0, 1 + i),
          isActive: true
        }
      })
      franchises.push(franchise)
    }
    console.log(`✅ ${franchises.length} franchises créées`)

    // Créer des véhicules
    const vehicles = []
    const brands = ['Renault', 'Peugeot', 'Citroën', 'Ford', 'Mercedes', 'Iveco', 'Fiat', 'Volkswagen']
    const models = ['Master', 'Boxer', 'Jumper', 'Transit', 'Sprinter', 'Daily', 'Ducato', 'Crafter']
    
    for (let i = 0; i < franchises.length; i++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          licensePlate: `${String.fromCharCode(65 + Math.floor(i/10))}${String.fromCharCode(65 + (i%10))}-${String(123 + i).padStart(3, '0')}-${String.fromCharCode(67 + Math.floor(i/5))}${String.fromCharCode(68 + (i%5))}`,
          brand: brands[i],
          model: models[i],
          year: 2019 + (i % 5),
          vin: `VF1234567890${String(i).padStart(5, '0')}`,
          status: 'ASSIGNED',
          purchaseDate: new Date(2023, i % 12, 15),
          purchasePrice: 25000 + (i * 3000),
          currentMileage: 30000 + (i * 15000),
          lastRevisionDate: new Date(2024, 9, 1 + i),
          nextRevisionDate: new Date(2025, 3, 1 + i),
          lastInspectionDate: new Date(2024, 7, 15 + i),
          nextInspectionDate: new Date(2025, 7, 15 + i),
          franchiseId: franchises[i].id,
          assignmentDate: new Date(2024, 0, 15 + i),
          isActive: true
        }
      })
      vehicles.push(vehicle)
    }
    console.log(`✅ ${vehicles.length} véhicules créés`)

    // Créer des rapports de ventes pour les 60 derniers jours
    const salesReports = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 60)
    
    for (let day = 0; day < 60; day++) {
      const reportDate = new Date(startDate)
      reportDate.setDate(reportDate.getDate() + day)
      
      for (const franchise of franchises) {
        // Générer des ventes réalistes avec variations
        const baseDaily = 300 + (Math.sin(day / 7) * 100) // Variations hebdomadaires
        const randomVariation = (Math.random() - 0.5) * 200
        const dailySales = Math.max(50, baseDaily + randomVariation)
        
        const transactionCount = Math.floor((dailySales / 25) + (Math.random() * 10))
        const averageTicket = dailySales / transactionCount
        const royaltyAmount = dailySales * 0.04

        const salesReport = await prisma.salesReport.create({
          data: {
            reportDate,
            dailySales,
            transactionCount,
            averageTicket,
            royaltyAmount,
            location: franchise.city,
            notes: `Ventes du ${reportDate.toLocaleDateString('fr-FR')}`,
            paymentStatus: Math.random() > 0.15 ? 'PAID' : 'PENDING', // 85% payés
            franchiseId: franchise.id,
            createdById: adminUser.id
          }
        })
        salesReports.push(salesReport)
      }
    }
    console.log(`✅ ${salesReports.length} rapports de ventes créés (60 jours)`)

    // Créer des factures
    const invoices = []
    for (let i = 0; i < 50; i++) {
      const franchise = franchises[Math.floor(Math.random() * franchises.length)]
      const amount = 150 + (Math.random() * 800) // Entre 150€ et 950€
      const issueDate = new Date()
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 90))
      
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + 30)

      const paymentStatuses = ['PAID', 'PENDING', 'OVERDUE']
      const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2024-${String(2000 + i).padStart(4, '0')}`,
          issueDate,
          dueDate,
          amount,
          description: `Redevances ${franchise.businessName}`,
          paymentStatus: status as any,
          paidDate: status === 'PAID' ? new Date() : null,
          franchiseId: franchise.id,
          createdById: adminUser.id
        }
      })
      invoices.push(invoice)
    }
    console.log(`✅ ${invoices.length} factures créées`)

    // Créer des commandes
    const orders = []
    for (let i = 0; i < 30; i++) {
      const franchise = franchises[Math.floor(Math.random() * franchises.length)]
      const totalAmount = 75 + (Math.random() * 400) // Entre 75€ et 475€
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 21))

      const statuses = ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'SHIPPED', 'DELIVERED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const order = await prisma.order.create({
        data: {
          orderNumber: `CMD-${Date.now()}-${String(i).padStart(3, '0')}`,
          orderDate,
          status: status as any,
          totalAmount,
          notes: `Commande matériel et consommables`,
          isFromDrivnCook: Math.random() > 0.3,
          franchiseId: franchise.id,
          createdById: adminUser.id
        }
      })
      orders.push(order)
    }
    console.log(`✅ ${orders.length} commandes créées`)

    console.log('\n🎉 Données de test créées avec succès !')
    console.log(`
    📊 Résumé :
    - ${franchiseUsers.length + 1} utilisateurs (1 admin + ${franchiseUsers.length} franchisés)
    - ${franchises.length} franchises
    - ${vehicles.length} véhicules  
    - ${salesReports.length} rapports de ventes
    - ${invoices.length} factures
    - ${orders.length} commandes
    `)

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function clearData() {
  try {
    console.log('🧹 Suppression des données de test...')
    
    await prisma.salesReport.deleteMany({})
    await prisma.invoice.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.vehicle.deleteMany({})
    await prisma.franchise.deleteMany({})
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: '@test.com' } },
          { email: 'admin@drivncook.com' }
        ]
      }
    })
    
    console.log('✅ Données de test supprimées')
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
  }
}

// Exécuter le script
const args = process.argv.slice(2)
if (args.includes('--clear')) {
  clearData()
} else {
  createTestData()
}

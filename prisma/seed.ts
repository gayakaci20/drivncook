import { PrismaClient, UserRole, FranchiseStatus, VehicleStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Supprimer toutes les données existantes
  await prisma.auditLog.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.salesReport.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.maintenance.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.franchise.deleteMany()
  await prisma.user.deleteMany()

  // Hash du mot de passe par défaut
  const hashedPassword = await bcrypt.hash('password123', 12)

  // 1. Créer les utilisateurs administrateurs
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@drivncook.fr',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '0123456789',
      role: UserRole.SUPER_ADMIN,
    }
  })

  const admin = await prisma.user.create({
    data: {
      email: 'gestion@drivncook.fr',
      password: hashedPassword,
      firstName: 'Gestionnaire',
      lastName: 'Principal',
      phone: '0123456790',
      role: UserRole.ADMIN,
    }
  })

  console.log('✅ Utilisateurs administrateurs créés')

  // 2. Créer les catégories de produits
  const categories = await Promise.all([
    prisma.productCategory.create({
      data: {
        name: 'Ingrédients frais',
        description: 'Légumes, fruits, viandes, poissons'
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Plats préparés',
        description: 'Burgers, sandwichs, salades préparées'
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Boissons',
        description: 'Sodas, jus, eaux, boissons chaudes'
      }
    }),
    prisma.productCategory.create({
      data: {
        name: 'Conditionnement',
        description: 'Emballages, serviettes, couverts'
      }
    })
  ])

  console.log('✅ Catégories de produits créées')

  // 3. Créer les entrepôts
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'Entrepôt Nord',
        address: '123 Avenue de la République',
        city: 'Saint-Denis',
        postalCode: '93200',
        region: 'Île-de-France',
        phone: '0145678901',
        email: 'nord@drivncook.fr',
        capacity: 5000
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Entrepôt Sud',
        address: '456 Rue de la Liberté',
        city: 'Créteil',
        postalCode: '94000',
        region: 'Île-de-France',
        phone: '0145678902',
        email: 'sud@drivncook.fr',
        capacity: 4500
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Entrepôt Est',
        address: '789 Boulevard de l\'Égalité',
        city: 'Montreuil',
        postalCode: '93100',
        region: 'Île-de-France',
        phone: '0145678903',
        email: 'est@drivncook.fr',
        capacity: 3000
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Entrepôt Ouest',
        address: '321 Place de la Fraternité',
        city: 'Nanterre',
        postalCode: '92000',
        region: 'Île-de-France',
        phone: '0145678904',
        email: 'ouest@drivncook.fr',
        capacity: 3500
      }
    })
  ])

  console.log('✅ Entrepôts créés')

  // 4. Créer des produits
  const products = await Promise.all([
    // Ingrédients frais
    prisma.product.create({
      data: {
        name: 'Pain burger',
        description: 'Pain spécial burger artisanal',
        sku: 'PAIN-001',
        unitPrice: 0.85,
        unit: 'pièce',
        minStock: 100,
        maxStock: 500,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Steak haché 150g',
        description: 'Steak haché de bœuf 150g',
        sku: 'VIANDE-001',
        unitPrice: 3.50,
        unit: 'pièce',
        minStock: 50,
        maxStock: 200,
        categoryId: categories[0].id
      }
    }),
    // Plats préparés
    prisma.product.create({
      data: {
        name: 'Burger Classic',
        description: 'Burger avec steak, salade, tomate, cornichons',
        sku: 'BURGER-001',
        unitPrice: 8.90,
        unit: 'pièce',
        minStock: 20,
        maxStock: 100,
        categoryId: categories[1].id
      }
    }),
    // Boissons
    prisma.product.create({
      data: {
        name: 'Coca-Cola 33cl',
        description: 'Canette Coca-Cola 33cl',
        sku: 'BOIS-001',
        unitPrice: 2.50,
        unit: 'pièce',
        minStock: 200,
        maxStock: 1000,
        categoryId: categories[2].id
      }
    }),
    // Conditionnement
    prisma.product.create({
      data: {
        name: 'Emballage burger',
        description: 'Emballage carton pour burger',
        sku: 'PACK-001',
        unitPrice: 0.15,
        unit: 'pièce',
        minStock: 500,
        maxStock: 2000,
        categoryId: categories[3].id
      }
    })
  ])

  console.log('✅ Produits créés')

  // 5. Créer les stocks
  for (const warehouse of warehouses) {
    for (const product of products) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: Math.floor(Math.random() * 500) + 100,
          reservedQty: 0
        }
      })
    }
  }

  console.log('✅ Stocks initialisés')

  // 6. Créer des franchisés
  const franchisees = await Promise.all([
    // Franchisé 1
    prisma.user.create({
      data: {
        email: 'jean.dupont@example.com',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '0612345678',
        role: UserRole.FRANCHISEE,
        franchise: {
          create: {
            businessName: 'Food Truck Dupont SARL',
            siretNumber: '12345678901234',
            vatNumber: 'FR1234567890',
            address: '45 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            region: 'Île-de-France',
            contactEmail: 'jean.dupont@example.com',
            contactPhone: '0612345678',
            status: FranchiseStatus.ACTIVE,
            entryFeePaid: true,
            entryFeeDate: new Date('2024-01-15'),
            contractStartDate: new Date('2024-02-01'),
            contractEndDate: new Date('2029-01-31')
          }
        }
      },
      include: { franchise: true }
    }),
    // Franchisé 2
    prisma.user.create({
      data: {
        email: 'marie.martin@example.com',
        password: hashedPassword,
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '0687654321',
        role: UserRole.FRANCHISEE,
        franchise: {
          create: {
            businessName: 'Martin Food Truck EURL',
            siretNumber: '98765432109876',
            vatNumber: 'FR0987654321',
            address: '123 Avenue des Champs',
            city: 'Neuilly-sur-Seine',
            postalCode: '92200',
            region: 'Île-de-France',
            contactEmail: 'marie.martin@example.com',
            contactPhone: '0687654321',
            status: FranchiseStatus.ACTIVE,
            entryFeePaid: true,
            entryFeeDate: new Date('2024-03-01'),
            contractStartDate: new Date('2024-03-15'),
            contractEndDate: new Date('2029-03-14')
          }
        }
      },
      include: { franchise: true }
    })
  ])

  console.log('✅ Franchisés créés')

  // 7. Créer des véhicules
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        licensePlate: 'AB-123-CD',
        brand: 'Renault',
        model: 'Master Food Truck',
        year: 2023,
        vin: '1HGBH41JXMN109186',
        status: VehicleStatus.ASSIGNED,
        purchaseDate: new Date('2024-01-10'),
        purchasePrice: 85000,
        currentMileage: 12500,
        lastInspectionDate: new Date('2024-01-15'),
        nextInspectionDate: new Date('2025-01-15'),
        franchiseId: franchisees[0].franchise!.id
      }
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: 'EF-456-GH',
        brand: 'Iveco',
        model: 'Daily Food Truck',
        year: 2023,
        vin: '2HGBH41JXMN109187',
        status: VehicleStatus.ASSIGNED,
        purchaseDate: new Date('2024-02-20'),
        purchasePrice: 78000,
        currentMileage: 8900,
        lastInspectionDate: new Date('2024-02-25'),
        nextInspectionDate: new Date('2025-02-25'),
        franchiseId: franchisees[1].franchise!.id
      }
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: 'IJ-789-KL',
        brand: 'Fiat',
        model: 'Ducato Food Truck',
        year: 2024,
        vin: '3HGBH41JXMN109188',
        status: VehicleStatus.AVAILABLE,
        purchaseDate: new Date('2024-06-15'),
        purchasePrice: 72000,
        currentMileage: 2100,
        lastInspectionDate: new Date('2024-06-20'),
        nextInspectionDate: new Date('2025-06-20')
      }
    })
  ])

  console.log('✅ Véhicules créés')

  // 8. Créer quelques rapports de vente
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  for (let i = 0; i < 30; i++) {
    const reportDate = new Date(lastMonth)
    reportDate.setDate(lastMonth.getDate() + i)

    await prisma.salesReport.create({
      data: {
        reportDate,
        dailySales: Math.floor(Math.random() * 800) + 200, // 200-1000€
        transactionCount: Math.floor(Math.random() * 50) + 10,
        location: 'La Défense',
        franchiseId: franchisees[0].franchise!.id,
        createdById: franchisees[0].id,
        royaltyAmount: 0 // Sera calculé automatiquement
      }
    })

    await prisma.salesReport.create({
      data: {
        reportDate,
        dailySales: Math.floor(Math.random() * 700) + 300,
        transactionCount: Math.floor(Math.random() * 45) + 15,
        location: 'Châtelet',
        franchiseId: franchisees[1].franchise!.id,
        createdById: franchisees[1].id,
        royaltyAmount: 0
      }
    })
  }

  console.log('✅ Rapports de vente créés')

  console.log('🎉 Seeding terminé avec succès!')
  console.log('📧 Comptes de test créés:')
  console.log('  - Super Admin: admin@drivncook.fr / password123')
  console.log('  - Admin: gestion@drivncook.fr / password123')
  console.log('  - Franchisé 1: jean.dupont@example.com / password123')
  console.log('  - Franchisé 2: marie.martin@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
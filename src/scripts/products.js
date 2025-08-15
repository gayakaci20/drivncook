const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const categoriesToSeed = [
  {
    name: 'Ingrédients frais',
    description: 'Produits frais pour la préparation',
    products: [
      { sku: 'IFR-TOMATE-001', name: 'Tomates', unitPrice: '2.90', unit: 'kg', minStock: 0 },
      { sku: 'IFR-OIGNON-001', name: 'Oignons jaunes', unitPrice: '1.80', unit: 'kg', minStock: 0 },
      { sku: 'IFR-SALADE-001', name: 'Salade verte', unitPrice: '1.50', unit: 'u', minStock: 0 },
      { sku: 'IFR-CHEDDAR-001', name: 'Cheddar tranché', unitPrice: '6.50', unit: 'kg', minStock: 0 },
      { sku: 'IFR-STEAK-001', name: 'Steak haché 150g', unitPrice: '1.20', unit: 'u', minStock: 0 }
    ]
  },
  {
    name: 'Plats préparés',
    description: 'Plats prêts à servir',
    products: [
      { sku: 'PRE-WRAP-POU-001', name: 'Wrap poulet', unitPrice: '4.20', unit: 'u', minStock: 0 },
      { sku: 'PRE-SALADE-001', name: 'Salade César', unitPrice: '5.90', unit: 'u', minStock: 0 },
      { sku: 'PRE-BURGER-001', name: 'Burger classique', unitPrice: '6.90', unit: 'u', minStock: 0 }
    ]
  },
  {
    name: 'Boissons',
    description: 'Boissons fraîches',
    products: [
      { sku: 'BOI-EAU-50CL-001', name: 'Eau minérale 50cl', unitPrice: '0.60', unit: 'u', minStock: 0 },
      { sku: 'BOI-COLA-33CL-001', name: 'Soda cola 33cl', unitPrice: '0.85', unit: 'u', minStock: 0 },
      { sku: 'BOI-JUS-OR-25-001', name: 'Jus d\'orange 25cl', unitPrice: '1.10', unit: 'u', minStock: 0 }
    ]
  },
  {
    name: 'Conditionnement',
    description: 'Emballages et consommables',
    products: [
      { sku: 'CON-BOX-BUR-001', name: 'Boîte burger kraft', unitPrice: '0.12', unit: 'u', minStock: 0 },
      { sku: 'CON-GOB-50CL-001', name: 'Gobelet 50cl', unitPrice: '0.10', unit: 'u', minStock: 0 },
      { sku: 'CON-SACH-PAP-001', name: 'Sachet papier', unitPrice: '0.05', unit: 'u', minStock: 0 }
    ]
  }
]

async function ensureCategory(name, description) {
  const existing = await prisma.productCategory.findFirst({ where: { name } })
  if (existing) return existing
  return prisma.productCategory.create({ data: { name, description } })
}

async function upsertProduct(input) {
  const { sku, name, unitPrice, unit, minStock, maxStock, imageUrl, description, barcode, categoryId } = input
  return prisma.product.upsert({
    where: { sku },
    update: {
      name,
      unitPrice,
      unit,
      minStock: typeof minStock === 'number' ? minStock : 0,
      maxStock: typeof maxStock === 'number' ? maxStock : null,
      imageUrl: imageUrl ?? null,
      description: description ?? null,
      barcode: barcode ?? null,
      categoryId
    },
    create: {
      name,
      sku,
      unitPrice,
      unit,
      minStock: typeof minStock === 'number' ? minStock : 0,
      maxStock: typeof maxStock === 'number' ? maxStock : null,
      imageUrl: imageUrl ?? null,
      description: description ?? null,
      barcode: barcode ?? null,
      categoryId
    }
  })
}

async function main() {
  const summary = []

  for (const cat of categoriesToSeed) {
    const category = await ensureCategory(cat.name, cat.description)
    const created = []
    for (const p of cat.products) {
      const product = await upsertProduct({ ...p, categoryId: category.id })
      created.push(product.sku)
    }
    summary.push({ category: category.name, products: created })
  }

  console.log('Seed terminé:')
  for (const s of summary) {
    console.log(`- ${s.category}: ${s.products.length} produits`) 
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



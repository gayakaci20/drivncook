const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const warehousesToSeed = [
  {
    name: 'Entrepôt Paris Nord',
    address: '12 Rue des Entrepôts',
    city: 'Paris',
    postalCode: '75018',
    region: 'Île-de-France',
    phone: '+33 1 45 00 00 01',
    email: 'paris-nord@drivncook.fr',
    advisor: 'Camille Dupont',
    capacity: 1200
  },
  {
    name: 'Entrepôt Lyon Est',
    address: '8 Avenue de la Logistique',
    city: 'Lyon',
    postalCode: '69008',
    region: 'Auvergne-Rhône-Alpes',
    phone: '+33 4 72 00 00 02',
    email: 'lyon-est@drivncook.fr',
    advisor: 'Julien Martin',
    capacity: 900
  },
  {
    name: 'Entrepôt Marseille Port',
    address: '21 Quai de la Joliette',
    city: 'Marseille',
    postalCode: '13002',
    region: "Provence-Alpes-Côte d'Azur",
    phone: '+33 4 91 00 00 03',
    email: 'marseille-port@drivncook.fr',
    advisor: 'Sofia Bernard',
    capacity: 1000
  },
  {
    name: 'Entrepôt Bordeaux Ouest',
    address: '5 Rue du Port',
    city: 'Bordeaux',
    postalCode: '33300',
    region: 'Nouvelle-Aquitaine',
    phone: '+33 5 56 00 00 04',
    email: 'bordeaux-ouest@drivncook.fr',
    advisor: 'Lucas Moreau',
    capacity: 800
  },
  {
    name: 'Entrepôt Lille Flandres',
    address: '3 Rue des Ateliers',
    city: 'Lille',
    postalCode: '59000',
    region: 'Hauts-de-France',
    phone: '+33 3 20 00 00 05',
    email: 'lille-flandres@drivncook.fr',
    advisor: 'Emma Lefevre',
    capacity: 700
  }
]

async function createOrUpdateWarehouse(input) {
  const existing = await prisma.warehouse.findFirst({
    where: {
      name: input.name,
      city: input.city
    }
  })

  const data = {
    name: input.name,
    address: input.address,
    city: input.city,
    postalCode: input.postalCode,
    region: input.region,
    phone: input.phone ?? null,
    email: input.email ?? null,
    advisor: input.advisor ?? null,
    capacity: typeof input.capacity === 'number' ? input.capacity : 0,
    isActive: true
  }

  if (existing) {
    return prisma.warehouse.update({ where: { id: existing.id }, data })
  }
  return prisma.warehouse.create({ data })
}

async function main() {
  const results = []
  for (const w of warehousesToSeed) {
    const saved = await createOrUpdateWarehouse(w)
    results.push(`${saved.name} (${saved.city})`)
  }
  console.log(`Seed entrepôts terminé: ${results.length} enregistrements`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



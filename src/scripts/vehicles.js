const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const vehiclesToSeed = [
  {
    licensePlate: 'DC-123-AB',
    brand: 'Renault',
    model: 'Master',
    year: 2021,
    vin: 'VF1MASTAR12345678',
    purchaseDate: '2023-03-15',
    purchasePrice: '32000.00',
    currentMileage: 42000
  },
  {
    licensePlate: 'DC-456-CD',
    brand: 'Peugeot',
    model: 'Boxer',
    year: 2020,
    vin: 'VF3BOXERXABCDEFG1',
    purchaseDate: '2022-11-20',
    purchasePrice: '29500.00',
    currentMileage: 60000
  },
  {
    licensePlate: 'DC-789-EF',
    brand: 'Citroën',
    model: 'Jumper',
    year: 2022,
    vin: 'VF7JUMPERABCDEFG2',
    purchaseDate: '2024-02-10',
    purchasePrice: '30500.00',
    currentMileage: 18000
  },
  {
    licensePlate: 'DC-147-GH',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2019,
    vin: 'WDBSPRINTERABCDE34',
    purchaseDate: '2021-07-05',
    purchasePrice: '45000.00',
    currentMileage: 98000
  },
  {
    licensePlate: 'DC-258-IJ',
    brand: 'Fiat',
    model: 'Ducato',
    year: 2021,
    vin: 'ZFA1DUCATOABCDE56',
    purchaseDate: '2023-09-30',
    purchasePrice: '28500.00',
    currentMileage: 35000
  }
]

async function upsertVehicle(data) {
  const {
    licensePlate,
    brand,
    model,
    year,
    vin,
    purchaseDate,
    purchasePrice,
    currentMileage
  } = data

  const base = {
    licensePlate,
    brand,
    model,
    year,
    status: 'AVAILABLE',
    purchaseDate: new Date(purchaseDate),
    purchasePrice,
    currentMileage: typeof currentMileage === 'number' ? currentMileage : null,
    isActive: true
  }

  return prisma.vehicle.upsert({
    where: { vin },
    update: base,
    create: { ...base, vin }
  })
}

async function main() {
  const results = []
  for (const v of vehiclesToSeed) {
    const saved = await upsertVehicle(v)
    results.push(saved.vin)
  }
  console.log(`Seed véhicules terminé: ${results.length} enregistrements`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'gaya.kaci2002@hotmail.fr' }
  })

  if (existingAdmin) {
    console.log('Admin user already exists')
    return
  }

  const hashedPassword = await bcrypt.hash('test123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'gaya.kaci2002@hotmail.fr',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN' as any,
      isActive: true    
    }
  })

  console.log('✅ Admin user created:', adminUser.email)

  const categories = [
    { name: 'Viandes', description: 'Produits carnés' },
    { name: 'Légumes', description: 'Légumes frais' },
    { name: 'Épices', description: 'Épices et condiments' },
    { name: 'Boissons', description: 'Boissons diverses' }
  ]

  for (const category of categories) {
    const existing = await prisma.productCategory.findFirst({
      where: { name: category.name }
    })
    
    if (!existing) {
      await prisma.productCategory.create({
        data: {
          name: category.name,
          description: category.description,
          isActive: true
        }
      })
      console.log(`✅ Category created: ${category.name}`)
    }
  }

  console.log('Seeding completed!')
  console.log('Admin login: gaya.kaci2002@hotmail.fr')
  console.log('Admin password: test123')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

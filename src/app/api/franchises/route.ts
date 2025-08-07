import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

 
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

     
    const where: any = {}
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

     
    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        where,
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
              status: true
            }
          },
          _count: {
            select: {
              orders: true,
              salesReports: true,
              invoices: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.franchise.count({ where })
    ])

     
    const serializedFranchises = franchises.map((franchise: any) => ({
      ...franchise,
      entryFee: Number(franchise.entryFee),
      royaltyRate: Number(franchise.royaltyRate),
      _count: {
        orders: Number(franchise._count.orders),
        salesReports: Number(franchise._count.salesReports),
        invoices: Number(franchise._count.invoices)
      }
    }))

    const response = {
      data: serializedFranchises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Erreur dans GET /api/franchises:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

 
const createFranchiseSchema = z.object({
   
  userData: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    phone: z.string().optional()
  }),
   
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siretNumber: z.string().regex(/^\d{14}$/, 'Le numéro SIRET doit contenir 14 chiffres'),
  vatNumber: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  region: z.string().min(2, 'La région est requise'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(10, 'Le numéro de téléphone est requis'),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED']).default('PENDING'),
  entryFee: z.coerce.number().min(0, 'Le droit d\'entrée doit être positif').default(50000),
  entryFeePaid: z.boolean().default(false),
  entryFeeDate: z.string().optional(),
  royaltyRate: z.coerce.number().min(0).max(100).default(4),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional()
})

 
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
    const validationResult = createFranchiseSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const data = validationResult.data

     
    const existingUser = await prisma.user.findUnique({
      where: { email: data.userData.email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      }, { status: 400 })
    }

     
    const existingSiret = await prisma.franchise.findUnique({
      where: { siretNumber: data.siretNumber }
    })

    if (existingSiret) {
      return NextResponse.json({
        success: false,
        error: 'Ce numéro SIRET est déjà utilisé'
      }, { status: 400 })
    }

     
    const hashedPassword = await bcrypt.hash(data.userData.password, 12)

     
    const result = await prisma.$transaction(async (tx: any) => {
       
      const user = await tx.user.create({
        data: {
          email: data.userData.email,
          password: hashedPassword,
          firstName: data.userData.firstName,
          lastName: data.userData.lastName,
          phone: data.userData.phone || null,
          role: UserRole.FRANCHISEE,
          isActive: data.status === 'ACTIVE'
        }
      })

       
      const franchise = await tx.franchise.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          siretNumber: data.siretNumber,
          vatNumber: data.vatNumber || null,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          region: data.region,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          status: data.status,
          entryFee: data.entryFee,
          entryFeePaid: data.entryFeePaid,
          entryFeeDate: data.entryFeeDate ? new Date(data.entryFeeDate) : null,
          royaltyRate: data.royaltyRate,
          contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
          contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null
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
          }
        }
      })

       
      await tx.user.update({
        where: { id: user.id },
        data: { franchiseId: franchise.id }
      })

       
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          tableName: 'franchises',
          recordId: franchise.id,
          newValues: JSON.stringify({
            franchise: {
              id: franchise.id,
              businessName: franchise.businessName,
              status: franchise.status
            },
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          }),
          userId: (session.user as ExtendedUser).id
        }
      })

      return franchise
    })

    return NextResponse.json({
      success: true,
      message: 'Franchisé créé avec succès',
      data: {
        id: result.id,
        businessName: result.businessName,
        status: result.status,
        user: result.user
      }
    })

  } catch (error) {
    console.error('Erreur dans POST /api/franchises:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}


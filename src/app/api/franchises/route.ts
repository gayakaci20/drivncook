import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/franchises - Lister les franchisés
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Construire les filtres
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

    // Récupérer les franchisés avec pagination
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

    // Convertir les BigInt en nombres pour éviter les erreurs de sérialisation
    const serializedFranchises = franchises.map(franchise => ({
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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}


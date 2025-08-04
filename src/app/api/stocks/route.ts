import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withAuth, 
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  parsePaginationParams,
  createPaginationResponse
} from '@/lib/api-utils'
import { UserRole } from '@/types/prisma-enums'

// GET /api/stocks - Lister les stocks
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams)
    const warehouseId = searchParams.get('warehouseId') || ''
    const productId = searchParams.get('productId') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    // Construire les filtres
    const where: any = {}
    
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    if (productId) {
      where.productId = productId
    }

    // Récupérer les stocks avec pagination
    const [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              minStock: true,
              maxStock: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              city: true,
              region: true
            }
          }
        },
        skip: ((page || 1) - 1) * (limit || 20),
        take: limit || 20,
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' }
      }),
      prisma.stock.count({ where })
    ])

    // Filtrer les stocks faibles si demandé
    let filteredStocks = stocks
    if (lowStock) {
      filteredStocks = stocks.filter(stock => 
        stock.quantity <= stock.product.minStock
      )
    }

    const response = createPaginationResponse(filteredStocks, total, page || 1, limit || 20)
    return createSuccessResponse(response)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FRANCHISE_MANAGER, UserRole.FRANCHISEE]
)

// POST /api/stocks - Ajuster un stock
export const POST = withAuth(
  withErrorHandling(async (request: NextRequest, context: any, session: any) => {
    const body = await request.json()
    const { productId, warehouseId, quantity, operation, notes } = body

    if (!productId || !warehouseId || quantity === undefined || !operation) {
      return createErrorResponse('Données manquantes (productId, warehouseId, quantity, operation)', 400)
    }

    if (!['ADD', 'REMOVE', 'SET'].includes(operation)) {
      return createErrorResponse('Opération invalide (ADD, REMOVE, SET)', 400)
    }

    // Vérifier que le produit et l'entrepôt existent
    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.warehouse.findUnique({ where: { id: warehouseId } })
    ])

    if (!product) {
      return createErrorResponse('Produit introuvable', 404)
    }

    if (!warehouse) {
      return createErrorResponse('Entrepôt introuvable', 404)
    }

    // Récupérer ou créer le stock
    let stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId
        }
      }
    })

    let newQuantity: number

    if (!stock) {
      // Créer un nouveau stock
      if (operation === 'REMOVE') {
        return createErrorResponse('Impossible de retirer du stock inexistant', 400)
      }
      newQuantity = operation === 'SET' ? quantity : quantity
      
      stock = await prisma.stock.create({
        data: {
          productId,
          warehouseId,
          quantity: newQuantity,
          lastRestockDate: operation === 'ADD' || operation === 'SET' ? new Date() : null
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unit: true,
              minStock: true
            }
          },
          warehouse: {
            select: {
              name: true,
              city: true
            }
          }
        }
      })
    } else {
      // Mettre à jour le stock existant
      switch (operation) {
        case 'ADD':
          newQuantity = stock.quantity + quantity
          break
        case 'REMOVE':
          newQuantity = Math.max(0, stock.quantity - quantity)
          break
        case 'SET':
          newQuantity = quantity
          break
        default:
          newQuantity = stock.quantity
      }

      stock = await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId
          }
        },
        data: {
          quantity: newQuantity,
          lastRestockDate: operation === 'ADD' || operation === 'SET' ? new Date() : stock.lastRestockDate
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unit: true,
              minStock: true
            }
          },
          warehouse: {
            select: {
              name: true,
              city: true
            }
          }
        }
      })
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        tableName: 'stocks',
        recordId: stock.id,
        newValues: JSON.stringify({
          operation,
          quantity,
          newTotal: newQuantity,
          notes
        }),
        userId: session.user.id
      }
    })

    return createSuccessResponse(stock, `Stock ${operation === 'ADD' ? 'ajouté' : operation === 'REMOVE' ? 'retiré' : 'mis à jour'} avec succès`)
  }),
  [UserRole.SUPER_ADMIN, UserRole.ADMIN]
)
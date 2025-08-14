'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  Edit,
  Plus,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface WarehouseDetail {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  region: string
  phone: string | null
  email: string | null
  capacity: number
  isActive: boolean
  _count?: {
    stocks: number
    orderItems: number
  }
}

interface StockItem {
  id: string
  quantity: number
  reservedQty: number
  lastRestockDate: string | null
  expirationDate: string | null
  product: {
    id: string
    name: string
    sku: string
    unit: string
    minStock: number
    maxStock: number | null
    category?: { name: string }
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WarehouseDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null)
  const [stocks, setStocks] = useState<StockItem[]>([])

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    fetchData()
  }, [session, isPending, resolvedParams.id, router])

  const fetchData = async () => {
    try {
      const [wRes, sRes] = await Promise.all([
        fetch(`/api/warehouses/${resolvedParams.id}`, { cache: 'no-store' }),
        fetch(`/api/stocks?warehouseId=${resolvedParams.id}&limit=1000`, { cache: 'no-store' })
      ])

      let warehouseFromApi: (WarehouseDetail & { stocks?: any[] }) | null = null
      let stocksFromApi: StockItem[] = []

      if (wRes.ok) {
        const wJson = await wRes.json()
        warehouseFromApi = (wJson?.data as any) || null
        setWarehouse(warehouseFromApi)
      }

      if (sRes.ok) {
        const sJson = await sRes.json()
        stocksFromApi = ((sJson?.data?.data) || []) as StockItem[]
      }

      if (stocksFromApi.length > 0) {
        setStocks(stocksFromApi)
      } else if (Array.isArray(warehouseFromApi?.stocks) && (warehouseFromApi!.stocks as any[]).length > 0) {
        setStocks((warehouseFromApi!.stocks as any[]) as StockItem[])
      } else {
        setStocks([])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const capacityUsage = useMemo(() => {
    if (!warehouse) return 0
    const totalQty = stocks.reduce((sum, s) => sum + s.quantity, 0)
    return Math.min(100, Math.round((totalQty / Math.max(warehouse.capacity, 1)) * 100))
  }, [warehouse, stocks])

  const totalProducts = stocks.length
  const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0)
  const lowStockCount = stocks.filter((s) => s.quantity - s.reservedQty <= s.product.minStock).length

  const getStockBadge = (available: number, minStock: number, maxStock: number | null) => {
    if (available <= 0) return <Badge variant="destructive">Rupture</Badge>
    if (available <= minStock) return <Badge variant="secondary">Stock faible</Badge>
    if (maxStock && available >= maxStock) return <Badge variant="default">Élevé</Badge>
    return <Badge variant="default">Normal</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Entrepôt introuvable</h3>
          <Button onClick={() => router.push('/admin/warehouses')}>Retour à la liste</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/warehouses')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              {warehouse.name}
            </h2>
            <p className="text-gray-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {warehouse.city}, {warehouse.region}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/inventory/new?warehouseId=${warehouse.id}`)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Mouvement de stock
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/warehouses/${warehouse.id}/edit`)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Références stockées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantité totale</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Unités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisation</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityUsage}%</div>
            <p className="text-xs text-muted-foreground">de {warehouse.capacity.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Stock faible</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations entrepôt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium">{warehouse.address}</div>
              <div className="text-sm text-gray-500">{warehouse.postalCode} {warehouse.city}, {warehouse.region}</div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${warehouse.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="font-medium">{warehouse.isActive ? 'Actif' : 'Inactif'}</div>
            </div>

            {warehouse.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div className="font-medium">{warehouse.phone}</div>
              </div>
            )}

            {warehouse.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div className="font-medium">{warehouse.email}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Capacité totale</span>
                <span className="font-medium">{warehouse.capacity.toLocaleString()} unités</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    capacityUsage > 80 ? 'bg-red-600' : capacityUsage > 60 ? 'bg-orange-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${capacityUsage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun stock enregistré.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stocks.map((s) => {
                const available = s.quantity - s.reservedQty
                return (
                  <div key={s.id} className="p-4 border rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{s.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {s.product.sku}</div>
                      </div>
                      {getStockBadge(available, s.product.minStock, s.product.maxStock)}
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-medium">{s.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Réservé</span>
                        <span className="text-orange-600">{s.reservedQty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponible</span>
                        <span className="font-medium text-green-600">{available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernier réassort</span>
                        <span className="text-gray-600">{formatDate(s.lastRestockDate)}</span>
                      </div>
                      {s.expirationDate && (
                        <div className="flex justify-between">
                          <span>Péremption</span>
                          <span className="flex items-center gap-1 text-red-600">
                            <Clock className="h-3 w-3" /> {formatDate(s.expirationDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



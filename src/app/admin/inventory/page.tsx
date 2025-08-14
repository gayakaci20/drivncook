'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Eye,
  Edit,
  Download,
  ChevronDown,
  Apple,
  Coffee,
  Utensils,
  Box
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { useSession } from '@/lib/auth-client'
import { safeFetchJson } from '@/lib/utils'
import { UserRole } from '@/types/prisma-enums'

interface Product {
  id: string
  name: string
  description: string | null
  sku: string
  barcode: string | null
  unitPrice: number
  unit: string
  minStock: number
  maxStock: number | null
  imageUrl: string | null
  isActive: boolean
  category: {
    id: string
    name: string
  }
  stocks: Array<{
    id: string
    quantity: number
    reservedQty: number
    lastRestockDate: string | null
    expirationDate: string | null
    warehouse: {
      id: string
      name: string
      city: string
    }
  }>
}

interface Warehouse {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  region: string
  capacity: number
  isActive: boolean
  stocks: Array<{
    id: string
    quantity: number
    reservedQty: number
    product: {
      id: string
      name: string
      sku: string
      unit: string
      minStock: number
    }
  }>
}

interface StockAlert {
  productId: string
  productName: string
  sku: string
  warehouseId: string
  warehouseName: string
  currentStock: number
  minStock: number
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function AdminInventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }

    fetchData()
  }, [session, isPending, router])

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.data.data || [])
      }

      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json()
        setWarehouses(warehousesData.data.data || [])
      }

       
      calculateStockAlerts()
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStockAlerts = () => {
    const alerts: StockAlert[] = []

    products.forEach(product => {
      product.stocks.forEach(stock => {
        const availableStock = stock.quantity - stock.reservedQty

        if (availableStock <= 0) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            warehouseId: stock.warehouse.id,
            warehouseName: stock.warehouse.name,
            currentStock: availableStock,
            minStock: product.minStock,
            alertType: 'OUT_OF_STOCK',
            severity: 'HIGH'
          })
        } else if (availableStock <= product.minStock) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            warehouseId: stock.warehouse.id,
            warehouseName: stock.warehouse.name,
            currentStock: availableStock,
            minStock: product.minStock,
            alertType: 'LOW_STOCK',
            severity: availableStock <= product.minStock * 0.5 ? 'HIGH' : 'MEDIUM'
          })
        }

         
        if (stock.expirationDate) {
          const expirationDate = new Date(stock.expirationDate)
          const today = new Date()
          const daysDiff = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysDiff <= 7 && daysDiff >= 0) {
            alerts.push({
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              warehouseId: stock.warehouse.id,
              warehouseName: stock.warehouse.name,
              currentStock: availableStock,
              minStock: product.minStock,
              alertType: 'EXPIRED',
              severity: daysDiff <= 3 ? 'HIGH' : 'MEDIUM'
            })
          }
        }
      })
    })

    setStockAlerts(alerts)
  }

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter && p.category.name !== categoryFilter) return false
      if (warehouseFilter && !p.stocks.some(s => s.warehouse.id === warehouseFilter)) return false
      if (!q) return true
      const haystack = [p.name, p.sku, p.barcode || '', p.category.name].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [products, categoryFilter, warehouseFilter, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getAlertBadge = (alertType: string, severity: string) => {
    const config = {
      'OUT_OF_STOCK': { label: 'Rupture', variant: 'destructive' as const },
      'LOW_STOCK': { label: 'Stock faible', variant: severity === 'HIGH' ? 'destructive' as const : 'secondary' as const },
      'EXPIRED': { label: 'Expire bientôt', variant: 'destructive' as const }
    }

    const alertConfig = config[alertType as keyof typeof config] || { label: alertType, variant: 'outline' as const }

    return <Badge variant={alertConfig.variant}>{alertConfig.label}</Badge>
  }

  const getStockStatusBadge = (currentStock: number, minStock: number, maxStock: number | null) => {
    if (currentStock <= 0) {
      return <Badge variant="destructive">Rupture</Badge>
    } else if (currentStock <= minStock) {
      return <Badge variant="secondary">Stock faible</Badge>
    } else if (maxStock && currentStock >= maxStock) {
      return <Badge variant="default">Stock élevé</Badge>
    } else {
      return <Badge variant="default">Stock normal</Badge>
    }
  }

   
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const totalValue = products.reduce((sum, product) => {
    const totalStock = product.stocks.reduce((stockSum, stock) => stockSum + stock.quantity, 0)
    return sum + (totalStock * product.unitPrice)
  }, 0)
  const alertsCount = stockAlerts.length
  const criticalAlerts = stockAlerts.filter(a => a.severity === 'HIGH').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Gestion des Stocks et Entrepôts</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => router.push('/admin/inventory/new')} className="flex items-center gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            Ajouter du stock
          </Button>
          <Button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Package className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">sur {totalProducts} total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrepôts</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">Île-de-France</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><BarChart3 className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center"><AlertTriangle className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{alertsCount}</div>
            <p className="text-xs text-muted-foreground">{criticalAlerts} critiques</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacité</CardTitle>
            <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {Math.round(warehouses.reduce((sum, w) => sum + w.capacity, 0) / warehouses.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Utilisation moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de stock */}
      {stockAlerts.length > 0 && (
        <Card className="rounded-2xl border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alertes de stock ({stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {stockAlerts.slice(0, 10).map((alert, index) => (
                <div key={`${alert.productId}-${alert.warehouseId}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-xl border">
                  <div>
                    <div className="font-medium">{alert.productName}</div>
                    <div className="text-sm text-gray-600">
                      {alert.sku} • {alert.warehouseName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600">{alert.currentStock}</div>
                    {getAlertBadge(alert.alertType, alert.severity)}
                  </div>
                </div>
              ))}
              {stockAlerts.length > 10 && (
                <div className="text-center py-2">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Voir toutes les alertes ({stockAlerts.length - 10} autres)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par nom, SKU, code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm backdrop-blur-md outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl">
                    <Filter className="h-4 w-4" />
                    {categoryFilter ? categoryFilter : 'Toutes les catégories'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCategoryFilter('')}>
                    <Filter className="h-4 w-4" />
                    Toutes les catégories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategoryFilter('Ingrédients frais')}>
                    <Apple className="h-4 w-4 text-green-600" />
                    Ingrédients frais
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Plats préparés')}>
                    <Utensils className="h-4 w-4 text-orange-600" />
                    Plats préparés
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Boissons')}>
                    <Coffee className="h-4 w-4 text-blue-600" />
                    Boissons
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Conditionnement')}>
                    <Box className="h-4 w-4 text-purple-600" />
                    Conditionnement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl">
                    <Building2 className="h-4 w-4" />
                    {warehouseFilter ? 
                      warehouses.find(w => w.id === warehouseFilter)?.name || 'Entrepôt sélectionné' 
                      : 'Tous les entrepôts'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setWarehouseFilter('')}>
                    <Building2 className="h-4 w-4" />
                    Tous les entrepôts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {warehouses.map(warehouse => (
                    <DropdownMenuItem key={warehouse.id} onClick={() => setWarehouseFilter(warehouse.id)}>
                      <Building2 className="h-4 w-4 text-blue-600" />
                      {warehouse.name} ({warehouse.city})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion par onglets */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
              const reservedStock = product.stocks.reduce((sum, stock) => sum + stock.reservedQty, 0)
              const availableStock = totalStock - reservedStock

              return (
                <Card key={product.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{product.name}</h3>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>SKU: {product.sku}</span>
                            <span>Catégorie: {product.category.name}</span>
                            <span>{formatCurrency(product.unitPrice)}</span>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {product.stocks.map((stock) => (
                              <div key={stock.id} className="p-3 border rounded-xl">
                                <div className="font-medium text-sm">{stock.warehouse.name}</div>
                                <div className="text-xs text-gray-500 mb-2">{stock.warehouse.city}</div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Total:</span>
                                    <span className="font-medium">{stock.quantity}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Réservé:</span>
                                    <span className="text-orange-600">{stock.reservedQty}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Disponible:</span>
                                    <span className="font-medium text-green-600">
                                      {stock.quantity - stock.reservedQty}
                                    </span>
                                  </div>
                                  {getStockStatusBadge(stock.quantity - stock.reservedQty, product.minStock, product.maxStock)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="text-lg font-semibold">{availableStock}</div>
                        <div className="text-sm text-gray-500">disponible</div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/inventory/new/${product.id}`)}
                            title="Ajouter du stock"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {products.length === 0 && (
              <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">Aucun produit</h3>
                  <p className="text-gray-500 dark:text-neutral-400 mb-4">Commencez par ajouter des produits à votre catalogue.</p>
                  <Button onClick={() => router.push('/admin/products/new')} className="rounded-xl">Ajouter un produit</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {warehouses.map((warehouse) => {
              const totalProducts = warehouse.stocks.length
              const lowStockProducts = warehouse.stocks.filter(s => s.quantity - s.reservedQty <= s.product.minStock).length
              const utilizationRate = (warehouse.stocks.reduce((sum, s) => sum + s.quantity, 0) / warehouse.capacity) * 100

              return (
                <Card key={warehouse.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{warehouse.city}, {warehouse.region}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-semibold">{totalProducts}</div>
                          <div className="text-xs text-gray-500">Produits</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-orange-600">{lowStockProducts}</div>
                          <div className="text-xs text-gray-500">Stock faible</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold">{Math.round(utilizationRate)}%</div>
                          <div className="text-xs text-gray-500">Utilisation</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Capacité:</span>
                          <span>{warehouse.capacity.toLocaleString()} unités</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilizationRate > 80 ? 'bg-red-600' : 
                              utilizationRate > 60 ? 'bg-orange-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => router.push(`/admin/warehouses/${warehouse.id}`)}>
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Mouvements de stock récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Historique des mouvements</h3>
                <p>Suivi des entrées/sorties de stock à venir</p>
                <p className="text-sm">(Fonctionnalité en développement)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <div>Graphique des catégories</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Évolution des stocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div>Courbe d\'évolution</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
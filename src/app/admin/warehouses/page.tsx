'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Package,
  TrendingUp,
  Eye,
  Edit,
  Phone,
  Mail
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Warehouse {
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
  _count: {
    stocks: number
    orderItems: number
  }
  stocks: Array<{
    quantity: number
    product: {
      name: string
      unit: string
    }
  }>
}

export default function AdminWarehousesPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchWarehouses()
  }, [search])

  const fetchWarehouses = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/warehouses?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setWarehouses(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entrepôts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCapacityUsage = (warehouse: Warehouse) => {
    const totalStock = warehouse.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
    const usage = (totalStock / warehouse.capacity) * 100
    return Math.min(usage, 100)
  }

  const getCapacityBadge = (usage: number) => {
    if (usage >= 90) return { variant: 'destructive' as const, label: 'Plein' }
    if (usage >= 70) return { variant: 'secondary' as const, label: 'Élevé' }
    if (usage >= 40) return { variant: 'default' as const, label: 'Modéré' }
    return { variant: 'outline' as const, label: 'Faible' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des entrepôts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Gestion des entrepôts
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Gérez votre réseau d'entrepôts et leur capacité
          </p>
        </div>
        <Button onClick={() => router.push('/admin/warehouses/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel entrepôt
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Total entrepôts</p>
                <p className="text-2xl font-bold text-blue-600">{warehouses.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Entrepôts actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {warehouses.filter(w => w.isActive).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Produits stockés</p>
                <p className="text-2xl font-bold text-purple-600">
                  {warehouses.reduce((sum, w) => sum + w._count.stocks, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Capacité totale</p>
                <p className="text-2xl font-bold text-orange-600">
                  {warehouses.reduce((sum, w) => sum + w.capacity, 0).toLocaleString()}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, région..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des entrepôts */}
      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Aucun entrepôt trouvé
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Commencez par ajouter votre premier entrepôt
            </p>
            <Button onClick={() => router.push('/admin/warehouses/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un entrepôt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {warehouses.map((warehouse) => {
            const capacityUsage = getCapacityUsage(warehouse)
            const capacityBadge = getCapacityBadge(capacityUsage)

            return (
              <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {warehouse.city}, {warehouse.region}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant={capacityBadge.variant}>
                        {capacityBadge.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Adresse</p>
                      <p className="font-medium">{warehouse.address}</p>
                      <p className="text-sm">{warehouse.postalCode} {warehouse.city}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Capacité</p>
                        <p className="font-semibold">{warehouse.capacity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Utilisation</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${capacityUsage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{capacityUsage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Produits stockés</p>
                        <p className="font-semibold">{warehouse._count.stocks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Commandes</p>
                        <p className="font-semibold">{warehouse._count.orderItems}</p>
                      </div>
                    </div>

                    {(warehouse.phone || warehouse.email) && (
                      <div className="border-t pt-3">
                        {warehouse.phone && (
                          <p className="text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {warehouse.phone}
                          </p>
                        )}
                        {warehouse.email && (
                          <p className="text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {warehouse.email}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/admin/warehouses/${warehouse.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir stocks
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/admin/warehouses/${warehouse.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
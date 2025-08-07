'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChevronDown
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'

interface Order {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  requestedDeliveryDate: string | null
  actualDeliveryDate: string | null
  totalAmount: number
  notes: string | null
  isFromDrivnCook: boolean
  _count: {
    orderItems: number
  }
  orderItems?: Array<{
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      name: string
      sku: string
      unit: string
    }
    warehouse: {
      name: string
      city: string
    }
  }>
}

export default function FranchiseOrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if ((session?.user as ExtendedUser).franchiseId) {
      fetchOrders()
    }
  }, [session, search, statusFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { label: 'Brouillon', variant: 'secondary' as const, icon: Package },
      'PENDING': { label: 'En attente', variant: 'default' as const, icon: Clock },
      'CONFIRMED': { label: 'Confirmée', variant: 'default' as const, icon: CheckCircle },
      'IN_PREPARATION': { label: 'En préparation', variant: 'default' as const, icon: Package },
      'SHIPPED': { label: 'Expédiée', variant: 'default' as const, icon: Truck },
      'DELIVERED': { label: 'Livrée', variant: 'default' as const, icon: CheckCircle },
      'CANCELLED': { label: 'Annulée', variant: 'destructive' as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: Package 
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getOrderTypeLabel = (isFromDrivnCook: boolean) => {
    return isFromDrivnCook ? 'Driv\'n Cook (80%)' : 'Externe (20%)'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Mes commandes
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Consultez et gérez vos commandes de produits
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => ['CONFIRMED', 'IN_PREPARATION', 'SHIPPED'].includes(o.status)).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Livrées</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Montant total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                  {formatAmount(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro de commande..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Filter className="h-4 w-4" />
                  {statusFilter ? (
                    statusFilter === 'PENDING' ? 'En attente' :
                    statusFilter === 'CONFIRMED' ? 'Confirmée' :
                    statusFilter === 'IN_PREPARATION' ? 'En préparation' :
                    statusFilter === 'SHIPPED' ? 'Expédiée' :
                    statusFilter === 'DELIVERED' ? 'Livrée' : statusFilter
                  ) : 'Tous les statuts'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('')}>
                  <Filter className="h-4 w-4" />
                  Tous les statuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
                  <Clock className="h-4 w-4 text-yellow-600" />
                  En attente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('CONFIRMED')}>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  Confirmée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('IN_PREPARATION')}>
                  <Package className="h-4 w-4 text-orange-600" />
                  En préparation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('SHIPPED')}>
                  <Truck className="h-4 w-4 text-purple-600" />
                  Expédiée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('DELIVERED')}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Livrée
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Vous n'avez pas encore passé de commandes
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Passer ma première commande
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-neutral-100">
                        {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {getOrderTypeLabel(order.isFromDrivnCook)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Date de commande</p>
                      <p className="font-medium">{formatDate(order.orderDate)}</p>
                    </div>
                    {order.requestedDeliveryDate && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Livraison souhaitée</p>
                        <p className="font-medium">{formatDate(order.requestedDeliveryDate)}</p>
                      </div>
                    )}
                    {order.actualDeliveryDate && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Livré le</p>
                        <p className="font-medium text-green-600">{formatDate(order.actualDeliveryDate)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.status)}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {order._count.orderItems} article{order._count.orderItems > 1 ? 's' : ''}
                      </p>
                      <p className="font-semibold text-lg">{formatAmount(order.totalAmount)}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
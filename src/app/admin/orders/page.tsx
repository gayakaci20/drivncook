'use client'

import { useState, useEffect } from 'react'
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
  Edit,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Pause,
  Truck,
  X
} from 'lucide-react'
import { safeFetchJson } from '@/lib/utils'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'


interface Order {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  requestedDeliveryDate: string | null
  totalAmount: number
  franchise: {
    businessName: string
    user: {
      firstName: string
      lastName: string
    }
  }
  _count: {
    orderItems: number
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }

    fetchOrders()
  }, [session, isPending, router])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/orders?${params}`)
      const data = await safeFetchJson(response)
      
      if (data.success) {
        setOrders(data.data.data || [])
      } else {
        throw new Error(data.error || 'Unknown server error')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
      
       
      if (error instanceof Error && error.message.includes('401')) {
        window.location.href = '/login'
        return
      }
      
      setOrders([])  
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { label: 'Brouillon', variant: 'secondary' as const, icon: Edit },
      'PENDING': { label: 'En attente', variant: 'default' as const, icon: Clock },
      'CONFIRMED': { label: 'Confirmée', variant: 'default' as const, icon: CheckCircle },
      'IN_PREPARATION': { label: 'En préparation', variant: 'default' as const, icon: Package },
      'SHIPPED': { label: 'Expédiée', variant: 'default' as const, icon: Package },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Gestion des commandes
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Suivi et gestion des commandes franchisés
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
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
                  placeholder="Rechercher par numéro, franchisé..."
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
                    statusFilter === 'DELIVERED' ? 'Livrée' :
                    statusFilter === 'CANCELLED' ? 'Annulée' : statusFilter
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
                <DropdownMenuItem onClick={() => setStatusFilter('CANCELLED')}>
                  <XCircle className="h-4 w-4 text-red-600" />
                  Annulée
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Plus de filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Les commandes des franchisés apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-neutral-100">
                        {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {order.franchise.businessName} • {order.franchise.user.firstName} {order.franchise.user.lastName}
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
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Articles</p>
                      <p className="font-medium">{order._count.orderItems} article{order._count.orderItems > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Montant</p>
                      <p className="font-semibold text-lg">{formatAmount(order.totalAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.status)}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm"
                        onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

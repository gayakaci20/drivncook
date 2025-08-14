'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import UploadThingFileUpload from '@/components/ui/uploadthing-file-upload'

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentInfo, setPaymentInfo] = useState<{ orderId: string; invoiceId?: string } | null>(null)
  const [transmittingId, setTransmittingId] = useState<string | null>(null)
  const [attachmentsByOrder, setAttachmentsByOrder] = useState<Record<string, { name: string; size: number; type: string; url: string; key?: string }[]>>({})
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null)

  useEffect(() => {
    if ((session?.user as ExtendedUser).franchiseId) {
      fetchOrders()
    }
  }, [session, search, statusFilter])

  useEffect(() => {
    const pay = searchParams?.get('payment')
    const orderId = searchParams?.get('orderId') || ''
    const invoiceId = searchParams?.get('invoiceId') || undefined
    if (pay === 'success' && orderId) {
      setPaymentInfo({ orderId, invoiceId })
    }
  }, [searchParams])

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
      'PAID': { label: 'Payée - PDF requis', variant: 'default' as const, icon: Clock },
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

  const normalizeEuroAmount = (raw: unknown) => {
    const n = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : Number(raw))
    if (!Number.isFinite(n)) return 0
    if (Number.isInteger(n) && n >= 1000 && n % 1000 === 0) return n / 1000
    if (Number.isInteger(n) && n >= 100 && n % 100 === 0) return n / 100
    return n
  }

  const formatAmount = (amount: unknown) => {
    const euros = normalizeEuroAmount(amount)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(euros)
  }

  const getOrderTypeLabel = (isFromDrivnCook: boolean) => {
    return isFromDrivnCook ? 'Driv\'n Cook (80%)' : 'Externe (20%)'
  }

  const transmitOrder = async (orderId: string) => {
    try {
      setTransmittingId(orderId)
      const attachments = attachmentsByOrder[orderId] || []
      if (!attachments.length) {
        setShowUploadFor(orderId)
        toast.error('Veuillez ajouter un PDF')
        return
      }
      const res = await fetch(`/api/orders/${orderId}/transmit`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentUrls: attachments.map(a => a.url) })
      })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(js?.error || 'Erreur lors de la transmission')
        return
      }
      toast.success('Bon de commande transmis à l\'administration')
      fetchOrders()
    } finally {
      setTransmittingId(null)
    }
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
      {paymentInfo ? (
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium">Paiement confirmé</p>
              <p className="text-sm text-gray-600">Vos documents sont prêts au téléchargement.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/api/orders/${paymentInfo.orderId}/download`)}>
                Bon de commande (PDF)
              </Button>
              {paymentInfo.invoiceId ? (
                <Button onClick={() => router.push(`/api/invoices/${paymentInfo.invoiceId}/download`)}>
                  Facture (PDF)
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
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
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'PENDING' || o.status === 'PAID').length}
            </div>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => ['IN_PREPARATION', 'SHIPPED'].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">Confirmée • Préparation • Expédiée</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => ['DELIVERED', 'CONFIRMED'].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <div className="size-7 rounded-lg bg-gray-500/10 text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(orders.reduce((sum, order) => sum + normalizeEuroAmount(order.totalAmount), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total cumulé</p>
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
                    statusFilter === 'PAID' ? 'Payée - PDF requis' :
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
                <DropdownMenuItem onClick={() => setStatusFilter('PAID')}>
                  <Clock className="h-4 w-4 text-orange-600" />
                  Payée - PDF requis
                </DropdownMenuItem>
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
                        <p className="text-sm text-gray-600 dark:text-neutral-400">Date de récupération</p>
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
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/franchise/orders?view=${order.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      {(order.status === 'DRAFT' || order.status === 'PAID') ? (
                        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
                          <Button size="sm" onClick={() => {
                            if (!(attachmentsByOrder[order.id]?.length)) {
                              setShowUploadFor(order.id)
                              return
                            }
                            transmitOrder(order.id)
                          }} disabled={transmittingId === order.id}>
                            {transmittingId === order.id ? 'Transmission…' : 'Transmettre'}
                          </Button>
                          {(showUploadFor === order.id) && (
                            <div className="w-full md:w-64">
                          <UploadThingFileUpload 
                                maxFiles={1}
                                accept=".pdf"
                                label="Ajouter un PDF (obligatoire)"
                                onFilesChange={(files) => {
                                  setAttachmentsByOrder(prev => ({ ...prev, [order.id]: files }))
                              if (files.length > 0) {
                                setShowUploadFor(null)
                                // Transmission auto dès qu'un PDF est ajouté
                                transmitOrder(order.id)
                              }
                                }}
                                initialFiles={attachmentsByOrder[order.id]}
                              />
                            </div>
                          )}
                        </div>
                      ) : order.status === 'PENDING' ? (
                        <Badge variant="secondary">Transmis</Badge>
                      ) : null}
                    </div>
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
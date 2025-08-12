"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { ArrowLeft, Pencil } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

interface OrderItemView {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: { id: string; name: string; sku: string; unit: string }
  warehouse: { id: string; name: string; city: string }
}

interface OrderView {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  notes?: string | null
  requestedDeliveryDate?: string | null
  franchise: { businessName: string; user: { firstName: string; lastName: string; email: string } }
  orderItems: OrderItemView[]
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const { data: session, isPending } = useSession()
  const [order, setOrder] = useState<OrderView | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    load()
  }, [isPending])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${resolved.id}`, { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json()
      const data = j?.data ?? j
      setOrder(data as OrderView)
    } finally {
      setLoading(false)
    }
  }

  const toNumber = (value: unknown) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    const parsed = parseFloat(String(value))
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const formatAmount = (amount: unknown) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(toNumber(amount))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Card>
          <CardContent className="p-8 text-center">Commande introuvable</CardContent>
        </Card>
      </div>
    )
  }

  const itemsTotal = order.orderItems.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Commande {order.orderNumber}</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => router.push(`/admin/orders/${order.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" /> Modifier
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Franchise</div>
              <div className="font-medium">{order.franchise.businessName}</div>
              <div className="text-xs text-gray-500">{order.franchise.user.firstName} {order.franchise.user.lastName} — {order.franchise.user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Statut</div>
              <div className="font-medium">{order.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="font-semibold">{formatAmount(order.totalAmount)}</div>
            </div>
          </div>

          {order.requestedDeliveryDate && (
            <div>
              <div className="text-sm text-gray-500">Livraison souhaitée</div>
              <div className="font-medium">{new Date(order.requestedDeliveryDate).toLocaleDateString()}</div>
            </div>
          )}

          {order.notes && (
            <div>
              <div className="text-sm text-gray-500">Notes</div>
              <div className="text-sm">{order.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles ({order.orderItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {order.orderItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Aucun article</div>
          ) : (
            <div className="space-y-3">
              {order.orderItems.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center border-b pb-3">
                  <div className="md:col-span-2">
                    <div className="font-medium">{it.product.name}</div>
                    <div className="text-xs text-gray-500">SKU: {it.product.sku} • {it.warehouse.name} ({it.warehouse.city})</div>
                  </div>
                  <div className="text-sm">{it.quantity} {it.product.unit}</div>
                  <div className="text-right font-medium">{formatAmount(it.totalPrice)}</div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <div className="text-sm text-gray-600">Sous-total: <span className="font-semibold">{formatAmount(itemsTotal)}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



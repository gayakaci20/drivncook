"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { ArrowLeft, Pencil, Check, Download, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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
  transmittedAttachmentUrls?: string[]
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const { data: session, isPending } = useSession()
  const [order, setOrder] = useState<OrderView | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0)

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

  const confirmReception = async () => {
    if (!order) return
    try {
      setConfirming(true)
      const res = await fetch(`/api/admin/orders/${order.id}/confirm-reception`, { method: 'POST' })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(js?.error || 'Erreur de confirmation')
        return
      }
      toast.success('Réception confirmée')
      await load()
    } finally {
      setConfirming(false)
    }
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
        <div className="ml-auto flex items-center gap-2">
          {order.status !== 'CONFIRMED' && (
            <Button size="sm" onClick={confirmReception} disabled={confirming}>
              <Check className="h-4 w-4 mr-2" /> {confirming ? 'Confirmation…' : 'Confirmer réception'}
            </Button>
          )}
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
          <div>
            <div className="text-sm text-gray-500">Pièce jointe transmise</div>
            <div className="mt-1">
              {(order.transmittedAttachmentUrls && order.transmittedAttachmentUrls.length > 0) ? (
                <span className="inline-flex items-center text-green-600 dark:text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" /> Oui
                </span>
              ) : (
                <span className="inline-flex items-center text-gray-500 dark:text-neutral-400">
                  <XCircle className="h-4 w-4 mr-1" /> Non
                </span>
              )}
            </div>
          </div>
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
              <div className="text-sm text-gray-500">Date de récupération souhaitée</div>
              <div className="font-medium">{new Date(order.requestedDeliveryDate).toLocaleDateString('fr-FR')}</div>
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
                  <div className="text-sm">{it.quantity}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={'transmitted'}>
            <TabsContent value="transmitted" className="mt-4">
              {order.transmittedAttachmentUrls && order.transmittedAttachmentUrls.length > 0 ? (
                <div className="space-y-3">
                  {order.transmittedAttachmentUrls.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {order.transmittedAttachmentUrls.map((u, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveAttachmentIndex(i)}
                          className={`text-xs px-3 py-1 rounded-full border ${activeAttachmentIndex === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 border-gray-300 dark:border-neutral-700'}`}
                        >
                          {u.split('/').pop() || `document-${i+1}.pdf`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(order.transmittedAttachmentUrls![activeAttachmentIndex], '_blank') }>
                      <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir
                    </Button>
                    <Button size="sm" onClick={() => window.open(order.transmittedAttachmentUrls![activeAttachmentIndex], '_blank') }>
                      <Download className="h-4 w-4 mr-2" /> Télécharger
                    </Button>
                  </div>

                  <div className="relative w-full overflow-hidden rounded-xl border bg-white dark:bg-neutral-900" style={{ height: '70vh' }}>
                    <iframe
                      key={order.transmittedAttachmentUrls[activeAttachmentIndex]}
                      src={`${order.transmittedAttachmentUrls[activeAttachmentIndex]}#view=FitH`}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">Aucun PDF transmis</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}



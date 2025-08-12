"use client"

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { ArrowLeft, AlertTriangle, ShoppingCart } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

interface ProductDetail {
  id: string
  name: string
  description: string | null
  sku: string
  unitPrice: number
  unit: string
  imageUrl?: string | null
  category: { id: string; name: string }
}

interface StockRow {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  reservedQty: number
  warehouse: { id: string; name: string; city: string }
}

export default function FranchiseOrderForProductPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [requestedDate, setRequestedDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.FRANCHISEE) {
      router.push('/unauthorized')
      return
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending])

  const load = async () => {
    try {
      setLoading(true)
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/products?limit=1000&sortBy=createdAt&sortOrder=desc`),
        fetch(`/api/stocks?productId=${resolved.id}&limit=100&sortBy=warehouseId&sortOrder=asc`, { cache: 'no-store' })
      ])

      if (pRes.ok) {
        const pj = await pRes.json()
        const items = (pj?.data?.data || []) as ProductDetail[]
        const byId = items.find((x) => x.id === resolved.id) || null
        setProduct(byId)
      }

      if (sRes.ok) {
        const sj = await sRes.json()
        const rows = (sj?.data?.data || []) as StockRow[]
        setStocks(rows)
        if (rows.length > 0) {
          setWarehouseId(rows[0].warehouseId)
          const available0 = Math.max(0, rows[0].quantity - (rows[0].reservedQty || 0))
          setQuantity(available0 > 0 ? 1 : 0)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedStock = useMemo(() => stocks.find((s) => s.warehouseId === warehouseId) || null, [stocks, warehouseId])
  const available = selectedStock ? Math.max(0, selectedStock.quantity - (selectedStock.reservedQty || 0)) : 0
  const unitLabel = product?.unit || 'unités'
  const unitPrice = product?.unitPrice || 0
  const total = unitPrice * (quantity || 0)

  const canSubmit = !!product && !!warehouseId && quantity > 0 && available >= quantity && !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.FRANCHISEE) {
      router.push('/unauthorized')
      return
    }
    setSaving(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedDeliveryDate: requestedDate || undefined, notes, isFromDrivnCook: false })
      })
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        alert(err?.error || 'Erreur lors de la création de la commande')
        return
      }
      const orderJson = await orderRes.json()
      const orderData = orderJson?.data ?? orderJson
      const orderId = orderData?.id as string | undefined
      if (!orderId || typeof orderId !== 'string') {
        alert('Erreur: ID de commande manquant')
        return
      }

      const itemRes = await fetch('/api/order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: product.id,
          warehouseId,
          quantity,
          unitPrice,
          notes
        })
      })
      if (!itemRes.ok) {
        const err = await itemRes.json().catch(() => ({}))
        alert(err?.error || 'Erreur lors de l\'ajout de l\'article')
        return
      }

      router.push('/franchise/orders')
    } catch (e) {
      alert('Erreur inattendue')
    } finally {
      setSaving(false)
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

  if (!product) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Card>
          <CardContent className="p-8 text-center">Produit introuvable</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Commander — {product.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle commande</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Produit</label>
                <input value={`${product.name} — ${product.sku}`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-xl" />
                <div className="mt-2 text-xs text-gray-600">Prix: <span className="font-medium">{unitPrice} € / {unitLabel}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Entrepôt *</label>
                <select
                  name="warehouseId"
                  value={warehouseId}
                  onChange={(e) => {
                    const next = e.target.value
                    setWarehouseId(next)
                    const st = stocks.find(s => s.warehouseId === next)
                    const avail = st ? Math.max(0, st.quantity - (st.reservedQty || 0)) : 0
                    setQuantity(Math.min(Math.max(1, quantity), Math.max(0, avail)))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                >
                  <option value="">Sélectionner un entrepôt</option>
                  {stocks.map((s) => {
                    const avail = Math.max(0, s.quantity - (s.reservedQty || 0))
                    return (
                      <option key={s.warehouseId} value={s.warehouseId}>
                        {s.warehouse.name} ({s.warehouse.city}) — dispo: {avail} {unitLabel}
                      </option>
                    )
                  })}
                </select>
                {selectedStock && (
                  <div className="mt-2 text-xs text-gray-600">
                    Stock: <span className="font-medium">{selectedStock.quantity} {unitLabel}</span> • Réservé: <span className="font-medium text-orange-600">{selectedStock.reservedQty} {unitLabel}</span> • Disponible: <span className="font-medium text-green-600">{available} {unitLabel}</span>
                  </div>
                )}
                {selectedStock && available === 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-orange-700">
                    <AlertTriangle className="h-3 w-3" /> Rupture sur cet entrepôt
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Quantité *</label>
                <input
                  type="number"
                  min={1}
                  max={available || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(() => {
                    const v = Number(e.target.value)
                    if (!selectedStock) return v
                    return Math.max(1, Math.min(v, available))
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1,5,10].map(step => (
                    <Button key={step} type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setQuantity(q => {
                      const next = q + step
                      return selectedStock ? Math.min(next, available) : next
                    })}>
                      + {step}
                    </Button>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setQuantity(1)}>Réinitialiser</Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Date de livraison souhaitée</label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="Précisions éventuelles"
                />
              </div>

              <div className="md:col-span-2 border-t pt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{total.toFixed(2)} €</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
                  <Button type="submit" disabled={!canSubmit}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> {saving ? 'Validation…' : 'Ajouter à la commande'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



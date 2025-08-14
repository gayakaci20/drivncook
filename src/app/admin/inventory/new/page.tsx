'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ProductOption { id: string; name: string; unit: string; minStock: number }
interface WarehouseOption { id: string; name: string }

export default function NewInventoryPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 0,
    operation: 'ADD' as 'ADD' | 'REMOVE' | 'SET',
    notes: ''
  })
  const [currentStock, setCurrentStock] = useState<{ total: number; reserved: number; available: number } | null>(null)

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadRefs()
  }, [session, isPending, router])

  const loadRefs = async () => {
    try {
      const [p, w] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/warehouses?limit=1000')
      ])
      if (p.ok) {
        const j = await p.json()
        const items = (j?.data?.data || []) as Array<{ id: string; name: string; unit: string; minStock: number }>
        setProducts(items.map(i => ({ id: i.id, name: i.name, unit: i.unit, minStock: i.minStock })))
      }
      if (w.ok) {
        const j = await w.json()
        const items = (j?.data?.data || []) as Array<{ id: string; name: string }>
        setWarehouses(items.map(i => ({ id: i.id, name: i.name })))
      }
    } catch {}
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const nextState = { ...form, [name]: name === 'quantity' ? Number(value) : value } as typeof form
    if (name === 'operation' && value === 'REMOVE' && currentStock) {
      nextState.quantity = Math.min(nextState.quantity || 0, Math.max(0, currentStock.available))
    }
    setForm(nextState)

    const selectedProductId = name === 'productId' ? (value as string) : form.productId
    const selectedWarehouseId = name === 'warehouseId' ? (value as string) : form.warehouseId
    if (selectedProductId && selectedWarehouseId) {
      await loadCurrentStock(selectedProductId, selectedWarehouseId)
    } else {
      setCurrentStock(null)
    }
  }

  const loadCurrentStock = async (productId: string, warehouseId: string) => {
    try {
      const res = await fetch(`/api/stocks?productId=${productId}&warehouseId=${warehouseId}&limit=1`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const items = (json?.data?.data || []) as Array<{ quantity: number; reservedQty: number }>
        const s = items[0]
        if (s) {
          const total = s.quantity
          const reserved = s.reservedQty
          const available = Math.max(0, total - reserved)
          setCurrentStock({ total, reserved, available })
          if (form.operation === 'REMOVE') {
            setForm(prev => ({ ...prev, quantity: Math.min(prev.quantity, available) }))
          }
        } else {
          setCurrentStock({ total: 0, reserved: 0, available: 0 })
        }
      }
    } catch {
      setCurrentStock(null)
    }
  }

  const selectedProduct = useMemo(() => products.find(p => p.id === form.productId) || null, [products, form.productId])
  const unitLabel = ''
  const isRemoveDisabled = form.operation === 'REMOVE' && (!currentStock || currentStock.available <= 0)
  const quantityMax = form.operation === 'REMOVE' && currentStock ? currentStock.available : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      if (form.operation === 'REMOVE' && currentStock) {
        payload.quantity = Math.min(form.quantity, Math.max(0, currentStock.available))
      }
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        router.push('/admin/inventory')
      } else {
        const err = await res.json()
        toast.error(err?.error || 'Erreur lors de l\'opération de stock')
      }
    } catch (e) {
      toast.error('Erreur lors de l\'opération de stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          Mouvement de stock
        </h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Créer une entrée, sortie ou mise à jour de stock
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau mouvement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Produit *</label>
                <select
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-2 text-xs text-gray-600">
                    Unité: <span className="font-medium">{selectedProduct.unit}</span> • Stock min: <span className="font-medium">{selectedProduct.minStock}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Entrepôt *</label>
                <select
                  name="warehouseId"
                  value={form.warehouseId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                >
                  <option value="">Sélectionner un entrepôt</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {currentStock && (
                  <div className="mt-2 text-xs text-gray-600">
                   Stock actuel: <span className="font-medium">{currentStock.total}</span> • Réservé: <span className="font-medium text-orange-600">{currentStock.reserved}</span> • Disponible: <span className="font-medium text-green-600">{currentStock.available}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Opération *</label>
                <div className="flex gap-2">
                  {(['ADD','REMOVE','SET'] as const).map(op => (
                    <Button key={op} type="button" variant={form.operation === op ? 'default' : 'outline'} className="rounded-xl" onClick={(e) => handleChange({ target: { name: 'operation', value: op } } as any)}>
                      {op === 'ADD' ? 'Ajouter' : op === 'REMOVE' ? 'Retirer' : 'Mettre à jour'}
                    </Button>
                  ))}
                </div>
                {isRemoveDisabled && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-orange-700">
                    <AlertTriangle className="h-3 w-3" /> Aucune quantité disponible à retirer.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Quantité *</label>
                <input
                  type="number"
                  name="quantity"
                  min={0}
                  {...(quantityMax !== undefined ? { max: quantityMax } : {})}
                  value={form.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1,5,10].map(step => (
                    <Button key={step} type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setForm(prev => ({ ...prev, quantity: Math.max(0, (prev.quantity || 0) + (form.operation === 'REMOVE' ? -step : step)) }))}>
                      {form.operation === 'REMOVE' ? `- ${step}` : `+ ${step}`}
                    </Button>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setForm(prev => ({ ...prev, quantity: 0 }))}>Réinitialiser</Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="Détail de l'opération (ex: réassort, correction, inventaire...)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || (form.operation === 'REMOVE' && isRemoveDisabled)}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

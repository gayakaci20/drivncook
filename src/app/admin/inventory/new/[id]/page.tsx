"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface Option { id: string; name: string }

interface PageProps { params: Promise<{ id: string }> }

export default function NewInventoryForProductPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Option | null>(null)
  const [warehouses, setWarehouses] = useState<Option[]>([])
  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 0,
    operation: 'ADD' as 'ADD' | 'REMOVE' | 'SET',
    notes: ''
  })

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
        fetch(`/api/products?limit=1000`),
        fetch('/api/warehouses?limit=1000')
      ])
      if (p.ok) {
        const j = await p.json()
        const items = (j?.data?.data || []) as Array<{ id: string; name: string }>
        const found = items.find(i => i.id === resolved.id) || null
        if (found) {
          setProduct({ id: found.id, name: found.name })
          setForm(prev => ({ ...prev, productId: found.id }))
        }
      }
      if (w.ok) {
        const j = await w.json()
        const items = (j?.data?.data || []) as Array<{ id: string; name: string }>
        setWarehouses(items.map(i => ({ id: i.id, name: i.name })))
      }
    } catch {}
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        router.push('/admin/inventory')
      } else {
        const err = await res.json()
        alert(err?.error || "Erreur lors de l'opération de stock")
      }
    } catch (e) {
      alert("Erreur lors de l'opération de stock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          Mouvement de stock — {product?.name || 'Produit'}
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
                <input value={product?.name || ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-xl" />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Opération *</label>
                <select
                  name="operation"
                  value={form.operation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="ADD">Ajouter</option>
                  <option value="REMOVE">Retirer</option>
                  <option value="SET">Mettre à jour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Quantité *</label>
                <input
                  type="number"
                  name="quantity"
                  min={0}
                  value={form.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  required
                />
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



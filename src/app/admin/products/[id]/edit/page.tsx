"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductFormData } from "@/lib/validations"
import { ArrowLeft } from "lucide-react"
import { useRef } from "react"

interface PageProps { params: Promise<{ id: string }> }

export default function EditAdminProductPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; city: string }>>([])

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema as any)
  })
  const warehouseRef = useRef<HTMLSelectElement | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${resolved.id}`)
        if (!res.ok) { setLoading(false); return }
        const json = await res.json()
        const p = json.data
        reset({
          name: p.name,
          description: p.description || undefined,
          sku: p.sku,
          unitPrice: p.unitPrice,
          unit: p.unit,
          minStock: p.minStock,
          maxStock: p.maxStock ?? undefined,
          imageUrl: p.imageUrl || undefined,
          categoryId: p.category?.id
        } as any)
      } finally { setLoading(false) }
    })()
  }, [resolved.id, reset])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/warehouses?limit=1000', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const items = (json?.data?.data || []) as Array<{ id: string; name: string; city: string }>
        setWarehouses(items)
      } catch {}
    })()
  }, [])

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${resolved.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const selectedWarehouse = warehouseRef.current?.value
        if (selectedWarehouse) {
          await fetch('/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: resolved.id, warehouseId: selectedWarehouse, quantity: 0, operation: 'SET' })
          })
        }
        router.push(`/admin/products/${resolved.id}`)
      }
      else {
        const err = await res.json(); alert(err?.error || 'Erreur lors de la mise à jour')
      }
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier le produit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input {...register('name')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SKU *</label>
                <input {...register('sku')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prix (€) *</label>
                <input type="number" step="0.01" min={0} {...register('unitPrice', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unité *</label>
                <input {...register('unit')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock minimum</label>
                <input type="number" min={0} {...register('minStock', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock maximum</label>
                <input type="number" min={0} {...register('maxStock', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Code-barres</label>
                <input {...register('barcode')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Image (URL)</label>
                <input {...register('imageUrl')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Entrepôt (assignation)</label>
                <select ref={warehouseRef} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">Ne pas modifier</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Catégorie *</label>
                <input {...register('categoryId')} className="w-full px-3 py-2 border rounded-xl" placeholder="ID de la catégorie" />
                {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={saving || !isDirty}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



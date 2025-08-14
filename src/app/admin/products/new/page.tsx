'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { productSchema, type ProductFormData } from '@/lib/validations'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { toast } from 'sonner'

interface CategoryOption {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const defaultCategoryNames = ['Ingrédients frais', 'Plats préparés', 'Boissons', 'Conditionnement']
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; city: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      minStock: 0,
      unit: 'u'
    }
  })

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadCategories()
    loadWarehouses()
  }, [session, isPending, router])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/product-categories?limit=1000')
      if (!res.ok) return
      const json = await res.json()
      let items = (json?.data?.data || []) as Array<{ id: string; name: string }>
      const existingNames = new Set(items.map(i => i.name))
      const missing = defaultCategoryNames.filter(n => !existingNames.has(n))
      if (missing.length) {
        for (const name of missing) {
          try { await fetch('/api/product-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }) } catch {}
        }
        const res2 = await fetch('/api/product-categories?limit=1000')
        if (res2.ok) { const json2 = await res2.json(); items = (json2?.data?.data || []) }
      }
      const pickByName = new Map<string, { id: string; name: string }>()
      for (const name of defaultCategoryNames) {
        const found = items.find(i => i.name === name)
        if (found) pickByName.set(name, { id: found.id, name: found.name })
      }
      const orderedUnique = defaultCategoryNames
        .filter(n => pickByName.has(n))
        .map(n => pickByName.get(n)!)
      setCategories(orderedUnique)
    } catch {}
  }

  const loadWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses?limit=1000')
      if (!res.ok) return
      const json = await res.json()
      const items = (json?.data?.data || []) as Array<{ id: string; name: string; city: string }>
      setWarehouses(items)
    } catch {}
  }

  const [creatingCategory, setCreatingCategory] = useState(false)
  const [quickCategoryName, setQuickCategoryName] = useState('')
  const [quickCategoryDescription, setQuickCategoryDescription] = useState('')

  const handleCreateCategory = async () => {
    if (!quickCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: quickCategoryName.trim(), description: quickCategoryDescription || undefined })
      })
      const json = await res.json()
      if (res.ok) {
        const created = { id: json?.data?.id as string, name: json?.data?.name as string }
        setCategories(prev => [...prev, created])
        setValue('categoryId', created.id as any, { shouldValidate: true })
        setQuickCategoryName('')
        setQuickCategoryDescription('')
      } else {
        toast.error(json?.error || 'Erreur lors de la création de la catégorie')
      }
    } catch {
      toast.error('Erreur lors de la création de la catégorie')
    } finally {
      setCreatingCategory(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        reset()
        const created = await res.json()
        const productId = created?.data?.id as string | undefined
        const selectedWarehouse = (document.getElementById('warehouseId') as HTMLSelectElement | null)?.value
        if (productId && selectedWarehouse) {
          await fetch('/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, warehouseId: selectedWarehouse, quantity: 0, operation: 'SET' })
          })
        }
        router.push('/admin/inventory')
      } else {
        const err = await res.json()
        toast.error(err?.error || 'Erreur lors de la création du produit')
      }
    } catch (e) {
      toast.error('Erreur lors de la création du produit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Nouveau Produit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un nouveau produit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Nom *</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="Burger Pain Brioché"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">SKU *</label>
                <input
                  {...register('sku')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="SKU-0001"
                />
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="Description du produit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Prix unitaire (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('unitPrice', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
                {errors.unitPrice && <p className="text-sm text-red-600 mt-1">{errors.unitPrice.message}</p>}
              </div>

              

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Code-barres</label>
                <input
                  {...register('barcode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="EAN13"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Stock minimum</label>
                <input
                  type="number"
                  min={0}
                  {...register('minStock', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
                {errors.minStock && <p className="text-sm text-red-600 mt-1">{errors.minStock.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Stock maximum</label>
                <input
                  type="number"
                  min={0}
                  {...register('maxStock', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
                {errors.maxStock && <p className="text-sm text-red-600 mt-1">{errors.maxStock.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Image (URL)</label>
                <input
                  {...register('imageUrl')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="https://..."
                />
                {errors.imageUrl && <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Catégorie *</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Entrepôt (assignation initiale)</label>
                <select
                  id="warehouseId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">Ne pas assigner</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le produit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

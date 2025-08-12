"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
  stocks: Array<{ quantity: number; warehouse: { name: string; city: string } }>
}

export default function FranchiseProductDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/products?limit=1000&sortBy=createdAt&sortOrder=desc`)
        if (!res.ok) return setLoading(false)
        const json = await res.json()
        const items = (json?.data?.data || []) as ProductDetail[]
        const byId = items.find(p => p.id === resolved.id) || null
        setProduct(byId)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resolved.id])

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

  const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">{product.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {product.imageUrl && (
            <div className="relative w-full h-60 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
            </div>
          )}
          {product.description && <p className="text-gray-700 dark:text-neutral-300">{product.description}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">SKU</div>
              <div className="font-medium">{product.sku}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Prix</div>
              <div className="font-medium">{product.unitPrice} € / {product.unit}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Catégorie</div>
              <div className="font-medium">{product.category.name}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Stock total disponible</div>
            <div className="font-semibold">{totalStock} {product.unit}</div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-gray-500 mb-2">Disponibilité par entrepôt</div>
            <div className="space-y-1">
              {product.stocks.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-neutral-400">{s.warehouse.name} ({s.warehouse.city})</span>
                  <span className="font-medium">{s.quantity} {product.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



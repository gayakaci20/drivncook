"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Package } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

interface ProductDetail {
  id: string
  name: string
  description: string | null
  sku: string
  barcode: string | null
  unitPrice: number
  unit: string
  minStock: number
  maxStock: number | null
  imageUrl: string | null
  isActive: boolean
  category: { id: string; name: string }
  stocks: Array<{
    id: string
    quantity: number
    reservedQty: number
    lastRestockDate: string | null
    expirationDate: string | null
    warehouse: { id: string; name: string; city: string }
  }>
}

export default function AdminProductDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/products?limit=1000&sortBy=createdAt&sortOrder=desc`, { cache: 'no-store' })
        if (!res.ok) return setLoading(false)
        const json = await res.json()
        const items = (json?.data?.data || []) as ProductDetail[]
        const byId = items.find((p) => p.id === resolved.id) || null
        setProduct(byId)

        if (byId) {
          const sRes = await fetch(`/api/stocks?productId=${byId.id}&limit=1000`, { cache: 'no-store' })
          if (sRes.ok) {
            const sJson = await sRes.json()
            const stocks = ((sJson?.data?.data) || []).map((s: any) => ({
              id: s.id,
              quantity: s.quantity,
              reservedQty: s.reservedQty,
              lastRestockDate: s.lastRestockDate,
              expirationDate: s.expirationDate,
              warehouse: s.warehouse
            }))
            setProduct((prev) => (prev ? { ...prev, stocks } : prev))
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resolved.id])

  const totalStock = useMemo(() => {
    return product?.stocks.reduce((sum, s) => sum + s.quantity, 0) ?? 0
  }, [product])

  const totalReserved = useMemo(() => {
    return product?.stocks.reduce((sum, s) => sum + s.reservedQty, 0) ?? 0
  }, [product])

  const totalAvailable = totalStock - totalReserved

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—")

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <Badge variant={product.isActive ? "default" : "secondary"}>
            {product.isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" /> Modifier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                  <Package className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">SKU</div>
                <div className="font-medium">{product.sku}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Code-barres</div>
                <div className="font-medium">{product.barcode || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Catégorie</div>
                <div className="font-medium">{product.category.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Prix</div>
               <div className="font-medium">{product.unitPrice} €</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Stock minimum</div>
               <div className="font-medium">{product.minStock}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Stock maximum</div>
                <div className="font-medium">{product.maxStock ?? "—"}</div>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="text-gray-700 dark:text-neutral-300">{product.description}</div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Stock total</div>
               <div className="text-xl font-semibold">{totalStock}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Réservé</div>
               <div className="text-xl font-semibold">{totalReserved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Disponible</div>
               <div className="text-xl font-semibold">{totalAvailable}</div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-4">
            <div className="font-medium mb-2">Stock par entrepôt</div>
            <div className="grid gap-3 md:grid-cols-2">
              {product.stocks.map((s) => (
                <div key={s.id} className="p-3 border rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.warehouse.name}</div>
                      <div className="text-xs text-gray-500">{s.warehouse.city}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{s.quantity - s.reservedQty}</div>
                      <div className="text-xs text-gray-500">disponible</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-medium">{s.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Réservé</div>
                      <div className="font-medium">{s.reservedQty}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Dernier réassort</div>
                      <div className="font-medium">{formatDate(s.lastRestockDate)}</div>
                    </div>
                  </div>
                  {s.expirationDate && (
                    <div className="mt-2 text-xs text-orange-600">Péremption: {formatDate(s.expirationDate)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



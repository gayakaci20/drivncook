'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Search, ShoppingCart, Eye, Filter, Apple, Utensils, Coffee, Box } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface Product {
  id: string
  name: string
  description: string | null
  sku: string
  unitPrice: number
  unit: string
  imageUrl?: string | null
  category: {
    name: string
  }
  stocks: Array<{
    quantity: number
    warehouse: {
      name: string
      city: string
    }
  }>
}

export default function FranchiseProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const router = useRouter()
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?limit=1000&sortBy=name&sortOrder=asc`)
      if (!res.ok) {
        setProducts([])
        return
      }
      const json = await res.json()
      const items = (json?.data?.data || []) as Product[]
      setProducts(items)
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableStock = (product: Product) => {
    return product.stocks.reduce((total, stock) => total + stock.quantity, 0)
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Rupture', variant: 'destructive' as const }
    if (quantity < 10) return { label: 'Stock faible', variant: 'secondary' as const }
    return { label: 'En stock', variant: 'default' as const }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Catalogue produits
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Consultez les produits disponibles et passez vos commandes
          </p>
        </div>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl">
                    <Filter className="h-4 w-4" />
                    {categoryFilter ? categoryFilter : 'Toutes les catégories'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCategoryFilter('')}>
                    <Filter className="h-4 w-4" />
                    Toutes les catégories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategoryFilter('Ingrédients frais')}>
                    <Apple className="h-4 w-4 text-green-600" />
                    Ingrédients frais
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Plats préparés')}>
                    <Utensils className="h-4 w-4 text-orange-600" />
                    Plats préparés
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Boissons')}>
                    <Coffee className="h-4 w-4 text-blue-600" />
                    Boissons
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('Conditionnement')}>
                    <Box className="h-4 w-4 text-purple-600" />
                    Conditionnement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalogue */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Aucun produit disponible
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Le catalogue sera bientôt disponible
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products
            .filter(p => !categoryFilter || p.category?.name === categoryFilter)
            .filter(p => {
              if (!search.trim()) return true
              const q = search.toLowerCase()
              return (
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                p.category.name.toLowerCase().includes(q)
              )
            })
            .map((product) => {
            const availableStock = getAvailableStock(product)
            const stockStatus = getStockStatus(availableStock)

            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {product.category.name}
                      </p>
                    </div>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {product.imageUrl && (
                      <div className="relative w-full h-40 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                      </div>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-neutral-100">
                          {product.unitPrice}€
                        </p>
                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                          par {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                          Disponible
                        </p>
                        <p className="font-semibold">
                          {availableStock} {product.unit}
                        </p>
                      </div>
                    </div>

                    {/* Disponibilité par entrepôt */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 dark:text-neutral-500 mb-2">
                        Disponibilité par entrepôt:
                      </p>
                      <div className="space-y-1">
                        {product.stocks.map((stock, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-neutral-400">
                              {stock.warehouse.name} ({stock.warehouse.city})
                            </span>
                            <span className="font-medium">
                              {stock.quantity} {product.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/franchise/products/${product.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        disabled={availableStock === 0}
                        onClick={() => router.push(`/franchise/products/${product.id}/order`)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Commander
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            })}
        </div>
      )}
    </div>
  )
}

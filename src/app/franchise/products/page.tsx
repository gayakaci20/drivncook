'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Search, ShoppingCart, Eye } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  sku: string
  unitPrice: number
  unit: string
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

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Simuler un appel API - à remplacer par le vrai endpoint
      setProducts([])
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            />
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
          {products.map((product) => {
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
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        disabled={availableStock === 0}
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

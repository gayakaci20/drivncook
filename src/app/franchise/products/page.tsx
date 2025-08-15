'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Search, ShoppingCart, Eye, Filter, Apple, Utensils, Coffee, Box, Trash2, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CheckoutDialog } from '@/components/ui/pay'

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
      id: string
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
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<Array<{ product: Product; warehouseId: string; quantity: number }>>([])
  const [requestedDate, setRequestedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [orderDetails, setOrderDetails] = useState<{ amount: number; itemCount: number; orderId: string } | null>(null)

  const router = useRouter()
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drivncook-requested-delivery-date')
      if (saved) setRequestedDate(saved)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      if (requestedDate) localStorage.setItem('drivncook-requested-delivery-date', requestedDate)
      else localStorage.removeItem('drivncook-requested-delivery-date')
    } catch {}
  }, [requestedDate])
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

  const addToCart = (product: Product) => {
    const available = getAvailableStock(product)
    if (available === 0) {
      toast.error('Stock insuffisant')
      return
    }
    setCartItems(prev => {
      const idx = prev.findIndex(ci => ci.product.id === product.id)
      if (idx >= 0) {
        const current = prev[idx]
        const selected = product.stocks.find(s => s.warehouse.id === current.warehouseId)
        const max = selected ? selected.quantity : available
        const nextQty = Math.min(current.quantity + 1, max)
        const next = [...prev]
        next[idx] = { ...current, quantity: nextQty }
        return next
      }
      const defaultWarehouse = product.stocks.find(s => s.quantity > 0) || product.stocks[0]
      return [...prev, { product, warehouseId: defaultWarehouse?.warehouse.id || '', quantity: 1 }]
    })
    setCartOpen(true)
    toast.success('Article ajouté au panier')
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(ci => ci.product.id !== productId))
  }

  const setItemWarehouse = (productId: string, warehouseId: string) => {
    setCartItems(prev => prev.map(ci => ci.product.id === productId ? { ...ci, warehouseId, quantity: Math.min(ci.quantity, (ci.product.stocks.find(s => s.warehouse.id === warehouseId)?.quantity || ci.quantity)) } : ci))
  }

  const setItemQuantity = (productId: string, quantity: number) => {
    setCartItems(prev => prev.map(ci => {
      if (ci.product.id !== productId) return ci
      const max = ci.product.stocks.find(s => s.warehouse.id === ci.warehouseId)?.quantity || ci.quantity
      const nextQty = Math.max(1, Math.min(quantity, max))
      return { ...ci, quantity: nextQty }
    }))
  }

  const cartTotal = useMemo(() => cartItems.reduce((sum, ci) => sum + ci.quantity * ci.product.unitPrice, 0), [cartItems])

  const canCheckout = cartItems.length > 0 && !checkingOut

  const handleCheckout = async () => {
    if (!canCheckout) return
    setCheckingOut(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedDeliveryDate: requestedDate || undefined, notes, isFromDrivnCook: false })
      })
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        toast.error(err?.error || 'Erreur lors de la création de la commande')
        return
      }
      const orderJson = await orderRes.json()
      const orderData = orderJson?.data ?? orderJson
      const orderId = orderData?.id as string | undefined
      if (!orderId) {
        toast.error('Erreur: ID de commande manquant')
        return
      }

      for (const ci of cartItems) {
        const unitPrice = ci.product.unitPrice
        const res = await fetch('/api/order-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            productId: ci.product.id,
            warehouseId: ci.warehouseId,
            quantity: ci.quantity,
            unitPrice,
            notes
          })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(err?.error || `Erreur sur l'article ${ci.product.name}`)
          return
        }
      }

      const itemCount = cartItems.length
      const amount = Math.round(cartTotal * 100)
      
      setOrderDetails({ amount, itemCount, orderId })
      setCartItems([])
      setNotes('')
      setCartOpen(false)
      setShowPayment(true)
      
      toast.success('Commande créée avec succès')
    } finally {
      setCheckingOut(false)
    }
  }

  const handlePayNow = async () => {
    await handleCheckout()
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
        <Button onClick={() => setCartOpen(true)}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Panier ({cartItems.length})
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
                        
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                          Disponible
                        </p>
                        <p className="font-semibold">
                          {availableStock}
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
                              {stock.quantity}
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
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            })}
        </div>
      )}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="w-full max-w-3xl md:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Panier de commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center text-sm text-gray-600">Votre panier est vide</div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(ci => {
                  const max = ci.product.stocks.find(s => s.warehouse.id === ci.warehouseId)?.quantity || 1
                  return (
                    <div key={ci.product.id} className="flex flex-col gap-3 border rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium">{ci.product.name}</div>
                          <div className="text-xs text-gray-500">{ci.product.unitPrice} €</div>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => removeFromCart(ci.product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6">
                          <label className="block text-xs mb-1">Entrepôt</label>
                          <select
                            value={ci.warehouseId}
                            onChange={(e) => setItemWarehouse(ci.product.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                          >
                            {ci.product.stocks.map(s => (
                              <option key={s.warehouse.id} value={s.warehouse.id}>
                                 {s.warehouse.name} ({s.warehouse.city}) — dispo: {s.quantity}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-xs mb-1">Quantité</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={ci.quantity <= 1}
                              onClick={() => setItemQuantity(ci.product.id, ci.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <input
                              type="number"
                              min={1}
                              max={max}
                              value={ci.quantity}
                              onChange={(e) => setItemQuantity(ci.product.id, Number(e.target.value))}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-center dark:bg-neutral-800 dark:border-neutral-700"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={ci.quantity >= max}
                              onClick={() => setItemQuantity(ci.product.id, ci.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                           <div className="mt-1 text-xs text-gray-500">Max: {max}</div>
                        </div>
                        <div className="md:col-span-2 md:text-right">
                          <div className="text-xs text-gray-500">Total article</div>
                          <div className="text-lg font-semibold">{(ci.quantity * ci.product.unitPrice).toFixed(2)} €</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-1">
                <label className="block text-sm mb-1">Date de récupération souhaitée</label>
                <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Précisions éventuelles" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4 mt-2">
              <div className="text-base text-gray-600">Total: <span className="font-semibold">{cartTotal.toFixed(2)} €</span></div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <Button variant="outline" className="h-11 w-full md:w-auto" onClick={() => setCartOpen(false)}>Fermer</Button>
                <Button className="h-11 w-full md:w-auto" onClick={handlePayNow} disabled={!canCheckout}>{checkingOut ? 'Validation…' : 'Finaliser la commande'}</Button>
              </div>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* CheckoutDialog contrôlé qui s'ouvre automatiquement */}
      {orderDetails && (
        <CheckoutDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          amountInCents={orderDetails.amount}
          description={`Commande ${orderDetails.itemCount} article${orderDetails.itemCount > 1 ? 's' : ''}`}
          triggerLabel="Payer maintenant"
          buttonLabel="Finaliser le paiement"
          successUrl={`/franchise/orders?payment=success`}
          cancelUrl="/franchise/products"
          orderId={orderDetails.orderId}
          paymentType="ORDER"
        />
      )}
    </div>
  )
}
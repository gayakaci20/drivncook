'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Truck, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  Building2,
  FileText
} from 'lucide-react'

interface DashboardStats {
  overview: {
    totalFranchises: number
    activeFranchises: number
    totalVehicles: number
    availableVehicles: number
    pendingOrders: number
    totalSales: number
    salesCount: number
    unpaidAmount: number
    unpaidCount: number
    monthlyRoyalties: number
  }
  charts: {
    dailySales: Array<{
      date: string
      sales: number
      royalties: number
    }>
    topFranchises: Array<{
      franchiseId: string
      franchiseName: string
      businessName: string
      totalSales: number
      totalRoyalties: number
    }>
  }
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      router.push('/unauthorized')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats?period=30')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Erreur lors du chargement des données</p>
          <Button onClick={fetchStats} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Vue d\'ensemble des indicateurs clés de Driv\'n Cook</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStats} className="rounded-xl">Actualiser</Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franchisés actifs</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Users className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.overview.activeFranchises}</div>
            <p className="text-xs text-muted-foreground">sur {stats.overview.totalFranchises} au total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules disponibles</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Truck className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.overview.availableVehicles}</div>
            <p className="text-xs text-muted-foreground">sur {stats.overview.totalVehicles} véhicules</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA total (30j)</CardTitle>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.overview.totalSales)}</div>
            <p className="text-xs text-muted-foreground">{stats.overview.salesCount} rapports</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redevances (30j)</CardTitle>
            <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.overview.monthlyRoyalties)}</div>
            <p className="text-xs text-muted-foreground">4% du CA franchisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Commandes en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{stats.overview.pendingOrders}</div>
            <Button variant="outline" size="sm" className="mt-2 rounded-xl">Voir les commandes</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-500" /> Factures impayées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{formatCurrency(stats.overview.unpaidAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.overview.unpaidCount} factures</p>
            <Button variant="outline" size="sm" className="mt-2 rounded-xl">Voir les factures</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" /> Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full rounded-xl">Nouveau franchisé</Button>
            <Button variant="outline" size="sm" className="w-full rounded-xl">Nouveau véhicule</Button>
            <Button variant="outline" size="sm" className="w-full rounded-xl">Générer rapport</Button>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tableaux */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="franchises">Franchisés</TabsTrigger>
          <TabsTrigger value="analysis">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Évolution des ventes (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Graphique des ventes quotidiennes
                <br />
                <small>(Intégration avec Recharts à venir)</small>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="franchises" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Top 5 des franchisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.charts.topFranchises.map((franchise, index) => (
                  <div key={franchise.franchiseId} className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <div className="font-medium">{franchise.franchiseName}</div>
                      <div className="text-sm text-muted-foreground">{franchise.businessName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(franchise.totalSales)}</div>
                      <div className="text-sm text-muted-foreground">
                        Redevances: {formatCurrency(franchise.totalRoyalties)}
                      </div>
                    </div>
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Analyses et insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-xl">
                  <h4 className="font-medium mb-2">Taux d\'occupation des véhicules</h4>
                  <div className="text-2xl font-bold">
                    {Math.round(((stats.overview.totalVehicles - stats.overview.availableVehicles) / stats.overview.totalVehicles) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.overview.totalVehicles - stats.overview.availableVehicles} véhicules assignés
                  </p>
                </div>
                
                <div className="p-4 border rounded-xl">
                  <h4 className="font-medium mb-2">Revenus moyens par franchisé</h4>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.overview.totalSales / Math.max(stats.overview.activeFranchises, 1))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sur les 30 derniers jours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
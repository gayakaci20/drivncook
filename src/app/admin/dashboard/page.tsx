'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox, CheckboxWithLabel } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  Truck, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  Building2,
  FileText,
  ChevronDown,
  Plus,
  UserPlus,
  FileBarChart
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { safeFetchJson } from '@/lib/utils'
import { UserRole } from '@/types/prisma-enums'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartLegendContent, ChartTooltipContent } from '@/components/ui/charts-base'

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
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }

    fetchStats()
  }, [session, isPending, router])

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

  if (isPending || loading) {
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
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Vue d&apos;ensemble des indicateurs clés de DRIV&apos;N COOK</p>
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
            <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={() => router.push('/admin/orders')}>Voir les commandes</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-500" /> Factures impayées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{formatCurrency(stats.overview.unpaidAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.overview.unpaidCount} factures</p>
            <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={() => router.push('/admin/finance/invoices')}>Voir les factures</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-500" /> Nouveau franchisé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/admin/franchises/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau franchisé
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/admin/vehicles/new')}>
              <Truck className="h-4 w-4 mr-1" />
              Nouveau véhicule
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/admin/finance/sales-reports')}>
              <FileBarChart className="h-4 w-4 mr-1" />
              Générer rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tableaux */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="franchises">Franchisés</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Évolution des ventes (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const data = stats.charts.dailySales.map((d) => ({
                  date: d.date,
                  sales: d.sales,
                  royalties: d.royalties,
                }))
                const series = [
                  { key: 'sales', label: 'Ventes', color: '#10B981' },
                  { key: 'royalties', label: 'Redevances', color: '#6366F1' },
                ] as const
                const formatNumber = (n: number) =>
                  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
                const formatDate = (iso: string) => {
                  try {
                    const d = new Date(iso)
                    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  } catch {
                    return String(iso)
                  }
                }
                return (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v: string) => formatDate(String(v))} tickLine={false} />
                        <YAxis tickLine={false} tickFormatter={(v: number) => formatNumber(Number(v))} />
                        <Tooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value: ValueType, name: NameType) => {
                                const numeric = typeof value === 'number' ? value : Number(value)
                                const key = String(name)
                                const s = series.find((s) => s.key === key)
                                return [formatNumber(numeric), s?.label ?? key]
                              }}
                              labelFormatter={(label: unknown) => formatDate(String(label))}
                            />
                          }
                        />
                        <Legend content={<ChartLegendContent />} />
                        {series.map((s) => (
                          <Area
                            key={s.key}
                            type={'monotone'}
                            dataKey={s.key}
                            name={s.key}
                            stroke={s.color}
                            fill={s.color}
                            fillOpacity={0.15}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
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
                  <h4 className="font-medium mb-2">Taux d&apos;occupation des véhicules</h4>
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
              
              {/* Démonstration des composants checkbox */}
              <div className="p-4 border rounded-xl mt-4">
                <h4 className="font-medium mb-4">Options d&apos;affichage</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Tailles disponibles :</p>
                    <CheckboxWithLabel label="Petit (sm)" size="sm" />
                    <CheckboxWithLabel label="Normal (default)" />
                    <CheckboxWithLabel label="Grand (lg)" size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Options :</p>
                    <div className="flex items-center gap-2">
                      <Checkbox size="sm" />
                      <span className="text-sm">Checkbox seule (petite)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked />
                      <span className="text-sm">Checkbox cochée par défaut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked="indeterminate" />
                      <span className="text-sm">État intermédiaire</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
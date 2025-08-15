'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckoutDialog } from '@/components/ui/pay'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  ChevronDown,
  Plus,
  PenTool
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartLegendContent, ChartTooltipContent } from '@/components/ui/charts-base'

interface FranchiseeStats {
  overview: {
    totalVehicles: number
    activeVehicles: number
    totalSales: number
    totalTransactions: number
    averageTicket: number
    totalRoyalties: number
    pendingInvoices: number
  }
  statusSummary?: {
    contract: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | string
    vehicleAssigned: boolean
    payments: 'PENDING' | 'PAID' | 'OVERDUE' | string
    entryFeePaid: boolean | null
    entryFeeDate: string | null
    contractStartDate: string | null
    contractEndDate: string | null
  }
  vehicles: Array<{
    id: string
    licensePlate: string
    brand: string
    model: string
    status: string
    currentMileage: number | null
    nextInspectionDate: string | null
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    orderDate: string
    totalAmount: number
  }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    amount: number
    paymentStatus: string
  }>
  charts: {
    salesEvolution: Array<{
      date: string
      sales: number
      transactions: number
      averageTicket: number
      royalties: number
    }>
  }
}

export default function FranchiseDashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<FranchiseeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.FRANCHISEE) {
      router.push('/unauthorized')
      return
    }

    fetchStats()
  }, [session, isPending, router])

  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard stats for user:', (session?.user as ExtendedUser).email, 'franchiseId:', (session?.user as ExtendedUser).franchiseId)
      
      const response = await fetch('/api/dashboard/stats?period=30')
      
      console.log('Dashboard response status:', response.status)
      
      if (!response.ok) {
        console.error('Dashboard HTTP error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Dashboard error content:', errorText)
        return
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Dashboard non-JSON response:', contentType)
        const text = await response.text()
        console.error('Dashboard response content:', text)
        return
      }

      const data = await response.json()
      console.log('Dashboard API Response:', data)
      
      if (data.success) {
        setStats(data.data)
        console.log('Dashboard stats set:', data.data)
        if (data.data.vehicles) {
          console.log('Vehicles in dashboard:', data.data.vehicles)
        }
      } else {
        console.error('Dashboard API error:', data.error)
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: 'Actif', variant: 'default' as const },
      'ASSIGNED': { label: 'Assigné', variant: 'default' as const },
      'AVAILABLE': { label: 'Disponible', variant: 'secondary' as const },
      'MAINTENANCE': { label: 'Maintenance', variant: 'destructive' as const },
      'PENDING': { label: 'En attente', variant: 'secondary' as const },
      'CONFIRMED': { label: 'Confirmée', variant: 'default' as const },
      'DELIVERED': { label: 'Livrée', variant: 'default' as const },
      'PAID': { label: 'Payée', variant: 'default' as const },
      'OVERDUE': { label: 'En retard', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {stats.statusSummary?.entryFeePaid === false && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="text-orange-800 dark:text-orange-200 font-semibold text-sm">Frais d'entrée en attente</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Réglez vos frais d'entrée pour activer votre franchise.
              </div>
            </div>
            <div>
              <CheckoutDialog
                amountInCents={Math.round((stats as any).statusSummary && (stats as any).statusSummary.entryFee ? Number((stats as any).statusSummary.entryFee) * 100 : 0)}
                description="Frais d'entrée franchise"
                triggerLabel="Payer les frais d'entrée"
                buttonLabel="Payer maintenant"
              />
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          Mon Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchStats} className="rounded-xl">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CA total (30j)
            </CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overview.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket moyen
            </CardTitle>
            <div className="size-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overview.averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Par transaction
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mes véhicules
            </CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Truck className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.overview.activeVehicles}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {stats.overview.totalVehicles} total
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Redevances dues
            </CardTitle>
            <div className="size-7 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center"><FileText className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overview.totalRoyalties)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overview.totalRoyalties * 0.04)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Factures en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.overview.pendingInvoices}
            </div>
            <Button variant="outline" size="sm" className="mt-2 rounded-xl">
              Voir les factures
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl">
                  <Plus className="h-4 w-4" />
                  Actions rapides
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem>
                  <ShoppingCart className="h-4 w-4" />
                  Nouvelle commande 
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PenTool className="h-4 w-4" />
                  Saisir ventes du jour
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4" />
                  Voir mes rapports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Statut franchise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Contrat</span>
                {(() => {
                  const s = stats.statusSummary?.contract ?? 'PENDING'
                  const mapping = {
                    ACTIVE: { label: 'Actif', variant: 'default' as const },
                    PENDING: { label: 'En attente', variant: 'secondary' as const },
                    SUSPENDED: { label: 'Suspendu', variant: 'destructive' as const },
                    TERMINATED: { label: 'Terminé', variant: 'destructive' as const },
                  } as const
                  const isKnown = s && s in mapping
                  const variant: 'default' | 'secondary' | 'destructive' | 'outline' = isKnown
                    ? mapping[s as keyof typeof mapping].variant
                    : 'outline'
                  const label = isKnown ? mapping[s as keyof typeof mapping].label : (s ?? 'N/A')
                  return <Badge variant={variant}>{label}</Badge>
                })()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Véhicule</span>
                <Badge variant={stats.statusSummary?.vehicleAssigned ? 'default' : 'secondary'}>
                  {stats.statusSummary?.vehicleAssigned ? 'Assigné' : 'Non assigné'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Paiements</span>
                {(() => {
                  const p = (stats.statusSummary?.entryFeePaid === false) ? 'PENDING' : 'PAID'
                  const mapping = {
                    PAID: { label: 'À jour', variant: 'default' as const },
                    PENDING: { label: 'En attente', variant: 'secondary' as const },
                    OVERDUE: { label: 'En retard', variant: 'destructive' as const },
                  } as const
                  const isKnown = p && p in mapping
                  const variant: 'default' | 'secondary' | 'destructive' | 'outline' = isKnown
                    ? mapping[p as keyof typeof mapping].variant
                    : 'outline'
                  const label = isKnown ? mapping[p as keyof typeof mapping].label : (p ?? 'N/A')
                  return <Badge variant={variant}>{label}</Badge>
                })()}
              </div>
              {stats.statusSummary?.entryFeePaid === false && (
                <div className="text-xs text-muted-foreground mt-1">
                  Droits d’entrée non réglés
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails par section */}
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="vehicles">Mes véhicules</TabsTrigger>
          <TabsTrigger value="orders">Commandes récentes</TabsTrigger>
          <TabsTrigger value="invoices">Mes factures</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Mes véhicules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.vehicles && stats.vehicles.length > 0 ? (
                  stats.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                          <div className="text-sm text-muted-foreground">{vehicle.licensePlate}</div>
                          {vehicle.currentMileage && (
                            <div className="text-xs text-muted-foreground">
                              {vehicle.currentMileage.toLocaleString()} km
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(vehicle.status)}
                        {vehicle.nextInspectionDate && (
                          <div className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            CT: {formatDate(vehicle.nextInspectionDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                      Aucun véhicule assigné
                    </h3>
                    <p className="text-gray-600 dark:text-neutral-400">
                      {(session?.user as ExtendedUser).franchiseId 
                        ? "Aucun véhicule n'est actuellement assigné à votre franchise" 
                        : "Aucune franchise associée à votre compte"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
                      Contactez votre administrateur pour l'attribution d'un véhicule
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(order.orderDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Mes factures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Émise: {formatDate(invoice.issueDate)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Échéance: {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(invoice.amount)}</div>
                      {getStatusBadge(invoice.paymentStatus)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Évolution de mes ventes (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const data = stats.charts.salesEvolution.map((d) => ({
                  date: d.date,
                  sales: d.sales,
                  transactions: d.transactions,
                  averageTicket: d.averageTicket,
                  royalties: d.royalties,
                }))
                const series = [
                  { key: 'sales', label: 'Ventes', color: '#10B981' },
                  { key: 'transactions', label: 'Transactions', color: '#F59E0B' },
                  { key: 'royalties', label: 'Redevances', color: '#6366F1' },
                ] as const
                const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
                const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
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
                                const formatted = key === 'transactions' ? formatNumber(numeric) : formatCurrency(numeric)
                                return [formatted, s?.label ?? key]
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
      </Tabs>
    </div>
  )
}
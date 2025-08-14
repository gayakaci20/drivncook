'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Truck,
  Package,
  Building2,
  RefreshCw,
  Filter,
  Eye,
  Share,
  Settings
} from 'lucide-react'

interface ReportData {
  id: string
  title: string
  description: string
  type: string
  period: string
  generatedAt: string
  status: string
  fileUrl: string | null
  data: {
    totalSales: number
    totalTransactions: number
    averageTicket: number
    growthRate: number
    topFranchises: Array<{
      name: string
      sales: number
      growth: number
    }>
    topProducts: Array<{
      name: string
      quantity: number
      revenue: number
    }>
    regionalData: Array<{
      region: string
      sales: number
      franchises: number
    }>
  }
}

interface DashboardMetrics {
  networkOverview: {
    totalFranchises: number
    activeFranchises: number
    totalVehicles: number
    totalSales: number
    totalRoyalties: number
    averageTicket: number
    growthRate: number
  }
  performance: {
    bestPerformers: Array<{
      franchiseId: string
      franchiseName: string
      sales: number
      growth: number
      rank: number
    }>
    worstPerformers: Array<{
      franchiseId: string
      franchiseName: string
      sales: number
      growth: number
      rank: number
    }>
  }
  operations: {
    totalOrders: number
    pendingOrders: number
    deliveredOrders: number
    inventoryValue: number
    lowStockAlerts: number
    maintenanceAlerts: number
  }
  financial: {
    totalRevenue: number
    pendingInvoices: number
    overdueInvoices: number
    averagePaymentDelay: number
    outstandingAmount: number
  }
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ReportData[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    fetchReportsData()
  }, [selectedPeriod, selectedType])

  const fetchReportsData = async () => {
    try {
      const [reportsRes, metricsRes] = await Promise.all([
        fetch(`/api/reports?period=${selectedPeriod}&type=${selectedType}`),
        fetch(`/api/dashboard/metrics?period=${selectedPeriod}`)
      ])

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.data || [])
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (type: string, period: string) => {
    setGeneratingReport(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, period })
      })

      if (response.ok) {
        await fetchReportsData()
        toast.success('Rapport généré avec succès')
      } else {
        const errorData = await response.json()
        toast.error(`Erreur : ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      toast.error('Erreur lors de la génération du rapport')
    } finally {
      setGeneratingReport(false)
    }
  }

  const downloadReport = async (reportId: string, format: string = 'pdf') => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download?format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rapport-${reportId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'GENERATED': { label: 'Généré', variant: 'default' as const },
      'GENERATING': { label: 'En cours', variant: 'secondary' as const },
      'ERROR': { label: 'Erreur', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getReportIcon = (type: string) => {
    const iconConfig = {
      'sales': BarChart3,
      'financial': DollarSign,
      'operational': Truck,
      'inventory': Package,
      'network': Building2
    }
    
    const Icon = iconConfig[type as keyof typeof iconConfig] || FileText
    return <Icon className="h-6 w-6" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Rapports et Analyses</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchReportsData} className="flex items-center gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button 
            onClick={() => generateReport('sales', selectedPeriod)}
            disabled={generatingReport}
            className="flex items-center gap-2 rounded-xl"
          >
            <FileText className="h-4 w-4" />
            {generatingReport ? 'Génération...' : 'Nouveau rapport'}
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Total</CardTitle>
              <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(metrics.networkOverview.totalSales)}</div>
              <div className="flex items-center gap-1 text-xs">
                {metrics.networkOverview.growthRate >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={metrics.networkOverview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercentage(metrics.networkOverview.growthRate)}
                </span>
                <span className="text-muted-foreground">vs période précédente</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Franchisés Actifs</CardTitle>
              <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Users className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metrics.networkOverview.activeFranchises}</div>
              <p className="text-xs text-muted-foreground">
                sur {metrics.networkOverview.totalFranchises} total
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Moyen</CardTitle>
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><BarChart3 className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(metrics.networkOverview.averageTicket)}</div>
              <p className="text-xs text-muted-foreground">
                Par transaction
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redevances</CardTitle>
              <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(metrics.networkOverview.totalRoyalties)}</div>
              <p className="text-xs text-muted-foreground">
                4% du CA
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              >
                <option value="">Tous les types</option>
                <option value="sales">Ventes</option>
                <option value="financial">Financier</option>
                <option value="operational">Opérationnel</option>
                <option value="inventory">Inventaire</option>
                <option value="network">Réseau</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion par onglets */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {metrics && (
            <div className="grid gap-6">
              {/* Top performers */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Meilleurs franchisés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.performance.bestPerformers.map((performer) => (
                        <div key={performer.franchiseId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-green-600">#{performer.rank}</span>
                            </div>
                            <div>
                              <div className="font-medium">{performer.franchiseName}</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(performer.sales)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                {formatPercentage(performer.growth)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      À surveiller
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.performance.worstPerformers.map((performer) => (
                        <div key={performer.franchiseId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-red-600">#{performer.rank}</span>
                            </div>
                            <div>
                              <div className="font-medium">{performer.franchiseName}</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(performer.sales)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                {formatPercentage(performer.growth)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operations overview */}
              <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle>Vue d&apos;ensemble opérationnelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{metrics.operations.totalOrders}</div>
                      <div className="text-sm text-gray-500">Commandes totales</div>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">{metrics.operations.pendingOrders}</div>
                      <div className="text-sm text-gray-500">En cours</div>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-red-600">{metrics.operations.lowStockAlerts}</div>
                      <div className="text-sm text-gray-500">Alertes stock</div>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">{metrics.operations.maintenanceAlerts}</div>
                      <div className="text-sm text-gray-500">Alertes maintenance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial overview */}
              <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle>Situation financière</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(metrics.financial.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-500">Revenus totaux</div>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(metrics.financial.outstandingAmount)}
                      </div>
                      <div className="text-sm text-gray-500">En attente</div>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <div className="text-2xl font-bold text-gray-600">
                        {metrics.financial.averagePaymentDelay} jours
                      </div>
                      <div className="text-sm text-gray-500">Délai moyen paiement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {/* Actions rapides de génération */}
            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Générer un nouveau rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <Button 
                    onClick={() => generateReport('sales', selectedPeriod)}
                    disabled={generatingReport}
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Rapport de ventes
                  </Button>
                  <Button 
                    onClick={() => generateReport('financial', selectedPeriod)}
                    disabled={generatingReport}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <DollarSign className="h-4 w-4" />
                    Rapport financier
                  </Button>
                  <Button 
                    onClick={() => generateReport('operational', selectedPeriod)}
                    disabled={generatingReport}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Truck className="h-4 w-4" />
                    Rapport opérationnel
                  </Button>
                  <Button 
                    onClick={() => generateReport('inventory', selectedPeriod)}
                    disabled={generatingReport}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Package className="h-4 w-4" />
                    Rapport inventaire
                  </Button>
                  <Button 
                    onClick={() => generateReport('network', selectedPeriod)}
                    disabled={generatingReport}
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Building2 className="h-4 w-4" />
                    Rapport réseau
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des rapports */}
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          {getReportIcon(report.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-lg">{report.title}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">Période</div>
                                <div className="text-gray-600">{report.period}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">Type</div>
                                <div className="text-gray-600">{report.type}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">Généré le</div>
                                <div className="text-gray-600">{formatDate(report.generatedAt)}</div>
                              </div>
                            </div>
                            
                            {report.data && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">CA</div>
                                  <div className="text-gray-600">{formatCurrency(report.data.totalSales)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/reports/${report.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report.id, 'pdf')}
                            disabled={report.status !== 'GENERATED'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={report.status !== 'GENERATED'}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">Aucun rapport</h3>
                    <p className="text-gray-500 dark:text-neutral-400 mb-4">
                      Aucun rapport généré pour les critères sélectionnés.
                    </p>
                    <Button onClick={() => generateReport('sales', selectedPeriod)} className="rounded-xl">
                      Générer votre premier rapport
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Évolution du réseau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div>Graphique d&apos;évolution</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Répartition géographique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2" />
                    <div>Carte de répartition</div>
                    <div className="text-sm">(Intégration cartes à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Performance par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <div>Graphique par catégorie</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Prévisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div>Modèle prédictif</div>
                    <div className="text-sm">(IA et machine learning à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Modèles de rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestion des modèles</h3>
                <p>Création et personnalisation des modèles de rapports</p>
                <p className="text-sm">(Fonctionnalité en développement)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  BarChart3,
  MapPin
} from 'lucide-react'

interface SalesReport {
  id: string
  reportDate: string
  dailySales: number
  transactionCount: number
  averageTicket: number
  location: string | null
  notes: string | null
  royaltyAmount: number
  paymentStatus: string
  createdAt: string
}

export default function FranchiseSalesPage() {
  const { data: session } = useSession()
  const [salesReports, setSalesReports] = useState<SalesReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [showNewReportForm, setShowNewReportForm] = useState(false)
  const [newReport, setNewReport] = useState({
    reportDate: new Date().toISOString().slice(0, 10),
    dailySales: '',
    transactionCount: '',
      location: '',
    notes: ''
  })

  useEffect(() => {
    if (session?.user?.franchiseId) {
      fetchSalesReports()
    }
  }, [session, selectedMonth])

  const fetchSalesReports = async () => {
    try {
      const startDate = new Date(selectedMonth + '-01').toISOString()
      const endDate = new Date(new Date(selectedMonth + '-01').getFullYear(), new Date(selectedMonth + '-01').getMonth() + 1, 0).toISOString()
      
      const params = new URLSearchParams({
        startDate: startDate.slice(0, 10),
        endDate: endDate.slice(0, 10)
      })

      const response = await fetch(`/api/sales-reports?${params}`)
        const data = await response.json()
      
      if (data.success) {
        setSalesReports(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/sales-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportDate: newReport.reportDate,
          dailySales: parseFloat(newReport.dailySales),
          transactionCount: parseInt(newReport.transactionCount) || 0,
          location: newReport.location,
          notes: newReport.notes,
          franchiseId: session?.user?.franchiseId
        }),
      })

      if (response.ok) {
        setShowNewReportForm(false)
        setNewReport({
          reportDate: new Date().toISOString().slice(0, 10),
          dailySales: '',
          transactionCount: '',
          location: '',
          notes: ''
        })
        fetchSalesReports()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la création du rapport')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du rapport')
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'En attente', variant: 'secondary' as const },
      'PAID': { label: 'Payé', variant: 'default' as const },
      'OVERDUE': { label: 'En retard', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Calculs pour les statistiques du mois
  const monthlyStats = {
    totalSales: salesReports.reduce((sum, report) => sum + report.dailySales, 0),
    totalTransactions: salesReports.reduce((sum, report) => sum + report.transactionCount, 0),
    totalRoyalties: salesReports.reduce((sum, report) => sum + report.royaltyAmount, 0),
    averageDaily: salesReports.length > 0 ? salesReports.reduce((sum, report) => sum + report.dailySales, 0) / salesReports.length : 0,
    reportCount: salesReports.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des ventes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Mes ventes
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Saisissez et consultez vos rapports de vente quotidiens
          </p>
        </div>
        <Button onClick={() => setShowNewReportForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Saisir les ventes du jour
        </Button>
      </div>

      {/* Sélecteur de mois */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <label htmlFor="month" className="text-sm font-medium text-gray-700 dark:text-neutral-300">
              Période:
            </label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques du mois */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">CA total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(monthlyStats.totalSales)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {monthlyStats.totalTransactions}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Redevances</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatAmount(monthlyStats.totalRoyalties)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">Moy. quotidienne</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatAmount(monthlyStats.averageDaily)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de nouveau rapport */}
      {showNewReportForm && (
        <Card>
                <CardHeader>
            <CardTitle>Saisir les ventes du jour</CardTitle>
                </CardHeader>
                <CardContent>
            <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Date *
                    </label>
                    <input
                      type="date"
                    id="reportDate"
                    required
                    value={newReport.reportDate}
                    onChange={(e) => setNewReport({...newReport, reportDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  />
                  </div>

                  <div>
                  <label htmlFor="dailySales" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Chiffre d'affaires (€) *
                    </label>
                    <input
                    type="number"
                    id="dailySales"
                    required
                    min="0"
                    step="0.01"
                    value={newReport.dailySales}
                    onChange={(e) => setNewReport({...newReport, dailySales: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>

                  <div>
                  <label htmlFor="transactionCount" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                      Nombre de transactions
                    </label>
                    <input
                      type="number"
                    id="transactionCount"
                      min="0"
                    value={newReport.transactionCount}
                    onChange={(e) => setNewReport({...newReport, transactionCount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Emplacement
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={newReport.location}
                    onChange={(e) => setNewReport({...newReport, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="ex: Marché de Rungis, Place de la République..."
                  />
                </div>
                        </div>

                        <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="Commentaires sur la journée, événements particuliers..."
                />
                      </div>

              <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                  onClick={() => setShowNewReportForm(false)}
                  >
                    Annuler
                  </Button>
                <Button type="submit">
                  Enregistrer les ventes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
      )}

      {/* Liste des rapports de vente */}
      {salesReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Aucun rapport de vente
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Commencez par saisir vos premières ventes
            </p>
            <Button onClick={() => setShowNewReportForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Saisir mes ventes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {salesReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-neutral-100">
                        {formatDate(report.reportDate)}
                      </h3>
                      {report.location && (
                        <p className="text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {report.location}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Chiffre d'affaires</p>
                      <p className="font-bold text-xl text-green-600">{formatAmount(report.dailySales)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Transactions</p>
                      <p className="font-semibold text-lg">{report.transactionCount}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Ticket moyen</p>
                      <p className="font-semibold text-lg">{formatAmount(report.averageTicket)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">Redevance (4%)</p>
                      <p className="font-semibold text-lg text-orange-600">{formatAmount(report.royaltyAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getPaymentStatusBadge(report.paymentStatus)}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </div>

                {report.notes && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      <strong>Notes:</strong> {report.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

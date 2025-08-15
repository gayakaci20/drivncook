'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Send,
  Building2,
  User,
  CreditCard
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { useSession } from '@/lib/auth-client'
import { UserRole } from '@/types/prisma-enums'
import { safeFetchJson } from '@/lib/utils'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  taxAmount: number
  totalAmount: number
  paymentStatus: string
  paymentDate: string | null
  paymentMethod: string | null
  description: string | null
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  franchise: {
    id: string
    businessName: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
    contactEmail: string
  }
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  paymentReference: string | null
  status: string
  notes: string | null
  franchise: {
    id: string
    businessName: string
    user: {
      firstName: string
      lastName: string
    }
  }
  invoice: {
    id: string
    invoiceNumber: string
  } | null
}

interface RoyaltyReport {
  franchiseId: string
  franchiseName: string
  period: string
  totalSales: number
  royaltyRate: number
  royaltyAmount: number
  paidAmount: number
  pendingAmount: number
  status: string
  lastPaymentDate: string | null
}

export default function AdminFinancePage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [royalties, setRoyalties] = useState<RoyaltyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('month')
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    fetchFinancialData()
  }, [searchTerm, statusFilter, periodFilter, session, isPending, router])

  const fetchFinancialData = async () => {
    try {
      const { startDate, endDate } = getPeriodRange(periodFilter)
      const params = new URLSearchParams()
      params.set('limit', '100')
      params.set('sortBy', 'issueDate')
      params.set('sortOrder', 'desc')
      if (statusFilter) params.set('paymentStatus', statusFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const salesParams = new URLSearchParams()
      salesParams.set('limit', '500')
      salesParams.set('sortBy', 'reportDate')
      salesParams.set('sortOrder', 'desc')
      if (startDate) salesParams.set('startDate', startDate)
      if (endDate) salesParams.set('endDate', endDate)

      const [invoicesRes, salesReportsRes] = await Promise.all([
        fetch(`/api/invoices?${params.toString()}`),
        fetch(`/api/sales-reports?${salesParams.toString()}`)
      ])

      if (invoicesRes.ok) {
        const json = await invoicesRes.json()
        const rows = json?.data?.data || json?.data || []
        const mapped: Invoice[] = rows.map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          issueDate: r.issueDate,
          dueDate: r.dueDate,
          amount: Number(r.amount ?? 0),
          taxAmount: 0,
          totalAmount: Number(r.amount ?? 0),
          paymentStatus: r.paymentStatus,
          paymentDate: r.paidDate ?? null,
          paymentMethod: null,
          description: r.description ?? null,
          items: [],
          franchise: {
            id: r.franchise?.id,
            businessName: r.franchise?.businessName,
            user: {
              firstName: r.franchise?.user?.firstName ?? '',
              lastName: r.franchise?.user?.lastName ?? '',
              email: r.franchise?.user?.email ?? ''
            },
            contactEmail: r.franchise?.contactEmail ?? ''
          }
        }))
        setInvoices(mapped)

        const derivedPayments: Payment[] = mapped
          .filter(i => i.paymentStatus === 'PAID')
          .map((i) => ({
            id: i.id,
            amount: normalizeNumber(i.totalAmount),
            paymentDate: i.paymentDate ?? i.issueDate,
            paymentMethod: i.paymentMethod ?? '—',
            paymentReference: null,
            status: 'CONFIRMED',
            notes: null,
            franchise: {
              id: i.franchise.id,
              businessName: i.franchise.businessName,
              user: { firstName: i.franchise.user.firstName, lastName: i.franchise.user.lastName }
            },
            invoice: { id: i.id, invoiceNumber: i.invoiceNumber }
          }))
        setPayments(derivedPayments)
      }

      if (salesReportsRes.ok) {
        const json = await salesReportsRes.json()
        const rows = json?.data?.data || json?.data || []
        const grouped = new Map<string, RoyaltyReport>()
        rows.forEach((r: any) => {
          const fid = r.franchiseId
          const existing = grouped.get(fid)
          const royaltyRate = Number(r.franchise?.royaltyRate ?? 0)
          const totalSalesAdd = Number(r.dailySales ?? 0)
          const royaltyAdd = Number(r.royaltyAmount ?? 0)
          const isPaid = r.paymentStatus === 'PAID'
          const isOverdueStatus = r.paymentStatus === 'OVERDUE'
          const pendingAdd = isPaid ? 0 : royaltyAdd
          if (!existing) {
            grouped.set(fid, {
              franchiseId: fid,
              franchiseName: r.franchise?.businessName ?? '',
              period: getPeriodLabel(periodFilter),
              totalSales: totalSalesAdd,
              royaltyRate,
              royaltyAmount: royaltyAdd,
              paidAmount: isPaid ? royaltyAdd : 0,
              pendingAmount: pendingAdd,
              status: isOverdueStatus ? 'OVERDUE' : isPaid ? 'UP_TO_DATE' : 'PENDING',
              lastPaymentDate: null
            })
          } else {
            existing.totalSales += totalSalesAdd
            existing.royaltyAmount += royaltyAdd
            existing.paidAmount += isPaid ? royaltyAdd : 0
            existing.pendingAmount += pendingAdd
            if (isOverdueStatus) existing.status = 'OVERDUE'
            else if (!isPaid && existing.status !== 'OVERDUE') existing.status = 'PENDING'
          }
        })
        setRoyalties(Array.from(grouped.values()))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodRange = (period: string) => {
    const now = new Date()
    let start = new Date(now)
    let end = new Date(now)
    if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (period === 'quarter') {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3
      start = new Date(now.getFullYear(), qStartMonth, 1)
      end = new Date(now.getFullYear(), qStartMonth + 3, 0)
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const getPeriodLabel = (period: string) => {
    if (period === 'month') return new Date().toISOString().slice(0, 7)
    if (period === 'year') return String(new Date().getFullYear())
    return 'Trimestre en cours'
  }

  const formatCurrency = (amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const normalizeNumber = (input: unknown): number => {
    if (typeof input === 'number') return Number.isFinite(input) ? input : 0
    if (typeof input === 'string') {
      const normalized = input.replace(/\s/g, '').replace(',', '.')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : 0
    }
    const coerced = Number(input)
    return Number.isFinite(coerced) ? coerced : 0
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      'PAID': { label: 'Payée', variant: 'default' as const, icon: CheckCircle },
      'OVERDUE': { label: 'En retard', variant: 'destructive' as const, icon: AlertTriangle },
      'CANCELLED': { label: 'Annulée', variant: 'destructive' as const, icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: Clock 
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getRoyaltyStatusBadge = (status: string) => {
    const statusConfig = {
      'UP_TO_DATE': { label: 'À jour', variant: 'default' as const },
      'PENDING': { label: 'En attente', variant: 'secondary' as const },
      'OVERDUE': { label: 'En retard', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const generateInvoice = async (franchiseId: string) => {
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ franchiseId, period: new Date().toISOString().slice(0, 7) })
      })

      if (response.ok) {
        await fetchFinancialData()
        toast.success('Facture générée avec succès')
      } else {
        const errorData = await response.json()
        toast.error(`Erreur : ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la génération de facture:', error)
      toast.error('Erreur lors de la génération de la facture')
    }
  }

   
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'PAID').length
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'PENDING' && isOverdue(i.dueDate)).length
  const totalRevenue = invoices
    .filter(i => i.paymentStatus === 'PAID')
    .reduce((sum, i) => sum + normalizeNumber(i.totalAmount), 0)
  const pendingAmount = invoices
    .filter(i => i.paymentStatus === 'PENDING')
    .reduce((sum, i) => sum + normalizeNumber(i.totalAmount), 0)
  const totalRoyalties = royalties.reduce((sum, r) => sum + normalizeNumber(r.royaltyAmount), 0)
  const pendingRoyalties = royalties.reduce((sum, r) => sum + normalizeNumber(r.pendingAmount), 0)
  const totalPayments = payments.reduce((sum, p) => sum + normalizeNumber(p.amount), 0)

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
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Gestion Financière</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Rapport comptable
          </Button>
          <Button 
            onClick={() => router.push('/admin/finance/invoices/new')}
            className="flex items-center gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA total</CardTitle>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Encaissé</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center"><Clock className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{invoices.filter(i => i.paymentStatus === 'PENDING').length} factures</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <div className="size-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center"><AlertTriangle className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Factures</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redevances</CardTitle>
            <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalRoyalties)}</div>
            <p className="text-xs text-muted-foreground">Total période</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redevances dues</CardTitle>
            <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center"><FileText className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{formatCurrency(pendingRoyalties)}</div>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CreditCard className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalPayments)}</div>
            <p className="text-xs text-muted-foreground">{payments.length} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes financières */}
      {overdueInvoices > 0 && (
        <Card className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Factures en retard ({overdueInvoices})
            </CardTitle>
          </CardHeader>
          <CardContent> 
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {invoices.filter(i => i.paymentStatus === 'PENDING' && isOverdue(i.dueDate)).slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900/60 rounded-xl border">
                  <div>
                    <div className="font-medium">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-600">
                      {invoice.franchise.businessName} • Échéance: {formatDate(invoice.dueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(invoice.totalAmount)}</div>
                    <Button size="sm" variant="outline" className="rounded-xl">
                      <Send className="h-4 w-4 mr-1" />
                      Relancer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par numéro, franchisé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm backdrop-blur-md outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="PAID">Payées</option>
                <option value="OVERDUE">En retard</option>
                <option value="CANCELLED">Annulées</option>
              </select>
              
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              >
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion par onglets */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="royalties">Redevances</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{invoice.invoiceNumber}</h3>
                          {getPaymentStatusBadge(invoice.paymentStatus)}
                          {invoice.paymentStatus === 'PENDING' && isOverdue(invoice.dueDate) && (
                            <Badge variant="destructive">En retard</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{invoice.franchise.businessName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{invoice.franchise.user.firstName} {invoice.franchise.user.lastName}</span>
                          </div>
                        </div>
                        
                        {invoice.description && (
                          <p className="text-sm text-gray-600 mb-3">{invoice.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Émise le</div>
                              <div className="text-gray-600">{formatDate(invoice.issueDate)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Échéance</div>
                              <div className={`${isOverdue(invoice.dueDate) && invoice.paymentStatus === 'PENDING' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                {formatDate(invoice.dueDate)}
                              </div>
                            </div>
                          </div>
                          
                          {invoice.paymentDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="font-medium">Payée le</div>
                                <div className="text-gray-600">{formatDate(invoice.paymentDate)}</div>
                              </div>
                            </div>
                          )}
                          
                          {invoice.paymentMethod && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">Méthode</div>
                                <div className="text-gray-600">{invoice.paymentMethod}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Détail des lignes de facture */}
                        {invoice.items && invoice.items.length > 0 && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                            <div className="text-sm font-medium text-gray-700 mb-2">Détail de la facture :</div>
                            <div className="space-y-1">
                              {invoice.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.description} ({item.quantity} × {formatCurrency(item.unitPrice)})</span>
                                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                              {invoice.taxAmount > 0 && (
                                <div className="flex justify-between text-sm border-t pt-1">
                                  <span>TVA</span>
                                  <span>{formatCurrency(invoice.taxAmount)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-semibold">{formatCurrency(invoice.totalAmount)}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/finance/invoices/${invoice.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/finance/invoices/${invoice.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {invoice.paymentStatus === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 rounded-xl"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {invoices.length === 0 && (
              <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">Aucune facture</h3>
                  <p className="text-gray-500 dark:text-neutral-400 mb-4">Aucune facture trouvée pour les critères sélectionnés.</p>
                  <Button onClick={() => router.push('/admin/finance/invoices/new')} className="rounded-xl">Créer une facture</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-lg">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-gray-600">
                          {payment.franchise.businessName} • {formatDate(payment.paymentDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod}
                          {payment.paymentReference && ` • Réf: ${payment.paymentReference}`}
                        </div>
                        {payment.invoice && (
                          <div className="text-sm text-gray-500">
                            Facture: {payment.invoice.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={payment.status === 'CONFIRMED' ? "default" : "secondary"}>
                        {payment.status === 'CONFIRMED' ? 'Confirmé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                  {payment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-700">Notes :</div>
                      <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="royalties" className="space-y-4">
          <div className="space-y-4">
            {royalties.map((royalty) => (
              <Card key={`${royalty.franchiseId}-${royalty.period}`} className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-lg">{royalty.franchiseName}</div>
                        <div className="text-sm text-gray-600">
                          Période: {royalty.period} • Taux: {royalty.royaltyRate}%
                        </div>
                        <div className="text-sm text-gray-500">
                          CA: {formatCurrency(royalty.totalSales)} • Redevance: {formatCurrency(royalty.royaltyAmount)}
                        </div>
                        {royalty.lastPaymentDate && (
                          <div className="text-sm text-gray-500">
                            Dernier paiement: {formatDate(royalty.lastPaymentDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xl font-semibold">
                        {formatCurrency(royalty.pendingAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Payé: {formatCurrency(royalty.paidAmount)}
                      </div>
                      {getRoyaltyStatusBadge(royalty.status)}
                      {royalty.pendingAmount > 0 && (
                        <div>
                          <Button size="sm" className="rounded-xl" onClick={() => generateInvoice(royalty.franchiseId)}>
                            Facturer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div>Graphique CA mensuel</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Répartition des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2" />
                    <div>Méthodes de paiement</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Taux de recouvrement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Factures payées:</span>
                      <span className="font-medium">{Math.round((paidInvoices / totalInvoices) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-green-600"
                        style={{ width: `${(paidInvoices / totalInvoices) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {paidInvoices} sur {totalInvoices} factures
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Montant encaissé:</span>
                      <span className="font-medium">
                        {Math.round((totalRevenue / (totalRevenue + pendingAmount)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-blue-600"
                        style={{ width: `${(totalRevenue / (totalRevenue + pendingAmount)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(totalRevenue)} sur {formatCurrency(totalRevenue + pendingAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Top franchisés par CA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {royalties.slice(0, 5).map((royalty, index) => (
                    <div key={royalty.franchiseId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{royalty.franchiseName}</span>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(royalty.totalSales)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
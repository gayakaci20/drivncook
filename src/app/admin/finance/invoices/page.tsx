'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Eye, Edit, FileText, Calendar, Clock, Building2, User, CheckCircle, Filter, Search } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface ApiPagination<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  description: string
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paidDate?: string | null
  franchise: {
    id: string
    businessName: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export default function InvoicesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadInvoices()
  }, [session, isPending, statusFilter])

  async function loadInvoices() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('paymentStatus', statusFilter)
      const res = await fetch(`/api/invoices?${params.toString()}`)
      const json = await res.json()
      const payload = (json?.data as ApiPagination<Invoice>)?.data || []
      setInvoices(payload.map((i: any) => ({
        ...i,
        amount: Number(i.amount)
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return invoices
    const s = search.toLowerCase()
    return invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(s) ||
      i.franchise.businessName.toLowerCase().includes(s) ||
      `${i.franchise.user.firstName} ${i.franchise.user.lastName}`.toLowerCase().includes(s)
    )
  }, [search, invoices])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
  }
  function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  function StatusBadge({ status }: { status: Invoice['paymentStatus'] }) {
    const map: Record<Invoice['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; Icon: any }>= {
      PENDING: { label: 'En attente', variant: 'secondary', Icon: Clock },
      PAID: { label: 'Payée', variant: 'default', Icon: CheckCircle },
      OVERDUE: { label: 'En retard', variant: 'destructive', Icon: Clock },
      CANCELLED: { label: 'Annulée', variant: 'destructive', Icon: Clock }
    }
    const cfg = map[status]
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1">
        <cfg.Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Factures</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => router.push('/admin/finance/invoices/new')} className="rounded-xl">
            Nouvelle facture
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, franchisé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="PAID">Payées</option>
                <option value="OVERDUE">En retard</option>
                <option value="CANCELLED">Annulées</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((invoice) => (
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
                      <StatusBadge status={invoice.paymentStatus} />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                          <div className="text-gray-600">{formatDate(invoice.dueDate)}</div>
                        </div>
                      </div>
                      {invoice.paidDate && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium">Payée le</div>
                            <div className="text-gray-600">{formatDate(invoice.paidDate)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-2xl font-semibold">{formatCurrency(invoice.amount)}</div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/finance/invoices/${invoice.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/finance/invoices/${invoice.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune facture</h3>
              <p className="text-gray-500 mb-4">Aucune facture trouvée pour les critères sélectionnés.</p>
              <Button onClick={() => router.push('/admin/finance/invoices/new')} className="rounded-xl">Créer une facture</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



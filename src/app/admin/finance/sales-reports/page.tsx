'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CreditCard, FileText, Search, Filter, TrendingUp } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface SalesReport {
  id: string
  reportDate: string
  dailySales: number
  transactionCount: number
  averageTicket: number
  royaltyAmount: number
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  franchise: {
    id: string
    businessName: string
    user: { firstName: string; lastName: string; email: string }
  }
  createdBy: { firstName: string; lastName: string }
}

interface ApiPagination<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
}

export default function SalesReportsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [reports, setReports] = useState<SalesReport[]>([])

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    load()
  }, [session, isPending, statusFilter])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('paymentStatus', statusFilter)
      const res = await fetch(`/api/sales-reports?${params.toString()}`)
      const json = await res.json()
      const payload = (json?.data as ApiPagination<SalesReport>)?.data || []
      setReports(payload.map((r: any) => ({
        ...r,
        dailySales: Number(r.dailySales),
        royaltyAmount: Number(r.royaltyAmount),
        averageTicket: Number(r.averageTicket)
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return reports
    const s = search.toLowerCase()
    return reports.filter(r =>
      r.franchise.businessName.toLowerCase().includes(s) ||
      `${r.franchise.user.firstName} ${r.franchise.user.lastName}`.toLowerCase().includes(s)
    )
  }, [search, reports])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
  }
  function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  function StatusBadge({ status }: { status: SalesReport['paymentStatus'] }) {
    const map: Record<SalesReport['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>= {
      PENDING: { label: 'En attente', variant: 'secondary' },
      PAID: { label: 'Payée', variant: 'default' },
      OVERDUE: { label: 'En retard', variant: 'destructive' },
      CANCELLED: { label: 'Annulée', variant: 'destructive' }
    }
    const cfg = map[status]
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
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
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Rapports de ventes</h2>
      </div>

      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par franchisé..."
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
        {filtered.map((r) => (
          <Card key={r.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{r.franchise.businessName}</div>
                    <div className="text-sm text-gray-600">{formatDate(r.reportDate)} • {r.franchise.user.firstName} {r.franchise.user.lastName}</div>
                    <div className="text-sm text-gray-500">Ventes: {formatCurrency(r.dailySales)} • Transactions: {r.transactionCount} • Panier moyen: {formatCurrency(r.averageTicket)}</div>
                    <div className="text-sm text-gray-500">Redevance: {formatCurrency(r.royaltyAmount)}</div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <StatusBadge status={r.paymentStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun rapport</h3>
              <p className="text-gray-500 mb-2">Aucun rapport trouvé pour les critères sélectionnés.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



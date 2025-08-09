'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, FileText, CreditCard, Calendar, Search, Filter } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface RoyaltyReport {
  franchiseId: string
  franchiseName: string
  period: string
  totalSales: number
  royaltyRate: number
  royaltyAmount: number
  paidAmount: number
  pendingAmount: number
  status: 'UP_TO_DATE' | 'PENDING' | 'OVERDUE' | string
  lastPaymentDate: string | null
}

export default function RoyaltiesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [search, setSearch] = useState('')
  const [data, setData] = useState<RoyaltyReport[]>([])

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    load()
  }, [session, isPending, period])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales-reports?period=${period}`)
      const json = await res.json()
      const payload = json?.data?.data || json?.data || []
      setData(payload.map((r: any) => ({
        ...r,
        totalSales: Number(r.totalSales ?? r.dailySales ?? 0),
        royaltyAmount: Number(r.royaltyAmount ?? 0),
        paidAmount: Number(r.paidAmount ?? 0),
        pendingAmount: Number(r.pendingAmount ?? 0)
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return data
    const s = search.toLowerCase()
    return data.filter(r =>
      r.franchiseName?.toLowerCase().includes(s) ||
      r.period?.toLowerCase().includes(s)
    )
  }, [search, data])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
  }
  function formatDate(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }
  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      UP_TO_DATE: { label: 'À jour', variant: 'default' },
      PENDING: { label: 'En attente', variant: 'secondary' },
      OVERDUE: { label: 'En retard', variant: 'destructive' }
    }
    const cfg = map[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  async function generateInvoice(franchiseId: string) {
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId,
          period: new Date().toISOString().slice(0, 7)
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err?.error || 'Erreur lors de la création de la facture')
      } else {
        alert('Facture générée')
        load()
      }
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création de la facture')
    }
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
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Redevances</h2>
      </div>

      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par franchisé, période..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm"
              >
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((r) => (
          <Card key={`${r.franchiseId}-${r.period}`} className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{r.franchiseName}</div>
                    <div className="text-sm text-gray-600">Période: {r.period} • Taux: {r.royaltyRate}%</div>
                    <div className="text-sm text-gray-500">CA: {formatCurrency(r.totalSales)} • Redevance: {formatCurrency(r.royaltyAmount)}</div>
                    {r.lastPaymentDate && (
                      <div className="text-sm text-gray-500">Dernier paiement: {formatDate(r.lastPaymentDate)}</div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-xl font-semibold">{formatCurrency(r.pendingAmount)}</div>
                  <div className="text-sm text-gray-500">Payé: {formatCurrency(r.paidAmount)}</div>
                  <StatusBadge status={r.status} />
                  {r.pendingAmount > 0 && (
                    <div>
                      <Button size="sm" className="rounded-xl" onClick={() => generateInvoice(r.franchiseId)}>
                        Facturer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune redevance</h3>
              <p className="text-gray-500 mb-2">Aucune donnée pour la période sélectionnée.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



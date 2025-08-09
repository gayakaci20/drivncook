'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Eye } from 'lucide-react'

type Invoice = {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | string
}

export default function FranchiseInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/invoices?limit=50')
      const json = await res.json()
      if (json?.success) setInvoices(json.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    if (filter === 'ALL') return invoices
    return invoices.filter(i => i.paymentStatus === filter)
  }, [invoices, filter])

  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  const statusBadge = (s: string) => {
    const m = {
      PENDING: { label: 'En attente', variant: 'secondary' as const },
      PAID: { label: 'Payée', variant: 'default' as const },
      OVERDUE: { label: 'En retard', variant: 'destructive' as const },
    }
    const v = (m as any)[s] || { label: s, variant: 'outline' as const }
    return <Badge variant={v.variant}>{v.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Factures</h1>
        <div className="flex gap-2">
          <Button variant={filter==='ALL'?'default':'outline'} onClick={() => setFilter('ALL')}>Toutes</Button>
          <Button variant={filter==='PENDING'?'default':'outline'} onClick={() => setFilter('PENDING')}>En attente</Button>
          <Button variant={filter==='PAID'?'default':'outline'} onClick={() => setFilter('PAID')}>Payées</Button>
          <Button variant={filter==='OVERDUE'?'default':'outline'} onClick={() => setFilter('OVERDUE')}>En retard</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Liste des factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune facture</div>
          ) : (
            <div className="divide-y">
              {visible.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <div className="font-medium">{inv.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">Émise le {formatDate(inv.issueDate)} • Échéance {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">{formatCurrency(inv.amount)}</div>
                    {statusBadge(inv.paymentStatus)}
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/invoices/${inv.id}/download`}>PDF</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

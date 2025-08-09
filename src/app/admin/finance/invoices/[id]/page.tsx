'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Clock, Building2, User, CheckCircle, Download, ArrowLeft } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

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
    user: { firstName: string; lastName: string; email: string }
  }
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (isPending) return
    if (!session) return router.push('/unauthorized')
    load()
  }, [isPending, session, id])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const json = await res.json()
      const inv = json?.data
      setInvoice({ ...inv, amount: Number(inv.amount) })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
  }
  function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }
  function StatusBadge({ status }: { status: Invoice['paymentStatus'] }) {
    const map: Record<Invoice['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'En attente', variant: 'secondary' },
      PAID: { label: 'Payée', variant: 'default' },
      OVERDUE: { label: 'En retard', variant: 'destructive' },
      CANCELLED: { label: 'Annulée', variant: 'destructive' }
    }
    const cfg = map[status]
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" />Retour</Button>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Facture {invoice.invoiceNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/api/invoices/${id}/download`}>
              <Download className="h-4 w-4 mr-1" />
              Télécharger PDF
            </a>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={invoice.paymentStatus} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Franchise</div>
                      <div className="text-gray-600">{invoice.franchise.businessName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Contact</div>
                      <div className="text-gray-600">{invoice.franchise.user.firstName} {invoice.franchise.user.lastName}</div>
                    </div>
                  </div>
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
                {invoice.description && (
                  <div>
                    <div className="font-medium text-sm">Description</div>
                    <div className="text-sm text-gray-600">{invoice.description}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">{formatCurrency(invoice.amount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



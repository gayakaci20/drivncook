'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface FranchiseOption {
  id: string
  businessName: string
  user: { firstName: string; lastName: string; email: string }
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [franchises, setFranchises] = useState<FranchiseOption[]>([])
  const [search, setSearch] = useState('')
  const [franchiseId, setFranchiseId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadFranchises()
  }, [session, isPending])

  async function loadFranchises() {
    setLoading(true)
    try {
      const res = await fetch(`/api/franchises?limit=1000&sortBy=businessName&sortOrder=asc`)
      const json = await res.json()
      const list = (json?.data?.data || []) as FranchiseOption[]
      setFranchises(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredFranchises = useMemo(() => {
    if (!search) return franchises
    const s = search.toLowerCase()
    return franchises.filter(f =>
      f.businessName.toLowerCase().includes(s) ||
      `${f.user.firstName} ${f.user.lastName}`.toLowerCase().includes(s) ||
      f.user.email.toLowerCase().includes(s)
    )
  }, [search, franchises])

  const formValid = franchiseId && dueDate && description.trim().length >= 2 && Number(amount) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId,
          dueDate,
          amount: Number(amount),
          description
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Erreur lors de la création de la facture')
        return
      }
      setSuccess('Facture créée avec succès')
      setTimeout(() => router.push('/admin/finance/invoices'), 600)
    } catch (e) {
      console.error(e)
      setError('Erreur serveur')
    } finally {
      setSubmitting(false)
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Nouvelle facture</h2>
      </div>

      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Franchisé</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un franchisé..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <select
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm"
              >
                <option value="">Sélectionner...</option>
                {filteredFranchises.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.businessName} — {f.user.firstName} {f.user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Échéance</Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Description de la facture"
                className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="text-sm text-emerald-600">{success}</div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!formValid || submitting} className="rounded-xl">
                {submitting ? 'Création...' : 'Créer la facture'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



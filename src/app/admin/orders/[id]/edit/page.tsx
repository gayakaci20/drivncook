"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole, OrderStatus } from '@/types/prisma-enums'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps { params: Promise<{ id: string }> }

export default function AdminOrderEditPage({ params }: PageProps) {
  const router = useRouter()
  const resolved = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ status: '' as keyof typeof OrderStatus | '', requestedDeliveryDate: '', notes: '' })

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${resolved.id}`, { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json()
      const data = j?.data ?? j
      setForm({
        status: (data.status || '') as keyof typeof OrderStatus | '',
        requestedDeliveryDate: data.requestedDeliveryDate ? new Date(data.requestedDeliveryDate).toISOString().slice(0, 10) : '',
        notes: data.notes || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${resolved.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status || undefined,
          requestedDeliveryDate: form.requestedDeliveryDate || undefined,
          notes: form.notes
        })
      })
      if (res.ok) {
        router.push(`/admin/orders/${resolved.id}`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error || 'Erreur lors de la mise à jour')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/orders/${resolved.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier la commande</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Statut</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">—</option>
                  {Object.keys(OrderStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Date de livraison souhaitée</label>
                <input
                  type="date"
                  name="requestedDeliveryDate"
                  value={form.requestedDeliveryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/orders/${resolved.id}`)}>Annuler</Button>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" /> {saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



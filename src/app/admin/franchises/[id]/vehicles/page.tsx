'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { toast } from 'sonner'

interface PageProps { params: Promise<{ id: string }> }

interface VehicleOption {
  id: string
  label: string
  status: string
  franchiseId?: string | null
}

export default function AssignVehicleToFranchiseePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [franchiseLabel, setFranchiseLabel] = useState<string>('')
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    ;(async () => {
      await Promise.all([loadFranchiseLabel(), loadVehicles()])
      setLoading(false)
    })()
  }, [session, isPending, router, resolvedParams.id])

  const loadFranchiseLabel = async () => {
    try {
      const res = await fetch(`/api/franchises/${resolvedParams.id}`)
      if (!res.ok) return
      const json = await res.json()
      const f = json?.data as { businessName: string; user: { firstName: string; lastName: string } }
      if (f) setFranchiseLabel(`${f.user.firstName} ${f.user.lastName} • ${f.businessName}`)
    } catch {}
  }

  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?limit=1000&status=AVAILABLE&sortBy=brand&sortOrder=asc')
      if (!res.ok) return
      const json = await res.json()
      const items = (json?.data?.data || []) as Array<{ id: string; brand: string; model: string; year: number; licensePlate: string; status: string; franchiseId?: string | null }>
      setVehicles(
        items.map(v => ({
          id: v.id,
          status: v.status,
          franchiseId: v.franchiseId ?? null,
          label: `${v.brand} ${v.model} (${v.year}) • ${v.licensePlate}`
        }))
      )
    } catch {}
  }

  const assignableVehicles = useMemo(() => {
    const base = vehicles.filter(v => !v.franchiseId)
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(v => v.label.toLowerCase().includes(q))
  }, [vehicles, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedParams.id || !selectedVehicleId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId: resolvedParams.id,
          status: 'ASSIGNED',
          assignmentDate: new Date().toISOString()
        })
      })
      const json = await res.json()
      if (res.ok) {
        await loadVehicles()
        setSelectedVehicleId('')
        toast.success("Véhicule assigné avec succès")
      } else {
        toast.error(json?.error || 'Erreur lors de l\'assignation')
      }
    } catch (err) {
      toast.error('Erreur lors de l\'assignation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h1 className="text-2xl font-bold">Assigner un véhicule</h1>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire d'assignation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Franchisé</label>
                <input value={franchiseLabel} disabled className="w-full px-3 py-2 border rounded-xl bg-muted" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Véhicule *</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">Sélectionner un véhicule</option>
                  {assignableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">Seuls les véhicules disponibles et non assignés sont listés.</div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Recherche véhicule</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par marque, modèle ou immatriculation"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={submitting || !selectedVehicleId}>
                {submitting ? 'Assignation...' : 'Assigner'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



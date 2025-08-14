'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { maintenanceSchema, type MaintenanceFormData } from '@/lib/validations'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { toast } from 'sonner'

interface VehicleOption {
  id: string
  label: string
}

export default function NewMaintenancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])

  const preselectedVehicleId = searchParams.get('vehicleId') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema as any),
    defaultValues: {
      status: 'SCHEDULED' as any,
      type: 'PREVENTIVE' as any,
      vehicleId: preselectedVehicleId || undefined
    }
  })

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadVehicles()
    if (preselectedVehicleId) setValue('vehicleId', preselectedVehicleId)
  }, [session, isPending, router, preselectedVehicleId, setValue])

  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?limit=1000&sortBy=brand&sortOrder=asc')
      if (!res.ok) return
      const json = await res.json()
      const items = (json?.data?.data || []) as Array<{ id: string; brand: string; model: string; year: number; licensePlate: string }>
      setVehicles(
        items.map(v => ({ id: v.id, label: `${v.brand} ${v.model} (${v.year}) • ${v.licensePlate}` }))
      )
    } catch {}
  }

  const onSubmit = async (data: MaintenanceFormData) => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const json = await res.json()
        const vehicleId = (json?.data?.vehicleId as string) || data.vehicleId
        reset()
        router.push(vehicleId ? `/admin/vehicles/${vehicleId}` : '/admin/vehicles')
      } else {
        const err = await res.json()
        toast.error(err?.error || 'Erreur lors de la création de la maintenance')
      }
    } catch (e) {
      toast.error('Erreur lors de la création de la maintenance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Nouvelle maintenance</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Véhicule *</label>
                <select
                  {...register('vehicleId')}
                  defaultValue={preselectedVehicleId || ''}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-sm text-red-600 mt-1">{errors.vehicleId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select {...register('type')} className="w-full px-3 py-2 border rounded-xl">
                  <option value="PREVENTIVE">Préventive</option>
                  <option value="CORRECTIVE">Corrective</option>
                </select>
                {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Statut *</label>
                <select {...register('status')} className="w-full px-3 py-2 border rounded-xl">
                  <option value="SCHEDULED">Planifiée</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminée</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
                {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input {...register('title')} className="w-full px-3 py-2 border rounded-xl" placeholder="Révision des freins" />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border rounded-xl" placeholder="Détails des opérations..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date planifiée *</label>
                <input type="date" {...register('scheduledDate')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.scheduledDate && <p className="text-sm text-red-600 mt-1">{errors.scheduledDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date de réalisation</label>
                <input type="date" {...register('completedDate')} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Coût (€)</label>
                <input type="number" step="0.01" min={0} {...register('cost', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kilométrage</label>
                <input type="number" min={0} {...register('mileage', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Pièces (JSON)</label>
                <input {...register('parts')} className="w-full px-3 py-2 border rounded-xl" placeholder='[{"ref":"PLAQUETTES","qty":1}]' />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Heures de main d'œuvre</label>
                <input type="number" step="0.25" min={0} {...register('laborHours', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prochaine maintenance</label>
                <input type="date" {...register('nextMaintenanceDate')} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer la maintenance'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



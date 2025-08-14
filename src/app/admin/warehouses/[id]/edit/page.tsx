'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { warehouseSchema, type WarehouseFormData } from '@/lib/validations'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditWarehousePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema as any)
  })

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    loadWarehouse()
  }, [session, isPending, router])

  const loadWarehouse = async () => {
    try {
      const res = await fetch(`/api/warehouses/${resolvedParams.id}`)
      if (res.ok) {
        const json = await res.json()
        const w = json.data
        reset({
          name: w.name,
          address: w.address,
          city: w.city,
          postalCode: w.postalCode,
          region: w.region,
          phone: w.phone || undefined,
          email: w.email || undefined,
          capacity: w.capacity
        })
      }
    } catch {}
  }

  const onSubmit = async (data: WarehouseFormData) => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/warehouses/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        router.push(`/admin/warehouses/${resolvedParams.id}`)
      } else {
        const err = await res.json()
        toast.error(err?.error || "Erreur lors de la mise à jour")
      }
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin/warehouses/${resolvedParams.id}`)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Modifier l'entrepôt
            </h2>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input {...register('name')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capacité *</label>
                <input type="number" min={1} {...register('capacity', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
                {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Adresse *</label>
                <input {...register('address')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ville *</label>
                <input {...register('city')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Code postal *</label>
                <input maxLength={5} {...register('postalCode')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.postalCode && <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Région *</label>
                <input {...register('region')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.region && <p className="text-sm text-red-600 mt-1">{errors.region.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input {...register('phone')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" {...register('email')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/warehouses/${resolvedParams.id}`)}>Annuler</Button>
              <Button type="submit" disabled={loading || !isDirty}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



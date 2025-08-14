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
import { franchiseSchema, type FranchiseFormData } from '@/lib/validations'
import { toast } from 'sonner'

interface FranchiseSummary {
  id: string
  businessName: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditFranchisePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FranchiseFormData>({
    resolver: zodResolver(franchiseSchema as any)
  })

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    fetchData()
  }, [session, isPending, resolvedParams.id, router])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/franchises/${resolvedParams.id}`)
      if (res.ok) {
        const json = await res.json()
        setFranchise(json.data)
        const f = json.data
        reset({
          businessName: f.businessName,
          siretNumber: f.siretNumber,
          vatNumber: f.vatNumber || undefined,
          address: f.address,
          city: f.city,
          postalCode: f.postalCode,
          region: f.region,
          contactEmail: f.contactEmail,
          contactPhone: f.contactPhone,
          status: f.status,
          entryFee: f.entryFee,
          entryFeePaid: f.entryFeePaid,
          entryFeeDate: f.entryFeeDate ? new Date(f.entryFeeDate).toISOString().slice(0,10) : undefined,
          royaltyRate: f.royaltyRate,
          contractStartDate: f.contractStartDate ? new Date(f.contractStartDate).toISOString().slice(0,10) : undefined,
          contractEndDate: f.contractEndDate ? new Date(f.contractEndDate).toISOString().slice(0,10) : undefined
        } as any)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FranchiseFormData) => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    try {
      const res = await fetch(`/api/franchises/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        router.push(`/admin/franchises/${resolvedParams.id}`)
      } else {
        const err = await res.json()
        toast.error(err?.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin/franchises/${resolvedParams.id}`)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Modifier le franchisé
            </h2>
            {franchise && (
              <p className="text-gray-600">{franchise.user.firstName} {franchise.user.lastName} • {franchise.businessName}</p>
            )}
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
                <label className="block text-sm font-medium mb-2">Raison sociale *</label>
                <input {...register('businessName')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.businessName && <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SIRET *</label>
                <input maxLength={14} {...register('siretNumber')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.siretNumber && <p className="text-sm text-red-600 mt-1">{errors.siretNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">TVA</label>
                <input {...register('vatNumber')} className="w-full px-3 py-2 border rounded-xl" />
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
                <label className="block text-sm font-medium mb-2">Email entreprise *</label>
                <input type="email" {...register('contactEmail')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.contactEmail && <p className="text-sm text-red-600 mt-1">{errors.contactEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone entreprise *</label>
                <input {...register('contactPhone')} className="w-full px-3 py-2 border rounded-xl" />
                {errors.contactPhone && <p className="text-sm text-red-600 mt-1">{errors.contactPhone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Statut *</label>
                <select {...register('status')} className="w-full px-3 py-2 border rounded-xl">
                  <option value="PENDING">En attente</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="TERMINATED">Terminé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Droit d'entrée (€)</label>
                <input type="number" step="0.01" min={0} {...register('entryFee', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Taux de redevance (%)</label>
                <input type="number" step="0.01" min={0} max={100} {...register('royaltyRate', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...register('entryFeePaid')} />
                <span className="text-sm">Droit d'entrée payé</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de paiement</label>
                <input type="date" {...register('entryFeeDate')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Début de contrat</label>
                <input type="date" {...register('contractStartDate')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fin de contrat</label>
                <input type="date" {...register('contractEndDate')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/franchises/${resolvedParams.id}`)}>Annuler</Button>
              <Button type="submit" disabled={!isDirty}>Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



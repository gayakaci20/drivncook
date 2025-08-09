"use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { ArrowLeft, Edit } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

export default function EditVehiclePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (isPending) return
    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    fetchVehicle()
  }, [resolvedParams.id, session, isPending, router])

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${resolvedParams.id}`)
      if (res.ok) {
        const json = await res.json()
        const v = json.data
        setFormData({
          licensePlate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          vin: v.vin,
          status: v.status,
          purchaseDate: v.purchaseDate ? new Date(v.purchaseDate).toISOString().slice(0,10) : '',
          purchasePrice: v.purchasePrice,
          currentMileage: v.currentMileage ?? '',
          lastInspectionDate: v.lastInspectionDate ? new Date(v.lastInspectionDate).toISOString().slice(0,10) : '',
          nextInspectionDate: v.nextInspectionDate ? new Date(v.nextInspectionDate).toISOString().slice(0,10) : '',
          insuranceNumber: v.insuranceNumber ?? '',
          insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().slice(0,10) : '',
          franchiseId: v.franchiseId ?? ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/vehicles/${resolvedParams.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      router.push(`/admin/vehicles/${resolvedParams.id}`)
    } else {
      const err = await res.json()
      alert(err?.error || 'Erreur lors de la mise à jour')
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
          <Button variant="outline" onClick={() => router.push(`/admin/vehicles/${resolvedParams.id}`)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Modifier le véhicule
            </h2>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Immatriculation *</label>
                <input name="licensePlate" value={formData.licensePlate || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">VIN *</label>
                <input name="vin" value={formData.vin || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Marque *</label>
                <input name="brand" value={formData.brand || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Modèle *</label>
                <input name="model" value={formData.model || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Année *</label>
                <input type="number" name="year" value={formData.year || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select name="status" value={formData.status || 'AVAILABLE'} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl">
                  <option value="AVAILABLE">Disponible</option>
                  <option value="ASSIGNED">Assigné</option>
                  <option value="MAINTENANCE">En maintenance</option>
                  <option value="OUT_OF_SERVICE">Hors service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date d'achat *</label>
                <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prix d'achat (€) *</label>
                <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Kilométrage</label>
                <input type="number" name="currentMileage" value={formData.currentMileage || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dernier contrôle technique</label>
                <input type="date" name="lastInspectionDate" value={formData.lastInspectionDate || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prochain contrôle technique</label>
                <input type="date" name="nextInspectionDate" value={formData.nextInspectionDate || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numéro d'assurance</label>
                <input name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expiration assurance</label>
                <input type="date" name="insuranceExpiry" value={formData.insuranceExpiry || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Franchise (ID)</label>
                <input name="franchiseId" value={formData.franchiseId || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl" placeholder="Laisser vide pour aucune" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/vehicles/${resolvedParams.id}`)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



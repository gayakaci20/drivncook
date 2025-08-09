    "use client"

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { useSession } from '@/lib/auth-client'
import { ArrowLeft, Edit, Trash2, Clock, MapPin, Car, Wrench } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

interface VehicleDetail {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  vin: string
  status: string
  purchaseDate: string
  purchasePrice: number
  currentMileage: number | null
  lastInspectionDate: string | null
  nextInspectionDate: string | null
  insuranceNumber: string | null
  insuranceExpiry: string | null
  assignmentDate: string | null
  latitude: number | null
  longitude: number | null
  franchiseId: string | null
  franchise?: {
    id: string
    businessName: string
    user: { firstName: string; lastName: string; email: string }
  } | null
  maintenances: Array<{
    id: string
    type: string
    status: string
    title: string
    scheduledDate: string
    completedDate: string | null
    cost: number | null
    mileage: number | null
  }>
}

export default function VehicleDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { data: session, isPending } = useSession()
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [loading, setLoading] = useState(true)

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
        setVehicle(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      AVAILABLE: 'secondary',
      ASSIGNED: 'default',
      MAINTENANCE: 'destructive',
      OUT_OF_SERVICE: 'destructive'
    }
    return <Badge variant={(map[status] as any) || 'outline'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Véhicule introuvable</h3>
          <Button onClick={() => router.push('/admin/vehicles')}>Retour à la liste</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/vehicles')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Car className="h-7 w-7" />
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </h2>
            <p className="text-gray-600">{vehicle.licensePlate} • VIN {vehicle.vin}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button variant="destructive" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">{getStatusBadge(vehicle.status)}</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Immatriculation: <span className="font-medium">{vehicle.licensePlate}</span></div>
            <div>VIN: <span className="font-medium">{vehicle.vin}</span></div>
            <div>Achat: <span className="font-medium">{formatDate(vehicle.purchaseDate)} • {formatCurrency(vehicle.purchasePrice)}</span></div>
            <div>Kilométrage: <span className="font-medium">{vehicle.currentMileage?.toLocaleString() ?? '—'} km</span></div>
            <div>CT dernier: <span className="font-medium">{formatDate(vehicle.lastInspectionDate)}</span></div>
            <div>CT prochain: <span className="font-medium">{formatDate(vehicle.nextInspectionDate)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Numéro: <span className="font-medium">{vehicle.insuranceNumber ?? '—'}</span></div>
            <div>Expiration: <span className="font-medium">{formatDate(vehicle.insuranceExpiry)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affectation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Date: <span className="font-medium">{formatDate(vehicle.assignmentDate)}</span></div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Latitude: {vehicle.latitude ?? '—'} / Longitude: {vehicle.longitude ?? '—'}</span>
            </div>
            <div>Franchise: <span className="font-medium">{vehicle.franchise?.businessName ?? 'Non assigné'}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenances récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicle.maintenances.length ? (
            <div className="space-y-3">
              {vehicle.maintenances.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-sm text-gray-500">{new Date(m.scheduledDate).toLocaleDateString('fr-FR')} • {m.mileage ? `${m.mileage.toLocaleString()} km` : '—'}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{m.status}</Badge>
                    {m.cost != null && <div className="text-sm">{formatCurrency(m.cost)}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Aucune maintenance</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



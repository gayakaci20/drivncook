'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation } from 'lucide-react'
import FranchiseMap from '@/components/maps/FranchiseMap'
import { ExtendedUser } from '@/types/auth'

type Franchise = {
  id: string
  businessName: string
  address: string
  city: string
  postalCode: string
  region: string
  status: string
  user: { firstName: string; lastName: string; email: string }
}

export default function FranchiseLocationPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [franchise, setFranchise] = useState<Franchise | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const id = (session?.user as ExtendedUser | undefined)?.franchiseId
      if (!id) { setLoading(false); return }
      const res = await fetch(`/api/franchises/${id}`)
      const json = await res.json()
      if (json?.success) setFranchise(json.data)
    } finally {
      setLoading(false)
    }
  }

  const franchiseForMap = useMemo(() => {
    if (!franchise) return []
    return [{
      id: franchise.id,
      businessName: franchise.businessName,
      address: franchise.address,
      city: franchise.city,
      postalCode: franchise.postalCode,
      region: franchise.region,
      status: franchise.status,
      user: franchise.user,
      vehicles: []
    }]
  }, [franchise])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ma Localisation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Détails de localisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : !franchise ? (
            <div className="p-8 text-center text-gray-500">
              <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Localisation non disponible</p>
              <p>Contactez l'administration pour associer votre franchise.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border p-4">
                <div className="font-medium">{franchise.businessName}</div>
                <div className="text-sm text-gray-600">
                  {franchise.address}<br />
                  {franchise.postalCode} {franchise.city}<br />
                  {franchise.region}
                </div>
              </div>
              <FranchiseMap franchises={franchiseForMap as any} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
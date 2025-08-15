'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation } from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import WarehouseMap from '@/components/maps/WarehouseMap'
import FranchiseMap from '@/components/maps/FranchiseMap'

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
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    fetchWarehouses()
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

  async function fetchWarehouses() {
    try {
      const res = await fetch('/api/warehouses?limit=1000')
      const json = await res.json()
      if (json?.success) setWarehouses(json.data.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des entrepôts:', error)
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

  const warehousesForMap = useMemo(() => {
    return warehouses.map(w => ({
      id: w.id,
      name: w.name,
      address: w.address,
      city: w.city,
      postalCode: w.postalCode,
      region: w.region,
      isActive: w.isActive
    }))
  }, [warehouses])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Localisation des entrepôts</h1>
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Entrepôts du réseau ({warehouses.length})</h3>
                  <WarehouseMap warehouses={warehousesForMap as any} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
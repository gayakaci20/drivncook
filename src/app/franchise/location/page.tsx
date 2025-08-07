'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Settings } from 'lucide-react'

export default function FranchiseLocationPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ma Localisation</h1>
        <Button disabled={loading}>
          <Settings className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Détails de localisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Localisation non configurée</p>
            <p>Cette section est en cours de développement.</p>
            <p>Vous pourrez gérer votre localisation de franchise ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

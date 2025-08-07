'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Save, User, Bell } from 'lucide-react'

export default function FranchiseSettingsPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <Button disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-gray-500">
              <p>Gestion du profil utilisateur</p>
              <p className="text-sm">En cours de développement...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-gray-500">
              <p>Paramètres de notifications</p>
              <p className="text-sm">En cours de développement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

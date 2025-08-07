'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react'

export default function FranchiseSupportPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support</h1>
        <Button disabled={loading}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact téléphonique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center">
              <p className="text-lg font-medium">+33 1 XX XX XX XX</p>
              <p className="text-sm text-gray-500">Lun-Ven: 9h-18h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center">
              <p className="text-lg font-medium">support@drivncook.com</p>
              <p className="text-sm text-gray-500">Réponse sous 24h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Centre d'aide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">FAQ et documentation</p>
            <p>Cette section est en cours de développement.</p>
            <p>Questions fréquentes et guides d'utilisation à venir.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, TrendingUp } from 'lucide-react'

export default function FranchiseReportsPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Rapports</h1>
        <Button disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Rapports de ventes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Rapports non disponibles</p>
            <p>Cette section est en cours de développement.</p>
            <p>Vos rapports de ventes et analyses apparaîtront ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

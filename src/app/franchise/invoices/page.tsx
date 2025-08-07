'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Eye } from 'lucide-react'

export default function FranchiseInvoicesPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Factures</h1>
        <Button disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Télécharger toutes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Liste des factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Aucune facture disponible</p>
            <p>Cette section est en cours de développement.</p>
            <p>Vos factures apparaîtront ici une fois la fonctionnalité implémentée.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

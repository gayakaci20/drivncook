'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Fuel,
  Settings,
  FileText,
  Plus
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  status: string
  currentMileage: number | null
  lastInspectionDate: string | null
  nextInspectionDate: string | null
  insuranceExpiry: string | null
  latitude: number | null
  longitude: number | null
  maintenances: Array<{
    id: string
    type: string
    status: string
    title: string
    scheduledDate: string
    completedDate: string | null
    cost: number | null
  }>
}

export default function FranchiseVehiclePage() {
  const { data: session } = useSession()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)

  useEffect(() => {
    if ((session?.user as ExtendedUser).franchiseId) {
      fetchVehicle()
    } else if (session?.user && !(session.user as ExtendedUser).franchiseId) {
       
      setLoading(false)
    }
  }, [session])

  const fetchVehicle = async () => {
    try {
      const response = await fetch('/api/vehicles')
      
      if (!response.ok) {
        console.error('Erreur HTTP:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Contenu de l\'erreur:', errorText)
        return
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Réponse non-JSON reçue:', contentType)
        const text = await response.text()
        console.error('Contenu de la réponse:', text)
        return
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.data && data.data.data.length > 0) {
        setVehicle(data.data.data[0])  
      } else if (!data.success) {
        console.error('Erreur API véhicules:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AVAILABLE': { label: 'Disponible', variant: 'default' as const, icon: CheckCircle },
      'ASSIGNED': { label: 'En service', variant: 'default' as const, icon: Truck },
      'MAINTENANCE': { label: 'En maintenance', variant: 'secondary' as const, icon: Wrench },
      'OUT_OF_SERVICE': { label: 'Hors service', variant: 'destructive' as const, icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: Truck 
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getMaintenanceStatusBadge = (status: string) => {
    const statusConfig = {
      'SCHEDULED': { label: 'Planifiée', variant: 'secondary' as const },
      'IN_PROGRESS': { label: 'En cours', variant: 'default' as const },
      'COMPLETED': { label: 'Terminée', variant: 'default' as const },
      'CANCELLED': { label: 'Annulée', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getMaintenanceTypeLabel = (type: string) => {
    const types = {
      'PREVENTIVE': 'Préventive',
      'CORRECTIVE': 'Corrective',
      'EMERGENCY': 'Urgence'
    }
    return types[type as keyof typeof types] || type
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const isInspectionSoon = (date: string | null) => {
    if (!date) return false
    const inspectionDate = new Date(date)
    const now = new Date()
    const diffInDays = (inspectionDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    return diffInDays <= 30 && diffInDays > 0
  }

  const isInspectionOverdue = (date: string | null) => {
    if (!date) return false
    const inspectionDate = new Date(date)
    const now = new Date()
    return inspectionDate < now
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des informations du véhicule...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
          Aucun véhicule assigné
        </h3>
        <p className="text-gray-600 dark:text-neutral-400 mb-4">
          {((session?.user as ExtendedUser).franchiseId) 
            ? "Aucun véhicule n'est actuellement assigné à votre franchise" 
            : "Aucune franchise associée à votre compte"}
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          {((session?.user as ExtendedUser).franchiseId) 
            ? "Contactez votre administrateur pour l'attribution d'un véhicule"
            : "Veuillez contacter l'administrateur pour associer une franchise à votre compte"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Mon véhicule
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Informations et suivi de votre véhicule
          </p>
        </div>
        <Button onClick={() => setShowMaintenanceForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Programmer maintenance
        </Button>
      </div>

      {/* Informations principales du véhicule */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </CardTitle>
            {getStatusBadge(vehicle.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-neutral-100 mb-3">Identification</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">Plaque d'immatriculation</p>
                  <p className="font-semibold text-lg">{vehicle.licensePlate}</p>
                </div>
                {vehicle.currentMileage && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">Kilométrage actuel</p>
                    <p className="font-medium">{vehicle.currentMileage.toLocaleString('fr-FR')} km</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-neutral-100 mb-3">Contrôles</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">Dernier contrôle technique</p>
                  <p className="font-medium">{formatDate(vehicle.lastInspectionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">Prochain contrôle technique</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{formatDate(vehicle.nextInspectionDate)}</p>
                    {isInspectionOverdue(vehicle.nextInspectionDate) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Dépassé
                      </Badge>
                    )}
                    {isInspectionSoon(vehicle.nextInspectionDate) && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Bientôt
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-neutral-100 mb-3">Assurance</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">Expiration assurance</p>
                  <p className="font-medium">{formatDate(vehicle.insuranceExpiry)}</p>
                </div>
                {vehicle.latitude && vehicle.longitude && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">Dernière position</p>
                    <Button variant="outline" size="sm" className="mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      Voir sur la carte
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {(isInspectionOverdue(vehicle.nextInspectionDate) || isInspectionSoon(vehicle.nextInspectionDate)) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                  Attention - Contrôle technique
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {isInspectionOverdue(vehicle.nextInspectionDate) 
                    ? 'Le contrôle technique de votre véhicule est dépassé. Planifiez-le rapidement.'
                    : 'Le contrôle technique de votre véhicule approche. Pensez à le programmer.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique de maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Historique de maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicle.maintenances.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-neutral-400">
                Aucun historique de maintenance
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicle.maintenances.map((maintenance) => (
                <div key={maintenance.id} className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-neutral-100">
                          {maintenance.title}
                        </h4>
                        {getMaintenanceStatusBadge(maintenance.status)}
                        <Badge variant="outline" className="text-xs">
                          {getMaintenanceTypeLabel(maintenance.type)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Date programmée</p>
                          <p className="font-medium">{formatDate(maintenance.scheduledDate)}</p>
                        </div>
                        {maintenance.completedDate && (
                          <div>
                            <p className="text-gray-600 dark:text-neutral-400">Date de réalisation</p>
                            <p className="font-medium">{formatDate(maintenance.completedDate)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Coût</p>
                          <p className="font-medium">{formatAmount(maintenance.cost)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Fuel className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Carnet de bord
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Enregistrer le kilométrage et les frais
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Documents
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Certificat, assurance, contrôle technique
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Signaler un problème
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Panne, accident, problème technique
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
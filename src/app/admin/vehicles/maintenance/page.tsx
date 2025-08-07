'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  User,
  FileText,
  Edit,
  Download,
  ChevronDown,
  Settings,
  Zap,
  X
} from 'lucide-react'

interface Maintenance {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  scheduledDate: string
  completedDate: string | null
  cost: number | null
  mileage: number | null
  parts: string | null
  laborHours: number | null
  notes: string | null
  nextMaintenanceDate: string | null
  createdAt: string
  vehicle: {
    id: string
    licensePlate: string
    brand: string
    model: string
    year: number
    currentMileage: number | null
    franchise: {
      id: string
      businessName: string
      user: {
        firstName: string
        lastName: string
      }
    } | null
  }
  createdBy: {
    firstName: string
    lastName: string
  }
}

export default function VehicleMaintenancePage() {
  const router = useRouter()
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchMaintenances()
  }, [searchTerm, statusFilter, typeFilter])

  const fetchMaintenances = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      
      const response = await fetch(`/api/maintenances?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMaintenances(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'SCHEDULED': { label: 'Planifiée', variant: 'secondary' as const, icon: Calendar },
      'IN_PROGRESS': { label: 'En cours', variant: 'default' as const, icon: Clock },
      'COMPLETED': { label: 'Terminée', variant: 'default' as const, icon: CheckCircle },
      'CANCELLED': { label: 'Annulée', variant: 'destructive' as const, icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: Clock 
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      'PREVENTIVE': { label: 'Préventive', color: 'bg-blue-100 text-blue-800' },
      'CORRECTIVE': { label: 'Corrective', color: 'bg-yellow-100 text-yellow-800' },
      'EMERGENCY': { label: 'Urgence', color: 'bg-red-100 text-red-800' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || { 
      label: type, 
      color: 'bg-gray-100 text-gray-800' 
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (maintenance: Maintenance) => {
    const scheduledDate = new Date(maintenance.scheduledDate)
    const today = new Date()
    const daysDiff = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (maintenance.type === 'EMERGENCY') {
      return <Badge variant="destructive">Urgence</Badge>
    }

    if (daysDiff < 0 && maintenance.status === 'SCHEDULED') {
      return <Badge variant="destructive">En retard</Badge>
    }

    if (daysDiff <= 7 && maintenance.status === 'SCHEDULED') {
      return <Badge variant="destructive">Cette semaine</Badge>
    }

    if (daysDiff <= 30 && maintenance.status === 'SCHEDULED') {
      return <Badge variant="secondary">Ce mois-ci</Badge>
    }

    return null
  }

   
  const stats = {
    total: maintenances.length,
    scheduled: maintenances.filter(m => m.status === 'SCHEDULED').length,
    inProgress: maintenances.filter(m => m.status === 'IN_PROGRESS').length,
    completed: maintenances.filter(m => m.status === 'COMPLETED').length,
    emergency: maintenances.filter(m => m.type === 'EMERGENCY').length,
    totalCost: maintenances.filter(m => m.cost).reduce((sum, m) => sum + (m.cost || 0), 0),
    avgCost: maintenances.filter(m => m.cost).reduce((sum, m) => sum + (m.cost || 0), 0) / maintenances.filter(m => m.cost).length || 0
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion de la Maintenance</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button 
            onClick={() => router.push('/admin/vehicles/maintenance/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle maintenance
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Maintenances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planifiées</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">À faire</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Complètes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgences</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
            <p className="text-xs text-muted-foreground">Critiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
            <p className="text-xs text-muted-foreground">Dépensé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par véhicule, titre, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl">
                    <Filter className="h-4 w-4" />
                    {statusFilter ? (
                      statusFilter === 'SCHEDULED' ? 'Planifiées' :
                      statusFilter === 'IN_PROGRESS' ? 'En cours' :
                      statusFilter === 'COMPLETED' ? 'Terminées' :
                      statusFilter === 'CANCELLED' ? 'Annulées' : statusFilter
                    ) : 'Tous les statuts'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('')}>
                    <Filter className="h-4 w-4" />
                    Tous les statuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('SCHEDULED')}>
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Planifiées
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('IN_PROGRESS')}>
                    <Clock className="h-4 w-4 text-orange-600" />
                    En cours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')}>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Terminées
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('CANCELLED')}>
                    <X className="h-4 w-4 text-red-600" />
                    Annulées
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl">
                    <Wrench className="h-4 w-4" />
                    {typeFilter ? (
                      typeFilter === 'PREVENTIVE' ? 'Préventive' :
                      typeFilter === 'CORRECTIVE' ? 'Corrective' :
                      typeFilter === 'EMERGENCY' ? 'Urgence' : typeFilter
                    ) : 'Tous les types'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTypeFilter('')}>
                    <Wrench className="h-4 w-4" />
                    Tous les types
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTypeFilter('PREVENTIVE')}>
                    <Settings className="h-4 w-4 text-blue-600" />
                    Préventive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('CORRECTIVE')}>
                    <Wrench className="h-4 w-4 text-orange-600" />
                    Corrective
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('EMERGENCY')}>
                    <Zap className="h-4 w-4 text-red-600" />
                    Urgence
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des maintenances */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="urgent">Urgentes</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiées</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {maintenances.map((maintenance) => (
              <Card key={maintenance.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{maintenance.title}</h3>
                          {getTypeBadge(maintenance.type)}
                          {getPriorityBadge(maintenance)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            <span>{maintenance.vehicle.brand} {maintenance.vehicle.model} ({maintenance.vehicle.licensePlate})</span>
                          </div>
                          
                          {maintenance.vehicle.franchise && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{maintenance.vehicle.franchise.user.firstName} {maintenance.vehicle.franchise.user.lastName}</span>
                            </div>
                          )}
                        </div>
                        
                        {maintenance.description && (
                          <p className="text-sm text-gray-600 mb-3">{maintenance.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Planifiée</div>
                              <div className="text-gray-600">{formatDate(maintenance.scheduledDate)}</div>
                            </div>
                          </div>
                          
                          {maintenance.completedDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="font-medium">Terminée</div>
                                <div className="text-gray-600">{formatDate(maintenance.completedDate)}</div>
                              </div>
                            </div>
                          )}
                          
                          {maintenance.cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">Coût</div>
                                <div className="text-gray-600">{formatCurrency(maintenance.cost)}</div>
                              </div>
                            </div>
                          )}
                          
                          {maintenance.mileage && (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 text-gray-500 flex items-center justify-center">
                                <span className="text-xs font-bold">KM</span>
                              </div>
                              <div>
                                <div className="font-medium">Kilométrage</div>
                                <div className="text-gray-600">{maintenance.mileage.toLocaleString()} km</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {maintenance.parts && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">Pièces utilisées :</div>
                            <div className="text-sm text-gray-600 mt-1">{maintenance.parts}</div>
                          </div>
                        )}
                        
                        {maintenance.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">Notes :</div>
                            <div className="text-sm text-gray-600 mt-1">{maintenance.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      {getStatusBadge(maintenance.status)}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/vehicles/maintenance/${maintenance.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/vehicles/maintenance/${maintenance.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {maintenances.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune maintenance</h3>
                  <p className="text-gray-500 mb-4">
                    Aucune maintenance programmée ou enregistrée.
                  </p>
                  <Button onClick={() => router.push('/admin/vehicles/maintenance/new')}>
                    Planifier une maintenance
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <div className="space-y-4">
            {maintenances.filter(m => {
              const scheduledDate = new Date(m.scheduledDate)
              const today = new Date()
              const daysDiff = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              return m.type === 'EMERGENCY' || (daysDiff <= 7 && m.status === 'SCHEDULED') || (daysDiff < 0 && m.status === 'SCHEDULED')
            }).map((maintenance) => (
              <Card key={maintenance.id} className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{maintenance.title}</h3>
                      <div className="text-sm text-gray-600">
                        {maintenance.vehicle.brand} {maintenance.vehicle.model} ({maintenance.vehicle.licensePlate})
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(maintenance.type)}
                        {getPriorityBadge(maintenance)}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(maintenance.status)}
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDate(maintenance.scheduledDate)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="space-y-4">
            {maintenances.filter(m => m.status === 'SCHEDULED').map((maintenance) => (
              <Card key={maintenance.id} className="border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{maintenance.title}</h3>
                      <div className="text-sm text-gray-600">
                        {maintenance.vehicle.brand} {maintenance.vehicle.model} ({maintenance.vehicle.licensePlate})
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(maintenance.type)}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(maintenance.status)}
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDate(maintenance.scheduledDate)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {maintenances.filter(m => m.status === 'COMPLETED').map((maintenance) => (
              <Card key={maintenance.id} className="border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{maintenance.title}</h3>
                      <div className="text-sm text-gray-600">
                        {maintenance.vehicle.brand} {maintenance.vehicle.model} ({maintenance.vehicle.licensePlate})
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(maintenance.type)}
                        {maintenance.cost && (
                          <span className="text-sm font-medium">{formatCurrency(maintenance.cost)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(maintenance.status)}
                      <div className="text-sm text-gray-600 mt-1">
                        Terminée le {formatDate(maintenance.completedDate)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
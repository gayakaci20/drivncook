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
  Truck, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  MapPin,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Fuel,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Pause,
  X
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface Vehicle {
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
  latitude: number | null
  longitude: number | null
  isActive: boolean
  createdAt: string
  franchise: {
    id: string
    businessName: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  } | null
  maintenances: Array<{
    id: string
    type: string
    status: string
    title: string
    scheduledDate: string
    completedDate: string | null
    cost: number | null
  }>
  _count: {
    maintenances: number
  }
}

export default function AdminVehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])

  useEffect(() => {
    fetchVehicles()
  }, [searchTerm, statusFilter])

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/vehicles?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVehicles()
      } else {
        const errorData = await response.json()
        toast.error(`Erreur : ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatCurrencyCompact = (amount: number | string) => {
    const n = typeof amount === 'number' ? amount : Number(amount)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(n)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ASSIGNED': { label: 'Assigné', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'AVAILABLE': { label: 'Disponible', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'MAINTENANCE': { label: 'En maintenance', variant: 'destructive' as const, color: 'bg-yellow-100 text-yellow-800' },
      'OUT_OF_SERVICE': { label: 'Hors service', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const,
      color: 'bg-gray-100 text-gray-800' 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getMaintenanceAlert = (vehicle: Vehicle) => {
     
    const nextInspection = vehicle.nextInspectionDate ? new Date(vehicle.nextInspectionDate) : null
    const insuranceExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null
    const today = new Date()
    const alertDays = 30

    const alerts = []

    if (nextInspection) {
      const daysDiff = Math.ceil((nextInspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= alertDays && daysDiff >= 0) {
        alerts.push(`CT dans ${daysDiff} jours`)
      } else if (daysDiff < 0) {
        alerts.push('CT en retard')
      }
    }

    if (insuranceExpiry) {
      const daysDiff = Math.ceil((insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= alertDays && daysDiff >= 0) {
        alerts.push(`Assurance dans ${daysDiff} jours`)
      } else if (daysDiff < 0) {
        alerts.push('Assurance expirée')
      }
    }

    const pendingMaintenances = vehicle.maintenances.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
    if (pendingMaintenances.length > 0) {
      alerts.push(`${pendingMaintenances.length} maintenance${pendingMaintenances.length > 1 ? 's' : ''}`)
    }

    return alerts
  }

   
  const stats = {
    total: vehicles.length,
    assigned: vehicles.filter(v => v.status === 'ASSIGNED').length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    outOfService: vehicles.filter(v => v.status === 'OUT_OF_SERVICE').length,
    totalValue: vehicles.reduce((sum, v) => sum + (typeof v.purchasePrice === 'number' ? v.purchasePrice : Number(v.purchasePrice || 0)), 0),
    avgMileage: vehicles.filter(v => v.currentMileage).reduce((sum, v) => sum + (v.currentMileage || 0), 0) / vehicles.filter(v => v.currentMileage).length || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Gestion du Parc de Véhicules</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button 
            onClick={() => router.push('/admin/vehicles/new')}
            className="flex items-center gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Nouveau véhicule
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Truck className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Véhicules</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignés</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><User className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">En service</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><CheckCircle className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Prêts</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Wrench className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrencyCompact(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Parc complet</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Km moyen</CardTitle>
            <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center"><Fuel className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{Math.round(stats.avgMileage).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Kilométrage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par plaque, marque, modèle, VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm backdrop-blur-md outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Filter className="h-4 w-4" />
                  {statusFilter ? (
                    statusFilter === 'ASSIGNED' ? 'Assignés' :
                    statusFilter === 'AVAILABLE' ? 'Disponibles' :
                    statusFilter === 'MAINTENANCE' ? 'En maintenance' :
                    statusFilter === 'OUT_OF_SERVICE' ? 'Hors service' : statusFilter
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
                <DropdownMenuItem onClick={() => setStatusFilter('ASSIGNED')}>
                  <User className="h-4 w-4 text-blue-600" />
                  Assignés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('AVAILABLE')}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Disponibles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('MAINTENANCE')}>
                  <Wrench className="h-4 w-4 text-orange-600" />
                  En maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('OUT_OF_SERVICE')}>
                  <X className="h-4 w-4 text-red-600" />
                  Hors service
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des véhicules */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="list">Vue liste</TabsTrigger>
          <TabsTrigger value="cards">Vue cartes</TabsTrigger>
          <TabsTrigger value="map">Vue carte</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="border-b bg-gray-50/70 dark:bg-neutral-900/40">
                    <tr>
                      <th className="w-12 px-2 py-3 text-left">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVehicles(vehicles.map(v => v.id))
                            } else {
                              setSelectedVehicles([])
                            }
                          }}
                        />
                      </th>
                      <th className="w-1/4 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Véhicule</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden lg:table-cell">Franchisé</th>
                      <th className="w-1/8 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Statut</th>
                      <th className="w-1/8 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden md:table-cell">Kilométrage</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden xl:table-cell">Contrôles</th>
                      <th className="w-1/8 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden lg:table-cell">Alertes</th>
                      <th className="w-32 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vehicles.map((vehicle) => {
                      const alerts = getMaintenanceAlert(vehicle)
                      
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-900/40">
                          <td className="px-2 py-3">
                            <Checkbox
                              checked={selectedVehicles.includes(vehicle.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicles([...selectedVehicles, vehicle.id])
                                } else {
                                  setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.id))
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="truncate">
                              <div className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                                {vehicle.brand} {vehicle.model} ({vehicle.year})
                              </div>
                              <div className="text-sm text-gray-500 dark:text-neutral-400 font-mono truncate">{vehicle.licensePlate}</div>
                              <div className="text-sm text-gray-500 dark:text-neutral-400 lg:hidden truncate">
                                {vehicle.franchise ? `${vehicle.franchise.user.firstName} ${vehicle.franchise.user.lastName}` : 'Non assigné'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-neutral-400 md:hidden">
                                {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'Km non renseigné'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell">
                            {vehicle.franchise ? (
                              <div className="truncate">
                                <div className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                                  {vehicle.franchise.user.firstName} {vehicle.franchise.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-neutral-400 truncate">{vehicle.franchise.businessName}</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-neutral-400 italic">Non assigné</div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              {getStatusBadge(vehicle.status)}
                              <div className="lg:hidden">
                                {alerts.length > 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    OK
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="text-sm">
                              {vehicle.currentMileage ? (
                                <div className="font-medium">{vehicle.currentMileage.toLocaleString()} km</div>
                              ) : (
                                <div className="text-gray-500 dark:text-neutral-400">Non renseigné</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden xl:table-cell">
                            <div className="text-sm space-y-1 truncate">
                              {vehicle.nextInspectionDate && (
                                <div className="flex items-center gap-1 truncate">
                                  <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">CT: {formatDate(vehicle.nextInspectionDate)}</span>
                                </div>
                              )}
                              {vehicle.insuranceExpiry && (
                                <div className="flex items-center gap-1 truncate">
                                  <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">Assurance: {formatDate(vehicle.insuranceExpiry)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell">
                            {alerts.length > 0 ? (
                              <div className="space-y-1">
                                {alerts.slice(0, 2).map((alert, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs block">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {alert}
                                  </Badge>
                                ))}
                                {alerts.length > 2 && (
                                  <div className="text-xs text-gray-500">+{alerts.length - 2} autre{alerts.length > 3 ? 's' : ''}</div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                                className="h-8 w-8 p-0 rounded-lg"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)}
                                className="h-8 w-8 p-0 rounded-lg hidden md:inline-flex"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(vehicle.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg hidden lg:inline-flex"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const alerts = getMaintenanceAlert(vehicle)
              
              return (
                <Card key={vehicle.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vehicle.brand} {vehicle.model}</CardTitle>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    <div className="text-sm text-gray-600 font-mono">{vehicle.licensePlate}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{vehicle.year} • {formatCurrency(vehicle.purchasePrice)}</span>
                      </div>
                      
                      {vehicle.currentMileage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Fuel className="h-4 w-4 text-gray-500" />
                          <span>{vehicle.currentMileage.toLocaleString()} km</span>
                        </div>
                      )}
                      
                      {vehicle.franchise ? (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{vehicle.franchise.user.firstName} {vehicle.franchise.user.lastName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>Non assigné</span>
                        </div>
                      )}
                      
                      {alerts.length > 0 && (
                        <div className="space-y-1">
                          {alerts.map((alert, index) => (
                            <Badge key={index} variant="destructive" className="text-xs mr-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alert}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-gray-600">
                          {vehicle._count.maintenances} maintenance{vehicle._count.maintenances > 1 ? 's' : ''}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                          className="rounded-xl"
                        >
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="p-6">
              <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Localisation des véhicules</h3>
                  <p>Carte GPS temps réel en cours de développement</p>
                  <p className="text-sm">Intégration Google Maps/OpenStreetMap à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4">
            {vehicles.filter(v => {
              const alerts = getMaintenanceAlert(v)
              return alerts.length > 0 || v.status === 'MAINTENANCE'
            }).map((vehicle) => {
              const alerts = getMaintenanceAlert(vehicle)
              
              return (
                <Card key={vehicle.id} className="rounded-2xl border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Wrench className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                          <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                          {vehicle.franchise && (
                            <div className="text-xs text-gray-500">
                              {vehicle.franchise.user.firstName} {vehicle.franchise.user.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {getStatusBadge(vehicle.status)}
                        {alerts.map((alert, index) => (
                          <div key={index}>
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alert}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {vehicles.filter(v => {
              const alerts = getMaintenanceAlert(v)
              return alerts.length > 0 || v.status === 'MAINTENANCE'
            }).length === 0 && (
              <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">Aucune maintenance requise</h3>
                  <p className="text-gray-500 dark:text-neutral-400">Tous les véhicules sont en bon état.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions groupées */}
      {selectedVehicles.length > 0 && (
        <Card className="rounded-2xl border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedVehicles.length} véhicule{selectedVehicles.length > 1 ? 's' : ''} sélectionné{selectedVehicles.length > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Planifier maintenance
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Exporter sélection
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setSelectedVehicles([])}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
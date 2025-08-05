'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Truck,
  MoreHorizontal
} from 'lucide-react'

interface Franchise {
  id: string
  businessName: string
  siretNumber: string
  vatNumber: string | null
  address: string
  city: string
  postalCode: string
  region: string
  contactEmail: string
  contactPhone: string
  status: string
  entryFee: number
  entryFeePaid: boolean
  entryFeeDate: string | null
  royaltyRate: number
  contractStartDate: string | null
  contractEndDate: string | null
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    isActive: boolean
    createdAt: string
  }
  vehicles: Array<{
    id: string
    licensePlate: string
    brand: string
    model: string
    status: string
  }>
  _count: {
    orders: number
    salesReports: number
    invoices: number
  }
}

export default function AdminFranchisesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Session data:', session)
    console.log('User role:', session?.user?.role)
    if (session) {
      fetchFranchises()
    } else {
      console.log('No session found')
    }
  }, [searchTerm, statusFilter, session])

  const fetchFranchises = async () => {
    try {
      if (!session?.user?.role) {
        console.error('No user role found in session')
        setAuthError('Aucun rôle utilisateur trouvé dans la session')
        setLoading(false)
        return
      }

      if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        console.error('User role not authorized:', session.user.role)
        setAuthError(`Rôle non autorisé: ${session.user.role}. Seuls les SUPER_ADMIN et ADMIN peuvent accéder à cette page.`)
        setLoading(false)
        return
      }

      setAuthError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      
      console.log('Fetching franchises with params:', params.toString())
      console.log('User role:', session.user.role)
      const response = await fetch(`/api/franchises?${params.toString()}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)
        console.log('Franchises array length:', (data.data?.data || data.data || []).length)
        setFranchises(data.data?.data || data.data || [])
      } else {
        const errorData = await response.json()
        console.error('API Error:', response.status, errorData)
        if (response.status === 401) {
          console.error('Non authentifié - redirection vers login')
        } else if (response.status === 403) {
          console.error('Permissions insuffisantes')
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des franchisés:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (franchiseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce franchisé ?')) return

    try {
      const response = await fetch(`/api/franchises/${franchiseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchFranchises()
      } else {
        const errorData = await response.json()
        alert(`Erreur : ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: 'Actif', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'PENDING': { label: 'En attente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'SUSPENDED': { label: 'Suspendu', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'TERMINATED': { label: 'Terminé', variant: 'destructive' as const, color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const,
      color: 'bg-gray-100 text-gray-800' 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getEntryFeeStatus = (paid: boolean, date: string | null) => {
    if (paid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Payé {date ? `le ${formatDate(date)}` : ''}
        </Badge>
      )
    }
    return <Badge variant="destructive">Non payé</Badge>
  }

  const stats = {
    total: franchises.length,
    active: franchises.filter(f => f.status === 'ACTIVE').length,
    pending: franchises.filter(f => f.status === 'PENDING').length,
    totalEntryFees: franchises.reduce((sum, f) => sum + (f.entryFeePaid ? f.entryFee : 0), 0),
    pendingPayments: franchises.filter(f => !f.entryFeePaid).length
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

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <p className="text-sm text-gray-500">Connectez-vous avec un compte administrateur.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Gestion des Franchisés</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => router.push('/admin/franchises/new')} className="flex items-center gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            Nouveau franchisé
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Users className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Franchisés</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">En exploitation</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À valider</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Droits d'entrée</CardTitle>
            <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.totalEntryFees)}</div>
            <p className="text-xs text-muted-foreground">Encaissés</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayés</CardTitle>
            <div className="size-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">À relancer</p>
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
                placeholder="Rechercher par nom, email, SIRET..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm backdrop-blur-md outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/80" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50"
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIVE">Actifs</option>
                <option value="PENDING">En attente</option>
                <option value="SUSPENDED">Suspendus</option>
                <option value="TERMINATED">Terminés</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des franchisés */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="list">Vue liste</TabsTrigger>
          <TabsTrigger value="cards">Vue cartes</TabsTrigger>
          <TabsTrigger value="map">Vue carte</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50/70 dark:bg-neutral-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFranchises(franchises.map(f => f.id))
                            } else {
                              setSelectedFranchises([])
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Franchisé</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Entreprise</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Localisation</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Statut</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Véhicules</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Activité</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {franchises.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Aucun franchisé trouvé</p>
                            <div className="text-sm space-y-1">
                              <p><strong>Session:</strong> {session ? '✅ Connecté' : '❌ Non connecté'}</p>
                              <p><strong>Rôle:</strong> {session?.user?.role || 'Non défini'}</p>
                              <p><strong>Email:</strong> {session?.user?.email || 'Non défini'}</p>
                              <p><strong>Erreur d'auth:</strong> {authError || 'Aucune'}</p>
                              <p className="mt-2">Vérifiez la console (F12) pour plus de détails</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {franchises.map((franchise) => (
                      <tr key={franchise.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-900/40">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedFranchises.includes(franchise.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFranchises([...selectedFranchises, franchise.id])
                              } else {
                                setSelectedFranchises(selectedFranchises.filter(id => id !== franchise.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-neutral-100">
                              {franchise.user.firstName} {franchise.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {franchise.user.email}
                            </div>
                            {franchise.user.phone && (
                              <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {franchise.user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-neutral-100">{franchise.businessName}</div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400">SIRET: {franchise.siretNumber}</div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {franchise.contactPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span>{franchise.city}, {franchise.postalCode}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-neutral-400">{franchise.region}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {getStatusBadge(franchise.status)}
                            {getEntryFeeStatus(franchise.entryFeePaid, franchise.entryFeeDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{franchise.vehicles.length}</span>
                          </div>
                          {franchise.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="text-xs text-gray-500">
                              {vehicle.licensePlate} ({vehicle.brand})
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{franchise._count.orders} commandes</div>
                            <div>{franchise._count.salesReports} rapports</div>
                            <div>{franchise._count.invoices} factures</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/franchises/${franchise.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/franchises/${franchise.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {session?.user?.role === 'SUPER_ADMIN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(franchise.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {franchises.map((franchise) => (
              <Card key={franchise.id} className="rounded-2xl border-gray-200/80 dark:border-neutral-800 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{franchise.user.firstName} {franchise.user.lastName}</CardTitle>
                    {getStatusBadge(franchise.status)}
                  </div>
                  <div className="text-sm text-gray-600">{franchise.businessName}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{franchise.city}, {franchise.region}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span>{franchise.vehicles.length} véhicule{franchise.vehicles.length > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Membre depuis {formatDate(franchise.user.createdAt)}</span>
                    </div>
                    
                    {getEntryFeeStatus(franchise.entryFeePaid, franchise.entryFeeDate)}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-600">
                        {franchise._count.salesReports} rapports • {franchise._count.orders} commandes
                      </div>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/franchises/${franchise.id}`)} className="rounded-xl">Voir détails</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardContent className="p-6">
              <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Carte des franchisés</h3>
                  <p>Visualisation géographique en cours de développement</p>
                  <p className="text-sm">Intégration Google Maps/OpenStreetMap à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions groupées */}
      {selectedFranchises.length > 0 && (
        <Card className="rounded-2xl border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedFranchises.length} franchisé{selectedFranchises.length > 1 ? 's' : ''} sélectionné{selectedFranchises.length > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Exporter sélection
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Envoyer email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setSelectedFranchises([])}
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
'use client'

import { useSession } from '@/lib/auth-client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import dynamic from 'next/dynamic'

 
const FranchiseMap = dynamic(() => import('@/components/maps/FranchiseMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p>Chargement de la carte...</p>
      </div>
    </div>
  )
})
import { 
  Users, 
  Plus, 
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
  MoreHorizontal,
  ChevronDown,
  Check,
  Clock,
  Pause,
  X,
  SearchIcon
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { safeFetchJson } from '@/lib/utils'

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
  kbisDocument: string | null
  idCardDocument: string | null
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
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }
    console.log('Session data:', session)
    console.log('User role:', (session?.user as ExtendedUser).role)
    if (session) {
      fetchFranchises()
    } else {
      console.log('No session found')
    }
  }, [searchTerm, statusFilter, session, isPending, router])

  const fetchFranchises = async () => {
    try {
      if (!session?.user || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
        console.error('No user role found in session')
        setAuthError('Aucun rôle utilisateur trouvé dans la session')
        setLoading(false)
        return
      }

      setAuthError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      
      console.log('Fetching franchises with params:', params.toString())
      console.log('User role:', (session.user as ExtendedUser).role)
      const response = await fetch(`/api/franchises?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
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
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-gray-700" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, SIRET..."
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
                    statusFilter === 'ACTIVE' ? 'Actifs' :
                    statusFilter === 'PENDING' ? 'En attente' :
                    statusFilter === 'SUSPENDED' ? 'Suspendus' :
                    statusFilter === 'TERMINATED' ? 'Terminés' : statusFilter
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
                <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                  <Check className="h-4 w-4 text-green-600" />
                  Actifs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
                  <Clock className="h-4 w-4 text-yellow-600" />
                  En attente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('SUSPENDED')}>
                  <Pause className="h-4 w-4 text-orange-600" />
                  Suspendus
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('TERMINATED')}>
                  <X className="h-4 w-4 text-red-600" />
                  Terminés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="border-b bg-gray-50/70 dark:bg-neutral-900/40">
                    <tr>
                      <th className="w-12 px-2 py-3 text-left">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFranchises(franchises.map(f => f.id))
                            } else {
                              setSelectedFranchises([])
                            }
                          }}
                        />
                      </th>
                      <th className="w-1/4 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Franchisé</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden lg:table-cell">Entreprise</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden md:table-cell">Localisation</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Statut</th>
                      <th className="w-1/6 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300 hidden xl:table-cell">Activité</th>
                      <th className="w-32 px-3 py-3 text-left font-medium text-gray-700 dark:text-neutral-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {franchises.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Aucun franchisé trouvé</p>
                            <p className="text-sm text-gray-500">Vérifiez les filtres et la recherche</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {franchises.map((franchise) => (
                      <tr key={franchise.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-900/40">
                        <td className="px-2 py-3">
                          <Checkbox
                            checked={selectedFranchises.includes(franchise.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFranchises([...selectedFranchises, franchise.id])
                              } else {
                                setSelectedFranchises(selectedFranchises.filter(id => id !== franchise.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="truncate">
                            <div className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                              {franchise.user.firstName} {franchise.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{franchise.user.email}</span>
                            </div>
                            {franchise.user.phone && (
                              <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1 lg:hidden">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{franchise.user.phone}</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-500 dark:text-neutral-400 lg:hidden truncate">
                              {franchise.businessName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 md:hidden truncate">
                              {franchise.city}, {franchise.postalCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <div className="truncate">
                            <div className="font-medium text-gray-900 dark:text-neutral-100 truncate">{franchise.businessName}</div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 truncate">SIRET: {franchise.siretNumber}</div>
                            <div className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{franchise.contactPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="truncate">
                            <div className="flex items-center gap-1 text-sm truncate">
                              <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{franchise.city}, {franchise.postalCode}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{franchise.region}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            {getStatusBadge(franchise.status)}
                            <div className="xl:hidden">
                              <div className="text-xs text-gray-500">
                                {franchise._count.orders} cmd • {franchise._count.salesReports} rap
                              </div>
                            </div>
                            {getEntryFeeStatus(franchise.entryFeePaid, franchise.entryFeeDate)}
                            {/* Document status indicator */}
                            <div className="flex items-center gap-1 mt-1">
                              {franchise.kbisDocument ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="KBIS fourni" />
                              ) : (
                                <div className="w-2 h-2 bg-red-500 rounded-full" title="KBIS manquant" />
                              )}
                              {franchise.idCardDocument ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Carte d'identité fournie" />
                              ) : (
                                <div className="w-2 h-2 bg-red-500 rounded-full" title="Carte d'identité manquante" />
                              )}
                              <span className="text-xs text-gray-500 ml-1">Doc</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <div className="text-sm">
                            <div>{franchise._count.orders} commandes</div>
                            <div>{franchise._count.salesReports} rapports</div>
                            <div>{franchise._count.invoices} factures</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Truck className="h-3 w-3 text-gray-500" />
                              <span className="text-xs">{franchise.vehicles.length} véhicule{franchise.vehicles.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/franchises/${franchise.id}`)}>
                                <Eye className="h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/franchises/${franchise.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/admin/franchises/${franchise.id}/documents`)}>
                                <Download className="h-4 w-4" />
                                Documents
                              </DropdownMenuItem>
                              {(session?.user as ExtendedUser).role === UserRole.ADMIN && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDelete(franchise.id)} variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Carte des franchisés
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                    Visualisation géographique de vos {franchises.length} franchisé{franchises.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Actif</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>En attente</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Suspendu</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <FranchiseMap 
                franchises={franchises}
                onFranchiseClick={(franchise) => router.push(`/admin/franchises/${franchise.id}`)}
              />
            </CardContent>
          </Card>
          
          {/* Statistiques par région */}
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Répartition par région</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  franchises.reduce((acc, franchise) => {
                    const region = franchise.region
                    if (!acc[region]) {
                      acc[region] = { total: 0, active: 0, pending: 0 }
                    }
                    acc[region].total++
                    if (franchise.status === 'ACTIVE') acc[region].active++
                    if (franchise.status === 'PENDING') acc[region].pending++
                    return acc
                  }, {} as Record<string, { total: number; active: number; pending: number }>)
                ).map(([region, stats]) => (
                  <div key={region} className="p-4 border rounded-xl">
                    <div className="font-medium text-gray-900 dark:text-neutral-100 mb-2">{region}</div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total}</div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Actifs:</span>
                        <span className="font-medium text-green-600">{stats.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente:</span>
                        <span className="font-medium text-yellow-600">{stats.pending}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Actions groupées
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4" />
                      Exporter sélection
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4" />
                      Envoyer email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4" />
                      Programmer relance
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Building2 className="h-4 w-4" />
                      Changer statut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
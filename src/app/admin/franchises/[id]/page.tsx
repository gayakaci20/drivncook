'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Truck,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { useSession } from '@/lib/auth-client'
import { safeFetchJson } from '@/lib/utils'
import { useAlertDialog, useSimpleAlert } from '@/components/ui/alert-dialog'

interface FranchiseDetail {
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
  personalPhone: string | null
  personalEmail: string | null
  drivingLicense: string | null
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
    year: number
    status: string
    currentMileage: number | null
    lastInspectionDate: string | null
    nextInspectionDate: string | null
  }>
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    orderDate: string
    totalAmount: number
    isFromDrivnCook: boolean
  }>
  salesReports: Array<{
    id: string
    reportDate: string
    dailySales: number
    transactionCount: number
    royaltyAmount: number
    paymentStatus: string
  }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    amount: number
    paymentStatus: string
  }>
  _count: {
    orders: number
    salesReports: number
    invoices: number
    vehicles: number
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function FranchiseDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [franchise, setFranchise] = useState<FranchiseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRequestingDocuments, setIsRequestingDocuments] = useState(false)
  const [isValidatingDocuments, setIsValidatingDocuments] = useState(false)
  const { data: session, isPending } = useSession()
  
  const { showAlert: showConfirmDialog, AlertDialogComponent: ConfirmDialog } = useAlertDialog()
  const { showAlert: showSimpleAlert, AlertComponent: SimpleAlert } = useSimpleAlert()

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }

    fetchFranchiseDetail()
  }, [resolvedParams.id, session, isPending, router])

  const fetchFranchiseDetail = async () => {
    try {
      const response = await fetch(`/api/franchises/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setFranchise(data.data)
      } else {
        console.error('Erreur lors du chargement du franchisé')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du franchisé:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Supprimer le franchisé',
      description: 'Êtes-vous sûr de vouloir supprimer ce franchisé ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/franchises/${resolvedParams.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/franchises')
      } else {
        const errorData = await response.json()
        showSimpleAlert({
          title: 'Erreur',
          description: `Erreur : ${errorData.error}`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showSimpleAlert({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        variant: 'destructive'
      })
    }
  }

  const handleRequestMissingDocuments = async () => {
    if (!franchise) return

    const missingDocuments = []
    if (!franchise.kbisDocument) {
      missingDocuments.push('Document KBIS')
    }
    if (!franchise.idCardDocument) {
      missingDocuments.push('Carte d\'identité')
    }

    if (missingDocuments.length === 0) {
      showSimpleAlert({
        title: 'Aucun document manquant',
        description: 'Tous les documents requis sont présents.',
        variant: 'success'
      })
      return
    }

    const confirmed = await showConfirmDialog({
      title: 'Demander les documents manquants',
      description: `Envoyer un email de demande de documents à ${franchise.user.firstName} ${franchise.user.lastName} ?\n\nDocuments manquants :\n${missingDocuments.map(doc => `• ${doc}`).join('\n')}`,
      confirmText: 'Envoyer l\'email',
      cancelText: 'Annuler'
    })
    
    if (!confirmed) return

    setIsRequestingDocuments(true)

    try {
      const response = await fetch(`/api/franchises/${resolvedParams.id}/request-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missingDocuments
        })
      })

      const result = await response.json()

      if (response.ok) {
        showSimpleAlert({
          title: 'Email envoyé avec succès',
          description: `Email envoyé avec succès à ${franchise.user.firstName} ${franchise.user.lastName} (${franchise.user.email})`,
          variant: 'success'
        })
      } else {
        showSimpleAlert({
          title: 'Erreur',
          description: `Erreur lors de l'envoi de l'email : ${result.error}`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la demande de documents:', error)
      showSimpleAlert({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de l\'email',
        variant: 'destructive'
      })
    } finally {
      setIsRequestingDocuments(false)
    }
  }

  const handleValidateDocuments = async () => {
    if (!franchise) return

    if (!franchise.kbisDocument || !franchise.idCardDocument) {
      showSimpleAlert({
        title: 'Validation impossible',
        description: 'Tous les documents requis ne sont pas présents.',
        variant: 'destructive'
      })
      return
    }

    const confirmed = await showConfirmDialog({
      title: 'Valider tous les documents',
      description: `Valider tous les documents de ${franchise.user.firstName} ${franchise.user.lastName} ?\n\nCela confirmera que :\n• Le document KBIS est valide\n• La carte d'identité est valide\n\n${franchise.status === 'PENDING' ? 'La franchise sera automatiquement activée.' : ''}`,
      confirmText: 'Valider',
      cancelText: 'Annuler'
    })
    
    if (!confirmed) return

    setIsValidatingDocuments(true)

    try {
      const response = await fetch(`/api/franchises/${resolvedParams.id}/validate-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (response.ok) {
        await fetchFranchiseDetail()
        
        const statusMessage = result.data.statusUpdated 
          ? `Franchise validée et activée avec succès !\n\n${franchise.user.firstName} ${franchise.user.lastName} a reçu un email de confirmation et peut maintenant accéder à toutes les fonctionnalités.`
          : `Documents validés avec succès !\n\n${franchise.user.firstName} ${franchise.user.lastName} a reçu un email de confirmation.`
        
        showSimpleAlert({
          title: result.data.statusUpdated ? 'Franchise activée !' : 'Documents validés',
          description: statusMessage,
          variant: 'success'
        })
      } else {
        showSimpleAlert({
          title: 'Erreur de validation',
          description: `Erreur lors de la validation : ${result.error}`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la validation des documents:', error)
      showSimpleAlert({
        title: 'Erreur',
        description: 'Erreur lors de la validation des documents',
        variant: 'destructive'
      })
    } finally {
      setIsValidatingDocuments(false)
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

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      'PAID': { label: 'Payée', variant: 'default' as const, icon: CheckCircle },
      'OVERDUE': { label: 'En retard', variant: 'destructive' as const, icon: AlertTriangle }
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

  const getVehicleStatusBadge = (status: string) => {
    const statusConfig = {
      'ASSIGNED': { label: 'Assigné', variant: 'default' as const },
      'AVAILABLE': { label: 'Disponible', variant: 'secondary' as const },
      'MAINTENANCE': { label: 'En maintenance', variant: 'destructive' as const },
      'OUT_OF_SERVICE': { label: 'Hors service', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  if (!franchise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Franchisé introuvable</h3>
          <Button onClick={() => router.push('/admin/franchises')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    )
  }

   
  const totalSales = franchise.salesReports.reduce((sum, report) => sum + report.dailySales, 0)
  const totalRoyalties = franchise.salesReports.reduce((sum, report) => sum + report.royaltyAmount, 0)
  const pendingInvoices = franchise.invoices.filter(invoice => invoice.paymentStatus === 'PENDING')
  const overdueInvoices = franchise.invoices.filter(invoice => invoice.paymentStatus === 'OVERDUE')

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/franchises')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {franchise.user.firstName} {franchise.user.lastName}
            </h2>
            <p className="text-gray-600">{franchise.businessName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/franchises/${franchise.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statut et alertes */}
      <div className="flex items-center gap-4">
        {getStatusBadge(franchise.status)}
        {!franchise.entryFeePaid && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Droit d&apos;entrée non payé
          </Badge>
        )}
        {overdueInvoices.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {overdueInvoices.length} facture{overdueInvoices.length > 1 ? 's' : ''} en retard
          </Badge>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {franchise._count.salesReports} rapport{franchise._count.salesReports > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redevances</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRoyalties)}</div>
            <p className="text-xs text-muted-foreground">
              {franchise.royaltyRate}% du CA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchise._count.orders}</div>
            <p className="text-xs text-muted-foreground">
              Total passées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchise._count.vehicles}</div>
            <p className="text-xs text-muted-foreground">
              Assigné{franchise._count.vehicles > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.user.firstName} {franchise.user.lastName}</div>
                    <div className="text-sm text-gray-500">Nom complet</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.user.email}</div>
                    <div className="text-sm text-gray-500">Email de connexion</div>
                  </div>
                </div>
                
                {franchise.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{franchise.user.phone}</div>
                      <div className="text-sm text-gray-500">Téléphone personnel</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{formatDate(franchise.user.createdAt)}</div>
                    <div className="text-sm text-gray-500">Membre depuis</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${franchise.user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="font-medium">{franchise.user.isActive ? 'Actif' : 'Inactif'}</div>
                    <div className="text-sm text-gray-500">Statut du compte</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium">{franchise.businessName}</div>
                  <div className="text-sm text-gray-500">Raison sociale</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.siretNumber}</div>
                    <div className="text-sm text-gray-500">Numéro SIRET</div>
                  </div>
                </div>
                
                {franchise.vatNumber && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{franchise.vatNumber}</div>
                      <div className="text-sm text-gray-500">Numéro TVA</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.address}</div>
                    <div className="text-sm text-gray-500">{franchise.postalCode} {franchise.city}, {franchise.region}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.contactEmail}</div>
                    <div className="text-sm text-gray-500">Email entreprise</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.contactPhone}</div>
                    <div className="text-sm text-gray-500">Téléphone entreprise</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations contractuelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Informations contractuelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{formatCurrency(franchise.entryFee)}</div>
                    <div className="text-sm text-gray-500">Droit d&apos;entrée</div>
                  </div>
                  <Badge variant={franchise.entryFeePaid ? "default" : "destructive"}>
                    {franchise.entryFeePaid ? "Payé" : "Non payé"}
                  </Badge>
                </div>
                
                {franchise.entryFeeDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{formatDate(franchise.entryFeeDate)}</div>
                      <div className="text-sm text-gray-500">Date de paiement</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{franchise.royaltyRate}%</div>
                    <div className="text-sm text-gray-500">Taux de redevance</div>
                  </div>
                </div>
                
                {franchise.contractStartDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{formatDate(franchise.contractStartDate)}</div>
                      <div className="text-sm text-gray-500">Début de contrat</div>
                    </div>
                  </div>
                )}
                
                {franchise.contractEndDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{formatDate(franchise.contractEndDate)}</div>
                      <div className="text-sm text-gray-500">Fin de contrat</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Document KBIS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document KBIS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franchise.kbisDocument ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Document téléchargé</div>
                        <div className="text-sm text-gray-500">KBIS disponible</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(franchise.kbisDocument!, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Voir le document
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = franchise.kbisDocument!
                          link.download = `KBIS_${franchise.businessName}.pdf`
                          link.click()
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      URL: {franchise.kbisDocument}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="font-medium text-red-800 mb-1">Document manquant</div>
                    <div className="text-sm text-gray-500">Le document KBIS n'a pas été téléchargé</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carte d'identité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Carte d'identité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franchise.idCardDocument ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Document téléchargé</div>
                        <div className="text-sm text-gray-500">Carte d'identité disponible</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(franchise.idCardDocument!, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Voir le document
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = franchise.idCardDocument!
                          link.download = `ID_${franchise.user.firstName}_${franchise.user.lastName}.pdf`
                          link.click()
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      URL: {franchise.idCardDocument}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="font-medium text-red-800 mb-1">Document manquant</div>
                    <div className="text-sm text-gray-500">La carte d'identité n'a pas été téléchargée</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations supplémentaires */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {franchise.personalEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{franchise.personalEmail}</div>
                        <div className="text-sm text-gray-500">Email personnel</div>
                      </div>
                    </div>
                  )}
                  
                  {franchise.personalPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{franchise.personalPhone}</div>
                        <div className="text-sm text-gray-500">Téléphone personnel</div>
                      </div>
                    </div>
                  )}
                  
                  {franchise.drivingLicense && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{franchise.drivingLicense}</div>
                        <div className="text-sm text-gray-500">Permis de conduire</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Statut de validation des documents */}
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Statut de validation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Document KBIS</span>
                      {franchise.kbisDocument ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Fourni
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Manquant
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Carte d'identité</span>
                      {franchise.idCardDocument ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Fourni
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Manquant
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions de validation */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      {franchise.kbisDocument && franchise.idCardDocument ? (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleValidateDocuments}
                          disabled={isValidatingDocuments}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isValidatingDocuments ? 'Validation en cours...' : 'Valider tous les documents'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Documents incomplets
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRequestMissingDocuments}
                        disabled={isRequestingDocuments}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {isRequestingDocuments ? 'Envoi en cours...' : 'Demander documents manquants'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          {franchise.vehicles && franchise.vehicles.length > 0 ? (
            <div className="grid gap-4">
              {franchise.vehicles.map((vehicle) => (
                <Card key={vehicle.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                          <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                          {vehicle.currentMileage && (
                            <div className="text-xs text-gray-500">
                              {vehicle.currentMileage.toLocaleString()} km
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {getVehicleStatusBadge(vehicle.status)}
                        {vehicle.nextInspectionDate && (
                          <div className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            CT: {formatDate(vehicle.nextInspectionDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun véhicule</h3>
                <p className="text-gray-500">Ce franchisé n&apos;a pas encore de véhicule assigné.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {franchise.orders && franchise.orders.length > 0 ? (
            <div className="space-y-4">
              {franchise.orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.orderDate)}</div>
                        <Badge variant={order.isFromDrivnCook ? "default" : "secondary"} className="mt-1">
                          {order.isFromDrivnCook ? "Driv'n Cook (80%)" : "Libre (20%)"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(order.totalAmount)}</div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
                <p className="text-gray-500">Ce franchisé n&apos;a pas encore passé de commande.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {franchise.salesReports && franchise.salesReports.length > 0 ? (
            <div className="space-y-4">
              {franchise.salesReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Ventes du {formatDate(report.reportDate)}</div>
                        <div className="text-sm text-gray-500">
                          {report.transactionCount} transaction{report.transactionCount > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(report.dailySales)}</div>
                        <div className="text-sm text-gray-500">
                          Redevance: {formatCurrency(report.royaltyAmount)}
                        </div>
                        {getPaymentStatusBadge(report.paymentStatus)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport de vente</h3>
                <p className="text-gray-500">Ce franchisé n&apos;a pas encore saisi de rapport de vente.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {franchise.invoices && franchise.invoices.length > 0 ? (
            <div className="space-y-4">
              {franchise.invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-500">
                          Émise: {formatDate(invoice.issueDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Échéance: {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
                        {getPaymentStatusBadge(invoice.paymentStatus)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture</h3>
                <p className="text-gray-500">Aucune facture générée pour ce franchisé.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyses et statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Performance CA</h4>
                  <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                  <p className="text-sm text-gray-500">Total généré</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Redevances</h4>
                  <div className="text-2xl font-bold">{formatCurrency(totalRoyalties)}</div>
                  <p className="text-sm text-gray-500">Total dû</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Ticket moyen</h4>
                  <div className="text-2xl font-bold">
                    {franchise.salesReports.length > 0 ? 
                      formatCurrency(totalSales / franchise.salesReports.reduce((sum, r) => sum + r.transactionCount, 0)) : 
                      formatCurrency(0)
                    }
                  </div>
                  <p className="text-sm text-gray-500">Par transaction</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-4">Graphique des ventes (à venir)</h4>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <div>Graphique d&apos;évolution des ventes</div>
                    <div className="text-sm">(Intégration Recharts à venir)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* AlertDialogs */}
      <ConfirmDialog />
      <SimpleAlert />
    </div>
  )
}
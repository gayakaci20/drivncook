'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { addToast } from '@heroui/toast'
import { UserRole } from '@/types/prisma-enums'

interface FranchiseProfile {
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
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  _count: {
    vehicles: number
    orders: number
    salesReports: number
    invoices: number
  }
}

export default function FranchiseProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<FranchiseProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if ((session?.user as ExtendedUser).franchiseId && (session?.user as ExtendedUser).role === UserRole.FRANCHISEE) {
      fetchProfile()
    } else if (session?.user && !(session.user as ExtendedUser).franchiseId && (session?.user as ExtendedUser).role === UserRole.FRANCHISEE) {
       
      setLoading(false)
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/franchises/${(session?.user as ExtendedUser).role === UserRole.FRANCHISEE ? (session?.user as ExtendedUser).franchiseId : (session?.user as ExtendedUser).id}`)
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
      } else {
        console.error('Erreur API:', data.error)
        addToast({
          title: 'Erreur',
          description: data.error,
          color: 'danger'
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      addToast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement du profil',
        color: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'En attente', variant: 'secondary' as const, icon: AlertTriangle },
      'ACTIVE': { label: 'Actif', variant: 'default' as const, icon: CheckCircle },
      'SUSPENDED': { label: 'Suspendu', variant: 'destructive' as const, icon: AlertTriangle },
      'TERMINATED': { label: 'Terminé', variant: 'destructive' as const, icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: AlertTriangle 
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
          Profil introuvable
        </h3>
        <p className="text-gray-600 dark:text-neutral-400 mb-4">
          {(session?.user as ExtendedUser).franchiseId && (session?.user as ExtendedUser).role === UserRole.FRANCHISEE
            ? "Impossible de charger les informations de votre franchise" 
            : "Aucune franchise associée à votre compte"}
        </p>
        {!(session?.user as ExtendedUser).franchiseId && (session?.user as ExtendedUser).role === UserRole.FRANCHISEE && (
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            Veuillez contacter l'administrateur pour associer une franchise à votre compte.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            Mon profil
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Informations personnelles et de votre franchise
          </p>
        </div>
        <Button onClick={() => setEditMode(!editMode)}>
          <Edit className="h-4 w-4 mr-2" />
          {editMode ? 'Annuler' : 'Modifier'}
        </Button>
      </div>

      {/* Statut de la franchise */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {profile.businessName}
            </CardTitle>
            {getStatusBadge(profile.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">Véhicules</p>
              <p className="text-2xl font-bold text-blue-600">{profile._count.vehicles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">Commandes</p>
              <p className="text-2xl font-bold text-green-600">{profile._count.orders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">Rapports de vente</p>
              <p className="text-2xl font-bold text-purple-600">{profile._count.salesReports}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">Factures</p>
              <p className="text-2xl font-bold text-orange-600">{profile._count.invoices}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Nom complet</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 font-medium">
                  {profile.user.firstName} {profile.user.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Email</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {profile.user.email}
                </p>
              </div>
              {profile.user.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Téléphone</label>
                  <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {profile.user.phone}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Raison sociale</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 font-medium">
                  {profile.businessName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">SIRET</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100">
                  {profile.siretNumber}
                </p>
              </div>
              {profile.vatNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">TVA Intracommunautaire</label>
                  <p className="mt-1 text-gray-900 dark:text-neutral-100">
                    {profile.vatNumber}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Adresse</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>
                    {profile.address}<br />
                    {profile.postalCode} {profile.city}<br />
                    {profile.region}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact professionnel */}
        <Card>
          <CardHeader>
            <CardTitle>Contact professionnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Email professionnel</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {profile.contactEmail}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Téléphone professionnel</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {profile.contactPhone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations contractuelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations contractuelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Droit d'entrée</label>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-gray-900 dark:text-neutral-100 font-semibold">
                    {formatAmount(profile.entryFee)}
                  </p>
                  <Badge variant={profile.entryFeePaid ? "default" : "destructive"}>
                    {profile.entryFeePaid ? "Payé" : "Non payé"}
                  </Badge>
                </div>
                {profile.entryFeeDate && (
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Payé le {formatDate(profile.entryFeeDate)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Taux de redevance</label>
                <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  {profile.royaltyRate}% du chiffre d'affaires
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Début du contrat</label>
                  <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {formatDate(profile.contractStartDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Fin du contrat</label>
                  <p className="mt-1 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {formatDate(profile.contractEndDate)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div>
                  <p className="font-medium">Télécharger contrat</p>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">PDF signé</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div>
                  <p className="font-medium">Contacter support</p>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">Aide & assistance</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div>
                  <p className="font-medium">Historique paiements</p>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">Redevances & factures</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
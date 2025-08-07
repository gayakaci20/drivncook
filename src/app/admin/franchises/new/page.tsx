'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  ArrowLeft,
  Save,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { z } from 'zod'
import { ExtendedUser } from '@/types/auth'
import { useSession } from '@/lib/auth-client'
import { UserRole } from '@/types/prisma-enums'


const createFranchiseSchema = z.object({
   
  userData: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    phone: z.string().optional()
  }),
   
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siretNumber: z.string().regex(/^\d{14}$/, 'Le numéro SIRET doit contenir 14 chiffres'),
  vatNumber: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  region: z.string().min(2, 'La région est requise'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(1, 'Le numéro de téléphone est requis'),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED']).default('PENDING'),
  entryFee: z.coerce.number().min(0, 'Le droit d\'entrée doit être positif').default(50000),
  entryFeePaid: z.boolean().default(false),
  entryFeeDate: z.string().optional(),
  royaltyRate: z.coerce.number().min(0).max(100).default(4),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional()
})

type CreateFranchiseFormData = z.infer<typeof createFranchiseSchema>

export default function NewFranchisePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { data: session, isPending } = useSession()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<CreateFranchiseFormData>({
    resolver: zodResolver(createFranchiseSchema as any),
    defaultValues: {
      status: 'PENDING',
      entryFee: 50000,
      entryFeePaid: false,  
      royaltyRate: 4
    }
  })

   
  console.log('Erreurs du formulaire:', errors)
  console.log('Formulaire valide:', isValid)
  console.log('Valeur contactPhone:', watch('contactPhone'))
  console.log('Longueur contactPhone:', watch('contactPhone')?.length)

  const watchEntryFeePaid = watch('entryFeePaid')

  const onSubmit = async (data: CreateFranchiseFormData) => {
    console.log('Fonction onSubmit appelée avec:', data)
    
    if (isPending) {
      console.log('Session en cours de chargement, abandon')
      return
    }

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      console.log('Permissions insuffisantes ou pas de session')
      router.push('/unauthorized')
      return
    }
    
    console.log('Début de la soumission...')
    setSubmitting(true)
    
    try {
      console.log('Envoi de la requête vers /api/franchises')
      const response = await fetch('/api/franchises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      console.log('Réponse reçue:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Franchisé créé avec succès:', result)
        router.push(`/admin/franchises/${result.data.id}`)
      } else {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        alert(`Erreur : ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert('Erreur lors de la création du franchisé')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { id: 1, title: 'Informations personnelles', icon: User },
    { id: 2, title: 'Entreprise', icon: Building2 },
    { id: 3, title: 'Contrat et finances', icon: DollarSign },
    { id: 4, title: 'Confirmation', icon: FileText }
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Nouveau Franchisé</h2>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-px mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Étape 1: Informations personnelles */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles du franchisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    {...register('userData.firstName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jean"
                  />
                  {errors.userData?.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.userData.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    {...register('userData.lastName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dupont"
                  />
                  {errors.userData?.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.userData.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de connexion *
                </label>
                <input
                  {...register('userData.email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jean.dupont@example.com"
                />
                {errors.userData?.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.userData.email.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Cet email sera utilisé pour se connecter au système</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe temporaire *
                </label>
                <input
                  {...register('userData.password')}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.userData?.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.userData.password.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Le franchisé pourra modifier ce mot de passe lors de sa première connexion</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone personnel
                </label>
                <input
                  {...register('userData.phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
                {errors.userData?.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.userData.phone.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Entreprise */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l&apos;entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison sociale *
                </label>
                <input
                  {...register('businessName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Food Truck Dupont SARL"
                />
                {errors.businessName && (
                  <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro SIRET *
                  </label>
                  <input
                    {...register('siretNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12345678901234"
                    maxLength={14}
                  />
                  {errors.siretNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.siretNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro TVA (optionnel)
                  </label>
                  <input
                    {...register('vatNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="FR1234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète *
                </label>
                <input
                  {...register('address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Avenue de la République"
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <input
                    {...register('city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paris"
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal *
                  </label>
                  <input
                    {...register('postalCode')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="75001"
                    maxLength={5}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région *
                  </label>
                  <select
                    {...register('region')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choisir une région</option>
                    <option value="Île-de-France">Île-de-France</option>
                    <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                    <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                    <option value="Occitanie">Occitanie</option>
                    <option value="Hauts-de-France">Hauts-de-France</option>
                    <option value="Grand Est">Grand Est</option>
                    <option value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d&apos;Azur</option>
                    <option value="Pays de la Loire">Pays de la Loire</option>
                    <option value="Bretagne">Bretagne</option>
                    <option value="Normandie">Normandie</option>
                    <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                    <option value="Centre-Val de Loire">Centre-Val de Loire</option>
                    <option value="Corse">Corse</option>
                    <option value="Guadeloupe">Guadeloupe</option>
                    <option value="Martinique">Martinique</option>
                    <option value="Guyane">Guyane</option>
                    <option value="La Réunion">La Réunion</option>
                    <option value="Mayotte">Mayotte</option>
                  </select>
                  {errors.region && (
                    <p className="text-sm text-red-600 mt-1">{errors.region.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email entreprise *
                  </label>
                  <input
                    {...register('contactEmail')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@foodtruck-dupont.fr"
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone entreprise *
                  </label>
                  <input
                    {...register('contactPhone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.contactPhone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Contrat et finances */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Contrat et finances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut initial
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">En attente</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="SUSPENDED">Suspendu</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Le statut peut être modifié ultérieurement</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Droit d&apos;entrée (€)
                  </label>
                  <input
                    {...register('entryFee')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.entryFee && (
                    <p className="text-sm text-red-600 mt-1">{errors.entryFee.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux de redevance (%)
                  </label>
                  <input
                    {...register('royaltyRate')}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.royaltyRate && (
                    <p className="text-sm text-red-600 mt-1">{errors.royaltyRate.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('entryFeePaid')}
                  type="checkbox"
                  id="entryFeePaid"
                  className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="entryFeePaid" className="text-sm font-medium text-gray-700">
                  Droit d'entrée déjà payé
                </label>
              </div>

              {watchEntryFeePaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement du droit d&apos;entrée
                  </label>
                  <input
                    {...register('entryFeeDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début de contrat
                  </label>
                  <input
                    {...register('contractStartDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin de contrat
                  </label>
                  <input
                    {...register('contractEndDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 4: Confirmation */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Confirmation des informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Informations personnelles</h3>
                <p><strong>Nom :</strong> {watch('userData.lastName')} {watch('userData.firstName')}</p>
                <p><strong>Email :</strong> {watch('userData.email')}</p>
                {watch('userData.phone') && <p><strong>Téléphone :</strong> {watch('userData.phone')}</p>}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Entreprise</h3>
                <p><strong>Raison sociale :</strong> {watch('businessName')}</p>
                <p><strong>SIRET :</strong> {watch('siretNumber')}</p>
                <p><strong>Adresse :</strong> {watch('address')}, {watch('postalCode')} {watch('city')}</p>
                <p><strong>Région :</strong> {watch('region')}</p>
                <p><strong>Email :</strong> {watch('contactEmail')}</p>
                <p><strong>Téléphone :</strong> {watch('contactPhone')}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Contrat</h3>
                <p><strong>Statut :</strong> {watch('status')}</p>
                <p><strong>Droit d'entrée :</strong> {watch('entryFee')}€</p>
                <p><strong>Taux de redevance :</strong> {watch('royaltyRate')}%</p>
                <p><strong>Droit d'entrée payé :</strong> {watch('entryFeePaid') ? 'Oui' : 'Non'}</p>
                {watch('entryFeePaid') && watch('entryFeeDate') && (
                  <p><strong>Date de paiement :</strong> {watch('entryFeeDate')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Étape précédente
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Étape suivante
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2"
                onClick={() => console.log('Bouton Créer cliqué!')}
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Création...' : 'Créer le franchisé'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
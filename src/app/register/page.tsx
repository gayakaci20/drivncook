'use client'

import Footer from '../../components/footer'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import FileUpload from '@/components/ui/file-upload'
import type { FileWithId } from '@/hooks/use-file-upload'
import { useDarkMode } from '@/hooks/use-dark-mode'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function Register() {
  const { isDarkMode } = useDarkMode()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    personalPhone: '',
    personalEmail: '',
    drivingLicense: '',
    
    businessName: '',
    siretNumber: '',
    vatNumber: '',
    address: '',
    city: '',
    postalCode: '',
    region: '',
    contactEmail: '',
    contactPhone: '',
    
    password: '',
    confirmPassword: '',
    
    kbisDocument: [] as FileWithId[],
    idCardDocument: [] as FileWithId[],
    
    acceptTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (name: string, files: FileWithId[]) => {
    setFormData(prev => ({ ...prev, [name]: files }))
  }

  const nextStep = () => {
    const errors = validateStep(currentStep)
    if (errors.length > 0) {
      setSubmitError(errors.join(', '))
      return
    }
    setSubmitError('')
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }
  
  const prevStep = () => {
    setSubmitError('')
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const validateStep = (step: number): string[] => {
    const errors: string[] = []
    
    if (step === 1) {
      if (!formData.firstName.trim()) errors.push('Le prénom est requis')
      if (!formData.lastName.trim()) errors.push('Le nom est requis')
      if (!formData.email.trim()) errors.push('L\'email est requis')
      if (!formData.password.trim()) errors.push('Le mot de passe est requis')
      if (formData.password.length < 6) errors.push('Le mot de passe doit contenir au moins 6 caractères')
      if (!formData.confirmPassword.trim()) errors.push('La confirmation du mot de passe est requise')
      if (formData.password !== formData.confirmPassword) errors.push('Les mots de passe ne correspondent pas')
    }
    
    if (step === 2) {
      if (!formData.businessName.trim()) errors.push('Le nom de l\'entreprise est requis')
      if (!formData.siretNumber.trim()) errors.push('Le numéro SIRET est requis')
      if (formData.siretNumber.length !== 14) errors.push('Le numéro SIRET doit contenir 14 chiffres')
      if (!formData.address.trim()) errors.push('L\'adresse est requise')
      if (!formData.city.trim()) errors.push('La ville est requise')
      if (!formData.postalCode.trim()) errors.push('Le code postal est requis')
      if (!formData.region.trim()) errors.push('La région est requise')
      if (!formData.contactEmail.trim()) errors.push('L\'email de contact est requis')
      if (!formData.contactPhone.trim()) errors.push('Le téléphone de contact est requis')
    }
    
    if (step === 3) {
      if (!formData.acceptTerms) errors.push('Vous devez accepter les conditions générales')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    
    const allErrors = [
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3)
    ]
    
    if (allErrors.length > 0) {
      setSubmitError(allErrors.join(', '))
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSubmitSuccess(result.message || 'Inscription réussie !')
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        setSubmitError(result.message || 'Une erreur est survenue lors de l\'inscription')
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      setSubmitError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const regions = [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire',
    'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine',
    'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
  ]

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
              <Link href="/" className="flex items-center justify-center gap-3 mb-10">
                <Image
                  src={isDarkMode ? "/logo-white.svg" : "/logo-black.svg"}
                  alt="Driv'n Cook"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>DRIV&apos;N COOK</h1>
              </Link>
              
              <div className={`${poppins.className} mt-4 rounded-2xl border border-white/60 bg-white/70 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur-md dark:bg-neutral-900/60 dark:border-white/10`}>
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      Inscription
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Créez votre compte et renseignez les informations nécessaires pour valider votre partenariat.
                    </p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-neutral-400">
                      Déjà un compte ?
                      <Link href="/login" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500 ml-1">
                        Se connecter
                      </Link>
                    </p>
                    
                    {/* Messages d'erreur et de succès */}
                    {submitError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{submitError}</p>
                      </div>
                    )}
                    
                    {submitSuccess && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{submitSuccess}</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Steps (timeline) */}
                  <div className="mb-10">
                    <ol className="flex">
                      {[1, 2, 3].map((step) => {
                        const active = currentStep === step
                        const done = currentStep > step
                        return (
                          <li key={step} className="relative flex-1">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center w-full">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all mx-auto
                                    ${done ? 'bg-red-600 border-red-600 text-white shadow-sm' : active ? 'bg-white border-red-500 text-red-600 dark:bg-neutral-900' : 'bg-white border-gray-300 text-gray-500 dark:bg-neutral-900 dark:border-neutral-700'}`}
                                >
                                  {step}
                                </div>
                                {step !== 3 && (
                                  <div
                                    className={`absolute left-1/2 ml-5 h-1 w-full rounded-full transition-colors ${done ? 'bg-red-600' : active ? 'bg-red-300' : 'bg-gray-200 dark:bg-neutral-800'}`}
                                  />
                                )}
                              </div>
                              <div className="mt-3 text-center text-xs text-gray-500 dark:text-neutral-400">
                                {step === 1 && (active ? <span className="text-red-600 font-medium">Personnel</span> : 'Personnel')}
                                {step === 2 && (active ? <span className="text-red-600 font-medium">Entreprise</span> : 'Entreprise')}
                                {step === 3 && (active ? <span className="text-red-600 font-medium">Documents</span> : 'Documents')}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Step 1: Informations personnelles */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations personnelles</h3>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Ces informations serviront à créer votre compte utilisateur.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Prénom *</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Nom *</label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email professionnel *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="personalPhone" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Téléphone personnel</label>
                            <input
                              type="tel"
                              id="personalPhone"
                              name="personalPhone"
                              value={formData.personalPhone}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="personalEmail" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email personnel</label>
                            <input
                              type="email"
                              id="personalEmail"
                              name="personalEmail"
                              value={formData.personalEmail}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="drivingLicense" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Numéro de permis de conduire</label>
                          <input
                            type="text"
                            id="drivingLicense"
                            name="drivingLicense"
                            value={formData.drivingLicense}
                            onChange={handleInputChange}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Mot de passe *</label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                            </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Confirmer le mot de passe *</label>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Informations entreprise */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations entreprise</h3>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Renseignez les informations légales et de contact de votre société.</p>
                        </div>
                        
                        <div>
                          <label htmlFor="businessName" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Nom de l'entreprise *</label>
                          <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="siretNumber" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Numéro SIRET *</label>
                            <input
                              type="text"
                              id="siretNumber"
                              name="siretNumber"
                              value={formData.siretNumber}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="vatNumber" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Numéro TVA</label>
                            <input
                              type="text"
                              id="vatNumber"
                              name="vatNumber"
                              value={formData.vatNumber}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Adresse *</label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Ville *</label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="postalCode" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Code postal *</label>
                            <input
                              type="text"
                              id="postalCode"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="region" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Région *</label>
                            <select
                              id="region"
                              name="region"
                              value={formData.region}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            >
                              <option value="">Sélectionner une région</option>
                              {regions.map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="contactEmail" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email de contact *</label>
                            <input
                              type="email"
                              id="contactEmail"
                              name="contactEmail"
                              value={formData.contactEmail}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                            </div>
                          
                          <div>
                            <label htmlFor="contactPhone" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Téléphone de contact *</label>
                            <input
                              type="tel"
                              id="contactPhone"
                              name="contactPhone"
                              value={formData.contactPhone}
                              onChange={handleInputChange}
                              className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Documents */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents justificatifs</h3>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Téléversez les documents nécessaires à la validation de votre dossier.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="rounded-xl border bg-white/60 p-4 dark:bg-neutral-900/50 dark:border-neutral-800">
                            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Document KBIS</label>
                            <FileUpload
                              maxSize={5 * 1024 * 1024} // 5MB
                              maxFiles={1}
                              accept=".pdf,.jpg,.jpeg,.png"
                              label="Télécharger le document KBIS"
                              description="Format accepté: PDF, JPG, PNG (max 5MB)"
                              onFilesChange={(files) => handleFileChange('kbisDocument', files)}
                              initialFiles={formData.kbisDocument.map(f => ({
                                name: f.file instanceof File ? f.file.name : f.file.name,
                                size: f.file instanceof File ? f.file.size : f.file.size,
                                type: f.file instanceof File ? f.file.type : f.file.type,
                                id: f.id
                              }))}
                            />
                          </div>
                          <div className="rounded-xl border bg-white/60 p-4 dark:bg-neutral-900/50 dark:border-neutral-800">
                            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Carte d'identité</label>
                            <FileUpload
                              maxSize={5 * 1024 * 1024} // 5MB
                              maxFiles={1}
                              accept=".pdf,.jpg,.jpeg,.png"
                              label="Télécharger la carte d'identité"
                              description="Format accepté: PDF, JPG, PNG (max 5MB)"
                              onFilesChange={(files) => handleFileChange('idCardDocument', files)}
                              initialFiles={formData.idCardDocument.map(f => ({
                                name: f.file instanceof File ? f.file.name : f.file.name,
                                size: f.file instanceof File ? f.file.size : f.file.size,
                                type: f.file instanceof File ? f.file.type : f.file.type,
                                id: f.id
                              }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center mt-2">
                          <input
                            id="acceptTerms"
                            name="acceptTerms"
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={handleInputChange}
                            className="shrink-0 mt-0.5 border-gray-200 rounded-sm text-red-600 focus:ring-red-500 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-red-500 dark:checked:border-red-500"
                            required
                          />
                          <label htmlFor="acceptTerms" className="text-sm ml-3 dark:text-white">
                            J'accepte les{' '}
                            <a href="#" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500">
                              conditions générales
                            </a>{' '}
                            et la{' '}
                            <a href="#" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500">
                              politique de confidentialité
                            </a>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons - sticky action bar */}
                    <div className="sticky bottom-0 mt-10 flex justify-between gap-3 px-2 py-4">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="py-3 px-4 inline-flex items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
                        >
                          Précédent
                        </button>
                      )}
                      
                      <div className="ml-auto">
                        {currentStep < 3 ? (
                          <button
                            type="button"
                            onClick={nextStep}
                            className="py-3 px-6 inline-flex items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30"
                          >
                            Suivant
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="py-3 px-6 inline-flex items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
                            disabled={!formData.acceptTerms || isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Création en cours...
                              </>
                            ) : (
                              'Créer mon compte'
                            )}
                          </button>
                        )}
                      </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <Footer />
    </>
  )
}
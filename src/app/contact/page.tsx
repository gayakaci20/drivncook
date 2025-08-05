'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { PhoneIcon, MapPinIcon, MailIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon, Loader2Icon } from 'lucide-react'
import Footer from '../../components/footer'

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true' || 
                    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)
  }, [])
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    
    // Simulation d'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Contact form data:', data)
    setIsSubmitted(true)
    setIsSubmitting(false)
    reset()
    
    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-2xl mx-auto text-center mb-12">
              <Link href="/" className="inline-flex items-center gap-3 mb-8">
                <Image
                  src={isDarkMode ? "/logo-white.svg" : "/logo-black.svg"}
                  alt="Driv'n Cook"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>DRIV&apos;N COOK</h1>
              </Link>
              
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Contactez-nous
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                Une question ? Un projet de franchise ? Notre équipe est là pour vous accompagner.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Informations de contact */}
                <div className={`backdrop-blur rounded-2xl p-6 md:p-8 ${
                  isDarkMode 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-white/80 border border-gray-200 shadow-lg'
                }`}>
                  <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nos coordonnées</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <MapPinIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Adresse</h4>
                        <p className={`mt-1 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                          123 Avenue de la Franchise<br />
                          75001 Paris, France
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Téléphone</h4>
                        <p className={`mt-1 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>+33 1 23 45 67 89</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <MailIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email</h4>
                        <p className={`mt-1 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>contact@drivncook.fr</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Horaires</h4>
                        <p className={`mt-1 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                          Lun - Ven : 9h00 - 18h00<br />
                          Sam : 9h00 - 12h00
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulaire de contact */}
                <div className={`rounded-2xl backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] ${
                  isDarkMode 
                    ? 'bg-neutral-900/60 border border-white/10' 
                    : 'bg-white/90 border border-gray-200'
                }`}>
                  <div className="p-6 md:p-8">
                    <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Envoyez-nous un message
                    </h3>

                    {isSubmitted && (
                      <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                          <p className="text-sm text-green-800">
                            Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div>
                        <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          Nom complet *
                        </label>
                        <input
                          {...register('name')}
                          type="text"
                          id="name"
                          className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                          placeholder="Votre nom complet"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-600 mt-2">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          Email *
                        </label>
                        <input
                          {...register('email')}
                          type="email"
                          id="email"
                          className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600 mt-2">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="subject" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          Sujet *
                        </label>
                        <input
                          {...register('subject')}
                          type="text"
                          id="subject"
                          className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                          placeholder="Objet de votre message"
                        />
                        {errors.subject && (
                          <p className="text-xs text-red-600 mt-2">{errors.subject.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="message" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                          Message *
                        </label>
                        <textarea
                          {...register('message')}
                          id="message"
                          rows={6}
                          className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                          placeholder="Décrivez votre demande ou votre projet de franchise..."
                        />
                        {errors.message && (
                          <p className="text-xs text-red-600 mt-2">{errors.message.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-6 inline-flex justify-center items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2Icon className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            Envoyer le message
                            <ArrowRightIcon className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}`}>
                      <p className={`text-xs text-center ${isDarkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
                        Vous pouvez aussi nous contacter directement par{' '}
                        <a href="tel:+33123456789" className="text-red-600 hover:underline">
                          téléphone
                        </a>{' '}
                        ou par{' '}
                        <a href="mailto:contact@drivncook.fr" className="text-red-600 hover:underline">
                          email
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section FAQ rapide */}
              <div className={`mt-16 backdrop-blur rounded-2xl p-6 md:p-8 ${
                isDarkMode 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-white/80 border border-gray-200 shadow-lg'
              }`}>
                <h3 className={`text-xl font-semibold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Questions fréquentes
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Comment devenir franchisé ?
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      Contactez-nous via ce formulaire ou par téléphone. Nous vous guiderons dans toutes les étapes.
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quel est l'investissement initial ?
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      L'investissement varie selon la zone géographique. Nous vous fournirons un devis personnalisé.
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Y a-t-il une formation incluse ?
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      Oui, nous proposons une formation complète sur la gestion de votre franchise et l'utilisation de nos outils.
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quel support technique proposez-vous ?
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      Support technique 24/7 et équipe dédiée pour vous accompagner au quotidien.
                    </p>
                  </div>
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

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { PhoneIcon, MapPinIcon, MailIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon } from 'lucide-react'
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
                  src="/logo-white.svg"
                  alt="Driv'n Cook"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-white">DRIV&apos;N COOK</h1>
              </Link>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Contactez-nous
              </h2>
              <p className="text-lg text-white/80">
                Une question ? Un projet de franchise ? Notre équipe est là pour vous accompagner.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Informations de contact */}
                <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6 md:p-8">
                  <h3 className="text-xl font-semibold text-white mb-6">Nos coordonnées</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <MapPinIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Adresse</h4>
                        <p className="text-white/70 mt-1">
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
                        <h4 className="font-medium text-white">Téléphone</h4>
                        <p className="text-white/70 mt-1">+33 1 23 45 67 89</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <MailIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Email</h4>
                        <p className="text-white/70 mt-1">contact@drivncook.fr</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Horaires</h4>
                        <p className="text-white/70 mt-1">
                          Lun - Ven : 9h00 - 18h00<br />
                          Sam : 9h00 - 12h00
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulaire de contact */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl dark:bg-neutral-900 dark:border-neutral-700">
                  <div className="p-6 md:p-8">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
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
                        <label htmlFor="name" className="block text-sm font-medium mb-2 dark:text-white">
                          Nom complet *
                        </label>
                        <input
                          {...register('name')}
                          type="text"
                          id="name"
                          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          placeholder="Votre nom complet"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-600 mt-2">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2 dark:text-white">
                          Email *
                        </label>
                        <input
                          {...register('email')}
                          type="email"
                          id="email"
                          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600 mt-2">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-2 dark:text-white">
                          Sujet *
                        </label>
                        <input
                          {...register('subject')}
                          type="text"
                          id="subject"
                          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          placeholder="Objet de votre message"
                        />
                        {errors.subject && (
                          <p className="text-xs text-red-600 mt-2">{errors.subject.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-2 dark:text-white">
                          Message *
                        </label>
                        <textarea
                          {...register('message')}
                          id="message"
                          rows={6}
                          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          placeholder="Décrivez votre demande ou votre projet de franchise..."
                        />
                        {errors.message && (
                          <p className="text-xs text-red-600 mt-2">{errors.message.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
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

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-700">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 text-center">
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
              <div className="mt-16 bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white mb-6 text-center">
                  Questions fréquentes
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      Comment devenir franchisé ?
                    </h4>
                    <p className="text-white/70 text-sm">
                      Contactez-nous via ce formulaire ou par téléphone. Nous vous guiderons dans toutes les étapes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      Quel est l'investissement initial ?
                    </h4>
                    <p className="text-white/70 text-sm">
                      L'investissement varie selon la zone géographique. Nous vous fournirons un devis personnalisé.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      Y a-t-il une formation incluse ?
                    </h4>
                    <p className="text-white/70 text-sm">
                      Oui, nous proposons une formation complète sur la gestion de votre franchise et l'utilisation de nos outils.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      Quel support technique proposez-vous ?
                    </h4>
                    <p className="text-white/70 text-sm">
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

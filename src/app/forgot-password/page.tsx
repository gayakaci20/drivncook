'use client'

import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/footer'
import { Poppins } from 'next/font/google'
import { useEffect, useState } from 'react'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true' || 
                    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)
  }, [])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 2000)
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md">
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
                      Mot de passe oublié ?
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Saisissez votre adresse email pour recevoir un lien de réinitialisation
                    </p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-neutral-400">
                      Vous vous souvenez de votre mot de passe ?
                      <Link href="/login" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500 ml-1">
                        Se connecter
                      </Link>
                    </p>
                  </div>

                  {/* Content */}
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                          Adresse email
                        </label>
                        <div className="relative">
                          <input 
                            type="email" 
                            id="email" 
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" 
                            placeholder="votre@email.com"
                            required 
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isLoading || !email}
                        className="w-full py-3 px-6 inline-flex justify-center items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          'Envoyer le lien de réinitialisation'
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
                        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Email envoyé !
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                          Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
                          Vérifiez votre boîte de réception et vos spams
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link 
                          href="/login"
                          className="flex-1 py-2.5 px-4 inline-flex justify-center items-center gap-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
                        >
                          Retour à la connexion
                        </Link>
                        <button 
                          onClick={() => {
                            setIsSubmitted(false)
                            setEmail('')
                          }}
                          className="flex-1 py-2.5 px-4 inline-flex justify-center items-center gap-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/30"
                        >
                          Renvoyer l'email
                        </button>
                      </div>
                    </div>
                  )}
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
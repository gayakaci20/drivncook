'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Footer from '@/components/ui/footer'
import { Poppins } from 'next/font/google'
import { useEffect, useState, Suspense } from 'react'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true' || 
                    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)

    if (!token || !email) {
      setError('Lien de réinitialisation invalide')
    }
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          email, 
          password 
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'An error occurred')
      }
    } catch (error) {
      console.error('Error during password reset:', error)
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <>
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Lien invalide</h1>
            <p className="text-gray-600 mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
            <Link 
              href="/forgot-password"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
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
                      Nouveau mot de passe
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Choisissez un nouveau mot de passe sécurisé pour votre compte
                    </p>
                  </div>

                  {/* Content */}
                  {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                          </div>
                        </div>
                      )}

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            id="password" 
                            name="password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              setError('')
                            }}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" 
                            placeholder="Minimum 8 caractères"
                            required 
                            minLength={8}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword" 
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value)
                              setError('')
                            }}
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" 
                            placeholder="Confirmez votre mot de passe"
                            required 
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isLoading || !password || !confirmPassword}
                        className="w-full py-3 px-6 inline-flex justify-center items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Réinitialisation...
                          </>
                        ) : (
                          'Réinitialiser le mot de passe'
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
                          Mot de passe mis à jour !
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                          Votre mot de passe a été mis à jour avec succès.
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
                          Redirection vers la page de connexion dans 3 secondes...
                        </p>
                      </div>

                      <Link 
                        href="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Se connecter maintenant
                      </Link>
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

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

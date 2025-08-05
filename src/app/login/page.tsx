'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod' 
import { loginSchema, type LoginFormData } from '../../lib/validations'
import Image from 'next/image'
import Footer from '../../components/footer'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { useDarkMode } from '@/hooks/use-dark-mode'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const { isDarkMode } = useDarkMode()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        return
      }

      // Récupérer la session pour rediriger selon le rôle
      const session = await getSession()
      if (session?.user?.role === 'FRANCHISEE') {
        router.push('/franchise/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setIsLoading(false)
    }
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
                      Connexion
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Accédez à votre espace franchisé DrivnCook
                    </p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-neutral-400">
                      Pas encore de compte ?
                      <Link href="/register" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500 ml-1">
                        S'inscrire
                      </Link>
                    </p>
                  </div>
                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
                        <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      {/* Email Field */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Adresse email</label>
                        <div className="relative">
                          <input 
                            {...register('email')}
                            type="email" 
                            id="email" 
                            name="email" 
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" 
                            autoComplete="email"
                            placeholder="votre@email.com"
                          />
                          {errors.email && (
                            <div className="absolute inset-y-0 end-0 pointer-events-none pe-3 flex items-center">
                              <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.email && (
                          <p className="text-xs text-red-600 mt-2">{errors.email.message}</p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div>
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white">Mot de passe</label>
                          <Link href="/forgot-password" className="inline-flex items-center gap-x-1 text-sm text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500">
                            Mot de passe oublié ?
                          </Link>
                        </div>
                        <div className="relative">
                          <input 
                            {...register('password')}
                            type="password" 
                            id="password" 
                            name="password" 
                            className="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500" 
                            autoComplete="current-password"
                            placeholder="••••••••"
                          />
                          {errors.password && (
                            <div className="absolute inset-y-0 end-0 pointer-events-none pe-3 flex items-center">
                              <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.password && (
                          <p className="text-xs text-red-600 mt-2">{errors.password.message}</p>
                        )}
                      </div>

                      {/* Remember me */}
                      <div className="flex items-center">
                        <input 
                          id="remember-me" 
                          name="remember-me" 
                          type="checkbox" 
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-3 text-sm text-gray-900 dark:text-white">
                          Se souvenir de moi
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 px-6 inline-flex justify-center items-center gap-2 text-sm font-semibold rounded-xl bg-red-500/90 text-white shadow-xs hover:bg-red-600 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                      </button>
                    </div>
                  </form>
                  {/* Demo accounts */}
                  <div className="mt-8 p-4 rounded-xl bg-gray-50/50 border border-gray-200/50 dark:bg-neutral-800/30 dark:border-neutral-700/50">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                        Comptes de démonstration
                      </div>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-neutral-400">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/60 dark:bg-neutral-900/40">
                          <span className="font-medium">Admin:</span>
                          <span className="font-mono">admin@drivncook.fr / password123</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/60 dark:bg-neutral-900/40">
                          <span className="font-medium">Franchisé:</span>
                          <span className="font-mono">jean.dupont@example.com / password123</span>
                        </div>
                      </div>
                    </div>
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
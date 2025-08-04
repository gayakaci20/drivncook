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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()

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
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md">
              <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                <Image
                  src="/logo-white.svg"
                  alt="Driv'n Cook"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-white">DRIV&apos;N COOK</h1>
              </Link>
              
              <div className="mt-7 bg-white border border-gray-200 rounded-xl shadow-2xs dark:bg-neutral-900 dark:border-neutral-700">
                <div className="p-4 sm:p-7">
                  <div className="text-center">
                    <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">Sign in</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Don&apos;t have an account yet?
                      <a className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500" href="/register">
                        Sign up here
                      </a>
                    </p>
                  </div>
                  <div className="mt-5"></div>
                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                      {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                          <div className="text-sm text-red-800">{error}</div>
                        </div>
                      )}
                      
                      <div className="grid gap-y-4">
                        {/* Form Group */}
                        <div>
                          <label htmlFor="email" className="block text-sm mb-2 dark:text-white">Email address</label>
                          <div className="relative border-1 border-neutral-200 rounded-lg">
                            <input 
                              {...register('email')}
                              type="email" 
                              id="email" 
                              name="email" 
                              className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" 
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
                        {/* End Form Group */}

                        {/* Form Group */}
                        <div>
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Password</label>
                            <a className="inline-flex items-center gap-x-1 text-sm text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500" href="/forgot-password">Forgot password?</a>
                          </div>
                          <div className="relative border-1 border-neutral-200 rounded-lg">
                            <input 
                              {...register('password')}
                              type="password" 
                              id="password" 
                              name="password" 
                              className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" 
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
                        {/* End Form Group */}

                        {/* Checkbox */}
                        <div className="flex items-center">
                          <div className="flex">
                            <input id="remember-me" name="remember-me" type="checkbox" className="shrink-0 mt-0.5 border-gray-200 rounded-sm text-red-600 focus:ring-red-500 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-red-500 dark:checked:border-red-500 dark:focus:ring-offset-gray-800" />
                          </div>
                          <div className="ms-3">
                            <label htmlFor="remember-me" className="text-sm dark:text-white">Remember me</label>
                          </div>
                        </div>
                        {/* End Checkbox */}

                        <button 
                          type="submit" 
                          disabled={isLoading}
                          className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                      </div>
                    </form>
                    {/* End Form */}
                    
                    <div className="mt-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-neutral-400">
                          Comptes de démonstration :
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-neutral-500">
                          <div>Admin: admin@drivncook.fr / password123</div>
                          <div>Franchisé: jean.dupont@example.com / password123</div>
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
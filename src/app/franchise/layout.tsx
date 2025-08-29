'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FranchiseSidebar } from '@/components/franchise/franchise-sidebar'
import { FranchiseHeader } from '@/components/franchise/franchise-header'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutDialog } from '@/components/ui/pay'
import { AlertTriangle, CreditCard } from 'lucide-react'

interface FranchiseData {
  entryFeePaid: boolean
  entryFee: number
}


export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null)
  const [loadingFranchise, setLoadingFranchise] = useState(true)

  useEffect(() => {
    if (isPending) return

    if (!session) {
      router.push('/login')
      return
    }

    if ((session.user as ExtendedUser).role !== UserRole.FRANCHISEE) {
      router.push('/unauthorized')
      return
    }

    if (!(session.user as ExtendedUser).franchiseId) {
      router.push('/unauthorized')
      return
    }

    fetchFranchiseData()
  }, [session, isPending, router])

  const fetchFranchiseData = async () => {
    try {
      const franchiseId = (session?.user as ExtendedUser).franchiseId
      if (!franchiseId) return

      const response = await fetch(`/api/franchises/${franchiseId}`)
      const data = await response.json()
      
      if (data.success) {
        setFranchiseData({
          entryFeePaid: data.data.entryFeePaid,
          entryFee: data.data.entryFee
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données franchise:', error)
    } finally {
      setLoadingFranchise(false)
    }
  }

  if (isPending || loadingFranchise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user as ExtendedUser).role !== UserRole.FRANCHISEE || !(session.user as ExtendedUser).franchiseId) {
    return null
  }

  const isEntryFeePaid = franchiseData?.entryFeePaid ?? false

  return (
    <div className="relative flex h-screen bg-gray-50 dark:bg-neutral-950">
      {/* background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-transparent dark:from-blue-950/20 dark:via-neutral-900 dark:to-neutral-950" />
      </div>

      {/* Sidebar */}
      <FranchiseSidebar entryFeePaid={isEntryFeePaid} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <FranchiseHeader />
        <main className="flex-1 overflow-y-auto">
          {/* page container */}
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm backdrop-blur-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
              <div className="p-4 sm:p-6 lg:p-8">
                {!isEntryFeePaid ? (
                  <div className="space-y-6">
                    {/* Message de blocage */}
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                              Accès limité - Paiement requis
                            </h2>
                            <p className="text-orange-700 dark:text-orange-300 mb-4">
                              Pour accéder à toutes les fonctionnalités de votre franchise, vous devez régler vos droits d'entrée.
                            </p>
                            <div className="mb-4">
                              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                                Montant à régler: <span className="font-semibold">{franchiseData ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(franchiseData.entryFee / 100) : '0 €'}</span>
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <CheckoutDialog
                                amountInCents={franchiseData ? franchiseData.entryFee : 0}
                                description="Frais d'entrée franchise"
                                triggerLabel="Payer les frais d'entrée"
                                buttonLabel="Payer maintenant"
                                successUrl="/franchise/dashboard?payment=success"
                                cancelUrl="/franchise/dashboard"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Contenu grisé et inaccessible */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-100/80 dark:bg-neutral-900/80 z-10 rounded-2xl"></div>
                      <div className="filter blur-sm pointer-events-none opacity-40">
                        {children}
                      </div>
                    </div>
                  </div>
                ) : (
                  children
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
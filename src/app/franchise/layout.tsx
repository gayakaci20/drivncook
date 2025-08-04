'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FranchiseSidebar } from '@/components/franchise/franchise-sidebar'
import { FranchiseHeader } from '@/components/franchise/franchise-header'

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'FRANCHISEE') {
      router.push('/unauthorized')
      return
    }

    if (!session.user.franchiseId) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'FRANCHISEE' || !session.user.franchiseId) {
    return null
  }

  return (
    <div className="relative flex h-screen bg-gray-50 dark:bg-neutral-950">
      {/* background aesthetics */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-transparent dark:from-blue-950/20 dark:via-neutral-900 dark:to-neutral-950" />
      </div>

      {/* Sidebar */}
      <FranchiseSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <FranchiseHeader />
        <main className="flex-1 overflow-y-auto">
          {/* page container */}
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm backdrop-blur-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
              <div className="p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
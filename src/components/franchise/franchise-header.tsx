'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Truck,
  Building2,
  MapPin,
  Clock
} from 'lucide-react'

interface FranchiseInfo {
  businessName: string
  status: string
  city: string
  vehicleCount: number
  contractEndDate: string | null
}

export function FranchiseHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [franchiseInfo, setFranchiseInfo] = useState<FranchiseInfo | null>(null)
  const [notifications] = useState(3) // Simulé pour la démo

  useEffect(() => {
    if (session?.user?.franchiseId) {
      fetchFranchiseInfo()
    }
  }, [session?.user?.franchiseId])

  const fetchFranchiseInfo = async () => {
    try {
      if (!session?.user?.franchiseId) return
      
      const response = await fetch(`/api/franchises/${session.user.franchiseId}`)
      if (response.ok) {
        const data = await response.json()
        setFranchiseInfo({
          businessName: data.data.businessName,
          status: data.data.status,
          city: data.data.city,
          vehicleCount: data.data.vehicles?.length || 0,
          contractEndDate: data.data.contractEndDate
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos franchise:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: 'Actif', variant: 'default' as const },
      'PENDING': { label: 'En attente', variant: 'secondary' as const },
      'SUSPENDED': { label: 'Suspendu', variant: 'destructive' as const },
      'TERMINATED': { label: 'Terminé', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-b border-gray-200/70 dark:border-neutral-800 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Informations franchise */}
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative max-w-sm group">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm backdrop-blur-md outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm"
            />
          </div>

          {/* Franchise info */}
          {franchiseInfo && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50/70 dark:bg-neutral-800/40 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">{franchiseInfo.businessName}</span>
                {getStatusBadge(franchiseInfo.status)}
              </div>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-neutral-300">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{franchiseInfo.city}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  <span>{franchiseInfo.vehicleCount} véhicule{franchiseInfo.vehicleCount > 1 ? 's' : ''}</span>
                </div>
                
                {franchiseInfo.contractEndDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Contrat jusqu&apos;au {formatDate(franchiseInfo.contractEndDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative rounded-xl hover:translate-y-[1px] transition-transform">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                {notifications}
              </span>
            )}
          </Button>

          {/* Actions rapides */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              Nouvelle commande
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              Saisir ventes
            </Button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-neutral-800/60 transition-colors ring-1 ring-inset ring-transparent hover:ring-gray-200/80 dark:hover:ring-neutral-700/80"
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {session?.user?.name || 'Franchisé'}
                </div>
                <div className="text-xs text-gray-500 dark:text-neutral-400">
                  Franchisé
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/70 dark:border-neutral-800 py-1.5 z-50">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100/80 dark:hover:bg-neutral-800/60">
                  <User className="h-4 w-4" />
                  Mon profil
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100/80 dark:hover:bg-neutral-800/60">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </button>
                <hr className="my-1" />
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/70 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile franchise info */}
      {franchiseInfo && (
        <div className="md:hidden mt-4 p-3 bg-gray-50/70 dark:bg-neutral-800/40 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-neutral-100">{franchiseInfo.businessName}</div>
              <div className="text-xs text-gray-600 dark:text-neutral-300">{franchiseInfo.city} • {franchiseInfo.vehicleCount} véhicule{franchiseInfo.vehicleCount > 1 ? 's' : ''}</div>
            </div>
            {getStatusBadge(franchiseInfo.status)}
          </div>
        </div>
      )}
    </header>
  )
}
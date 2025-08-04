'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  User,
  Truck,
  ShoppingCart,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Package,
  MapPin
} from 'lucide-react'
import Image from 'next/image'

interface NavItem {
  title: string
  href: string
  icon: any
  description?: string
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/franchise/dashboard',
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble de votre activité'
  },
  {
    title: 'Mon profil',
    href: '/franchise/profile',
    icon: User,
    description: 'Informations personnelles et entreprise'
  },
  {
    title: 'Mon véhicule',
    href: '/franchise/vehicle',
    icon: Truck,
    description: 'État, maintenance et localisation'
  },
  {
    title: 'Mes commandes',
    href: '/franchise/orders',
    icon: ShoppingCart,
    description: 'Nouvelles commandes et historique'
  },
  {
    title: 'Produits',
    href: '/franchise/products',
    icon: Package,
    description: 'Catalogue et disponibilité'
  },
  {
    title: 'Mes ventes',
    href: '/franchise/sales',
    icon: DollarSign,
    description: 'Saisie et consultation des ventes'
  },
  {
    title: 'Rapports',
    href: '/franchise/reports',
    icon: BarChart3,
    description: 'Analyses et statistiques'
  },
  {
    title: 'Factures',
    href: '/franchise/invoices',
    icon: FileText,
    description: 'Factures et paiements'
  },
  {
    title: 'Localisation',
    href: '/franchise/location',
    icon: MapPin,
    description: 'Gérer vos emplacements'
  },
  {
    title: 'Support',
    href: '/franchise/support',
    icon: MessageSquare,
    description: 'Aide et contact'
  },
  {
    title: 'Paramètres',
    href: '/franchise/settings',
    icon: Settings,
    description: 'Configuration du compte'
  }
]

export function FranchiseSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn(
      'relative shrink-0 border-r border-gray-200/70 dark:border-neutral-800 bg-gradient-to-b from-white/80 via-white/60 to-white/30 dark:from-neutral-950/70 dark:via-neutral-950/50 dark:to-neutral-950/30 backdrop-blur-xl flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-72'
    )}>
      {/* gradient accent */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent" />

      {/* Logo */}
      <div className="relative p-6 border-b border-gray-200/70 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden">
            <Image 
              src="/logo-black.svg" 
              alt="Driv'n Cook" 
              width={24} 
              height={24}
              className="object-contain dark:hidden w-full h-full" 
            />
            <Image 
              src="/logo-white.svg" 
              alt="Driv'n Cook" 
              width={24} 
              height={24}
              className="object-contain hidden dark:block w-full h-full" 
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold tracking-tight text-gray-900 dark:text-neutral-100">DRIV'N COOK</h1>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Espace Franchisé</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-colors group',
                isActive
                  ? 'bg-blue-50/70 dark:bg-red-950/30 text-white-700 dark:text-red-400 border-r-2 border-red-600'
                  : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100/70 dark:hover:bg-neutral-800/40 hover:text-gray-900 dark:hover:text-neutral-100'
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-gray-600 dark:group-hover:text-neutral-300 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200/70 dark:border-neutral-800">
          <div className="text-xs text-gray-500 dark:text-neutral-400 text-center">
              Version 1.0.0
          </div>
        </div>
      )}
    </div>
  )
}
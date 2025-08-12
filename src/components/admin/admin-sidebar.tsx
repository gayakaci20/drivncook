'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  Settings,
  Building2,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Plus,
  Wrench
} from 'lucide-react'
import Image from 'next/image'

interface NavItem {
  title: string
  href?: string
  icon: any
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Calendrier',
    href: '/admin/calendar',
    icon: Calendar
  },
  {
    title: 'Franchisés',
    icon: User,
    children: [
      { title: 'Tous les franchisés', href: '/admin/franchises', icon: Users },
      { title: 'Nouveau franchisé', href: '/admin/franchises/new', icon: Plus },
    ]
  },
  {
    title: 'Véhicules',
    icon: Truck,
    children: [
      { title: 'Parc automobile', href: '/admin/vehicles', icon: Truck },
      { title: 'Nouveau véhicule', href: '/admin/vehicles/new', icon: Plus },
      { title: 'Maintenance', href: '/admin/vehicles/maintenance', icon: Wrench }
    ]
  },
  {
    title: 'Entrepôts',
    icon: Building2,
    children: [
      { title: 'Liste des entrepôts', href: '/admin/warehouses', icon: Building2 },
      { title: 'Stocks', href: '/admin/inventory', icon: Package },
      { title: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
    ]
  },
  {
    title: 'Finances',
    icon: DollarSign,
    children: [
      { title: 'Gestion Financière', href: '/admin/finance', icon: DollarSign },
      { title: 'Rapports de vente', href: '/admin/finance/sales-reports', icon: BarChart3 },
      { title: 'Factures', href: '/admin/finance/invoices', icon: FileText },
      { title: 'Redevances', href: '/admin/finance/royalties', icon: DollarSign }
    ]
  },
  {
    title: 'Rapports',
    href: '/admin/reports',
    icon: FileText
  },
  {
    title: 'Paramètres',
    href: '/admin/settings',
    icon: Settings
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Franchisés'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href === pathname

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors',
              'hover:bg-gray-100/70 dark:hover:bg-neutral-800/40 text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-100',
              level > 0 && 'ml-4'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors',
          level > 0 && 'ml-4',
          isActive
            ? 'bg-blue-50/70 dark:bg-red-950/30 text-white-700 dark:text-red-400 border-r-2 border-red-600'
            : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100/70 dark:hover:bg-neutral-800/40 hover:text-gray-900 dark:hover:text-neutral-100'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.title}</span>
      </Link>
    )
  }

  return (
    <div className="relative w-72 shrink-0 border-r border-gray-200/70 dark:border-neutral-800 bg-gradient-to-b from-white/80 via-white/60 to-white/30 dark:from-neutral-950/70 dark:via-neutral-950/50 dark:to-neutral-950/30 backdrop-blur-xl flex flex-col">
      {/* gradient accent */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-500/5 to-transparent" />

      {/* Logo */}
      <div className="relative p-6 border-b border-gray-200/70 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden">
            <Image 
              src="/logo-black.svg" 
              alt="Driv'n Cook" 
              width={36} 
              height={36}
              className="object-contain dark:hidden" 
            />
            <Image 
              src="/logo-white.svg" 
              alt="Driv'n Cook" 
              width={36} 
              height={36}
              className="object-contain hidden dark:block" 
            />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-gray-900 dark:text-neutral-100">DRIV'N COOK</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map(item => renderNavItem(item))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/70 dark:border-neutral-800">
        <div className="text-xs text-gray-500 dark:text-neutral-400 text-center">
          © 2025 DRIV&apos;N COOK. Tous droits réservés.
        </div>
      </div>
    </div>
  )
}
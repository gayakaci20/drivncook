'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Notification } from '@/components/ui/notification'
import { useTheme } from '@/components/providers/theme-provider'
import { 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NotificationAPI } from '@/lib/notification-client'
import { useNotifications } from '@/hooks/use-notifications'
import type { NotificationItem as UINotificationItem } from '@/components/ui/notification'

export function FranchiseHeader() {
  const router = useRouter()
  const { data: session } = useSession()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const notificationsHook = useNotifications('FRANCHISEE', 20)
  const [idMap, setIdMap] = useState<Record<number, { id: string; url?: string }>>({})

  const handleSignOut = async () => { 
    await signOut()
    window.location.href = '/login'
  }

  const loadNotifications = async () => {
    try {
      await notificationsHook.load()
      const res = await NotificationAPI.getFranchiseNotifications({ limit: 20 })
      if (res.success && res.data) {
        const map: Record<number, { id: string; url?: string }> = {}
        res.data.notifications.forEach((n) => {
          const numId = parseInt(n.id.replace(/\D/g, '') || '0', 10)
          map[numId] = { id: n.id, url: n.actionUrl || undefined }
        })
        setIdMap(map)
      }
    } catch {}
  }

  useEffect(() => {
    loadNotifications()
    const i = setInterval(loadNotifications, 15000)
    return () => clearInterval(i)
  }, [])

  const onNotificationClick = async (id: number) => {
    const original = idMap[id]
    if (original?.id) {
      await notificationsHook.markAsRead([original.id])
    }
    if (original?.url) {
      router.push(original.url)
    }
  }

  const onMarkAllAsRead = async () => {
    await notificationsHook.markAllAsRead()
  }



  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-b border-gray-200/70 dark:border-neutral-800 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] px-4 sm:px-6 py-4.5">
      <div className="flex items-center justify-between">
        {/* Informations franchise */}
        <div className="flex items-center gap-6">
          <div className="relative group">
          </div>

        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl hover:translate-y-[1px] transition-all duration-300"
            aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 transition-transform duration-300" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-300" />
            )}
          </Button>

          {/* Notifications */}
          <Notification 
            className="rounded-xl hover:translate-y-[1px] transition-transform"
            buttonVariant="ghost"
            buttonSize="icon"
            notifications={NotificationAPI.convertToComponentFormat(notificationsHook.notifications)}
            onNotificationClick={onNotificationClick}
            onMarkAllAsRead={onMarkAllAsRead}
          />

          {/* Actions rapides */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.push('/franchise/products')}>
              Nouvelle commande
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.push('/franchise/sales')}>
              Saisir ventes
            </Button>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-neutral-800/60 transition-colors ring-1 ring-inset ring-transparent hover:ring-gray-200/80 dark:hover:ring-neutral-700/80">
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/franchise/profile')}>
                <User className="h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/franchise/settings')}>
                <Settings className="h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


    </header>
  )
}
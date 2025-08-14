'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Check, CheckCheck, Clock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NotificationStatus } from '@/types/notifications'
import { useSession } from '@/lib/auth-client'
import { useNotifications } from '@/hooks/use-notifications'

export default function FranchiseNotificationsPage() {
  const { data: session } = useSession()
  const {
    notifications,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    load,
    markAsRead,
    markAllAsRead,
  } = useNotifications('FRANCHISEE', 100)

  useEffect(() => { load() }, [filter, session?.user])

  const filteredList = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = notifications.filter(n => n.status === NotificationStatus.UNREAD).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Mes notifications</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Alertes et messages du réseau</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {unreadCount} non lues
          </Badge>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Toutes ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Non lues ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Lues ({notifications.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : filteredList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-center">Aucune notification</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredList.map((n) => (
                <Card key={n.id} className={n.status === NotificationStatus.UNREAD ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{n.title}</h3>
                          {n.status === NotificationStatus.UNREAD && (
                            <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{n.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(n.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {n.status === NotificationStatus.UNREAD && (
                          <Button size="sm" variant="ghost" onClick={() => markAsRead([n.id])} className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Marquer comme lu
                          </Button>
                        )}
                        {n.actionUrl && (
                          <Button size="sm" variant="outline" onClick={() => window.open(n.actionUrl!, '_blank')} className="text-xs">Voir</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}



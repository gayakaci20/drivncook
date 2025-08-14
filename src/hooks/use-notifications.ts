'use client'

import { useCallback, useMemo, useState } from 'react'
import { NotificationAPI } from '@/lib/notification-client'
import { NotificationData, NotificationStatus } from '@/types/notifications'

export type NotificationRole = 'ADMIN' | 'FRANCHISEE'

export function useNotifications(role: NotificationRole, initialLimit = 100) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters = filter === 'all' ? {} : { status: [filter === 'unread' ? NotificationStatus.UNREAD : NotificationStatus.READ] }
      const res = role === 'ADMIN'
        ? await NotificationAPI.getAdminNotifications({ ...filters, limit: initialLimit })
        : await NotificationAPI.getFranchiseNotifications({ ...filters, limit: initialLimit })
      if (res.success && res.data) setNotifications(res.data.notifications)
    } finally {
      setLoading(false)
    }
  }, [filter, role, initialLimit])

  const markAsRead = useCallback(async (ids: string[]) => {
    await NotificationAPI.markAsRead(ids, role)
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, status: NotificationStatus.READ, readAt: new Date() } : n))
  }, [role])

  const markAllAsRead = useCallback(async () => {
    await NotificationAPI.markAllAsRead(role)
    setNotifications(prev => prev.map(n => ({ ...n, status: NotificationStatus.READ, readAt: new Date() })))
  }, [role])

  const unreadCount = useMemo(() => notifications.filter(n => n.status === NotificationStatus.UNREAD).length, [notifications])

  const filteredNotifications = useMemo(() => {
    const term = searchTerm.toLowerCase()
    if (!term) return notifications
    return notifications.filter(n => n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term))
  }, [notifications, searchTerm])

  return {
    notifications,
    setNotifications,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    load,
    markAsRead,
    markAllAsRead,
    unreadCount,
    filteredNotifications,
  }
}

export default useNotifications



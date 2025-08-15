'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, setHours, setMinutes } from 'date-fns'
import { EventCalendar } from '@/components/event-calendar'
import type { CalendarEvent } from '@/components/event-calendar'

export default function AdminCalendarPage() {
  const initialEvents: CalendarEvent[] = useMemo(() => [
    {
      id: 'a1',
      title: "Réunion d'équipe",
      description: 'Point hebdomadaire',
      start: setMinutes(setHours(new Date(), 10), 0),
      end: setMinutes(setHours(new Date(), 11), 0),
      color: 'sky',
      location: 'Salle A'
    },
    {
      id: 'a2',
      title: 'Livraison fournisseur',
      start: addDays(new Date(), 1),
      end: addDays(new Date(), 1),
      allDay: true,
      color: 'amber'
    },
    {
      id: 'a3',
      title: 'Maintenance véhicule',
      start: setMinutes(setHours(addDays(new Date(), 2), 14), 0),
      end: setMinutes(setHours(addDays(new Date(), 2), 16), 0),
      color: 'emerald',
      location: 'Atelier'
    }
  ], [])

  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  useEffect(() => {
    async function loadOrderEvents() {
      try {
        const res = await fetch('/api/orders?limit=1000&sortBy=requestedDeliveryDate&sortOrder=asc', { cache: 'no-store' })
        const js = await res.json().catch(() => null)
        if (!res.ok || !js?.data?.data) return
        const orders = js.data.data as any[]
        const orderEvents: CalendarEvent[] = orders
          .filter(o => !!o.requestedDeliveryDate)
          .map(o => {
            let color: CalendarEvent['color'] = 'amber'
            const status = String(o.status || '')
            if (status === 'CONFIRMED' || status === 'IN_PREPARATION') color = 'sky'
            else if (status === 'SHIPPED') color = 'violet'
            else if (status === 'DELIVERED') color = 'emerald'
            else if (status === 'CANCELLED') color = 'rose'
            return {
              id: o.id,
              title: `Commande ${o.orderNumber}`,
              description: 'Date de récupération souhaitée',
              start: new Date(o.requestedDeliveryDate),
              end: new Date(o.requestedDeliveryDate),
              allDay: true,
              color,
              location: o?.franchise?.city || undefined
            }
          })
        setEvents(prev => {
          const staticIds = new Set(prev.map(e => e.id))
          const merged = [...prev]
          for (const ev of orderEvents) {
            if (!staticIds.has(ev.id)) merged.push(ev)
          }
          return merged
        })
      } catch {}
    }
    loadOrderEvents()
  }, [])

  const handleAdd = (event: CalendarEvent) => {
    setEvents(prev => [...prev, { ...event, id: crypto.randomUUID() }])
  }

  const handleUpdate = (updated: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
          <EventCalendar
            events={events}
            onEventAdd={handleAdd}
            onEventUpdate={handleUpdate}
            onEventDelete={handleDelete}
            className=""
          />
  )
}



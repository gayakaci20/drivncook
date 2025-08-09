"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"
import { addDays, setHours, setMinutes, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption:
      "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-medium",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0"
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0"
    ),
    weekday: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
    day_button:
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 hover:not-in-data-selected:bg-accent group-data-selected:bg-primary hover:not-in-data-selected:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:text-foreground/30 group-data-selected:group-data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-accent group-[.range-middle]:group-data-selected:text-foreground",
    day: "group size-9 px-0 py-px text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
    outside:
      "text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
  }

  const mergedClassNames: typeof defaultClassNames = Object.keys(
    defaultClassNames
  ).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames]
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames
  )

  const defaultComponents = {
    Chevron: (props: {
      className?: string
      size?: number
      disabled?: boolean
      orientation?: "left" | "right" | "up" | "down"
    }) => {
      if (props.orientation === "left") {
        return <ChevronLeftIcon size={16} {...props} aria-hidden="true" />
      }
      return <ChevronRightIcon size={16} {...props} aria-hidden="true" />
    },
  }

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      locale={fr}
      {...props}
    />
  )
}

export { Calendar }

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  color?: "sky" | "amber" | "orange" | "emerald" | "violet" | "rose"
  location?: string
}

export const sampleEvents: CalendarEvent[] = [
  { id: "1", title: "Annual Planning", description: "Strategic planning for next year", start: subDays(new Date(), 24), end: subDays(new Date(), 23), allDay: true, color: "sky", location: "Main Conference Hall" },
  { id: "2", title: "Project Deadline", description: "Submit final deliverables", start: setMinutes(setHours(subDays(new Date(), 9), 13), 0), end: setMinutes(setHours(subDays(new Date(), 9), 15), 30), color: "amber", location: "Office" },
  { id: "3", title: "Quarterly Budget Review", description: "Strategic planning for next year", start: subDays(new Date(), 13), end: subDays(new Date(), 13), allDay: true, color: "orange", location: "Main Conference Hall" },
  { id: "4", title: "Team Meeting", description: "Weekly team sync", start: setMinutes(setHours(new Date(), 10), 0), end: setMinutes(setHours(new Date(), 11), 0), color: "sky", location: "Conference Room A" },
  { id: "5", title: "Lunch with Client", description: "Discuss new project requirements", start: setMinutes(setHours(addDays(new Date(), 1), 12), 0), end: setMinutes(setHours(addDays(new Date(), 1), 13), 15), color: "emerald", location: "Downtown Cafe" },
  { id: "6", title: "Product Launch", description: "New product release", start: addDays(new Date(), 3), end: addDays(new Date(), 6), allDay: true, color: "violet" },
  { id: "7", title: "Sales Conference", description: "Discuss about new clients", start: setMinutes(setHours(addDays(new Date(), 4), 14), 30), end: setMinutes(setHours(addDays(new Date(), 5), 14), 45), color: "rose", location: "Downtown Cafe" },
  { id: "8", title: "Team Meeting", description: "Weekly team sync", start: setMinutes(setHours(addDays(new Date(), 5), 9), 0), end: setMinutes(setHours(addDays(new Date(), 5), 10), 30), color: "orange", location: "Conference Room A" },
  { id: "9", title: "Review contracts", description: "Weekly team sync", start: setMinutes(setHours(addDays(new Date(), 5), 14), 0), end: setMinutes(setHours(addDays(new Date(), 5), 15), 30), color: "sky", location: "Conference Room A" },
  { id: "10", title: "Team Meeting", description: "Weekly team sync", start: setMinutes(setHours(addDays(new Date(), 5), 9), 45), end: setMinutes(setHours(addDays(new Date(), 5), 11), 0), color: "amber", location: "Conference Room A" },
  { id: "11", title: "Marketing Strategy Session", description: "Quarterly marketing planning", start: setMinutes(setHours(addDays(new Date(), 9), 10), 0), end: setMinutes(setHours(addDays(new Date(), 9), 15), 30), color: "emerald", location: "Marketing Department" },
  { id: "12", title: "Annual Shareholders Meeting", description: "Presentation of yearly results", start: addDays(new Date(), 17), end: addDays(new Date(), 17), allDay: true, color: "sky", location: "Grand Conference Center" },
  { id: "13", title: "Product Development Workshop", description: "Brainstorming for new features", start: setMinutes(setHours(addDays(new Date(), 26), 9), 0), end: setMinutes(setHours(addDays(new Date(), 27), 17), 0), color: "rose", location: "Innovation Lab" }
]

export function EventCalendar({
  events,
  onEventAdd,
  onEventUpdate,
  onEventDelete
}: {
  events: CalendarEvent[]
  onEventAdd?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (id: string) => void
}) {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date())
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const start = startOfDay(ev.start)
      const end = endOfDay(ev.end)
      for (let d = start; d <= end; d = addDays(d, 1)) {
        const key = d.toDateString()
        const list = map.get(key) || []
        list.push(ev)
        map.set(key, list)
      }
    }
    return map
  }, [events])

  const modifiers = {
    hasEvent: (date: Date) => {
      return events.some(ev => isWithinInterval(date, { start: startOfDay(ev.start), end: endOfDay(ev.end) }))
    }
  }

  const modifiersClassNames = {
    hasEvent: "relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:start-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1.5 [&>button]:after:rounded-full [&>button]:after:bg-primary"
  }

  const dayEvents = selected ? eventsByDay.get(startOfDay(selected).toDateString()) || [] : []

  return (
    <div className="space-y-4">
      <Calendar
        selected={selected}
        onSelect={setSelected as any}
        modifiers={modifiers as any}
        modifiersClassNames={modifiersClassNames as any}
      />
      <div className="space-y-2">
        {dayEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucun évènement</div>
        ) : (
          dayEvents.map(ev => (
            <div key={ev.id} className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-muted-foreground">{ev.location || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {onEventUpdate && (
                  <button className={cn(buttonVariants({ variant: "outline", size: "sm" }))} onClick={() => onEventUpdate(ev)}>Modifier</button>
                )}
                {onEventDelete && (
                  <button className={cn(buttonVariants({ variant: "destructive", size: "sm" }))} onClick={() => onEventDelete(ev.id)}>Supprimer</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useState } from "react"
import { BellIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface NotificationItem {
  id: number
  user: string
  action: string
  target: string
  timestamp: string
  unread: boolean
}

const notificationVariants = cva(
  "hover:bg-accent rounded-md px-3 py-2 text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "",
        highlighted: "bg-accent/50",
      },
      size: {
        default: "px-3 py-2",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const notificationContainerVariants = cva(
  "p-1",
  {
    variants: {
      width: {
        default: "w-80",
        sm: "w-64",
        lg: "w-96",
        xl: "w-[420px]",
      },
    },
    defaultVariants: {
      width: "default",
    },
  }
)

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  )
}

export interface NotificationItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  notification: NotificationItem
  onNotificationClick?: (id: number) => void
}

const NotificationItemComponent = React.forwardRef<HTMLDivElement, NotificationItemProps>(
  ({ className, variant, size, notification, onNotificationClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant, size, className }))}
        {...props}
      >
        <div className="relative flex items-start pe-3">
          <div className="flex-1 space-y-1">
            <button
              className="text-foreground/80 text-left after:absolute after:inset-0"
              onClick={() => onNotificationClick?.(notification.id)}
            >
              <span className="text-foreground font-medium hover:underline">
                {notification.user}
              </span>{" "}
              {notification.action}{" "}
              <span className="text-foreground font-medium hover:underline">
                {notification.target}
              </span>
              .
            </button>
            <div className="text-muted-foreground text-xs">
              {notification.timestamp}
            </div>
          </div>
          {notification.unread && (
            <div className="absolute end-0 self-center">
              <span className="sr-only">Unread</span>
              <Dot />
            </div>
          )}
        </div>
      </div>
    )
  }
)
NotificationItemComponent.displayName = "NotificationItem"

export interface NotificationProps
  extends React.ComponentProps<typeof PopoverTrigger>,
    VariantProps<typeof notificationContainerVariants> {
  notifications?: NotificationItem[]
  onNotificationClick?: (id: number) => void
  onMarkAllAsRead?: () => void
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  showMarkAllAsRead?: boolean
}

const Notification = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  NotificationProps
>(({
  className,
  width,
  notifications: externalNotifications,
  onNotificationClick: externalOnNotificationClick,
  onMarkAllAsRead: externalOnMarkAllAsRead,
  buttonVariant = "outline",
  buttonSize = "icon",
  showMarkAllAsRead = true,
  ...props
}, ref) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    externalNotifications || []
  )

  React.useEffect(() => {
    if (externalNotifications !== undefined) {
      setNotifications(externalNotifications)
    }
  }, [externalNotifications])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      unread: false,
    }))
    setNotifications(updatedNotifications)
    externalOnMarkAllAsRead?.()
  }

  const handleNotificationClick = (id: number) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, unread: false }
        : notification
    )
    setNotifications(updatedNotifications)
    externalOnNotificationClick?.(id)
  }

  return (
    <Popover>
      <PopoverTrigger asChild ref={ref} {...props}>
        <Button
          size={buttonSize}
          variant={buttonVariant}
          className={cn("relative", className)}
          aria-label="Open notifications"
        >
          <BellIcon size={16} aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(notificationContainerVariants({ width }))}>
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadCount > 0 && showMarkAllAsRead && (
            <button
              className="text-xs font-medium hover:underline"
              onClick={handleMarkAllAsRead}
            >
              Marquer tout comme lu
            </button>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="bg-border -mx-1 my-1 h-px"
        ></div>
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <div className="text-muted-foreground text-sm">
              Aucune notification
            </div>
            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => {
              window.location.reload()
            }}>
              Actualiser
            </Button>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItemComponent
              key={notification.id}
              notification={notification}
              onNotificationClick={handleNotificationClick}
            />
          ))
        )}
      </PopoverContent>
    </Popover>
  )
})
Notification.displayName = "Notification"

export { 
  Notification, 
  NotificationItemComponent as NotificationItem,
  notificationVariants,
  notificationContainerVariants,
  Dot as NotificationDot
}

"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const popoverVariants = cva(
  "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 rounded-md border outline-hidden",
  {
    variants: {
      variant: {
        default: "w-72 p-4 shadow-md",
        tooltip: "max-w-[280px] py-3 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

export interface PopoverContentProps
  extends React.ComponentProps<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverVariants> {
  showArrow?: boolean
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({
  className,
  variant,
  align = "center",
  sideOffset = 4,
  showArrow = false,
  ...props
}, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverVariants({ variant, className }))}
        {...props}
      >
        {props.children}
        {showArrow && (
          <PopoverPrimitive.Arrow className="fill-popover -my-px drop-shadow-[0_1px_0_var(--border)]" />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

 
interface TooltipLikePopoverProps {
  triggerText?: string
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  side?: "top" | "right" | "bottom" | "left"
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

function TooltipLikePopover({
  triggerText = "Tooltip-like popover",
  title = "Popover with button",
  description = "I am a popover that would like to look like a tooltip. I can't be a tooltip because of the interactive element inside me.",
  buttonText = "Know more",
  onButtonClick,
  side = "top",
  triggerVariant = "outline"
}: TooltipLikePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={triggerVariant}>{triggerText}</Button>
      </PopoverTrigger>
      <PopoverContent variant="tooltip" side={side}>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[13px] font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">
              {description}
            </p>
          </div>
          <Button size="sm" className="h-7 px-2" onClick={onButtonClick}>
            {buttonText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { 
  Popover, 
  PopoverAnchor, 
  PopoverContent, 
  PopoverTrigger, 
  TooltipLikePopover,
  popoverVariants
}

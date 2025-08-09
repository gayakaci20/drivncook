"use client"

import * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { CreditCardIcon, StoreIcon, WalletIcon } from "lucide-react"
import { usePaymentInputs } from "react-payment-inputs"
import images, { type CardImages } from "react-payment-inputs/images"
import { Elements, useElements, useStripe, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="currentcolor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="3" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export function CardDetailsDialog() {
  const id = useId()
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } =
    usePaymentInputs()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Card details</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
            <WalletIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Update your card</DialogTitle>
            <DialogDescription className="text-left">
              Your new card will replace your current card.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="*:not-first:mt-2">
              <Label htmlFor={`name-${id}`}>Name on card</Label>
              <Input id={`name-${id}`} type="text" required />
            </div>
            <div className="*:not-first:mt-2">
              <Label htmlFor={`number-${id}`}>Card Number</Label>
              <div className="relative">
                <Input {...getCardNumberProps()} id={`number-${id}`} className="peer pe-9 [direction:inherit]" />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50">
                  {meta.cardType ? (
                    <svg
                      className="overflow-hidden rounded-sm"
                      {...getCardImageProps({ images: images as unknown as CardImages })}
                      width={20}
                    />
                  ) : (
                    <CreditCardIcon size={16} aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`expiry-${id}`}>Expiry date</Label>
                <Input className="[direction:inherit]" {...getExpiryDateProps()} id={`expiry-${id}`} />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`cvc-${id}`}>CVC</Label>
                <Input className="[direction:inherit]" {...getCVCProps()} id={`cvc-${id}`} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`primary-${id}`} />
            <Label htmlFor={`primary-${id}`} className="text-muted-foreground font-normal">
              Set as default payment method
            </Label>
          </div>
          <Button type="button" className="w-full">
            Update card
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type CheckoutDialogProps = {
  amountInCents: number
  description?: string
  triggerLabel?: string
  buttonLabel?: string
  successUrl?: string
  cancelUrl?: string
  currency?: string
  locale?: string
}

export function CheckoutDialog({
  amountInCents,
  description,
  triggerLabel = "Payer",
  buttonLabel = "Payer maintenant",
  successUrl,
  cancelUrl,
  currency = 'EUR',
  locale = 'fr-FR',
}: CheckoutDialogProps) {
  const id = useId()
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } =
    usePaymentInputs()
  const couponInputRef = useRef<HTMLInputElement>(null)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isPaying, setIsPaying] = useState(false)
  const [open, setOpen] = useState(false)

  const formattedAmount = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format((amountInCents || 0) / 100)
    } catch {
      return `${(amountInCents || 0) / 100} ${currency}`
    }
  }, [amountInCents, currency, locale])

  useEffect(() => {
    if (showCouponInput && couponInputRef.current) {
      couponInputRef.current.focus()
    }
  }, [showCouponInput])

  async function handleCheckoutInline(stripe: any, elements: any) {
    try {
      setIsPaying(true)
      const res = await fetch("/api/payments/entry-fee/intent", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.clientSecret) {
        console.error("PI error", json?.error || res.statusText)
        return
      }
      const cardElement = elements.getElement(CardNumberElement)
      const result = await stripe.confirmCardPayment(json.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {},
        },
      })
      if (result.error) {
        console.error(result.error.message)
        return
      }
      if (result.paymentIntent?.status === 'succeeded') {
        await fetch('/api/payments/entry-fee/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
        })
      }
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="mb-2 flex flex-col gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
            <StoreIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Confirmer et payer</DialogTitle>
            <DialogDescription className="text-left">Paiement sécurisé par carte.</DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="rounded-md border p-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{description || 'Montant à payer'}</div>
              <div className="text-base font-semibold">{formattedAmount}</div>
            </div>
            <div className="*:not-first:mt-2">
              <Label htmlFor={`name-${id}`}>Nom sur la carte</Label>
              <Input id={`name-${id}`} type="text" required />
            </div>
            <Elements stripe={stripePromise}>
              <div className="*:not-first:mt-2">
                <legend className="text-foreground text-sm font-medium">Coordonnées de carte</legend>
                <StripeCardFields isDark={true} />
              </div>
              <PayButton onPay={async (stripe, elements) => {
                await handleCheckoutInline(stripe, elements)
                setOpen(false)
                try {
                  setTimeout(() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload()
                    }
                  }, 800)
                } catch {}
              }} disabled={isPaying}>
                {isPaying ? "Redirection..." : buttonLabel}
              </PayButton>
            </Elements>

    
          </div>
        </form>

        <p className="text-muted-foreground text-center text-xs">Paiement non remboursable.</p>
      </DialogContent>
    </Dialog>
  )
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function StripeCardFields({ isDark }: { isDark?: boolean }) {
  const options = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#fff' : 'currentColor',
        '::placeholder': { color: 'rgba(148,163,184,0.9)' },
      },
      invalid: { color: '#ef4444' },
    },
  } as any
  return (
    <div className="rounded-md shadow-xs">
      <div className="relative focus-within:z-10 border rounded-t-md px-3 py-2">
        <CardNumberElement options={options} />
      </div>
      <div className="-mt-px flex">
        <div className="min-w-0 flex-1 focus-within:z-10 border rounded-bl-md px-3 py-2">
          <CardExpiryElement options={options} />
        </div>
        <div className="-ms-px min-w-0 flex-1 focus-within:z-10 border rounded-br-md px-3 py-2">
          <CardCvcElement options={options} />
        </div>
      </div>
    </div>
  )
}

function PayButton({ children, onPay, disabled }: { children: React.ReactNode; onPay: (stripe: any, elements: any) => Promise<void>; disabled?: boolean }) {
  const stripe = useStripe()
  const elements = useElements()
  return (
    <Button type="button" className="w-full" onClick={() => stripe && elements && onPay(stripe, elements)} disabled={disabled || !stripe || !elements}>
      {children}
    </Button>
  )
}

export { RadioGroup, RadioGroupItem }

import { NextRequest, NextResponse } from 'next/server'
import { notificationEmailService, notificationService } from '@/lib/notification-service'
import { NotificationPriority, NotificationStatus, NotificationType } from '@/types/notifications'

export const runtime = 'nodejs'

type ActionKey =
  | 'vehicle-assigned'
  | 'entry-fee-paid'
  | 'stock-received'
  | 'order-created'
  | 'document-transmitted'
  | 'order-confirmed'
  | 'test-unified-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      action?: ActionKey
      adminEmail?: string
      franchiseeEmail?: string
      orderNumber?: string
      licensePlate?: string
      productName?: string
    }

    const action = body.action
    if (!action) return NextResponse.json({ success: false, error: 'action manquant' }, { status: 400 })

    const adminEmail = body.adminEmail
    const franchiseeEmail = body.franchiseeEmail

    const now = new Date()
    const makeId = () => `test-${action}-${now.getTime()}`

    const base = {
      id: makeId(),
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      createdAt: now,
    } as const

    const results: any[] = []

    if (action === 'vehicle-assigned') {
      const data = {
        ...base,
        type: NotificationType.VEHICLE_ASSIGNED,
        title: 'Véhicule assigné',
        message: `Un véhicule a été assigné`,
        data: { licensePlate: body.licensePlate || 'AA-000-AA' },
        actionUrl: `/franchise/vehicle`
      }
      if (franchiseeEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [franchiseeEmail] }))
      }
      if (adminEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor({ ...data, actionUrl: '/admin/vehicles' } as any, undefined, { sendEmail: true, emailRecipients: [adminEmail] }))
      }
    }

    if (action === 'entry-fee-paid') {
      const data = {
        ...base,
        type: NotificationType.PAYMENT_RECEIVED,
        title: `Droit d’entrée payé`,
        message: 'Le paiement des droits d’entrée a été confirmé',
        data: { amount: 50000, entityNumber: 'ENTRY_FEE' },
        actionUrl: `/franchise/dashboard`
      }
      if (franchiseeEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [franchiseeEmail] }))
      }
      if (adminEmail) {
        const adminData = { ...data, title: 'Droit d’entrée payé par une franchise', message: 'Le franchisé a payé ses droits d’entrée', actionUrl: '/admin/franchises' }
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(adminData as any, undefined, { sendEmail: true, emailRecipients: [adminEmail] }))
      }
    }

    if (action === 'stock-received') {
      const data = {
        ...base,
        type: NotificationType.STOCK_RECEIVED,
        title: 'Stock mis à jour',
        message: `Stock ajouté pour ${body.productName || 'Produit'}`,
        data: { productName: body.productName || 'Produit' },
        actionUrl: `/admin/inventory`
      }
      if (adminEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [adminEmail] }))
      }
    }

    if (action === 'order-created') {
      const num = body.orderNumber || 'CMD-TEST-000001'
      const data = {
        ...base,
        type: NotificationType.ORDER_CREATED,
        title: 'Nouvelle commande créée',
        message: `Commande ${num} créée`,
        data: { orderNumber: num },
        actionUrl: `/admin/orders`
      }
      if (adminEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [adminEmail] }))
      }
      if (franchiseeEmail) {
        const frData = { ...data, title: 'Votre commande a été créée', message: `Votre commande ${num} a été enregistrée`, actionUrl: '/franchise/orders' }
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(frData as any, undefined, { sendEmail: true, emailRecipients: [franchiseeEmail] }))
      }
    }

    if (action === 'document-transmitted') {
      const num = body.orderNumber || 'CMD-TEST-000001'
      const data = {
        ...base,
        type: NotificationType.DOCUMENT_TRANSMITTED,
        title: 'Bon de commande transmis',
        message: `Le bon de commande ${num} a été transmis`,
        data: { orderNumber: num },
        actionUrl: `/admin/orders`
      }
      if (adminEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [adminEmail] }))
      }
    }

    if (action === 'order-confirmed') {
      const num = body.orderNumber || 'CMD-TEST-000001'
      const data = {
        ...base,
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Commande confirmée',
        message: `Votre commande ${num} a été confirmée`,
        data: { orderNumber: num },
        actionUrl: `/franchise/orders`
      }
      if (franchiseeEmail) {
        results.push(await notificationEmailService.sendSimpleNotificationEmailFor(data as any, undefined, { sendEmail: true, emailRecipients: [franchiseeEmail] }))
      }
    }

    if (action === 'test-unified-service') {
      const adminResult = await notificationService.createAdminNotification({
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: 'Test du service unifié - Admin',
        message: 'Ceci est un test du nouveau service de notifications unifié. Un email devrait être envoyé automatiquement aux administrateurs.',
        actionUrl: '/admin/notifications'
      })
      results.push({ 
        type: 'admin', 
        ...adminResult,
        note: 'Email envoyé automatiquement aux admins'
      })

      if (franchiseeEmail) {
        const franchiseResult = await notificationService.createNotification({
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          title: 'Test du service unifié - Franchise',
          message: 'Ceci est un test du nouveau service de notifications unifié. Un email devrait être envoyé automatiquement.',
          targetRole: 'FRANCHISEE',
          actionUrl: '/franchise/notifications'
        }, {
          id: 'test-user',
          email: franchiseeEmail,
          name: 'Test Franchise',
          role: 'FRANCHISEE'
        })
        results.push({ 
          type: 'franchise',
          ...franchiseResult,
          note: 'Email envoyé automatiquement au franchisé'
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 })
  }
}



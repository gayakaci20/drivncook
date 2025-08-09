'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { addToast } from '@heroui/toast'
import { HelpCircle, Phone, Mail } from 'lucide-react'

export default function FranchiseSupportContactPage() {
  const { data: session } = useSession()
  const [subject, setSubject] = useState('Demande de support')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        addToast({ title: 'Erreur', description: json?.error || 'Impossible d\'envoyer le message', color: 'danger' })
        return
      }
      addToast({ title: 'Envoyé', description: 'Votre message a été envoyé au support', color: 'success' })
      setMessage('')
    } catch (err) {
      addToast({ title: 'Erreur', description: 'Erreur réseau', color: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-gray-600">Contactez-nous ou consultez l'aide.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact téléphonique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center">
              <p className="text-lg font-medium">+33 1 XX XX XX XX</p>
              <p className="text-sm text-gray-500">Lun-Ven: 9h-18h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center">
              <p className="text-lg font-medium">support@drivncook.com</p>
              <p className="text-sm text-gray-500">Réponse sous 24h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de contact</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Objet</Label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Décrivez votre demande..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={sending || !message.trim()} className="rounded-xl">
                {sending ? 'Envoi...' : 'Envoyer'}
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={`mailto:support@drivncook.com?subject=${encodeURIComponent(subject)}`}>Email support</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Centre d'aide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">FAQ et documentation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

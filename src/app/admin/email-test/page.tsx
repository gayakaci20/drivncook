"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Send, 
  Settings, 
  TestTube,
  Clock,
  Loader2
} from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  messageId?: string
  error?: string
  timestamp: Date
}

interface TestStatus {
  isLoading: boolean
  result: TestResult | null
}

export default function EmailTestPage() {
  const [configTest, setConfigTest] = useState<TestStatus>({ isLoading: false, result: null })
  const [basicTest, setBasicTest] = useState<TestStatus>({ isLoading: false, result: null })
  const [notificationTest, setNotificationTest] = useState<TestStatus>({ isLoading: false, result: null })
  const [testEmail, setTestEmail] = useState('')

  const runTest = async (
    testType: 'configuration' | 'basic' | 'notification',
    setTestState: React.Dispatch<React.SetStateAction<TestStatus>>
  ) => {
    setTestState({ isLoading: true, result: null })

    try {
      const body = testType === 'configuration' 
        ? { testType } 
        : { email: testEmail || 'test@example.com', testType }

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      
      setTestState({
        isLoading: false,
        result: {
          success: result.success,
          message: result.message || result.error || 'Test terminé',
          messageId: result.messageId,
          error: result.error,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      setTestState({
        isLoading: false,
        result: {
          success: false,
          message: 'Erreur de connexion',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          timestamp: new Date(),
        },
      })
    }
  }

  const renderTestResult = (testStatus: TestStatus) => {
    if (testStatus.isLoading) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Test en cours...</span>
        </div>
      )
    }

    if (!testStatus.result) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Pas encore testé</span>
        </div>
      )
    }

    const { success, message, messageId, error, timestamp } = testStatus.result

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={success ? 'text-green-600' : 'text-red-600'}>
            {message}
          </span>
        </div>
        
        {messageId && (
          <div className="text-xs text-gray-500">
            ID: {messageId}
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded border">
            {error}
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          {timestamp.toLocaleString('fr-FR')}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test d'Intégration Gmail</h1>
        <p className="text-gray-600">
          Testez la configuration et l'envoi d'emails via Gmail pour le système de notifications DrivnCook.
        </p>
      </div>

      {/* Configuration actuelle */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Configuration Email</CardTitle>
          </div>
          <CardDescription>
            Configuration actuelle du service d'email Gmail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Serveur SMTP:</label>
              <p className="text-sm text-gray-900">smtp.gmail.com:587</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Utilisateur:</label>
              <p className="text-sm text-gray-900">{process.env.NEXT_PUBLIC_SMTP_USER || 'flashtuto894@gmail.com'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Authentification:</label>
              <p className="text-sm text-gray-900">Mot de passe d'application</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nom d'expéditeur:</label>
              <p className="text-sm text-gray-900">DrivnCook</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email de test */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email de Test</CardTitle>
          </div>
          <CardDescription>
            Adresse email où envoyer les tests (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Badge variant="outline" className="px-3 py-2">
              Optionnel
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Si vide, utilisera une adresse par défaut pour les tests
          </p>
        </CardContent>
      </Card>

      {/* Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test de configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Configuration</CardTitle>
            </div>
            <CardDescription>
              Vérifie que le service email est correctement configuré
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderTestResult(configTest)}
            <Button
              onClick={() => runTest('configuration', setConfigTest)}
              disabled={configTest.isLoading}
              className="w-full"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Tester la Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Test d'email basique */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Email Basique</CardTitle>
            </div>
            <CardDescription>
              Envoie un email de test simple
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderTestResult(basicTest)}
            <Button
              onClick={() => runTest('basic', setBasicTest)}
              disabled={basicTest.isLoading || !testEmail}
              className="w-full"
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer Email Test
            </Button>
            {!testEmail && (
              <p className="text-xs text-amber-600">
                Veuillez saisir un email de test
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test de notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Notification</CardTitle>
            </div>
            <CardDescription>
              Teste l'envoi d'un email de notification formaté
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderTestResult(notificationTest)}
            <Button
              onClick={() => runTest('notification', setNotificationTest)}
              disabled={notificationTest.isLoading || !testEmail}
              className="w-full"
              variant="outline"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Tester Notification
            </Button>
            {!testEmail && (
              <p className="text-xs text-amber-600">
                Veuillez saisir un email de test
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900">1. Test de Configuration</h4>
            <p className="text-sm text-gray-600">
              Vérifie que les paramètres Gmail sont corrects et que la connexion fonctionne.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">2. Test d'Email Basique</h4>
            <p className="text-sm text-gray-600">
              Envoie un email simple pour vérifier l'envoi et la réception.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">3. Test de Notification</h4>
            <p className="text-sm text-gray-600">
              Teste l'envoi d'un email de notification avec le template et la mise en forme DrivnCook.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

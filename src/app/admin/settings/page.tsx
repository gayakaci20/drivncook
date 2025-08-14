'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Users,
  DollarSign,
  Building2,
  Truck,
  Shield,
  Mail,
  Globe,
  Database,
  Bell,
  FileText,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  X
} from 'lucide-react'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'
import { toast } from 'sonner'

interface AppSettings {
  general: {
    companyName: string
    defaultRoyaltyRate: number
    defaultEntryFee: number
    currency: string
    timezone: string
    language: string
  }
  franchise: {
    autoApproval: boolean
    maxFranchisesPerUser: number
    contractDurationMonths: number
    reminderDaysBefore: number
  }
  financial: {
    vatRate: number
    paymentTermsDays: number
    latePaymentFees: number
    autoGenerateInvoices: boolean
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    franchiseApplications: boolean
    paymentReminders: boolean
    maintenanceAlerts: boolean
    lowStockAlerts: boolean
  }
  security: {
    sessionTimeoutMinutes: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireTwoFactor: boolean
    auditLogRetentionDays: number
  }
  system: {
    maintenanceMode: boolean
    allowRegistrations: boolean
    maxFileUploadSize: number
    backupFrequencyDays: number
    logLevel: string
  }
}

export default function AdminSettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswords, setShowPasswords] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    if (isPending) return

    if (!session || (session.user as ExtendedUser).role !== UserRole.ADMIN) {
      router.push('/unauthorized')
      return
    }

    fetchSettings()
  }, [session, isPending, router])

  const fetchSettings = async () => {
    try {
       
       
      const defaultSettings: AppSettings = {
        general: {
          companyName: "Driv'n Cook",
          defaultRoyaltyRate: 4.0,
          defaultEntryFee: 50000,
          currency: "EUR",
          timezone: "Europe/Paris",
          language: "fr"
        },
        franchise: {
          autoApproval: false,
          maxFranchisesPerUser: 1,
          contractDurationMonths: 60,
          reminderDaysBefore: 30
        },
        financial: {
          vatRate: 20.0,
          paymentTermsDays: 30,
          latePaymentFees: 5.0,
          autoGenerateInvoices: true
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          franchiseApplications: true,
          paymentReminders: true,
          maintenanceAlerts: true,
          lowStockAlerts: true
        },
        security: {
          sessionTimeoutMinutes: 480,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireTwoFactor: false,
          auditLogRetentionDays: 365
        },
        system: {
          maintenanceMode: false,
          allowRegistrations: true,
          maxFileUploadSize: 10,
          backupFrequencyDays: 7,
          logLevel: "INFO"
        }
      }
      setSettings(defaultSettings)
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (section: keyof AppSettings, key: string, value: any) => {
    if (!settings) return

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
       
      await new Promise(resolve => setTimeout(resolve, 1000))  
      setUnsavedChanges(false)
      toast.success('Paramètres sauvegardés avec succès!')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde des paramètres')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser les paramètres aux valeurs par défaut ?')) {
      await fetchSettings()
      setUnsavedChanges(false)  
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Erreur lors du chargement des paramètres</p>
          <Button onClick={fetchSettings} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
            Paramètres
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Configuration générale de l'application Driv'n Cook
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsavedChanges && (
            <Badge variant="secondary" className="rounded-xl">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Non sauvegardé
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={resetSettings} 
            className="rounded-xl"
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={saveSettings} 
            className="rounded-xl"
            disabled={saving || !unsavedChanges}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Settings tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="franchise" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Franchise
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financier
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Devise</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar US (USD)</option>
                    <option value="GBP">Livre Sterling (GBP)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taux de redevance par défaut (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.general.defaultRoyaltyRate}
                    onChange={(e) => handleSettingChange('general', 'defaultRoyaltyRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Droit d'entrée par défaut (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.general.defaultEntryFee}
                    onChange={(e) => handleSettingChange('general', 'defaultEntryFee', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuseau horaire</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Langue</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Franchise Settings */}
        <TabsContent value="franchise" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestion des franchisés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre max de franchises par utilisateur</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.franchise.maxFranchisesPerUser}
                    onChange={(e) => handleSettingChange('franchise', 'maxFranchisesPerUser', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durée du contrat (mois)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.franchise.contractDurationMonths}
                    onChange={(e) => handleSettingChange('franchise', 'contractDurationMonths', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rappel avant expiration (jours)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.franchise.reminderDaysBefore}
                    onChange={(e) => handleSettingChange('franchise', 'reminderDaysBefore', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <h4 className="font-medium">Approbation automatique</h4>
                  <p className="text-sm text-gray-500">Approuver automatiquement les nouvelles demandes de franchise</p>
                </div>
                <button
                  onClick={() => handleSettingChange('franchise', 'autoApproval', !settings.franchise.autoApproval)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.franchise.autoApproval ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.franchise.autoApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Paramètres financiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taux de TVA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.financial.vatRate}
                    onChange={(e) => handleSettingChange('financial', 'vatRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Délai de paiement (jours)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.financial.paymentTermsDays}
                    onChange={(e) => handleSettingChange('financial', 'paymentTermsDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frais de retard (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings.financial.latePaymentFees}
                    onChange={(e) => handleSettingChange('financial', 'latePaymentFees', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <h4 className="font-medium">Génération automatique des factures</h4>
                  <p className="text-sm text-gray-500">Générer automatiquement les factures mensuelles</p>
                </div>
                <button
                  onClick={() => handleSettingChange('financial', 'autoGenerateInvoices', !settings.financial.autoGenerateInvoices)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.financial.autoGenerateInvoices ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.financial.autoGenerateInvoices ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Notifications par email', description: 'Activer les notifications par email' },
                { key: 'smsNotifications', label: 'Notifications par SMS', description: 'Activer les notifications par SMS' },
                { key: 'franchiseApplications', label: 'Demandes de franchise', description: 'Notifications pour les nouvelles demandes' },
                { key: 'paymentReminders', label: 'Rappels de paiement', description: 'Rappels automatiques des factures' },
                { key: 'maintenanceAlerts', label: 'Alertes de maintenance', description: 'Notifications de maintenance des véhicules' },
                { key: 'lowStockAlerts', label: 'Alertes de stock', description: 'Notifications de stock faible' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <h4 className="font-medium">{item.label}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', item.key, !settings.notifications[item.key as keyof typeof settings.notifications])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications[item.key as keyof typeof settings.notifications] ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications[item.key as keyof typeof settings.notifications] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout de session (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tentatives de connexion max</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longueur min du mot de passe</label>
                  <input
                    type="number"
                    min="6"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rétention des logs d'audit (jours)</label>
                  <input
                    type="number"
                    min="30"
                    value={settings.security.auditLogRetentionDays}
                    onChange={(e) => handleSettingChange('security', 'auditLogRetentionDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <h4 className="font-medium">Authentification à deux facteurs obligatoire</h4>
                  <p className="text-sm text-gray-500">Exiger l'A2F pour tous les administrateurs</p>
                </div>
                <button
                  onClick={() => handleSettingChange('security', 'requireTwoFactor', !settings.security.requireTwoFactor)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.security.requireTwoFactor ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.requireTwoFactor ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Paramètres système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille max upload (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.system.maxFileUploadSize}
                    onChange={(e) => handleSettingChange('system', 'maxFileUploadSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fréquence de sauvegarde (jours)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.system.backupFrequencyDays}
                    onChange={(e) => handleSettingChange('system', 'backupFrequencyDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau de log</label>
                  <select
                    value={settings.system.logLevel}
                    onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="ERROR">ERROR</option>
                    <option value="WARN">WARN</option>
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <h4 className="font-medium">Mode maintenance</h4>
                    <p className="text-sm text-gray-500">Désactiver l'accès à l'application pour maintenance</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('system', 'maintenanceMode', !settings.system.maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.system.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.system.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <h4 className="font-medium">Autoriser les inscriptions</h4>
                    <p className="text-sm text-gray-500">Permettre l'inscription de nouveaux utilisateurs</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('system', 'allowRegistrations', !settings.system.allowRegistrations)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.system.allowRegistrations ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.system.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions système */}
          <Card className="rounded-2xl border-gray-200/80 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actions système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="rounded-xl">
                  <Database className="h-4 w-4 mr-2" />
                  Sauvegarder la base de données
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter les logs
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vider le cache
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Test des notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

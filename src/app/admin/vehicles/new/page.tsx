'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    purchaseDate: '',
    purchasePrice: '',
    currentMileage: '',
    lastInspectionDate: '',
    nextInspectionDate: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    franchiseId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/vehicles')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création du véhicule')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du véhicule')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
          Nouveau véhicule
        </h1>
        <p className="text-gray-600 dark:text-neutral-400">
          Ajouter un nouveau véhicule au parc automobile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Plaque d'immatriculation *
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  required
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Numéro VIN *
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  required
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Marque *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Année *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Date d'achat *
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  required
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Prix d'achat (€) *
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  required
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label htmlFor="currentMileage" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Kilométrage actuel
                </label>
                <input
                  type="number"
                  id="currentMileage"
                  name="currentMileage"
                  min="0"
                  value={formData.currentMileage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le véhicule'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

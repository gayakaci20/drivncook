'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Check, Clock, AlertTriangle, Circle, Eye, MapPin, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Franchise {
  id: string
  businessName: string
  address: string
  city: string
  postalCode: string
  region: string
  status: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  vehicles: Array<{
    id: string
    licensePlate: string
    brand: string
    model: string
    status: string
  }>
}

interface FranchiseMapProps {
  franchises: Franchise[]
  onFranchiseClick?: (franchise: Franchise) => void
}

// Custom icons for different statuses with Lucide icons
const createCustomIcon = (status: string) => {
  const config = {
    'ACTIVE': { color: '#10b981', iconSvg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>' },
    'PENDING': { color: '#f59e0b', iconSvg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>' },
    'SUSPENDED': { color: '#ef4444', iconSvg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' },
    'TERMINATED': { color: '#6b7280', iconSvg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' }
  }
  
  const { color, iconSvg } = config[status as keyof typeof config] || config['TERMINATED']
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        ${iconSvg}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

// Component to fit bounds when franchises change
function FitBounds({ franchises }: { franchises: Franchise[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (franchises.length > 0) {
      // Get coordinates from postal codes (simplified - in real app you'd use geocoding)
      const coordinates = franchises.map(franchise => {
        // Simple mapping of some French postal codes to coordinates
        // In a real app, you'd use a geocoding service or store lat/lng in database
        const postalCode = franchise.postalCode
        
        // Paris region
        if (postalCode.startsWith('75') || postalCode.startsWith('92') || postalCode.startsWith('93') || postalCode.startsWith('94')) {
          return [48.8566 + (Math.random() - 0.5) * 0.1, 2.3522 + (Math.random() - 0.5) * 0.1] as [number, number]
        }
        // Marseille region
        if (postalCode.startsWith('13')) {
          return [43.2965 + (Math.random() - 0.5) * 0.1, 5.3698 + (Math.random() - 0.5) * 0.1] as [number, number]
        }
        // Lyon region
        if (postalCode.startsWith('69')) {
          return [45.7640 + (Math.random() - 0.5) * 0.1, 4.8357 + (Math.random() - 0.5) * 0.1] as [number, number]
        }
        // Default to center of France with some random spread
        return [46.6034 + (Math.random() - 0.5) * 2, 1.8883 + (Math.random() - 0.5) * 2] as [number, number]
      })
      
      if (coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates)
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [franchises, map])
  
  return null
}

export default function FranchiseMap({ franchises, onFranchiseClick }: FranchiseMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Generate coordinates for franchises (in a real app, these would come from geocoding or database)
  const franchisesWithCoords = franchises.map(franchise => {
    const postalCode = franchise.postalCode
    let lat, lng
    
    // Simple mapping based on postal codes (replace with real geocoding)
    if (postalCode.startsWith('75') || postalCode.startsWith('92') || postalCode.startsWith('93') || postalCode.startsWith('94')) {
      // Paris region
      lat = 48.8566 + (Math.random() - 0.5) * 0.1
      lng = 2.3522 + (Math.random() - 0.5) * 0.1
    } else if (postalCode.startsWith('13')) {
      // Marseille region  
      lat = 43.2965 + (Math.random() - 0.5) * 0.1
      lng = 5.3698 + (Math.random() - 0.5) * 0.1
    } else if (postalCode.startsWith('69')) {
      // Lyon region
      lat = 45.7640 + (Math.random() - 0.5) * 0.1
      lng = 4.8357 + (Math.random() - 0.5) * 0.1
    } else {
      // Default to center of France with random spread
      lat = 46.6034 + (Math.random() - 0.5) * 2
      lng = 1.8883 + (Math.random() - 0.5) * 2
    }
    
    return {
      ...franchise,
      coordinates: [lat, lng] as [number, number]
    }
  })

  const getStatusLabel = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: 'Actif', color: 'text-green-600' },
      'PENDING': { label: 'En attente', color: 'text-yellow-600' },
      'SUSPENDED': { label: 'Suspendu', color: 'text-red-600' },
      'TERMINATED': { label: 'Terminé', color: 'text-gray-600' }
    }
    return statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'text-gray-600' }
  }

  return (
    <div className="relative h-96 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white/30 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      {/* Top overlay header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[401] p-3">
        <div className="mx-auto w-fit rounded-full border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 shadow-sm px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Carte des franchises</span>
        </div>
      </div>

      {/* Status legend */}
      <div className="pointer-events-auto absolute right-3 bottom-3 z-[401]">
        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 shadow-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Légende</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-200">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-2 w-2 text-white" />
              </div>
              <span>Actif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500">
                <Clock className="h-2 w-2 text-white" />
              </div>
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500">
                <AlertTriangle className="h-2 w-2 text-white" />
              </div>
              <span>Suspendu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-500">
                <Circle className="h-2 w-2 text-white fill-current" />
              </div>
              <span>Terminé</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={[46.6034, 1.8883]} // Center of France
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds franchises={franchises} />
        
        {franchisesWithCoords.map((franchise) => (
          <Marker
            key={franchise.id}
            position={franchise.coordinates}
            icon={createCustomIcon(franchise.status)}
            eventHandlers={{
              click: () => {
                setSelectedFranchise(franchise)
                setPopoverOpen(true)
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Modal overlay avec blur d'arrière-plan */}
      {popoverOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop avec blur */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setPopoverOpen(false)}
          />
          
          {/* Modal content */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl">
            {selectedFranchise && (
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-xl leading-6">
                        {selectedFranchise.user.firstName} {selectedFranchise.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{selectedFranchise.businessName}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${
                    selectedFranchise.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
                    selectedFranchise.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    selectedFranchise.status === 'SUSPENDED' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {getStatusLabel(selectedFranchise.status).label}
                  </span>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                    <div className="text-gray-500 font-medium">Adresse</div>
                    <div className="text-gray-800 dark:text-gray-200">
                      {selectedFranchise.address}<br />
                      {selectedFranchise.city}, {selectedFranchise.postalCode}<br />
                      {selectedFranchise.region}
                    </div>
                    <div className="text-gray-500 font-medium">Email</div>
                    <div className="text-gray-800 dark:text-gray-200">{selectedFranchise.user.email}</div>
                  </div>

                  {selectedFranchise.vehicles.length > 0 && (
                    <div>
                      <div className="text-gray-500 font-medium mb-3">Véhicules ({selectedFranchise.vehicles.length})</div>
                      <div className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/40 p-3 space-y-3">
                        {selectedFranchise.vehicles.slice(0, 3).map(vehicle => (
                          <div key={vehicle.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{vehicle.licensePlate}</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-gray-600 dark:text-gray-300">{vehicle.brand} {vehicle.model}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              vehicle.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {vehicle.status}
                            </span>
                          </div>
                        ))}
                        {selectedFranchise.vehicles.length > 3 && (
                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-neutral-700">
                            +{selectedFranchise.vehicles.length - 3} autre{selectedFranchise.vehicles.length > 4 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPopoverOpen(false)}
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      onFranchiseClick?.(selectedFranchise)
                      setPopoverOpen(false)
                    }}
                    className="flex-1 gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Voir détails
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
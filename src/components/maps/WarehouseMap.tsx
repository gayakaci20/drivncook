'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Building2, MapPin, Check, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

interface Warehouse {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  region: string
  phone?: string | null
  email?: string | null
  advisor?: string | null
  capacity?: number
  isActive: boolean
}

interface WarehouseMapProps {
  warehouses: Warehouse[]
  onWarehouseClick?: (warehouse: Warehouse) => void
}

function createWarehouseIcon(isActive: boolean) {
  const color = isActive ? '#10b981' : '#6b7280'
  const iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/></svg>'
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

function FitBounds({ warehouses }: { warehouses: Warehouse[] }) {
  const map = useMap()
  useEffect(() => {
    if (!warehouses.length) return
    const coords = warehouses.map(w => {
      const pc = w.postalCode || ''
      if (pc.startsWith('75') || pc.startsWith('92') || pc.startsWith('93') || pc.startsWith('94')) return [48.8566 + (Math.random() - 0.5) * 0.1, 2.3522 + (Math.random() - 0.5) * 0.1] as [number, number]
      if (pc.startsWith('13')) return [43.2965 + (Math.random() - 0.5) * 0.1, 5.3698 + (Math.random() - 0.5) * 0.1] as [number, number]
      if (pc.startsWith('69')) return [45.7640 + (Math.random() - 0.5) * 0.1, 4.8357 + (Math.random() - 0.5) * 0.1] as [number, number]
      return [46.6034 + (Math.random() - 0.5) * 2, 1.8883 + (Math.random() - 0.5) * 2] as [number, number]
    })
    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [warehouses, map])
  return null
}

export default function WarehouseMap({ warehouses, onWarehouseClick }: WarehouseMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const points = warehouses.map(w => {
    const pc = w.postalCode || ''
    let lat: number, lng: number
    if (pc.startsWith('75') || pc.startsWith('92') || pc.startsWith('93') || pc.startsWith('94')) { lat = 48.8566 + (Math.random() - 0.5) * 0.1; lng = 2.3522 + (Math.random() - 0.5) * 0.1 }
    else if (pc.startsWith('13')) { lat = 43.2965 + (Math.random() - 0.5) * 0.1; lng = 5.3698 + (Math.random() - 0.5) * 0.1 }
    else if (pc.startsWith('69')) { lat = 45.7640 + (Math.random() - 0.5) * 0.1; lng = 4.8357 + (Math.random() - 0.5) * 0.1 }
    else { lat = 46.6034 + (Math.random() - 0.5) * 2; lng = 1.8883 + (Math.random() - 0.5) * 2 }
    return { ...w, coordinates: [lat, lng] as [number, number] }
  })

  return (
    <>
    <div className="relative h-96 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white/30 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      {/* Top overlay header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[401] p-3">
        <div className="mx-auto w-fit rounded-full border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 shadow-sm px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Carte des entrepôts</span>
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
              <div className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-500">
                <X className="h-2 w-2 text-white" />
              </div>
              <span>Inactif</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={[46.6034, 1.8883]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds warehouses={warehouses} />
        {points.map(w => (
          <Marker 
            key={w.id} 
            position={w.coordinates} 
            icon={createWarehouseIcon(w.isActive)}
            eventHandlers={{
              click: () => {
                setSelectedWarehouse(w)
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
            {selectedWarehouse && (
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-xl leading-6">
                        {selectedWarehouse.name}
                      </div>
                      <div className="text-sm text-gray-500">{selectedWarehouse.city}, {selectedWarehouse.region}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${
                    selectedWarehouse.isActive ? 'bg-green-100 text-green-800 border-green-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {selectedWarehouse.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                    <div className="text-gray-500 font-medium">Adresse</div>
                    <div className="text-gray-800 dark:text-gray-200">
                      {selectedWarehouse.address}<br />
                      {selectedWarehouse.city}, {selectedWarehouse.postalCode}<br />
                      {selectedWarehouse.region}
                    </div>
                    {selectedWarehouse.phone && (
                      <>
                        <div className="text-gray-500 font-medium">Téléphone</div>
                        <div className="text-gray-800 dark:text-gray-200">{selectedWarehouse.phone}</div>
                      </>
                    )}
                    {selectedWarehouse.email && (
                      <>
                        <div className="text-gray-500 font-medium">Email</div>
                        <div className="text-gray-800 dark:text-gray-200">{selectedWarehouse.email}</div>
                      </>
                    )}
                    {selectedWarehouse.advisor && (
                      <>
                        <div className="text-gray-500 font-medium">Conseiller</div>
                        <div className="text-gray-800 dark:text-gray-200">{selectedWarehouse.advisor}</div>
                      </>
                    )}
                    {selectedWarehouse.capacity && (
                      <>
                        <div className="text-gray-500 font-medium">Capacité</div>
                        <div className="text-gray-800 dark:text-gray-200">{selectedWarehouse.capacity.toLocaleString()}</div>
                      </>
                    )}
                  </div>
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
                      onWarehouseClick?.(selectedWarehouse)
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
    </>
  )
}



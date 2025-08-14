'use client'

import React, { useCallback, useState } from 'react'

type IdOption = { id: string; label: string }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...init })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export default function TestPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [log, setLog] = useState<string>('')

  const append = useCallback((msg: string) => setLog(prev => `${new Date().toLocaleTimeString()} - ${msg}\n${prev}`), [])

  const [vehicleId, setVehicleId] = useState('')
  const [franchiseId, setFranchiseId] = useState('')
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [quantity, setQuantity] = useState<number>(5)

  const fetchFirstIds = useCallback(async () => {
    setLoading('init')
    try {
      try {
        const v = await api<any>(`/api/vehicles`)
        const firstVehicle = Array.isArray(v?.data?.items) ? v.data.items[0] : v?.data?.[0]
        if (firstVehicle?.id) setVehicleId(firstVehicle.id)
      } catch {}
      try {
        const w = await api<any>(`/api/warehouses`)
        const firstWarehouse = Array.isArray(w?.data?.items) ? w.data.items[0] : w?.data?.[0]
        if (firstWarehouse?.id) setWarehouseId(firstWarehouse.id)
      } catch {}
      try {
        const p = await api<any>(`/api/products`)
        const firstProduct = Array.isArray(p?.data?.items) ? p.data.items[0] : p?.data?.[0]
        if (firstProduct?.id) setProductId(firstProduct.id)
      } catch {}
      try {
        const f = await api<any>(`/api/franchises`)
        const firstFranchise = Array.isArray(f?.data?.items) ? f.data.items[0] : f?.data?.[0]
        if (firstFranchise?.id) setFranchiseId(firstFranchise.id)
      } catch {}
      append('IDs init OK')
    } catch (e: any) {
      append(`Init error: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [append])

  const assignVehicle = useCallback(async () => {
    if (!vehicleId || !franchiseId) return append('vehicleId et franchiseId requis')
    setLoading('assign')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'vehicle-assigned', adminEmail: 'gaya.kaci2002@hotmail.fr', franchiseeEmail: 'bouzianeyanis26@gmail.com', licensePlate: 'TEST-000-AA' }) })
      append(`Email: véhicule assigné`)
    } catch (e: any) {
      append(`Erreur assign: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [vehicleId, franchiseId, append])

  const simulateEntryFeePaid = useCallback(async () => {
    setLoading('entry-fee')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'entry-fee-paid', adminEmail: 'gaya.kaci2002@hotmail.fr', franchiseeEmail: 'bouzianeyanis26@gmail.com' }) })
      append('Email droits d’entrée envoyé')
    } catch (e: any) {
      append(`Erreur entrée: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [franchiseId, append])

  const restock = useCallback(async () => {
    if (!productId || !warehouseId) return append('productId et warehouseId requis')
    setLoading('stock')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stock-received', adminEmail: 'gaya.kaci2002@hotmail.fr', productName: 'Produit test' }) })
      append('Email stock reçu envoyé')
    } catch (e: any) {
      append(`Erreur stock: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [productId, warehouseId, quantity, append])

  const createOrder = useCallback(async () => {
    setLoading('order')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'order-created', adminEmail: 'gaya.kaci2002@hotmail.fr', franchiseeEmail: 'bouzianeyanis26@gmail.com', orderNumber: 'CMD-TEST-000001' }) })
      setOrderId('CMD-TEST-000001')
      append('Email commande créée envoyé')
    } catch (e: any) {
      append(`Erreur commande: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [franchiseId, append])

  const transmitOrder = useCallback(async () => {
    if (!orderId) return append('orderId requis')
    setLoading('transmit')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'document-transmitted', adminEmail: 'gaya.kaci2002@hotmail.fr', orderNumber: orderId }) })
      append('Email document transmis envoyé (ADMIN)')
    } catch (e: any) {
      append(`Erreur transmission: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [orderId, append])

  const confirmOrder = useCallback(async () => {
    if (!orderId) return append('orderId requis')
    setLoading('confirm')
    try {
      await api<any>(`/api/test/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'order-confirmed', franchiseeEmail: 'bouzianeyanis26@gmail.com', orderNumber: orderId }) })
      append('Email commande confirmée envoyé (FRANCHISEE)')
    } catch (e: any) {
      append(`Erreur confirmation: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [orderId, append])

  const testUnifiedService = useCallback(async () => {
    setLoading('unified')
    try {
      const result = await api<any>(`/api/test/notifications`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'test-unified-service', 
          adminEmail: 'gaya.kaci2002@hotmail.fr', 
          franchiseeEmail: 'bouzianeyanis26@gmail.com' 
        }) 
      })
      append('Test service unifié: notification créée + emails envoyés automatiquement')
      if (result?.results) {
        result.results.forEach((r: any) => {
          if (r.channelResults?.email) {
            append(`- ${r.type}: ${r.channelResults.email.success ? 'Email envoyé' : 'Échec email'}`)
          }
        })
      }
    } catch (e: any) {
      append(`Erreur test unifié: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }, [append])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-xl font-semibold">Page de test notifications/emails</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Références</div>
          <button className="px-3 py-2 rounded bg-gray-100" onClick={fetchFirstIds} disabled={loading==='init'}>
            {loading==='init' ? 'Chargement...' : 'Auto-remplir les IDs'}
          </button>
          <div className="space-y-2">
            <input className="w-full border rounded px-3 py-2" placeholder="franchiseId" value={franchiseId} onChange={e=>setFranchiseId(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="vehicleId" value={vehicleId} onChange={e=>setVehicleId(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="productId" value={productId} onChange={e=>setProductId(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="warehouseId" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="orderId" value={orderId} onChange={e=>setOrderId(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="quantity" type="number" value={quantity} onChange={e=>setQuantity(Number(e.target.value)||0)} />
          </div>
        </div>

        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Actions ADMIN</div>
          <button className="w-full px-3 py-2 rounded bg-red-600 text-white" onClick={assignVehicle} disabled={loading==='assign'}>
            Assigner véhicule ➜ franchisé
          </button>
          <button className="w-full px-3 py-2 rounded bg-red-600 text-white" onClick={restock} disabled={loading==='stock'}>
            Remettre des produits en stock
          </button>
          <button className="w-full px-3 py-2 rounded bg-red-600 text-white" onClick={confirmOrder} disabled={loading==='confirm'}>
            Confirmer réception commande
          </button>
          <button className="w-full px-3 py-2 rounded bg-blue-600 text-white" onClick={testUnifiedService} disabled={loading==='unified'}>
            Tester service unifié (notification + email auto)
          </button>
        </div>

        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Actions FRANCHISEE</div>
          <button className="w-full px-3 py-2 rounded bg-gray-900 text-white" onClick={simulateEntryFeePaid} disabled={loading==='entry-fee'}>
            Payer droits d’entrée (simuler email)
          </button>
          <button className="w-full px-3 py-2 rounded bg-gray-900 text-white" onClick={createOrder} disabled={loading==='order'}>
            Passer commande
          </button>
          <button className="w-full px-3 py-2 rounded bg-gray-900 text-white" onClick={transmitOrder} disabled={loading==='transmit'}>
            Envoyer document de commande
          </button>
        </div>

        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-medium">Journal</div>
          <pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-3 h-64 overflow-auto">{log}</pre>
        </div>
      </div>
    </div>
  )
}



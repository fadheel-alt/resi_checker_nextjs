'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingOrders } from '@/db/database'

interface PendingListProps {
  refreshTrigger: number
}

interface Order {
  id: string
  trackingNumber: string
  orderId?: string
  variationName?: string
  receiverName?: string
  buyerUserName?: string
  jumlah?: string
  shippingMethod?: string
  status: 'pending' | 'scanned'
}

export default function PendingList({ refreshTrigger }: PendingListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      const data = await getPendingOrders()
      setOrders(data)
    } catch (err) {
      console.error('Error loading pending orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders, refreshTrigger])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return null
  }

  const displayOrders = expanded ? orders : orders.slice(0, 5)
  const hasMore = orders.length > 5

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const scannedCount = orders.filter(o => o.status === 'scanned').length

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-800">
          Daftar Pesanan ({pendingCount} pending, {scannedCount} scanned)
        </h2>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Tutup' : `Lihat semua`}
          </button>
        )}
      </div>

      <div className={`space-y-2 ${expanded ? 'max-h-96 overflow-y-auto' : ''}`}>
        {displayOrders.map((order) => {
          const isScanned = order.status === 'scanned'
          const bgColor = isScanned ? 'bg-green-50' : 'bg-yellow-50'
          const borderColor = isScanned ? 'border-green-200' : 'border-yellow-100'
          const trackingColor = isScanned ? 'text-green-800' : 'text-yellow-800'
          const detailColor = isScanned ? 'text-green-600' : 'text-yellow-600'

          return (
            <div
              key={order.id}
              className={`p-2 ${bgColor} border ${borderColor} rounded text-sm`}
            >
              <div className={`font-mono ${trackingColor} break-all`}>
                {order.trackingNumber}
              </div>
              {order.orderId && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Order: {order.orderId}
                </div>
              )}
              {order.buyerUserName && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Pembeli: {order.buyerUserName}
                </div>
              )}
              {order.variationName && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Variasi: {order.variationName}
                </div>
              )}
              {order.receiverName && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Penerima: {order.receiverName}
                </div>
              )}
              {order.jumlah && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Jumlah: {order.jumlah}
                </div>
              )}
              {order.shippingMethod && (
                <div className={`text-xs ${detailColor} mt-1`}>
                  Pengiriman: {order.shippingMethod}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!expanded && hasMore && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          +{orders.length - 5} lainnya
        </p>
      )}
    </div>
  )
}

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-800">
          Pending Orders ({orders.length})
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
        {displayOrders.map((order) => (
          <div
            key={order.id}
            className="p-2 bg-yellow-50 border border-yellow-100 rounded text-sm"
          >
            <div className="font-mono text-yellow-800 break-all">
              {order.trackingNumber}
            </div>
            {order.orderId && (
              <div className="text-xs text-yellow-600 mt-1">
                Order: {order.orderId}
              </div>
            )}
          </div>
        ))}
      </div>

      {!expanded && hasMore && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          +{orders.length - 5} lainnya
        </p>
      )}
    </div>
  )
}

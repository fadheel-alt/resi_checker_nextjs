'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingOrders, resetSelectedScans } from '@/db/database'
import { calculateDeadline, isOrderLate, formatDeadline } from '@/utils/deadlineCalculator'
import SaveToHistoryDialog from '@/components/SaveToHistoryDialog'

interface PendingListProps {
  refreshTrigger: number
  onDataChange?: () => void
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
  orderCreationDate?: string
}

export default function PendingList({ refreshTrigger, onDataChange }: PendingListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isResetting, setIsResetting] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

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

  const toggleSelection = (orderId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(order => order.id)))
    }
  }

  const isAllSelected = orders.length > 0 && selectedIds.size === orders.length

  const handleResetScan = async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `Reset scan untuk ${selectedIds.size} pesanan yang dipilih?`
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      await resetSelectedScans(Array.from(selectedIds))
      setSelectedIds(new Set())
      onDataChange?.()
    } catch (err) {
      console.error('Error resetting scans:', err)
      alert('Gagal reset scan')
    } finally {
      setIsResetting(false)
    }
  }

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
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 font-medium">
            {selectedIds.size} pesanan dipilih
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetScan}
              disabled={isResetting}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isResetting ? 'Mereset...' : 'Reset Scan'}
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            >
              Simpan ke History
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          {/* Select All Checkbox */}
          {orders.length > 0 && (
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              aria-label="Select all"
            />
          )}
          <h2 className="font-semibold text-gray-800">
            Daftar Pesanan ({pendingCount} pending, {scannedCount} scanned)
          </h2>
        </div>
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

          // Calculate deadline
          const deadline = calculateDeadline(order.orderCreationDate)
          const isLate = isOrderLate(deadline, order.status)
          const deadlineText = formatDeadline(deadline)

          return (
            <div
              key={order.id}
              className={`p-2 ${bgColor} border ${borderColor} rounded text-sm ${
                selectedIds.has(order.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Checkbox and Tracking Number Row */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelection(order.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
                  aria-label={`Select ${order.trackingNumber}`}
                />
                <div className="flex-1">
                  <div className={`font-mono ${trackingColor} break-all`}>
                    {order.trackingNumber}
                  </div>

                  {/* Deadline Display */}
                  {deadline && (
                    <div className={`text-xs mt-1 ${isLate ? 'text-red-600 font-semibold' : detailColor}`}>
                      Batas kirim: {deadlineText}
                    </div>
                  )}

                  {/* Existing order details */}
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
              </div>
            </div>
          )
        })}
      </div>

      {!expanded && hasMore && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          +{orders.length - 5} lainnya
        </p>
      )}

      {/* SaveToHistoryDialog */}
      <SaveToHistoryDialog
        isOpen={showSaveDialog}
        selectedIds={Array.from(selectedIds)}
        onClose={() => setShowSaveDialog(false)}
        onSuccess={() => {
          setSelectedIds(new Set())
          onDataChange?.()
        }}
      />
    </div>
  )
}

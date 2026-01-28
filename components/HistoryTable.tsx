'use client'

import { useState } from 'react'

interface ArchivedOrder {
  id: string
  trackingNumber: string
  orderId: string
  variationName?: string
  receiverName?: string
  buyerUserName?: string
  jumlah?: string
  shippingMethod?: string
  status: 'pending' | 'scanned'
  scannedAt: string | null
  createdAt: string
  archivedAt: string
}

interface HistoryTableProps {
  orders: ArchivedOrder[]
  onRestore: (orderId: string) => Promise<void>
  onDelete: (orderId: string) => Promise<void>
}

export default function HistoryTable({ orders, onRestore, onDelete }: HistoryTableProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isRestoringBulk, setIsRestoringBulk] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const handleRestore = async (orderId: string) => {
    const confirmed = window.confirm('Restore pesanan ini kembali ke data aktif?')
    if (!confirmed) return

    setRestoringId(orderId)
    try {
      await onRestore(orderId)
      // Remove from selection after successful restore
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    } catch (err) {
      console.error('Error restoring order:', err)
      alert('Gagal restore pesanan')
    } finally {
      setRestoringId(null)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(`Restore ${selectedIds.size} pesanan yang dipilih kembali ke data aktif?`)
    if (!confirmed) return

    setIsRestoringBulk(true)
    try {
      // Restore all selected orders in parallel
      await Promise.all(
        Array.from(selectedIds).map(id => onRestore(id))
      )
      // Clear selection after successful restore
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error restoring orders:', err)
      alert('Gagal restore beberapa pesanan')
    } finally {
      setIsRestoringBulk(false)
    }
  }

  const handleDelete = async (orderId: string) => {
    const confirmed = window.confirm(
      'PERHATIAN: Hapus permanen pesanan ini dari database?\n\n' +
      'Data yang dihapus tidak dapat dikembalikan!'
    )
    if (!confirmed) return

    setDeletingId(orderId)
    try {
      await onDelete(orderId)
      // Remove from selection after successful delete
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Gagal menghapus pesanan')
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `PERHATIAN: Hapus permanen ${selectedIds.size} pesanan yang dipilih?\n\n` +
      'Data yang dihapus tidak dapat dikembalikan!'
    )
    if (!confirmed) return

    setIsDeletingBulk(true)
    try {
      // Delete all selected orders in parallel
      await Promise.all(
        Array.from(selectedIds).map(id => onDelete(id))
      )
      // Clear selection after successful delete
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error deleting orders:', err)
      alert('Gagal menghapus beberapa pesanan')
    } finally {
      setIsDeletingBulk(false)
    }
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Tidak ada data history
      </div>
    )
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 font-medium">
            {selectedIds.size} pesanan dipilih
          </div>
          <div className="flex gap-2">
            {/* Restore Button */}
            <button
              onClick={handleBulkRestore}
              disabled={isRestoringBulk || isDeletingBulk}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isRestoringBulk ? 'Restoring...' : `Restore ${selectedIds.size} Pesanan`}
            </button>

            {/* Delete Button - NEW */}
            <button
              onClick={handleBulkDelete}
              disabled={isDeletingBulk || isRestoringBulk}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {isDeletingBulk ? 'Deleting...' : `Hapus ${selectedIds.size} Pesanan`}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Tracking Number
              </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Order ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Penerima
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Variasi
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Pembeli
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Diarsipkan
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr
              key={order.id}
              className={`border-b border-gray-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } ${selectedIds.has(order.id) ? 'bg-blue-50' : ''} hover:bg-blue-50 transition-colors`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelection(order.id)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  aria-label={`Select ${order.trackingNumber}`}
                />
              </td>
              <td className="px-4 py-3 text-sm font-mono text-gray-900">
                {order.trackingNumber}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {order.orderId || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {order.receiverName || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {order.variationName || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {order.buyerUserName || '-'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'scanned'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {order.status === 'scanned' ? 'Scanned' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDate(order.archivedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  {/* Restore Button */}
                  <button
                    onClick={() => handleRestore(order.id)}
                    disabled={restoringId === order.id || deletingId === order.id}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {restoringId === order.id ? 'Restoring...' : 'Restore'}
                  </button>

                  {/* Delete Button - NEW */}
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id || restoringId === order.id}
                    className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                  >
                    {deletingId === order.id ? 'Deleting...' : 'Hapus'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

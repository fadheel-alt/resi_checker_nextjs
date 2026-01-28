'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import HistoryTable from '@/components/HistoryTable'
import { getHistoryOrders, restoreOrder, deleteOrder } from '@/db/database'

interface HistoryOrder {
  id: any
  trackingNumber: any
  orderId: any
  variationName: any
  receiverName: any
  buyerUserName: any
  jumlah: any
  shippingMethod: any
  status: any
  scannedAt: any
  createdAt: any
  archivedAt: any
}

export default function DataPesananPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState<HistoryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [daysFilter, setDaysFilter] = useState(7)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHistoryOrders(daysFilter)
      setOrders(data)
    } catch (err) {
      console.error('Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }, [daysFilter])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleRestore = async (orderId: string) => {
    const result = await restoreOrder(orderId)
    if (result.success) {
      // Refresh history list
      loadHistory()
    } else {
      throw new Error('Failed to restore order')
    }
  }

  const handleDelete = async (orderId: string) => {
    const result = await deleteOrder(orderId)
    if (result.success) {
      // Refresh history list
      loadHistory()
    } else {
      throw new Error('Failed to delete order')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} title="Data Pesanan" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">History Data Pesanan</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setDaysFilter(1)}
                className={`px-3 py-1 rounded text-sm ${
                  daysFilter === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setDaysFilter(3)}
                className={`px-3 py-1 rounded text-sm ${
                  daysFilter === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                3 hari
              </button>
              <button
                onClick={() => setDaysFilter(7)}
                className={`px-3 py-1 rounded text-sm ${
                  daysFilter === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                7 hari
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data history dalam {daysFilter} hari terakhir
            </div>
          ) : (
            <HistoryTable orders={orders} onRestore={handleRestore} onDelete={handleDelete} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

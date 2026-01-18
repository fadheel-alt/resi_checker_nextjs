'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStats, clearAllOrders } from '@/db/database'

interface DashboardProps {
  refreshTrigger: number
}

interface StatsData {
  total: number
  scanned: number
  pending: number
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const [stats, setStats] = useState<StatsData>({ total: 0, scanned: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats, refreshTrigger])

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearAllOrders()
      setStats({ total: 0, scanned: 0, pending: 0 })
      setShowConfirm(false)
    } catch (err) {
      console.error('Error clearing data:', err)
    } finally {
      setClearing(false)
    }
  }

  const progressPercent = stats.total > 0 ? Math.round((stats.scanned / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-800">Status</h2>
        {stats.total > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.scanned}</div>
          <div className="text-xs text-green-600">Scanned</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
      </div>

      {/* Empty State */}
      {stats.total === 0 && (
        <p className="mt-3 text-center text-sm text-gray-500">
          Belum ada data. Upload CSV/XLSX terlebih dahulu.
        </p>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Reset Data?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Semua data pesanan akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? 'Menghapus...' : 'Ya, Reset'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={clearing}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

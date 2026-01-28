'use client'

import { useState } from 'react'
import { archiveSelectedOrders } from '@/db/database'

interface SaveToHistoryDialogProps {
  isOpen: boolean
  selectedIds: string[]
  onClose: () => void
  onSuccess: () => void
}

export default function SaveToHistoryDialog({
  isOpen,
  selectedIds,
  onClose,
  onSuccess
}: SaveToHistoryDialogProps) {
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (scannedOnly: boolean) => {
    setIsSaving(true)
    try {
      const result = await archiveSelectedOrders(selectedIds, scannedOnly)

      if (result.success) {
        if (result.archivedCount === 0 && scannedOnly) {
          alert('Tidak ada pesanan yang sudah di-scan dalam pilihan Anda.')
        } else {
          alert(`Berhasil menyimpan ${result.archivedCount} pesanan ke history.`)
        }
        onSuccess()
        onClose()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error archiving orders:', err)
      alert('Gagal menyimpan pesanan ke history')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full">
        <h3 className="font-semibold text-gray-800 mb-2">
          Simpan ke History
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Pilih pesanan yang ingin disimpan ke history:
        </p>

        <div className="space-y-2">
          {/* Option 1: Scanned Only */}
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 text-left"
          >
            <div className="font-semibold">Simpan yang sudah di-scan saja</div>
            <div className="text-xs text-green-100 mt-1">
              Hanya pesanan dengan status "scanned" yang akan disimpan
            </div>
          </button>

          {/* Option 2: All Selected */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-left"
          >
            <div className="font-semibold">Simpan semua</div>
            <div className="text-xs text-blue-100 mt-1">
              Semua {selectedIds.length} pesanan yang dipilih akan disimpan
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isSaving}
          className="w-full mt-3 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </div>
  )
}

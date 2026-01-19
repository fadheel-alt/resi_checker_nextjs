'use client'

import { useState, useRef } from 'react'
import { parseFile, extractOrders } from '@/utils/csvParser'
import { addOrders } from '@/db/database'

interface CsvUploaderProps {
  onImportComplete?: () => void
}

export default function CsvUploader({ onImportComplete }: CsvUploaderProps) {
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [mapping, setMapping] = useState({
    trackingColumn: '',
    orderColumn: '',
    variationColumn: '',
    receiverColumn: '',
    buyerColumn: '',
    jumlahColumn: '',
    shippingMethodColumn: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)
    setParsing(true)

    try {
      const data = await parseFile(file)
      setParsedData(data)
      setMapping({
        trackingColumn: data.suggestedMapping.trackingColumn || '',
        orderColumn: data.suggestedMapping.orderColumn || '',
        variationColumn: data.suggestedMapping.variationColumn || '',
        receiverColumn: data.suggestedMapping.receiverColumn || '',
        buyerColumn: data.suggestedMapping.buyerColumn || '',
        jumlahColumn: data.suggestedMapping.jumlahColumn || '',
        shippingMethodColumn: data.suggestedMapping.shippingMethodColumn || ''
      })
    } catch (err: any) {
      setError(err.message)
      setParsedData(null)
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!parsedData || !mapping.trackingColumn) {
      setError('Pilih kolom tracking number terlebih dahulu')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const { orders, errors: parseErrors } = extractOrders(
        parsedData.rows,
        mapping.trackingColumn,
        mapping.orderColumn,
        mapping.variationColumn,
        mapping.receiverColumn,
        mapping.buyerColumn,
        mapping.jumlahColumn,
        mapping.shippingMethodColumn
      )

      if (orders.length === 0) {
        setError('Tidak ada data valid untuk diimport')
        return
      }

      const dbResult = await addOrders(orders)

      setResult({
        success: dbResult.success,
        duplicates: dbResult.duplicates.length,
        parseErrors: parseErrors.length,
        total: parsedData.rows.length
      })

      // Reset state
      setParsedData(null)
      setMapping({
        trackingColumn: '',
        orderColumn: '',
        variationColumn: '',
        receiverColumn: '',
        buyerColumn: '',
        jumlahColumn: '',
        shippingMethodColumn: ''
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onImportComplete?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleCancel = () => {
    setParsedData(null)
    setMapping({
      trackingColumn: '',
      orderColumn: '',
      variationColumn: '',
      receiverColumn: '',
      buyerColumn: '',
      jumlahColumn: '',
      shippingMethodColumn: ''
    })
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 mb-3">Upload Data Pesanan</h2>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileSelect}
        disabled={parsing || importing}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      />

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          <p className="font-medium">Import berhasil!</p>
          <p>{result.success} pesanan ditambahkan</p>
          {result.duplicates > 0 && (
            <p className="text-yellow-700">{result.duplicates} duplicate diabaikan</p>
          )}
          {result.parseErrors > 0 && (
            <p className="text-yellow-700">{result.parseErrors} baris error</p>
          )}
        </div>
      )}

      {/* Parsing indicator */}
      {parsing && (
        <div className="mt-3 text-gray-600 text-sm">Membaca file...</div>
      )}

      {/* Column Mapping */}
      {parsedData && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-gray-50 rounded text-sm">
            <span className="text-gray-600">Ditemukan </span>
            <span className="font-medium">{parsedData.rows.length}</span>
            <span className="text-gray-600"> baris data</span>
          </div>

          {/* Tracking Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Tracking Number *
            </label>
            <select
              value={mapping.trackingColumn}
              onChange={(e) => setMapping({ ...mapping, trackingColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Order ID Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Order ID (opsional)
            </label>
            <select
              value={mapping.orderColumn}
              onChange={(e) => setMapping({ ...mapping, orderColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Variation Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Nama Variasi (opsional)
            </label>
            <select
              value={mapping.variationColumn}
              onChange={(e) => setMapping({ ...mapping, variationColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Receiver Name Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Nama Penerima (opsional)
            </label>
            <select
              value={mapping.receiverColumn}
              onChange={(e) => setMapping({ ...mapping, receiverColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer User Name Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Nama Pembeli (opsional)
            </label>
            <select
              value={mapping.buyerColumn}
              onChange={(e) => setMapping({ ...mapping, buyerColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Jumlah (opsional)
            </label>
            <select
              value={mapping.jumlahColumn}
              onChange={(e) => setMapping({ ...mapping, jumlahColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Shipping Method Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolom Metode Pengiriman (opsional)
            </label>
            <select
              value={mapping.shippingMethodColumn}
              onChange={(e) => setMapping({ ...mapping, shippingMethodColumn: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Kolom --</option>
              {parsedData.headers.map((header: string) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Preview (5 baris pertama)</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border-b text-left">Tracking</th>
                    <th className="px-2 py-1 border-b text-left">Order ID</th>
                    <th className="px-2 py-1 border-b text-left">Pembeli</th>
                    <th className="px-2 py-1 border-b text-left">Variasi</th>
                    <th className="px-2 py-1 border-b text-left">Penerima</th>
                    <th className="px-2 py-1 border-b text-left">Jumlah</th>
                    <th className="px-2 py-1 border-b text-left">Pengiriman</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row: any, i: number) => {
                    // Extract variation if product_info column is selected
                    let variationPreview = '-'
                    if (mapping.variationColumn) {
                      const rawValue = row[mapping.variationColumn] || ''
                      if (mapping.variationColumn.toLowerCase() === 'product_info') {
                        const match = rawValue.match(/Nama Variasi:([^;]+?)(?:;\s*Harga:|Harga:)/i)
                        variationPreview = match ? match[1].trim() : '-'
                      } else {
                        variationPreview = rawValue || '-'
                      }
                    }

                    return (
                      <tr key={i} className="border-b">
                        <td className="px-2 py-1 font-mono">
                          {mapping.trackingColumn ? row[mapping.trackingColumn] || '-' : '-'}
                        </td>
                        <td className="px-2 py-1">
                          {mapping.orderColumn ? row[mapping.orderColumn] || '-' : '-'}
                        </td>
                        <td className="px-2 py-1">
                          {mapping.buyerColumn ? row[mapping.buyerColumn] || '-' : '-'}
                        </td>
                        <td className="px-2 py-1 max-w-xs truncate" title={variationPreview}>
                          {variationPreview}
                        </td>
                        <td className="px-2 py-1">
                          {mapping.receiverColumn ? row[mapping.receiverColumn] || '-' : '-'}
                        </td>
                        <td className="px-2 py-1">
                          {mapping.jumlahColumn ? row[mapping.jumlahColumn] || '-' : '-'}
                        </td>
                        <td className="px-2 py-1">
                          {mapping.shippingMethodColumn ? row[mapping.shippingMethodColumn] || '-' : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing || !mapping.trackingColumn}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {importing ? 'Mengimport...' : 'Import Data'}
            </button>
            <button
              onClick={handleCancel}
              disabled={importing}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

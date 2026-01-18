import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Auto-detect column names untuk Shopee format
const TRACKING_COLUMN_NAMES = ['tracking_number', 'tracking_no', 'no_resi', 'resi', 'awb']
const ORDER_COLUMN_NAMES = ['order_sn', 'order_id', 'orderid', 'no_pesanan']

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
  suggestedMapping: {
    trackingColumn: string | null
    orderColumn: string | null
  }
}

interface ExtractedOrders {
  orders: Array<{ trackingNumber: string; orderId: string }>
  errors: Array<{ row: number; reason: string }>
}

function findColumn(headers: string[], possibleNames: string[]): string | null {
  const lowerHeaders = headers.map(h => h?.toLowerCase().trim())
  for (const name of possibleNames) {
    const index = lowerHeaders.indexOf(name.toLowerCase())
    if (index !== -1) {
      return headers[index]
    }
  }
  return null
}

// Parse XLSX file
function parseXLSX(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        if (jsonData.length < 2) {
          reject(new Error('File kosong atau tidak ada data'))
          return
        }

        const headers = jsonData[0].map(h => String(h || '').trim())
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? String(row[index]).trim() : ''
          })
          return obj
        })

        resolve({ headers, rows })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

// Parse CSV file
function parseCSV(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parse warnings:', results.errors)
        }
        const headers = results.meta.fields || []
        const rows = results.data.map((row: any) => {
          const obj: Record<string, string> = {}
          headers.forEach(header => {
            obj[header] = String(row[header] || '').trim()
          })
          return obj
        })
        resolve({ headers, rows })
      },
      error: (error) => reject(error)
    })
  })
}

// Main parse function
export async function parseFile(file: File): Promise<ParsedData> {
  const fileName = file.name.toLowerCase()
  let result

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    result = await parseXLSX(file)
  } else if (fileName.endsWith('.csv')) {
    result = await parseCSV(file)
  } else {
    throw new Error('Format file tidak didukung. Gunakan CSV atau XLSX.')
  }

  // Auto-detect columns
  const trackingColumn = findColumn(result.headers, TRACKING_COLUMN_NAMES)
  const orderColumn = findColumn(result.headers, ORDER_COLUMN_NAMES)

  return {
    headers: result.headers,
    rows: result.rows,
    suggestedMapping: {
      trackingColumn,
      orderColumn
    }
  }
}

// Extract orders dari parsed data dengan mapping
export function extractOrders(
  rows: Record<string, string>[],
  trackingColumn: string,
  orderColumn: string
): ExtractedOrders {
  const orders: Array<{ trackingNumber: string; orderId: string }> = []
  const errors: Array<{ row: number; reason: string }> = []
  const seen = new Set<string>()

  rows.forEach((row, index) => {
    const trackingNumber = row[trackingColumn]?.trim()
    const orderId = row[orderColumn]?.trim() || ''

    // Skip jika tracking kosong
    if (!trackingNumber) {
      errors.push({ row: index + 2, reason: 'Tracking number kosong' })
      return
    }

    // Cek duplicate dalam file
    if (seen.has(trackingNumber)) {
      errors.push({ row: index + 2, reason: `Duplicate: ${trackingNumber}` })
      return
    }

    seen.add(trackingNumber)
    orders.push({ trackingNumber, orderId })
  })

  return { orders, errors }
}

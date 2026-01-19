import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Auto-detect column names untuk Shopee format
const TRACKING_COLUMN_NAMES = ['tracking_number', 'tracking_no', 'no_resi', 'resi', 'awb']
const ORDER_COLUMN_NAMES = ['order_sn', 'order_id', 'orderid', 'no_pesanan']
const VARIATION_COLUMN_NAMES = ['product_info', 'variasi', 'variation_name', 'nama_variasi']
const RECEIVER_COLUMN_NAMES = ['order_receiver_name', 'receiver_name', 'nama_penerima', 'penerima']
const BUYER_COLUMN_NAMES = ['buyer_user_name', 'buyer_username', 'nama_pembeli', 'pembeli']
const JUMLAH_COLUMN_NAMES = ['jumlah', 'quantity', 'qty', 'amount']
const SHIPPING_METHOD_COLUMN_NAMES = ['shipping_method', 'metode_pengiriman', 'pengiriman', 'kurir']

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
  suggestedMapping: {
    trackingColumn: string | null
    orderColumn: string | null
    variationColumn: string | null
    receiverColumn: string | null
    buyerColumn: string | null
    jumlahColumn: string | null
    shippingMethodColumn: string | null
  }
}

interface ExtractedOrders {
  orders: Array<{
    trackingNumber: string
    orderId: string
    variationName?: string
    receiverName?: string
    buyerUserName?: string
    jumlah?: string
    shippingMethod?: string
  }>
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

// Extract variation name from product_info column
// Format: "...Nama Variasi:Flamingo,180x120x10 - 2 orang; Harga: Rp 269,000..."
function extractVariationFromProductInfo(productInfo: string): string {
  if (!productInfo) return ''
  const match = productInfo.match(/Nama Variasi:([^;]+?)(?:;\s*Harga:|Harga:)/i)
  return match ? match[1].trim() : ''
}

// Extract jumlah from product_info column
// Format: "...Jumlah: 1; Nomor Referensi SKU: A;..."
function extractJumlahFromProductInfo(productInfo: string): string {
  if (!productInfo) return ''
  const match = productInfo.match(/Jumlah:\s*(\d+)/i)
  return match ? match[1].trim() : ''
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
  const variationColumn = findColumn(result.headers, VARIATION_COLUMN_NAMES)
  const receiverColumn = findColumn(result.headers, RECEIVER_COLUMN_NAMES)
  const buyerColumn = findColumn(result.headers, BUYER_COLUMN_NAMES)
  const jumlahColumn = findColumn(result.headers, JUMLAH_COLUMN_NAMES)
  const shippingMethodColumn = findColumn(result.headers, SHIPPING_METHOD_COLUMN_NAMES)

  return {
    headers: result.headers,
    rows: result.rows,
    suggestedMapping: {
      trackingColumn,
      orderColumn,
      variationColumn,
      receiverColumn,
      buyerColumn,
      jumlahColumn,
      shippingMethodColumn
    }
  }
}

// Extract orders dari parsed data dengan mapping
export function extractOrders(
  rows: Record<string, string>[],
  trackingColumn: string,
  orderColumn: string,
  variationColumn?: string,
  receiverColumn?: string,
  buyerColumn?: string,
  jumlahColumn?: string,
  shippingMethodColumn?: string
): ExtractedOrders {
  const orders: Array<{
    trackingNumber: string
    orderId: string
    variationName?: string
    receiverName?: string
    buyerUserName?: string
    jumlah?: string
    shippingMethod?: string
  }> = []
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

    // Extract variation name
    let variationName = ''
    if (variationColumn) {
      const rawValue = row[variationColumn]?.trim() || ''
      // If column is product_info, extract variation using regex
      if (variationColumn.toLowerCase() === 'product_info') {
        variationName = extractVariationFromProductInfo(rawValue)
      } else {
        // Otherwise use the column value directly
        variationName = rawValue
      }
    }

    // Extract receiver name
    const receiverName = receiverColumn ? row[receiverColumn]?.trim() || '' : ''

    // Extract buyer user name
    const buyerUserName = buyerColumn ? row[buyerColumn]?.trim() || '' : ''

    // Extract jumlah
    let jumlah = ''
    if (jumlahColumn) {
      const rawValue = row[jumlahColumn]?.trim() || ''
      jumlah = rawValue
    } else if (variationColumn && variationColumn.toLowerCase() === 'product_info') {
      // If no jumlah column specified, try to extract from product_info
      const rawValue = row[variationColumn]?.trim() || ''
      jumlah = extractJumlahFromProductInfo(rawValue)
    }

    // Extract shipping method
    const shippingMethod = shippingMethodColumn ? row[shippingMethodColumn]?.trim() || '' : ''

    seen.add(trackingNumber)
    orders.push({
      trackingNumber,
      orderId,
      variationName: variationName || undefined,
      receiverName: receiverName || undefined,
      buyerUserName: buyerUserName || undefined,
      jumlah: jumlah || undefined,
      shippingMethod: shippingMethod || undefined
    })
  })

  return { orders, errors }
}

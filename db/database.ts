import { supabase } from '@/lib/supabase'

interface Order {
  orderId: string
  trackingNumber: string
  variationName?: string
  receiverName?: string
  buyerUserName?: string
  jumlah?: string
  shippingMethod?: string
}

interface AddOrdersResult {
  success: number
  duplicates: string[]
  errors: Array<{ tracking: string; error: string }>
}

interface MarkAsScannedResult {
  success: boolean
  reason?: string
  order?: any
  error?: string
}

interface StatsResult {
  total: number
  scanned: number
  pending: number
}

// Add orders from CSV/XLSX
export async function addOrders(orders: Order[]): Promise<AddOrdersResult> {
  const results: AddOrdersResult = { success: 0, duplicates: [], errors: [] }

  for (const order of orders) {
    const { error } = await supabase
      .from('orders')
      .insert({
        order_id: order.orderId,
        tracking_number: order.trackingNumber,
        variation_name: order.variationName || null,
        receiver_name: order.receiverName || null,
        buyer_user_name: order.buyerUserName || null,
        jumlah: order.jumlah || null,
        shipping_method: order.shippingMethod || null,
        status: 'pending'
      })
      .select()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        results.duplicates.push(order.trackingNumber)
      } else {
        results.errors.push({ tracking: order.trackingNumber, error: error.message })
      }
    } else {
      results.success++
    }
  }

  return results
}

// Get order by tracking number (active orders only)
export async function getByTracking(trackingNumber: string) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('tracking_number', trackingNumber.trim())
    .is('archived_at', null)
    .single()

  return data
}

// Mark as scanned
export async function markAsScanned(trackingNumber: string): Promise<MarkAsScannedResult> {
  const order = await getByTracking(trackingNumber)

  if (!order) {
    return { success: false, reason: 'not_found' }
  }

  if (order.status === 'scanned') {
    return { success: false, reason: 'already_scanned', order }
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'scanned',
      scanned_at: new Date().toISOString()
    })
    .eq('id', order.id)

  if (error) {
    return { success: false, reason: 'error', error: error.message }
  }

  return { success: true, order }
}

// Get stats (active orders only)
export async function getStats(): Promise<StatsResult> {
  const { count: total } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null)

  const { count: scanned } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scanned')
    .is('archived_at', null)

  return {
    total: total || 0,
    scanned: scanned || 0,
    pending: (total || 0) - (scanned || 0)
  }
}

// Get pending orders (active orders only, returns all orders with status for green/yellow display)
export async function getPendingOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .is('archived_at', null)
    .order('status', { ascending: true }) // pending first, then scanned
    .order('created_at', { ascending: false })

  return (data || []).map((order: any) => ({
    id: order.id,
    trackingNumber: order.tracking_number,
    orderId: order.order_id,
    variationName: order.variation_name,
    receiverName: order.receiver_name,
    buyerUserName: order.buyer_user_name,
    jumlah: order.jumlah,
    shippingMethod: order.shipping_method,
    status: order.status
  }))
}

// Clear all orders (keep for backward compatibility, but prefer archiving)
export async function clearAllOrders() {
  const { error } = await supabase
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  return { success: !error, error }
}

// Archive all active orders
export async function archiveAllOrders(): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase
    .from('orders')
    .update({ archived_at: new Date().toISOString() })
    .is('archived_at', null)

  return { success: !error, error }
}

// Reset scan - set all active orders back to pending status
export async function resetScan() {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'pending',
      scanned_at: null
    })
    .eq('status', 'scanned')
    .is('archived_at', null)

  return { success: !error, error }
}

// Get archived orders from last N days
export async function getHistoryOrders(daysBack: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  const { data } = await supabase
    .from('orders')
    .select('*')
    .not('archived_at', 'is', null)
    .gte('archived_at', cutoffDate.toISOString())
    .order('archived_at', { ascending: false })

  return (data || []).map((order: any) => ({
    id: order.id,
    trackingNumber: order.tracking_number,
    orderId: order.order_id,
    variationName: order.variation_name,
    receiverName: order.receiver_name,
    buyerUserName: order.buyer_user_name,
    jumlah: order.jumlah,
    shippingMethod: order.shipping_method,
    status: order.status,
    scannedAt: order.scanned_at,
    createdAt: order.created_at,
    archivedAt: order.archived_at
  }))
}

// Restore order back to active state
export async function restoreOrder(orderId: string): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase
    .from('orders')
    .update({ archived_at: null })
    .eq('id', orderId)

  return { success: !error, error }
}

// Auto-cleanup old archived data
export async function cleanupOldHistory(daysToKeep: number = 7): Promise<{ success: boolean; deletedCount: number; error?: any }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const { data, error } = await supabase
    .from('orders')
    .delete()
    .not('archived_at', 'is', null)
    .lt('archived_at', cutoffDate.toISOString())
    .select()

  return {
    success: !error,
    deletedCount: data?.length || 0,
    error
  }
}

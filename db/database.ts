import { supabase } from '@/lib/supabase'

interface Order {
  orderId: string
  trackingNumber: string
  variationName?: string
  receiverName?: string
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
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_id: order.orderId,
        tracking_number: order.trackingNumber,
        variation_name: order.variationName || null,
        receiver_name: order.receiverName || null,
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

// Get order by tracking number
export async function getByTracking(trackingNumber: string) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('tracking_number', trackingNumber.trim())
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

// Get stats
export async function getStats(): Promise<StatsResult> {
  const { count: total } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: scanned } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scanned')

  return {
    total: total || 0,
    scanned: scanned || 0,
    pending: (total || 0) - (scanned || 0)
  }
}

// Get pending orders (now returns all orders with status for green/yellow display)
export async function getPendingOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('status', { ascending: true }) // pending first, then scanned
    .order('created_at', { ascending: false })

  return (data || []).map((order: any) => ({
    id: order.id,
    trackingNumber: order.tracking_number,
    orderId: order.order_id,
    variationName: order.variation_name,
    receiverName: order.receiver_name,
    status: order.status
  }))
}

// Clear all orders
export async function clearAllOrders() {
  const { error } = await supabase
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  return { success: !error, error }
}

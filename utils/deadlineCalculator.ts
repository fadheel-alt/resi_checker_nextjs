/**
 * Calculate delivery deadline (batas kirim) based on order creation time
 * Rule:
 * - Created before 12:00 → deadline is same day 23:59
 * - Created after 12:00 → deadline is next day 23:59
 */
export function calculateDeadline(orderCreationDate: string | null | undefined): Date | null {
  if (!orderCreationDate) return null

  try {
    const createdDate = new Date(orderCreationDate)

    // Validate date
    if (isNaN(createdDate.getTime())) return null

    const hour = createdDate.getHours()

    // Create deadline date
    const deadline = new Date(createdDate)

    // Set time to 23:59:59.999
    deadline.setHours(23, 59, 59, 999)

    // If created after 12:00 (noon), deadline is next day
    if (hour >= 12) {
      deadline.setDate(deadline.getDate() + 1)
    }

    return deadline
  } catch (error) {
    console.error('Error calculating deadline:', error)
    return null
  }
}

/**
 * Check if an order is late
 * An order is late if:
 * 1. It has a deadline
 * 2. Current time > deadline
 * 3. Status is still 'pending'
 */
export function isOrderLate(
  deadline: Date | null,
  status: 'pending' | 'scanned'
): boolean {
  if (!deadline) return false
  if (status !== 'pending') return false

  const now = new Date()
  return now > deadline
}

/**
 * Format deadline for display
 * Example output: "28 Jan, 23:59" or "29 Jan, 23:59"
 */
export function formatDeadline(deadline: Date | null): string {
  if (!deadline) return '-'

  return deadline.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

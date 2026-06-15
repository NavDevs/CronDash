/**
 * Cron expression validation and utilities
 */

import parser from 'cron-parser'

export interface CronValidationResult {
  valid: boolean
  error?: string
  description?: string
}

// Simple cron expression validator (5-field standard)
function isValidCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const range = (field: string, min: number, max: number): boolean => {
    if (field === "*") return true
    if (field.startsWith("*/")) {
      const n = parseInt(field.slice(2))
      return !isNaN(n) && n > 0 && n <= max
    }
    if (field.includes(",")) {
      return field.split(",").every((p) => range(p.trim(), min, max))
    }
    if (field.includes("-")) {
      const [lo, hi] = field.split("-").map(Number)
      return !isNaN(lo) && !isNaN(hi) && lo >= min && hi <= max && lo <= hi
    }
    const n = parseInt(field)
    return !isNaN(n) && n >= min && n <= max
  }

  return (
    range(parts[0], 0, 59) && // minute
    range(parts[1], 0, 23) && // hour
    range(parts[2], 1, 31) && // day of month
    range(parts[3], 1, 12) && // month
    range(parts[4], 0, 7)    // day of week (0=Sun, 7=Sun)
  )
}

/**
 * Validate a cron expression and return a human-readable description
 */
export function validateCronExpression(expression: string): CronValidationResult {
  if (!expression || expression.trim() === '') {
    return {
      valid: false,
      error: 'Cron expression is required',
    }
  }

  // Check if it's a valid cron expression
  if (!isValidCronExpression(expression)) {
    return {
      valid: false,
      error: 'Invalid cron expression format',
    }
  }

  // Generate human-readable description
  const description = describeCronExpression(expression)

  return {
    valid: true,
    description,
  }
}

/**
 * Convert cron expression to human-readable description
 */
export function describeCronExpression(expression: string): string {
  const parts = expression.trim().split(/\s+/)

  if (parts.length !== 5) {
    return 'Custom schedule'
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  // Every minute
  if (expression === '* * * * *') {
    return 'Every minute'
  }

  // Every X minutes
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = minute.split('/')[1]
    return `Every ${interval} minutes`
  }

  // Every X hours
  if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = hour.split('/')[1]
    return `Every ${interval} hours`
  }

  // Daily at specific hour
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const h = parseInt(hour)
    const m = parseInt(minute)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    const displayMin = m.toString().padStart(2, '0')
    return `Daily at ${displayHour}:${displayMin} ${ampm}`
  }

  // Weekly on specific day
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayNum = parseInt(dayOfWeek)
    const dayName = days[dayNum] || 'Unknown'
    
    if (hour !== '*' && minute !== '*') {
      const h = parseInt(hour)
      const m = parseInt(minute)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayHour = h % 12 || 12
      const displayMin = m.toString().padStart(2, '0')
      return `Every ${dayName} at ${displayHour}:${displayMin} ${ampm}`
    }
    
    return `Every ${dayName}`
  }

  // Monthly on specific day
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    const day = parseInt(dayOfMonth)
    return `Monthly on day ${day}`
  }

  return 'Custom schedule'
}

/**
 * Calculate the next run time for a cron expression
 * Returns Date object for the next scheduled execution
 */
export function getNextRunTime(expression: string): Date | null {
  if (!isValidCronExpression(expression)) {
    return null
  }

  try {
    const interval = parser.parse(expression)
    return interval.next().toDate()
  } catch (err) {
    return null
  }
}

/**
 * Common cron presets for quick selection
 */
export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Weekly on Monday', value: '0 9 * * 1' },
  { label: 'Monthly on 1st', value: '0 0 1 * *' },
]
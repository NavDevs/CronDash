/**
 * Simple in-memory rate limiter for API routes
 * 
 * Tracks failed login attempts by IP
 * Resets after successful login
 * Blocks after 5 failed attempts for 15 minutes
 */

// In-memory store (resets on server restart)
// For production, use Redis or a database
const attempts = new Map<string, { count: number; lastAttempt: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes in ms
const WINDOW_DURATION = 15 * 60 * 1000 // 15 minute window

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; waitSeconds: number } {
  const now = Date.now()
  const record = attempts.get(ip)

  // No previous attempts
  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, waitSeconds: 0 }
  }

  // Check if blocked
  if (record.count >= MAX_ATTEMPTS) {
    const timePassed = now - record.lastAttempt
    
    if (timePassed < BLOCK_DURATION) {
      const waitSeconds = Math.ceil((BLOCK_DURATION - timePassed) / 1000)
      return { allowed: false, remaining: 0, waitSeconds }
    } else {
      // Block expired, reset
      attempts.delete(ip)
      return { allowed: true, remaining: MAX_ATTEMPTS, waitSeconds: 0 }
    }
  }

  // Check if window expired (reset count after 15 minutes of no attempts)
  if (now - record.lastAttempt > WINDOW_DURATION) {
    attempts.delete(ip)
    return { allowed: true, remaining: MAX_ATTEMPTS, waitSeconds: 0 }
  }

  return {
    allowed: true,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count - 1),
    waitSeconds: 0,
  }
}

export function recordFailedAttempt(ip: string): void {
  const record = attempts.get(ip)

  if (!record) {
    attempts.set(ip, { count: 1, lastAttempt: Date.now() })
  } else {
    record.count++
    record.lastAttempt = Date.now()
  }
}

export function recordSuccessfulLogin(ip: string): void {
  // Clear attempts on successful login
  attempts.delete(ip)
}

export function getClientIP(request: Request): string {
  // Check common headers for real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (will work in local dev)
  return '127.0.0.1'
}
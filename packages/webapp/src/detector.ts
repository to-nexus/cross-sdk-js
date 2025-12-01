/**
 * Check if running on client side
 */
function isClient(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

/**
 * Detect if running in CROSSx environment
 *
 * Detection order:
 * 1. Check for native bridge object (window.crossxNativeBridge)
 * 2. Check for CROSSx marker (window.__crossx)
 * 3. Check user agent string for CROSSx
 */
export function isCROSSxEnvironment(): boolean {
  if (!isClient()) {
    return false
  }

  // 1. Check for native bridge
  if (window.crossxNativeBridge !== undefined) {
    return true
  }

  // 2. Check for CROSSx marker
  if (window.__crossx !== undefined) {
    return true
  }

  // 3. Check user agent (case-insensitive)
  // Matches: CROSSx, crossx, Crossx, etc.
  const ua = window.navigator.userAgent
  return /crossx/i.test(ua)
}

/**
 * Get current environment type
 */
export function getEnvironmentType(): 'crossx' | 'browser' {
  return isCROSSxEnvironment() ? 'crossx' : 'browser'
}

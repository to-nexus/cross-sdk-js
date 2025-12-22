import type { CROSSxBrowserMarker } from './types.js'

/**
 * Check if running on client side
 */
function isClient(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

/**
 * Check if __crossx marker is a valid CROSSxBrowserMarker object
 */
function isCROSSxBrowserMarker(value: unknown): value is CROSSxBrowserMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    'browser' in value &&
    (value as CROSSxBrowserMarker).browser === true &&
    'version' in value &&
    typeof (value as CROSSxBrowserMarker).version === 'string' &&
    'platform' in value &&
    ['ios', 'android', 'desktop'].includes((value as CROSSxBrowserMarker).platform)
  )
}

/**
 * Get CROSSx browser marker info if available
 * @returns CROSSxBrowserMarker object or null
 */
export function getCROSSxBrowserInfo(): CROSSxBrowserMarker | null {
  if (!isClient()) {
    return null
  }

  const marker = window.__crossx
  if (isCROSSxBrowserMarker(marker)) {
    return marker
  }

  return null
}

/**
 * Detect if running in CROSSx environment
 *
 * Detection order:
 * 1. Check for native bridge object (window.crossxNativeBridge)
 * 2. Check for CROSSx marker (window.__crossx) - supports both boolean and object form
 * 3. Check user agent string for CROSSx (fallback for backward compatibility)
 */
export function isCROSSxEnvironment(): boolean {
  if (!isClient()) {
    return false
  }

  // 1. Check for native bridge
  if (window.crossxNativeBridge !== undefined) {
    return true
  }

  // 2. Check for CROSSx marker (supports both boolean and CROSSxBrowserMarker object)
  if (window.__crossx !== undefined) {
    // Boolean form (legacy)
    if (window.__crossx === true) {
      return true
    }
    // Object form (new CROSSxBrowserMarker)
    if (isCROSSxBrowserMarker(window.__crossx)) {
      return true
    }
  }

  // #region LEGACY_USERAGENT_FALLBACK
  // TODO: Remove this fallback once all CROSSx wallets support JS injection (window.__crossx)
  // @deprecated userAgent-based detection - will be removed in future version
  // 3. Check user agent (case-insensitive) - fallback for backward compatibility
  // Matches: CROSSx, crossx, Crossx, etc.
  const ua = window.navigator.userAgent
  return /crossx/i.test(ua)
  // #endregion LEGACY_USERAGENT_FALLBACK
}

/**
 * Get current environment type
 */
export function getEnvironmentType(): 'crossx' | 'browser' {
  return isCROSSxEnvironment() ? 'crossx' : 'browser'
}

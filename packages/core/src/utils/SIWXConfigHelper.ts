import type { CaipNetworkId } from '@to-nexus/appkit-common'

import { AccountController } from '../controllers/AccountController.js'
import type { SIWXConfig, SIWXMessage, SIWXSession } from './SIWXUtil.js'

/**
 * Options for creating a default SIWX configuration
 *
 * @remarks
 * DApp developers can customize the following options:
 *
 * **Frequently customized (recommended to set):**
 * - `statement`: Custom message to display to users
 * - `addSession`, `getSessions`: For backend verification
 *
 * **Occasionally customized:**
 * - `domain`, `uri`: Defaults to window.location (usually no need to change)
 * - `expirationTime`: Session validity period (default: 24 hours)
 *
 * **Rarely customized:**
 * - `revokeSession`, `setSessions`: Advanced session management
 * - `getRequired`: Whether SIWE is mandatory (default: false - optional)
 *
 * **Automatically handled (fixed values):**
 * - `version`: Fixed to '1'
 * - `issuedAt`: Current timestamp
 * - `toString()`: Standard SIWE format
 */
export interface CreateSIWXConfigOptions {
  // === Frequently customized ===

  /**
   * Custom statement for SIWE message
   * @default "Sign in with your wallet"
   * @example "Sign in to My DApp"
   * @recommended Set this to match your DApp's brand
   */
  statement?: string

  /**
   * Get nonce from backend (CRITICAL for security)
   * @default Generates random nonce client-side (NOT SECURE for production)
   * @example
   * ```typescript
   * getNonce: async () => {
   *   const response = await fetch('/api/siwe/nonce')
   *   const { nonce } = await response.json()
   *   return nonce
   * }
   * ```
   * @recommended MUST implement backend nonce generation for production
   * @security Prevents replay attacks by ensuring nonces are single-use
   */
  getNonce?: () => Promise<string>

  /**
   * Custom session storage handler
   * @default Saves to localStorage
   * @example
   * ```typescript
   * addSession: async (session) => {
   *   await fetch('/api/siwe/verify', {
   *     method: 'POST',
   *     body: JSON.stringify(session)
   *   })
   * }
   * ```
   * @recommended Implement backend verification for production
   */
  addSession?: (session: SIWXSession) => Promise<void>

  /**
   * Custom sessions getter
   * @default Retrieves from localStorage
   * @example
   * ```typescript
   * getSessions: async (chainId, address) => {
   *   const response = await fetch(`/api/siwe/sessions?chain=${chainId}&address=${address}`)
   *   return response.json()
   * }
   * ```
   * @recommended Implement backend retrieval for production
   */
  getSessions?: (chainId: CaipNetworkId, address: string) => Promise<SIWXSession[]>

  // === Occasionally customized ===

  /**
   * Custom domain for SIWE message
   * @default window.location.host
   * @example "app.mydapp.com"
   */
  domain?: string

  /**
   * Custom URI for SIWE message
   * @default window.location.origin
   * @example "https://app.mydapp.com"
   */
  uri?: string

  /**
   * Custom expiration time
   * @default 24 hours from now
   * @example new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
   * @example (issuedAt) => new Date(issuedAt.getTime() + 60 * 60 * 1000).toISOString() // 1 hour
   */
  expirationTime?: string | ((issuedAt: Date) => string)

  // === Rarely customized ===

  /**
   * Custom session revocation handler
   * @default Removes from localStorage
   */
  revokeSession?: (chainId: CaipNetworkId, address: string) => Promise<void>

  /**
   * Custom sessions setter
   * @default Saves to localStorage
   */
  setSessions?: (sessions: SIWXSession[]) => Promise<void>

  /**
   * Whether SIWX authentication is required
   * @default false (optional authentication)
   */
  getRequired?: () => boolean
}

/**
 * Creates a default SIWX configuration that works out of the box for most use cases.
 *
 * This eliminates the need for DApps to implement ~120 lines of boilerplate code.
 * All callbacks can be customized if needed (e.g., for backend verification).
 *
 * @example
 * ```typescript
 * // ⚠️ Development/Demo only (NOT SECURE for production)
 * initCrossSdkWithParams({
 *   projectId: 'your-project-id',
 *   siwx: createDefaultSIWXConfig({
 *     statement: 'Sign in to My DApp'
 *   })
 * })
 *
 * // ✅ Production-ready with backend verification
 * initCrossSdkWithParams({
 *   projectId: 'your-project-id',
 *   siwx: createDefaultSIWXConfig({
 *     statement: 'Sign in to My DApp',
 *     // CRITICAL: Get nonce from backend to prevent replay attacks
 *     getNonce: async () => {
 *       const response = await fetch('/api/siwe/nonce')
 *       const { nonce } = await response.json()
 *       return nonce
 *     },
 *     // Verify signature on backend
 *     addSession: async (session) => {
 *       await fetch('/api/siwe/verify', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(session)
 *       })
 *     },
 *     // Retrieve sessions from backend
 *     getSessions: async (chainId, address) => {
 *       const response = await fetch(
 *         `/api/siwe/sessions?chain=${chainId}&address=${address}`
 *       )
 *       return response.json()
 *     }
 *   })
 * })
 * ```
 */
export function createDefaultSIWXConfig(options: CreateSIWXConfigOptions = {}): SIWXConfig {
  let currentChainId: CaipNetworkId | undefined = undefined

  // Subscribe to chain changes to track the current chain
  AccountController.subscribeKey('caipAddress', caipAddress => {
    if (caipAddress) {
      const parts = caipAddress.split(':')
      if (parts.length >= 2) {
        currentChainId = `${parts[0]}:${parts[1]}` as CaipNetworkId
      }
    }
  })

  return {
    /**
     * Creates a SIWE message with standard fields
     */
    createMessage: async (input: {
      chainId: CaipNetworkId
      accountAddress: string
      notBefore?: string
    }): Promise<SIWXMessage> => {
      const chainId = currentChainId || input.chainId
      const issuedAt = new Date()
      const expirationTime =
        typeof options.expirationTime === 'function'
          ? options.expirationTime(issuedAt)
          : options.expirationTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // Get nonce from backend if provided, otherwise generate random (NOT SECURE for production)
      const nonce = options.getNonce
        ? await options.getNonce()
        : Math.random().toString(36).substring(2, 15)

      const message: SIWXMessage = {
        ...input,
        chainId,
        domain: options.domain || window.location.host,
        uri: options.uri || window.location.origin,
        version: '1',
        nonce,
        issuedAt: issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'), // Remove milliseconds for SIWE compatibility
        expirationTime,
        statement: options.statement || 'Sign in with your wallet',
        toString: () => {
          // Build message parts - always maintain 2 blank lines (with optional statement in between)
          const parts = [
            `${message.domain} wants you to sign in with your Ethereum account:`,
            message.accountAddress,
            '', // First blank line
            message.statement || undefined, // Statement (optional)
            '', // Second blank line
            `URI: ${message.uri}`,
            `Version: ${message.version}`,
            `Chain ID: ${message.chainId}`,
            `Nonce: ${message.nonce}`,
            `Issued At: ${message.issuedAt}`
          ]
          
          // Add optional fields
          if (message.expirationTime) {
            parts.push(`Expiration Time: ${message.expirationTime}`)
          }
          
          // Filter out undefined values only (keep empty strings for blank lines)
          return parts.filter(part => part !== undefined).join('\n')
        }
      }

      return message
    },

    /**
     * Stores a SIWX session (defaults to localStorage)
     */
    addSession:
      options.addSession ||
      (async (session: SIWXSession) => {
        console.log('✅ SIWX Session added:', session)
        localStorage.setItem('siwx_session', JSON.stringify(session))
      }),

    /**
     * Revokes a SIWX session (defaults to localStorage removal)
     */
    revokeSession:
      options.revokeSession ||
      (async (chainId: CaipNetworkId, address: string) => {
        console.log('🗑️ SIWX Session revoked:', { chainId, address })
        localStorage.removeItem('siwx_session')
      }),

    /**
     * Sets multiple SIWX sessions (defaults to localStorage)
     */
    setSessions:
      options.setSessions ||
      (async (sessions: SIWXSession[]) => {
        console.log('📝 SIWX Sessions set:', sessions)
        if (sessions.length > 0) {
          localStorage.setItem('siwx_sessions', JSON.stringify(sessions))
        } else {
          localStorage.removeItem('siwx_sessions')
        }
      }),

    /**
     * Retrieves SIWX sessions for a given chain and address (defaults to localStorage)
     */
    getSessions:
      options.getSessions ||
      (async (chainId: CaipNetworkId, address: string): Promise<SIWXSession[]> => {
        // Check single session
        const sessionStr = localStorage.getItem('siwx_session')
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr) as SIWXSession
            if (
              session.data.chainId === chainId &&
              session.data.accountAddress.toLowerCase() === address.toLowerCase()
            ) {
              return [session]
            }
          } catch (error) {
            console.error('Error parsing siwx_session:', error)
          }
        }

        // Check multiple sessions
        const sessionsStr = localStorage.getItem('siwx_sessions')
        if (sessionsStr) {
          try {
            const sessions = JSON.parse(sessionsStr) as SIWXSession[]

            return sessions.filter(
              s =>
                s.data.chainId === chainId &&
                s.data.accountAddress.toLowerCase() === address.toLowerCase()
            )
          } catch (error) {
            console.error('Error parsing siwx_sessions:', error)
          }
        }

        return []
      }),

    /**
     * Whether SIWX authentication is required (defaults to false - optional)
     */
    getRequired: options.getRequired || (() => false)
  }
}

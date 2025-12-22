import type { IWebApp, WebAppEventType } from '../types.js'
import { Haptics } from '../types.js'

/**
 * Mock WebApp for development and testing
 */
export class WebAppMock implements IWebApp {
  version: string
  private listeners: Map<string, Set<Function>> = new Map()
  private isReady = false

  constructor(version: string) {
    this.version = version
    console.log('[MOCK] CROSSx.WebApp initialized', { version })
  }

  /**
   * Signal that WebApp is ready (mock)
   */
  ready(): void {
    if (this.isReady) {
      console.warn('[MOCK] CROSSx.WebApp already ready')
      return
    }

    this.isReady = true
    console.log('[MOCK] CROSSx.WebApp.ready() called')
  }

  /**
   * Request full screen mode (mock)
   */
  requestFullScreen(): void {
    console.log('[MOCK] CROSSx.WebApp.requestFullScreen() called')

    // Try to enter fullscreen on browser
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .catch(error => console.log('[MOCK] Fullscreen not available:', error))
    }
  }

  /**
   * Get safe area insets (mock)
   * Returns default values for browser environment
   */
  async getSafeAreaInsets(): Promise<{ top: number; bottom: number; left: number; right: number }> {
    console.log('[MOCK] CROSSx.WebApp.getSafeAreaInsets() called')

    // Return default safe area insets for browser
    // In real CROSSx environment, these values would come from native
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }

  /**
   * Trigger haptic feedback (mock)
   * Logs the haptic type for debugging purposes
   */
  hapticFeedback(hapticType: Haptics): void {
    console.log('[MOCK] CROSSx.WebApp.hapticFeedback() called', { hapticType })
  }

  /**
   * Register event listener
   */
  on(event: WebAppEventType, callback: () => void): void {
    console.log(`[MOCK] Listening to "${event}"`)

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Remove event listener
   */
  off(event: WebAppEventType, callback: () => void): void {
    this.listeners.get(event)?.delete(callback)
  }

  /**
   * Emit event to all listeners (for testing)
   */
  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[MOCK] Error in ${event} listener:`, error)
      }
    })
  }

  /**
   * Simulate viewClosed event (testing utility)
   */
  _simulateClose(): void {
    console.log('[MOCK] Simulating viewClosed event')
    this.emit('viewClosed')
  }

  /**
   * Simulate viewBackgrounded event (testing utility)
   */
  _simulateBackgrounded(): void {
    console.log('[MOCK] Simulating viewBackgrounded event')
    this.emit('viewBackgrounded')
  }
}

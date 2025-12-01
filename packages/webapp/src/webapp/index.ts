import type { IWebApp, WebAppEventType } from '../types.js'
import { Haptics } from '../types.js'
import { NativeBridge } from './bridge.js'

/**
 * CROSSx WebApp Implementation for CROSSx Environment
 */
export class WebAppImpl implements IWebApp {
  version: string
  private bridge: NativeBridge
  private listeners: Map<string, Set<Function>> = new Map()
  private isReady = false

  constructor(version: string) {
    this.version = version
    this.bridge = new NativeBridge()
    this.initializeEventListeners()
  }

  /**
   * Signal that WebApp is ready
   */
  ready(): void {
    if (this.isReady) {
      console.warn('[CROSSx WebApp] already ready')
      return
    }

    this.isReady = true

    // Notify native bridge (JSON-RPC 2.0)
    this.bridge.call('crossx_app_ready', []).catch(error => {
      console.error('[CROSSx WebApp] Error sending ready signal:', error)
    })
  }

  /**
   * Request full screen mode
   * @param options.isExpandSafeArea - If true, expand content to safe area (notches, status bar, etc.)
   */
  requestFullScreen(options?: { isExpandSafeArea?: boolean }): void {
    this.bridge
      .call('crossx_app_requestFullscreen', [
        {
          isExpandSafeArea: options?.isExpandSafeArea ?? false
        }
      ])
      .catch(error => {
        console.error('[CROSSx WebApp] Error requesting fullscreen:', error)
      })
  }

  /**
   * Get safe area insets (notch, status bar, home indicator distances)
   * @returns Promise with safe area insets { top, bottom, left, right }
   */
  async getSafeAreaInsets(): Promise<{ top: number; bottom: number; left: number; right: number }> {
    try {
      const result = await this.bridge.call('crossx_app_safeAreaInset', [])
      return result || { top: 0, bottom: 0, left: 0, right: 0 }
    } catch (error) {
      console.error('[CROSSx WebApp] Error getting safe area insets:', error)
      return { top: 0, bottom: 0, left: 0, right: 0 }
    }
  }

  /**
   * Trigger haptic feedback
   * @param hapticType - Type of haptic feedback from Haptics enum
   */
  hapticFeedback(hapticType: Haptics): void {
    this.bridge.call('crossx_app_hapticFeedback', [{ hapticType }]).catch(error => {
      console.error('[CROSSx WebApp] Error triggering haptic feedback:', error)
    })
  }

  /**
   * Register event listener
   */
  on(event: WebAppEventType, callback: () => void): void {
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
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[CROSSx WebApp] Error in ${event} listener:`, error)
      }
    })
  }

  /**
   * Initialize event listeners from native bridge
   */
  private initializeEventListeners(): void {
    this.bridge.onEvent('viewClosed', () => {
      this.emit('viewClosed')
    })

    this.bridge.onEvent('viewBackgrounded', () => {
      this.emit('viewBackgrounded')
    })
  }
}

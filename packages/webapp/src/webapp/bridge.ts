import type { INativeBridge, NativeBridgeRequest, NativeBridgeResponse } from '../types.js'

/**
 * Native Bridge Implementation for CROSSx Environment
 */
export class NativeBridge implements INativeBridge {
  private listeners: Map<string, Set<Function>> = new Map()
  private pendingRequests: Map<string, Function> = new Map()

  constructor() {
    this.initializeEventListeners()
  }

  /**
   * Send request to native bridge (JSON-RPC 2.0 compatible)
   */
  async call(method: string, params: any[] | Record<string, any> = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.generateRequestId()

      this.pendingRequests.set(id, (response: NativeBridgeResponse) => {
        if (response.error) {
          const errorMsg = response.error.message || 'Unknown error'
          reject(new Error(errorMsg))
        } else {
          resolve(response.result)
        }
        this.pendingRequests.delete(id)
      })

      try {
        const request: NativeBridgeRequest = {
          jsonrpc: '2.0',
          id,
          method,
          params
        }
        this.send(request, (response: NativeBridgeResponse) => {
          const handler = this.pendingRequests.get(id)
          if (handler) {
            handler(response)
          }
        })
      } catch (error) {
        this.pendingRequests.delete(id)
        reject(error)
      }
    })
  }

  /**
   * Send raw request to native bridge (JSON-RPC 2.0 compatible)
   */
  send(request: NativeBridgeRequest, callback: (response: NativeBridgeResponse) => void): void {
    if (typeof window !== 'undefined' && window.crossxNativeBridge?.send) {
      window.crossxNativeBridge.send(request, callback)
    } else {
      console.warn('[CROSSx WebApp] Native bridge not available')
      callback({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Native bridge not available'
        }
      })
    }
  }

  /**
   * Register event listener from native
   */
  onEvent(event: string, handler: (data?: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    // Register with native bridge if available
    if (typeof window !== 'undefined' && window.crossxNativeBridge?.onEvent) {
      window.crossxNativeBridge.onEvent(event, handler)
    }
  }

  /**
   * Remove event listener
   */
  offEvent(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler)
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
   * Initialize global event listeners
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return

    // Listen for events from native
    window.crossxNativeBridge?.onEvent('viewClosed', () => {
      this.emit('viewClosed')
    })

    window.crossxNativeBridge?.onEvent('viewBackgrounded', () => {
      this.emit('viewBackgrounded')
    })
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

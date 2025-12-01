/**
 * Haptics Type - CROSSx Wallet supported haptic feedback types
 */
export enum Haptics {
  selection = 'selection',
  impactLight = 'impactLight',
  impactMedium = 'impactMedium',
  impactHeavy = 'impactHeavy',
  notificationSuccess = 'notificationSuccess',
  notificationWarning = 'notificationWarning',
  notificationError = 'notificationError'
}

/**
 * WebApp Event Types
 */
export type WebAppEventType = 'viewClosed' | 'viewBackgrounded'

/**
 * JSON-RPC 2.0 Request (Ethereum compatible)
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params: any[] | Record<string, any>
}

/**
 * JSON-RPC 2.0 Response (Ethereum compatible)
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

// For backward compatibility
export type NativeBridgeRequest = JsonRpcRequest
export type NativeBridgeResponse = JsonRpcResponse

/**
 * Native Bridge Interface
 */
export interface INativeBridge {
  call(method: string, params: Record<string, any>): Promise<any>
  onEvent(event: string, handler: (data?: any) => void): void
  send(request: NativeBridgeRequest, callback: (response: NativeBridgeResponse) => void): void
}

/**
 * Safe Area Insets (safe area top, bottom, left, right distances)
 */
export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

/**
 * WebApp Interface
 */
export interface IWebApp {
  version: string
  ready(): void
  requestFullScreen(): void
  getSafeAreaInsets(): Promise<SafeAreaInsets>
  hapticFeedback(hapticType: Haptics): void
  on(event: WebAppEventType, callback: () => void): void
  off(event: WebAppEventType, callback: () => void): void
}

/**
 * Global Window Extensions
 */
declare global {
  interface Window {
    crossxNativeBridge?: INativeBridge
    __crossx?: boolean
    CROSSx?: {
      WebApp: IWebApp
    }
  }
}

# CROSSx WebApp - Native Bridge Specification

This document defines the contract between the JavaScript SDK and the native CROSSx application.

## Overview

The SDK communicates with the native application through a bridge interface. The native app must provide `window.crossxNativeBridge` object with specific methods for this communication to work.

## Native Bridge Interface

### Required Implementation

```typescript
window.crossxNativeBridge = {
  send(request: NativeBridgeRequest, callback: (response: NativeBridgeResponse) => void): void;
  onEvent(event: string, handler: (data?: any) => void): void;
}
```

## Request/Response Protocol

### Request Format (JSON-RPC 2.0)

```typescript
interface JsonRpcRequest {
  jsonrpc: '2.0' // JSON-RPC version
  id: string | number // Unique request identifier
  method: string // Method name (Ethereum-compatible)
  params: any[] | Record<string, any> // Parameters (array or object)
}
```

**Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "crossx_app_ready",
  "params": []
}
```

### Response Format (JSON-RPC 2.0)

```typescript
interface JsonRpcResponse {
  jsonrpc: '2.0' // JSON-RPC version
  id: string | number // Matches request id
  result?: any // Response data (if success)
  error?: {
    // Error object (if failed)
    code: number // Error code (standard JSON-RPC)
    message: string // Error message
    data?: any // Additional error data
  }
}
```

**Success Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

**Error Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": "eth_app_unknown is not supported"
  }
}
```

## Supported Methods (JSON-RPC 2.0)

### `webapp.ready` (alias: `ready`)

Called when the WebApp is ready for interaction.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "webapp.ready",
  "params": {}
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

**JavaScript Call:**

```typescript
await CROSSx.WebApp.ready()
```

**Native Responsibility:**

- Acknowledge that WebApp is ready
- Display the app in full interface (not hidden)
- Prepare for user interaction
- Start monitoring for lifecycle changes

**Status:** ✅ Implemented (iOS)

---

### `webapp.requestFullScreen` (alias: `requestFullScreen`)

Called when WebApp requests to be displayed in fullscreen mode.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "webapp.requestFullScreen",
  "params": {
    "isExpandSafeArea": false
  }
}
```

**Response (Success):**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "success": true
  }
}
```

**Response (Already in Fullscreen):**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "success": true,
    "alreadyFullScreen": true
  }
}
```

**Parameters:**

- `isExpandSafeArea` (boolean, optional): If `true`, expand content to safe area (notches, status bar, safe insets). Default: `false`.

**JavaScript Call:**

```typescript
// Basic fullscreen (respect safe areas)
await CROSSx.WebApp.requestFullScreen()

// Fullscreen with content expanded to safe areas
await CROSSx.WebApp.requestFullScreen({ isExpandSafeArea: true })
```

**Native Responsibility:**

- Check if already in fullscreen mode (if so, ignore request and respond with `alreadyFullScreen: true`)
- Hide all native UI elements (header, navigation, etc.)
- Maximize WebView to fill entire screen
- If `isExpandSafeArea` is `true`: Expand content behind safe areas (notches, status bar, etc.)
- If `isExpandSafeArea` is `false`: Respect safe areas and maintain padding
- Provide close/exit button for user to exit fullscreen mode
- Allow user to toggle safe area expansion with a button

**Status:** ✅ Implemented (iOS)

---

### `crossx_app_safeAreaInset`

Returns the current safe area insets of the device.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "crossx_app_safeAreaInset",
  "params": {}
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "top": 47.0,
    "bottom": 34.0,
    "left": 0.0,
    "right": 0.0
  }
}
```

**JavaScript Call:**

```typescript
const insets = await CROSSx.WebApp.getSafeAreaInsets()
console.log('Safe area:', insets)
// { top: 47, bottom: 34, left: 0, right: 0 }
```

**Native Responsibility:**

- Get the current safe area insets from the window
- Return insets in logical pixels (points, not physical pixels)
- Values represent the inset from each edge:
  - `top`: Status bar, notch, or Dynamic Island height
  - `bottom`: Home indicator height
  - `left`: Left safe area (for landscape with notch)
  - `right`: Right safe area (for landscape with notch)

**Use Cases:**

- Position UI elements to avoid notches and home indicators
- Adjust content layout for full-screen experiences
- Create safe area aware animations
- Calculate usable screen space

**Status:** ✅ Implemented (iOS)

---

### `crossx_app_hapticFeedback`

Triggers haptic feedback on the device.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "crossx_app_hapticFeedback",
  "params": {
    "type": "medium"
  }
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "success": true
  }
}
```

**Parameters:**

- `type` (string, required): The type of haptic feedback to trigger
  - `light` - Light impact feedback
  - `medium` - Medium impact feedback
  - `heavy` - Heavy impact feedback
  - `success` - Success notification feedback
  - `warning` - Warning notification feedback
  - `error` - Error notification feedback
  - `selection` - Selection changed feedback

**JavaScript Call:**

```typescript
// Light haptic feedback
await CROSSx.WebApp.hapticFeedback('light')

// Success feedback
await CROSSx.WebApp.hapticFeedback('success')

// Heavy impact
await CROSSx.WebApp.hapticFeedback('heavy')
```

**Native Responsibility:**

- Trigger the appropriate haptic feedback based on the type parameter
- Use UIImpactFeedbackGenerator for impact types (light, medium, heavy)
- Use UINotificationFeedbackGenerator for notification types (success, warning, error)
- Use UISelectionFeedbackGenerator for selection type
- Handle devices that don't support haptics gracefully
- Return success even if haptics are disabled or unavailable

**Use Cases:**

- Button press feedback
- Success/error notifications
- Game interactions
- Selection changes in pickers or menus
- Scroll/swipe gestures

**Status:** ✅ Implemented (iOS)

---

## Supported Events

The native app can emit events to JavaScript via `onEvent` callbacks.

### `viewClosed`

Emitted when the user closes the WebApp (presses back, taps close button, etc.).

**Event Call (Native → JavaScript):**

```javascript
window.crossxNativeBridge.onEvent('viewClosed', () => {
  // Handle event
})
```

**JavaScript Handler:**

```typescript
CROSSx.WebApp.on('viewClosed', () => {
  console.log('WebApp closed')
  // Save state, cleanup resources, etc.
})
```

**Native Responsibility:**

- Call event handler when user initiates close
- Wait for cleanup before destroying WebView
- Consider warning user about unsaved data

---

### `viewBackgrounded`

Emitted when the app is sent to background (user presses home, opens another app, etc.).

**Event Call (Native → JavaScript):**

```javascript
window.crossxNativeBridge.onEvent('viewBackgrounded', () => {
  // Handle event
})
```

**JavaScript Handler:**

```typescript
CROSSx.WebApp.on('viewBackgrounded', () => {
  console.log('App backgrounded')
  // Pause game, save state, stop animations, etc.
})
```

**Native Responsibility:**

- Call event handler when app moves to background
- Maintain WebView state (don't destroy)
- Resume when app returns to foreground

---

## Implementation Examples

### iOS (Swift)

```swift
import WebKit

class WebAppBridge: NSObject, WKScriptMessageHandler {
  weak var webView: WKWebView?
  weak var viewModel: BrowserViewModel?

  func setupBridge(in webView: WKWebView) {
    self.webView = webView

    // Inject bridge into JavaScript
    let bridgeScript = """
    (function() {
      if (window.__CROSSX_BRIDGE_INITIALIZED__) {
        return;
      }

      // Pending callbacks storage
      if (!window.__crossx_pending_callbacks) {
        window.__crossx_pending_callbacks = {};
      }

      // Native response listener
      window.addEventListener('message', function(event) {
        try {
          var response = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (response && response.id && window.__crossx_pending_callbacks[response.id]) {
            window.__crossx_pending_callbacks[response.id](response);
            delete window.__crossx_pending_callbacks[response.id];
          }
        } catch(e) {
          console.error('[CROSSx Native Bridge] Failed to handle response:', e);
        }
      });

      // Main bridge object
      window.crossxNativeBridge = {
        send: function(request, callback) {
          try {
            if (callback && typeof callback === 'function') {
              window.__crossx_pending_callbacks[request.id] = callback;

              // 10 second timeout
              setTimeout(function() {
                if (window.__crossx_pending_callbacks[request.id]) {
                  callback({
                    jsonrpc: '2.0',
                    id: request.id,
                    error: { code: -32000, message: 'Request timeout' }
                  });
                  delete window.__crossx_pending_callbacks[request.id];
                }
              }, 10000);
            }

            window.webkit.messageHandlers.bridge.postMessage(request);
          } catch(e) {
            if (callback && typeof callback === 'function') {
              callback({
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32603, message: e.message }
              });
              delete window.__crossx_pending_callbacks[request.id];
            }
          }
        },
        onEvent: function(event, handler) {
          if (!window.__crossx_event_handlers) {
            window.__crossx_event_handlers = {};
          }
          window.__crossx_event_handlers[event] = handler;
        }
      };

      window.__CROSSX_BRIDGE_INITIALIZED__ = true;
    })();
    """

    let userScript = WKUserScript(
      source: bridgeScript,
      injectionTime: .atDocumentStart,
      forMainFrameOnly: false
    )
    webView.configuration.userContentController.addUserScript(userScript)
    webView.configuration.userContentController.add(self, name: "bridge")
  }

  // WKScriptMessageHandler
  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard message.name == "bridge",
          let webView = message.webView,
          let body = message.body as? [String: Any] else {
      return
    }

    handleRequest(body, webView: webView)
  }

  func handleRequest(_ request: [String: Any], webView: WKWebView) {
    guard let method = request["method"] as? String,
          let id = request["id"] else {
      return
    }

    let params = request["params"] as? [String: Any]

    switch method {
    case "crossx_app_ready":
      // Handle ready
      let response: [String: Any] = [
        "jsonrpc": "2.0",
        "id": id,
        "result": ["success": true]
      ]
      sendToWeb(webView, message: response)

    case "crossx_app_requestFullscreen":
      handleRequestFullScreen(id: id, params: params, webView: webView)

    case "crossx_app_safeAreaInset":
      handleSafeAreaInset(id: id, webView: webView)

    case "crossx_app_hapticFeedback":
      handleHapticFeedback(id: id, params: params, webView: webView)

    default:
      let response: [String: Any] = [
        "jsonrpc": "2.0",
        "id": id,
        "error": [
          "code": -32601,
          "message": "Method not found"
        ]
      ]
      sendToWeb(webView, message: response)
    }
  }

  func handleRequestFullScreen(id: Any, params: [String: Any]?, webView: WKWebView) {
    Task { @MainActor in
      // Check if already in fullscreen
      if viewModel?.showFullScreenModal == true {
        let response: [String: Any] = [
          "jsonrpc": "2.0",
          "id": id,
          "result": [
            "success": true,
            "alreadyFullScreen": true
          ]
        ]
        sendToWeb(webView, message: response)
        return
      }

      // Parse isExpandSafeArea parameter
      let isExpandSafeArea = params?["isExpandSafeArea"] as? Bool ?? false

      // Open fullscreen
      viewModel?.openFullScreen(isExpandSafeArea: isExpandSafeArea)

      // Send success response
      let response: [String: Any] = [
        "jsonrpc": "2.0",
        "id": id,
        "result": ["success": true]
      ]
      sendToWeb(webView, message: response)
    }
  }

  func handleSafeAreaInset(id: Any, webView: WKWebView) {
    Task { @MainActor in
      // Get safe area insets from window
      let safeAreaInsets: UIEdgeInsets

      if let window = webView.window {
        safeAreaInsets = window.safeAreaInsets
      } else if #available(iOS 13.0, *) {
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first as? UIWindowScene
        safeAreaInsets = windowScene?.windows.first?.safeAreaInsets ?? .zero
      } else {
        safeAreaInsets = UIApplication.shared.keyWindow?.safeAreaInsets ?? .zero
      }

      let result: [String: Double] = [
        "top": Double(safeAreaInsets.top),
        "bottom": Double(safeAreaInsets.bottom),
        "left": Double(safeAreaInsets.left),
        "right": Double(safeAreaInsets.right)
      ]

      let response: [String: Any] = [
        "jsonrpc": "2.0",
        "id": id,
        "result": result
      ]
      sendToWeb(webView, message: response)
    }
  }

  func handleHapticFeedback(id: Any, params: [String: Any]?, webView: WKWebView) {
    Task { @MainActor in
      let feedbackType = params?["type"] as? String ?? "medium"

      // Trigger haptic feedback
      switch feedbackType {
      case "light":
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
      case "medium":
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
      case "heavy":
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
      case "success":
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
      case "warning":
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
      case "error":
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
      case "selection":
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
      default:
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
      }

      let response: [String: Any] = [
        "jsonrpc": "2.0",
        "id": id,
        "result": ["success": true]
      ]
      sendToWeb(webView, message: response)
    }
  }

  func sendToWeb(_ webView: WKWebView, message: Any) {
    guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
      return
    }

    let escaped = jsonString
      .replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "'", with: "\\'")
      .replacingOccurrences(of: "\n", with: "\\n")

    let jsCode = """
    (function(){
      try {
        var payloadStr = '\(escaped)';
        window.dispatchEvent(new MessageEvent('message', { data: payloadStr }));
      } catch(e) {}
    })();
    """
    webView.evaluateJavaScript(jsCode, completionHandler: nil)
  }

  func closeWebApp() {
    guard let handlers = webView?.evaluateJavaScript(
      "window.__crossx_event_handlers?.viewClosed?.()",
      completionHandler: nil
    ) else { return }
  }

  func backgroundApp() {
    guard let handlers = webView?.evaluateJavaScript(
      "window.__crossx_event_handlers?.viewBackgrounded?.()",
      completionHandler: nil
    ) else { return }
  }
}
```

### Android (Kotlin)

```kotlin
import android.webkit.WebView
import android.webkit.JavascriptInterface
import org.json.JSONObject

class CrossxWebAppBridge(private val webView: WebView) {

  fun setup() {
    val bridgeScript = """
    window.crossxNativeBridge = {
      send: function(request, callback) {
        Android.handleBridgeMessage(JSON.stringify({
          action: 'send',
          request: request
        }), callback);
      },
      onEvent: function(event, handler) {
        Android.registerEventHandler(event);
      }
    };
    """.trimIndent()

    webView.evaluateJavascript("javascript:$bridgeScript", null)
    webView.addJavascriptInterface(this, "Android")
  }

  @JavascriptInterface
  fun handleBridgeMessage(message: String, callback: String) {
    val json = JSONObject(message)
    val action = json.getString("action")

    when (action) {
      "send" -> {
        val request = json.getJSONObject("request")
        handleRequest(request) { response ->
          webView.evaluateJavascript("javascript:$callback($response)", null)
        }
      }
    }
  }

  private fun handleRequest(
    request: JSONObject,
    callback: (JSONObject) -> Unit
  ) {
    val method = request.getString("method")
    val id = request.getString("id")

    when (method) {
      "webapp.ready" -> {
        // Handle ready
        callback(JSONObject().apply {
          put("id", id)
          put("result", true)
        })
      }

      "webapp.requestFullScreen" -> {
        // Enter fullscreen
        // ... implementation ...
        callback(JSONObject().apply {
          put("id", id)
          put("result", true)
        })
      }

      else -> {
        callback(JSONObject().apply {
          put("id", id)
          put("error", "Unknown method")
        })
      }
    }
  }

  fun closeWebApp() {
    webView.evaluateJavascript(
      "javascript:window.crossxNativeBridge.onEvent?.('viewClosed');",
      null
    )
  }

  fun backgroundApp() {
    webView.evaluateJavascript(
      "javascript:window.crossxNativeBridge.onEvent?.('viewBackgrounded');",
      null
    )
  }
}
```

### React Native

```typescript
import { WebView } from 'react-native-webview';

export const CrossxWebView = () => {
  const webViewRef = useRef<WebView>(null);

  const bridgeScript = `
    window.crossxNativeBridge = {
      send: function(request, callback) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bridgeRequest',
          request: request
        }));
      },
      onEvent: function(event, handler) {
        // Register handler
      }
    };
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'bridgeRequest') {
      const { request } = data;

      switch (request.method) {
        case 'webapp.ready':
          // Handle ready
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'bridgeResponse',
            response: { id: request.id, result: true }
          }));
          break;

        case 'webapp.requestFullScreen':
          // Enter fullscreen
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'bridgeResponse',
            response: { id: request.id, result: true }
          }));
          break;
      }
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://game.crossx.io' }}
      injectedJavaScriptBeforeContentLoaded={bridgeScript}
      onMessage={handleMessage}
    />
  );
};
```

---

## Error Handling

### Request Timeout

If the native app doesn't respond within a reasonable time (5 seconds), the SDK will reject the promise:

```typescript
CROSSx.WebApp.requestFullScreen().catch(error => {
  console.error('Request timeout:', error)
})
```

### Invalid Responses

The SDK validates response format:

```json
// ✅ Valid
{ "id": "req_123", "result": true }
{ "id": "req_123", "error": "Failed" }

// ❌ Invalid (will be treated as error)
{ "id": "req_123" }  // No result or error
{ "result": true }   // Missing id
```

### Missing Bridge

If `window.crossxNativeBridge` is not provided:

```typescript
CROSSx.WebApp.requestFullScreen().catch(error => {
  console.error('Native bridge not available')
})
```

---

## Best Practices

### Native App

1. **Always respond to requests** - Even if request fails, send error response with proper JSON-RPC error format
2. **Validate IDs** - Ensure response IDs match request IDs exactly (support both string and number types)
3. **Handle timeouts** - Cleanup pending requests after timeout (SDK uses 10 second timeout)
4. **Inject bridge early** - Use `.atDocumentStart` to ensure bridge is available before page scripts run
5. **Support both main and iframes** - Set `forMainFrameOnly: false` to support embedded content
6. **Emit events reliably** - Don't lose lifecycle events, queue them if needed
7. **Version compatibility** - Support both old method names (`crossx_app_*`) and new ones (`webapp.*`)
8. **State management** - Check current state before executing actions (e.g., already in fullscreen)
9. **Use MainActor** - Ensure UI updates happen on main thread in Swift
10. **Provide user controls** - Add buttons for users to exit fullscreen or toggle safe area expansion

### JavaScript App

1. **Always call ready()** - Signal when app is initialized and ready for interaction
2. **Listen to lifecycle** - Handle close and background events for proper cleanup
3. **Handle errors** - Implement catch handlers for all bridge calls
4. **Use async/await** - All bridge methods return Promises for clean error handling
5. **Save state** - Save data when backgrounded or closing
6. **Test thoroughly** - Test in actual WebView, not just browser
7. **Check bridge availability** - Handle cases where native bridge might not be available
8. **Respect timeouts** - Requests timeout after 10 seconds, handle appropriately
9. **Progressive enhancement** - App should work (degraded) without native bridge if needed

---

## Testing

### Mock Native Bridge (for testing)

```typescript
// In test environment
window.crossxNativeBridge = {
  send: (request, callback) => {
    console.log('Mock bridge received:', request)

    setTimeout(() => {
      // Mock successful response
      callback({
        jsonrpc: '2.0',
        id: request.id,
        result: { success: true }
      })
    }, 10)
  },
  onEvent: (event, handler) => {
    console.log('Mock event registered:', event)
    // Store handler for manual triggering in tests
    if (!window.__mockEventHandlers) {
      window.__mockEventHandlers = {}
    }
    window.__mockEventHandlers[event] = handler
  }
}

// Mark as initialized
window.__CROSSX_BRIDGE_INITIALIZED__ = true
```

### Automated Testing

```typescript
import { CROSSx } from '@to-nexus/webapp'

describe('WebApp Bridge', () => {
  beforeEach(() => {
    // Setup mock bridge
    window.crossxNativeBridge = {
      send: vi.fn((req, cb) => {
        cb({
          jsonrpc: '2.0',
          id: req.id,
          result: { success: true }
        })
      }),
      onEvent: vi.fn()
    }
  })

  it('should call ready', async () => {
    await CROSSx.WebApp.ready()

    expect(window.crossxNativeBridge.send).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'webapp.ready'
      }),
      expect.any(Function)
    )
  })

  it('should request fullscreen with parameters', async () => {
    await CROSSx.WebApp.requestFullScreen({ isExpandSafeArea: true })

    expect(window.crossxNativeBridge.send).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'webapp.requestFullScreen',
        params: { isExpandSafeArea: true }
      }),
      expect.any(Function)
    )
  })

  it('should handle timeout', async () => {
    // Mock that doesn't call callback
    window.crossxNativeBridge.send = vi.fn()

    await expect(CROSSx.WebApp.ready()).rejects.toThrow('Request timeout')
  })

  it('should handle errors', async () => {
    window.crossxNativeBridge.send = vi.fn((req, cb) => {
      cb({
        jsonrpc: '2.0',
        id: req.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      })
    })

    await expect(CROSSx.WebApp.ready()).rejects.toThrow('Method not found')
  })
})
```

### Testing in iOS Simulator

```bash
# Build and run iOS app
cd ios
xcodebuild -workspace crossx-ios.xcworkspace \
  -scheme crossx-ios \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build

# Run the app
open -a Simulator
# Install and launch your app
```

### Testing Bridge Health

Add to your WebApp for debugging:

```typescript
// Debug bridge status
console.log('Bridge available:', typeof window.crossxNativeBridge !== 'undefined')
console.log('Bridge methods:', {
  send: typeof window.crossxNativeBridge?.send,
  onEvent: typeof window.crossxNativeBridge?.onEvent
})

// Test bridge
try {
  await CROSSx.WebApp.ready()
  console.log('✅ Bridge working')
} catch (error) {
  console.error('❌ Bridge failed:', error)
}
```

---

## Versioning

Current Bridge Version: **1.3.0**

### Version History

| Version | Date       | Changes                                                                                                                   |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1.3.0   | 2025-11-28 | Added `crossx_app_hapticFeedback` method with 7 feedback types (light, medium, heavy, success, warning, error, selection) |
| 1.2.0   | 2025-11-28 | Added `crossx_app_safeAreaInset` method to get device safe area insets                                                    |
| 1.1.0   | 2025-11-28 | Added `isExpandSafeArea` parameter to `requestFullScreen()`                                                               |
| 1.0.0   | 2025-11-28 | Initial release with `ready()`, `requestFullScreen()`, and lifecycle events                                               |

### Implementation Status

| Method                         | iOS | Android | Status       |
| ------------------------------ | --- | ------- | ------------ |
| `crossx_app_ready`             | ✅  | ⏳      | iOS Complete |
| `crossx_app_requestFullscreen` | ✅  | ⏳      | iOS Complete |
| `crossx_app_safeAreaInset`     | ✅  | ⏳      | iOS Complete |
| `crossx_app_hapticFeedback`    | ✅  | ⏳      | iOS Complete |

Future versions may add:

- Version negotiation
- Backward compatibility layer
- New methods and events
- Screen orientation control
- Camera/QR code scanner access
- Device motion sensors

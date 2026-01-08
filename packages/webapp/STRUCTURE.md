# CROSSx WebApp SDK - Architecture & Structure

## 📁 Directory Structure

```
packages/webapp/
├── src/
│   ├── index.ts                    # Entry point - creates WebApp instance
│   ├── detector.ts                 # Environment detection (CROSSx vs Browser)
│   ├── types.ts                    # TypeScript type definitions
│   ├── webapp/
│   │   ├── index.ts                # WebAppImpl - Real implementation for CROSSx
│   │   └── bridge.ts               # NativeBridge - Communication layer
│   ├── mock/
│   │   └── index.ts                # WebAppMock - Mock implementation for browsers
│   └── vite.config.ts              # Vite build config for CDN bundle
├── dist/
│   ├── types/                      # TypeScript declaration files
│   └── cdn/                        # CDN bundle (after build)
├── example.html                    # Interactive test page
├── package.json                    # Package metadata
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── README.md                       # User documentation
├── CHANGELOG.md                    # Version history
└── STRUCTURE.md                    # This file
```

## 🏗️ Architecture Overview

### 1. Environment Detection (`detector.ts`)

```
isCROSSxEnvironment()
  ├─ Checks window.crossxNativeBridge
  ├─ Checks window.__crossx
  └─ Checks navigator.userAgent for "CROSSx"
```

**Returns:**
- `true` - Running in CROSSx app (WebView)
- `false` - Running in regular browser

### 2. Instance Creation (`index.ts`)

```
createWebApp()
  ├─ If CROSSx Environment
  │   └─ Returns WebAppImpl (real implementation)
  └─ If Browser Environment
      └─ Returns WebAppMock (mock implementation)
```

**Global Registration:**
```javascript
window.CROSSx = {
  WebApp: <IWebApp instance>
}
```

### 3. Real Implementation (`webapp/index.ts`)

For CROSSx environment only.

```typescript
class WebAppImpl implements IWebApp {
  ready()              // Signal to native bridge
  requestFullScreen()  // Request fullscreen to native bridge
  on()                 // Register event listeners
  off()                // Remove event listeners
}
```

**Communication Flow:**
```
WebApp method called
  ↓
NativeBridge.call()
  ↓
window.crossxNativeBridge.send()
  ↓
Native App (iOS/Android)
  ↓
Response via callback
```

### 4. Native Bridge (`webapp/bridge.ts`)

Handles all communication with native app.

```typescript
class NativeBridge {
  call(method, params)           // Send request to native
  send(request, callback)        // Low-level send
  onEvent(event, handler)        // Listen for native events
  emit(event, data)              // Emit to local listeners
}
```

**Request Format:**
```json
{
  "id": "req_1234567890_abc123",
  "method": "webapp.ready | webapp.requestFullScreen",
  "params": {}
}
```

**Response Format:**
```json
{
  "id": "req_1234567890_abc123",
  "result": {},
  "error": null
}
```

### 5. Mock Implementation (`mock/index.ts`)

For browser/development environment.

```typescript
class WebAppMock implements IWebApp {
  ready()              // Logs to console
  requestFullScreen()  // Tries browser fullscreen API
  on()                 // Registers listeners
  off()                // Removes listeners
  _simulateClose()     // Test utility
  _simulateBackgrounded()  // Test utility
}
```

## 🔄 Event Flow

### Ready Signal (CROSSx)
```
WebApp.ready()
  ↓
NativeBridge.call('webapp.ready', {})
  ↓
Promise wrapper around:
  window.crossxNativeBridge.send(request, callback)
  ↓
Native receives: { id, method: 'webapp.ready', params: {} }
  ↓
Native processes and calls callback: { id, result: true }
  ↓
Promise resolves
```

### Event Reception (CROSSx)
```
Native: User closes WebView
  ↓
Native calls: window.crossxNativeBridge.onEvent('viewClosed', handler)
  ↓
NativeBridge.onEvent() receives call
  ↓
Triggers all registered listeners in WebAppImpl
  ↓
User's CROSSx.WebApp.on('viewClosed', callback) handlers fire
```

### Mock Events (Browser)
```
User clicks "Simulate Close"
  ↓
WebAppMock._simulateClose()
  ↓
this.emit('viewClosed')
  ↓
All registered listeners fire
```

## 🏃 Lifecycle

### Initialization
```
1. HTML loads SDK
   ├─ Module loads: src/index.ts
   ├─ isCROSSxEnvironment() checks environment
   ├─ createWebApp() creates appropriate instance
   └─ window.CROSSx.WebApp is set globally

2. Event listeners registered
   └─ NativeBridge.onEvent() sets up native event handlers

3. Ready for use
   └─ CROSSx.WebApp.ready() can be called
```

### Runtime
```
App Running
  ├─ User calls CROSSx.WebApp.ready()
  ├─ Native bridge sends message to native app
  ├─ User calls CROSSx.WebApp.requestFullScreen()
  ├─ Native app applies fullscreen
  └─ Events (viewClosed, viewBackgrounded) can fire at any time

User closes WebView
  ├─ Native calls window.crossxNativeBridge.onEvent('viewClosed')
  ├─ WebAppImpl receives and processes event
  ├─ User's listener is called
  └─ App cleanup happens
```

## 📦 Build Outputs

### TypeScript Build (`npm run build`)
```
dist/types/
├── src/index.d.ts
├── src/types.d.ts
├── src/detector.d.ts
├── src/webapp/index.d.ts
├── src/webapp/bridge.d.ts
├── src/mock/index.d.ts
└── ... (source maps)
```

### CDN Bundle (`npm run build:cdn`)
```
dist/cdn/
├── crossx-webapp.esm.js       (ES module)
├── crossx-webapp.esm.js.map   (source map)
├── crossx-webapp.umd.js       (UMD format)
└── crossx-webapp.umd.js.map   (source map)
```

## 🧪 Testing

### Example Page (`example.html`)
```
1. Shows current environment (CROSSx or Mock)
2. Displays SDK version
3. Test buttons for:
   - ready()
   - requestFullScreen()
   - Simulate events (mock mode only)
4. Event log showing all activity
```

**Run locally:**
```bash
pnpm dev
```

## 🔐 Type Safety

All interfaces are TypeScript-first:

```typescript
// Main interface
interface IWebApp {
  version: string;
  ready(): void;
  requestFullScreen(): void;
  on(event: WebAppEventType, callback: () => void): void;
  off(event: WebAppEventType, callback: () => void): void;
}

// Event types
type WebAppEventType = 'viewClosed' | 'viewBackgrounded';

// Native bridge
interface INativeBridge {
  call(method: string, params: Record<string, any>): Promise<any>;
  onEvent(event: string, handler: (data?: any) => void): void;
  send(request: NativeBridgeRequest, callback: (response: NativeBridgeResponse) => void): void;
}
```

## 📊 Size Comparison

| Build | Size (gzip) | Notes |
|-------|------------|-------|
| TypeScript output | N/A | For npm package |
| ESM Bundle | ~3KB | For browsers |
| UMD Bundle | ~4KB | For CDN |

## 🔗 Integration Points

### Native App Must Provide
```javascript
window.crossxNativeBridge = {
  send(request, callback) {
    // Handle request and call callback
  },
  onEvent(event, handler) {
    // Register listener for events
  }
}
```

### Injection Script (Optional)
```html
<!-- Auto-inject in CROSSx WebView -->
<script src="https://sdk.crossx.io/crossx-webapp.umd.js"></script>
```

## 🚀 Future Enhancements

Possible additions without breaking current API:

```typescript
// Phase 2: Wallet Integration
CROSSx.WebApp.wallet.connect()
CROSSx.WebApp.wallet.signMessage()

// Phase 3: Haptic Feedback
CROSSx.WebApp.haptics.light()
CROSSx.WebApp.haptics.heavy()

// Phase 4: Transaction Support
CROSSx.WebApp.transaction.send()
```

All can be added as new methods without affecting existing `ready()`, `requestFullScreen()`, and event handling.


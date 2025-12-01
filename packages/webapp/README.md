# CROSSx WebApp SDK

The official JavaScript SDK for building web applications within the CROSSx browser/wallet environment.

## Features

- 🎮 **Game Ready** - Optimized for gaming and interactive applications
- 📱 **Lifecycle Management** - Handle app state transitions (ready, backgrounded, closed)
- 🖥️ **Display Control** - Request fullscreen mode
- 🔗 **Native Integration** - Direct communication with CROSSx native app
- 🧪 **Mock Support** - Built-in mock for development and testing
- 📦 **Zero Dependencies** - Lightweight and self-contained

## Installation

```bash
npm install @to-nexus/webapp
```

or

```bash
pnpm add @to-nexus/webapp
```

## Quick Start

### Basic Usage

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp';

// Get SDK version
console.log(CROSSxWebApp.version);

// Signal that your app is ready
CROSSxWebApp.ready();

// Request fullscreen mode
document.getElementById('startBtn').addEventListener('click', () => {
  CROSSxWebApp.requestFullScreen();
});

// Listen for lifecycle events
CROSSxWebApp.on('viewClosed', () => {
  console.log('App closed - save state');
  saveGameState();
});

CROSSxWebApp.on('viewBackgrounded', () => {
  console.log('App backgrounded - pause');
  pauseGame();
});
```

### Global Access (Browser/CDN)

When included via CDN, the SDK is automatically available as a global object:

```html
<script src="https://sdk.crossx.io/crossx-webapp.min.js"></script>

<script>
  // Available globally as window.CROSSx.WebApp
  console.log(window.CROSSx.WebApp.version);
  
  window.CROSSx.WebApp.ready();
</script>
```

## API Reference

### Properties

#### `version`
Get the SDK version.

```typescript
const version: string = CROSSxWebApp.version;
// Returns: "1.0.0"
```

### Methods

#### `ready()`
Signal to the CROSSx app that your WebApp is ready to interact.

**Important:** Call this after your app has initialized and is ready to receive user input.

```typescript
CROSSxWebApp.ready();
```

#### `requestFullScreen()`
Request the CROSSx app to display your WebApp in fullscreen mode.

```typescript
CROSSxWebApp.requestFullScreen();
```

#### `on(event, callback)`
Register a listener for lifecycle events.

```typescript
CROSSxWebApp.on('viewClosed', () => {
  // Handle app closure
});

CROSSxWebApp.on('viewBackgrounded', () => {
  // Handle app being backgrounded
});
```

**Supported Events:**
- `viewClosed` - The WebView was closed by the user
- `viewBackgrounded` - The app was sent to background

#### `off(event, callback)`
Remove a previously registered event listener.

```typescript
const handler = () => console.log('closed');
CROSSxWebApp.on('viewClosed', handler);
CROSSxWebApp.off('viewClosed', handler);
```

## Environment Detection

The SDK automatically detects whether it's running in:

1. **CROSSx Environment** - Uses native bridge for real functionality
2. **Browser Environment** - Uses mock implementation for development

```typescript
import { isCROSSxEnvironment, getEnvironmentType } from '@to-nexus/webapp';

if (isCROSSxEnvironment()) {
  console.log('Running in CROSSx app');
} else {
  console.log('Running in browser (mock mode)');
}

const env = getEnvironmentType(); // 'crossx' | 'browser'
```

## Mock Testing

For development and testing, the SDK provides mock implementations:

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp';

// Register events
CROSSxWebApp.on('viewClosed', () => {
  console.log('App closed');
});

// Simulate events (only available in mock mode)
if (CROSSxWebApp._simulateClose) {
  CROSSxWebApp._simulateClose(); // Triggers 'viewClosed' event
}
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm watch
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Native Bridge Communication

The SDK communicates with the CROSSx native app through a bridge interface. The native app should provide:

```typescript
window.crossxNativeBridge = {
  send(request, callback) {
    // Handle request from JS and call callback with response
  },
  onEvent(event, handler) {
    // Register event listener for native events
  }
}
```

### Request Format

```typescript
{
  id: "req_1234567890_abc123",
  method: "webapp.ready" | "webapp.requestFullScreen",
  params: {}
}
```

### Response Format

```typescript
{
  id: "req_1234567890_abc123",
  result?: any,
  error?: string
}
```

### Supported Events

- `viewClosed` - WebView was closed
- `viewBackgrounded` - App moved to background

## Examples

### Game Integration

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp';

class Game {
  constructor() {
    this.init();
  }

  private init() {
    // Signal app ready
    CROSSxWebApp.ready();

    // Request fullscreen for better experience
    CROSSxWebApp.requestFullScreen();

    // Handle state transitions
    CROSSxWebApp.on('viewBackgrounded', () => {
      this.pause();
    });

    CROSSxWebApp.on('viewClosed', () => {
      this.saveProgress();
      this.cleanup();
    });
  }

  private pause() {
    console.log('Game paused');
  }

  private saveProgress() {
    console.log('Progress saved');
  }

  private cleanup() {
    console.log('Game cleaned up');
  }
}

// Start game
const game = new Game();
```

### Web App Integration

```typescript
import { CROSSxWebApp, isCROSSxEnvironment } from '@to-nexus/webapp';

document.addEventListener('DOMContentLoaded', () => {
  // Only in CROSSx environment
  if (isCROSSxEnvironment()) {
    // App is ready
    CROSSxWebApp.ready();

    // Handle fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      CROSSxWebApp.requestFullScreen();
    });
  }

  // Listen for lifecycle events
  CROSSxWebApp.on('viewClosed', () => {
    console.log('Saving data before exit');
    // Save user data, clear cache, etc.
  });
});
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| CROSSx  | ✅      | Full functionality |
| Chrome  | ✅      | Mock mode |
| Safari  | ✅      | Mock mode |
| Firefox | ✅      | Mock mode |

## License

Apache-2.0

## Support

For issues and feature requests, visit: https://github.com/cross-sdk-js/issues


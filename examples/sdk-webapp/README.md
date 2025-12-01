# CROSSx WebApp SDK - Example

This example demonstrates how to use the CROSSx WebApp SDK in different scenarios.

## 📁 Files

- **`index.html`** - Interactive testing & API reference page
- **`game.html`** - Full game example showing practical usage
- **`package.json`** - Project configuration
- **`vite.config.ts`** - Vite build configuration

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Development

Run the development server:

```bash
pnpm dev
```

This will open the example page in your browser at `http://localhost:5174`

### Build

Create an optimized production build:

```bash
pnpm build
```

Output will be in the `dist` folder.

### Preview

Preview the production build:

```bash
pnpm preview
```

## 📖 Examples

### 1. Interactive Testing (`index.html`)

A comprehensive testing page that shows:

- SDK version information
- Environment detection (CROSSx vs Mock)
- API testing buttons
- Event simulation (in mock mode)
- Real-time event logging

**Features:**

- ✅ Signal ready status
- ✅ Request fullscreen
- ✅ Simulate lifecycle events
- ✅ Visual event log

**Use cases:**

- Learning SDK API
- Testing in browser
- Debugging implementation

### 2. Game Demo (`game.html`)

A simple interactive game that demonstrates:

- Real-world SDK integration
- Game lifecycle management
- Fullscreen support
- Event handling

**How to play:**

1. Click "Start" to begin
2. Click the red circles to score points
3. Use Pause to pause the game
4. Use Fullscreen to go fullscreen (CROSSx only)

**SDK Integration:**

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp'

// Initialize
CROSSxWebApp.ready()

// Request fullscreen
CROSSxWebApp.requestFullScreen()

// Handle lifecycle
CROSSxWebApp.on('viewBackgrounded', () => {
  pauseGame()
})

CROSSxWebApp.on('viewClosed', () => {
  saveProgress()
})
```

## 🎯 What You'll Learn

### API Basics

- Getting SDK version
- Signaling readiness
- Requesting fullscreen
- Handling lifecycle events

### Environment Detection

- Detecting CROSSx environment
- Using mock for development
- Testing in browser

### Real-World Usage

- Game integration patterns
- State management
- Event handling
- UI responsiveness

## 🧪 Testing Scenarios

### In Browser (Mock Mode)

```bash
# Run dev server
pnpm dev

# Open http://localhost:5174/index.html
# - All features work in mock mode
# - Can simulate lifecycle events
# - Full functionality for testing
```

### In CROSSx App (Real Mode)

1. Build the example: `pnpm build`
2. Host the files on a server
3. Load URL in CROSSx WebView
4. Real native bridge communication happens

### Different Devices

The examples are responsive and work on:

- Desktop browsers
- Mobile browsers
- CROSSx WebView (iOS)
- CROSSx WebView (Android)

## 📝 Key Takeaways

### Initialization Pattern

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp'

// 1. Signal ready when app is initialized
CROSSxWebApp.ready()

// 2. Register lifecycle handlers
CROSSxWebApp.on('viewClosed', handleClose)
CROSSxWebApp.on('viewBackgrounded', handleBackground)

// 3. Request features as needed
CROSSxWebApp.requestFullScreen()
```

### Error Handling

```typescript
// Promises can fail if native bridge not available
CROSSxWebApp.requestFullScreen().catch(error => {
  console.error('Fullscreen not available:', error)
})
```

### Environment-Specific Code

```typescript
import { isCROSSxEnvironment } from '@to-nexus/webapp'

if (isCROSSxEnvironment()) {
  // Real CROSSx native features
  CROSSxWebApp.requestFullScreen()
} else {
  // Browser fallback
  document.documentElement.requestFullscreen?.()
}
```

## 🔗 Resources

- [CROSSx WebApp SDK Documentation](../../packages/webapp/README.md)
- [Architecture & Structure](../../packages/webapp/STRUCTURE.md)
- [Native Bridge Specification](../../packages/webapp/NATIVE_BRIDGE.md)

## 🐛 Troubleshooting

### SDK not found

```bash
# Make sure to install dependencies
pnpm install
```

### Port already in use

```bash
# Use a different port
pnpm dev -- --port 5175
```

### Build errors

```bash
# Clean and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

## 📞 Support

For issues with:

- **SDK**: See [SDK Documentation](../../packages/webapp/README.md)
- **Native Bridge**: See [Bridge Specification](../../packages/webapp/NATIVE_BRIDGE.md)
- **Examples**: File an issue with reproduction steps

## 📄 License

Apache-2.0

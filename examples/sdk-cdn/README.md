# Cross SDK CDN Sample

Vanilla JavaScript sample application using Cross SDK via CDN.

## Overview

This sample demonstrates how to load and use Cross SDK from CDN in a browser environment. You can test all SDK features with a single HTML file without any build process.

## Features

- ✅ Wallet connection/disconnection
- ✅ Account information display (address, network, balance)
- ✅ Message signing
- ✅ Transaction sending
- ✅ Network switching
- ✅ Real-time log display
- ✅ Responsive UI

## File Structure

```
sdk-cdn/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js              # JavaScript application logic
├── package.json        # Project configuration
└── README.md           # This file
```

## Quick Start

### 1. Install Dependencies

```bash
# Navigate to CDN example directory
cd examples/sdk-cdn

# Install dependencies (includes http-server)
npm install
```

### 2. Run the Server

**Option A: Using npm script (Recommended)**

```bash
# Development server with CORS support
npm run dev

# Or basic server
npm start
```

**Option B: Using npx (if http-server not installed globally)**

```bash
# With specific port
npx http-server -p 8080 -c-1

# With auto port allocation (recommended)
npx http-server -c-1
```

**Option C: Using global http-server**

```bash
# Install globally first
npm install -g http-server

# Then run with auto port allocation
http-server -c-1
```

**Option D: Using Python (if available)**

```bash
python3 -m http.server 8080
```

### 3. Access in Browser

When you start the server, it will show the available URLs in the terminal:

```
Starting up http-server, serving ./
Available on:
  http://localhost:8080
  http://10.120.120.48:8080
```

Use any of these URLs to access the application in your browser.

## Troubleshooting

### "http-server: command not found" Error

If you encounter this error, try one of these solutions:

1. **Use npx (Recommended):**

   ```bash
   npx http-server -p 8080 -c-1
   ```

2. **Install globally:**

   ```bash
   npm install -g http-server
   ```

3. **Use pnpm dlx:**
   ```bash
   pnpm dlx http-server -p 8080 -c-1
   ```

### "Missing script start" Error

If you get this error when running `pnpm start`, make sure you're in the correct directory:

```bash
# Navigate to the sdk-cdn directory first
cd packages/sdk-cdn
pnpm start
```

### Port Already in Use

If you get a port conflict error, you have several options:

**Option 1: Use auto port allocation (Recommended)**

```bash
# Remove the -p flag to let http-server find an available port
npx http-server -c-1
```

**Option 2: Try a different specific port**

```bash
npx http-server -p 3000 -c-1
# Then access http://localhost:3000
```

**Option 3: Find available ports**

```bash
# Check what's using port 8080
lsof -i :8080

# Kill the process if needed
kill -9 <PID>
```

**Note:** When using auto port allocation, the server will automatically find the next available port (8080, 8081, 8082, etc.) and display the URLs in the terminal.

## Configuration

Update the following settings in `app.js`:

```javascript
const projectId = 'YOUR_PROJECT_ID' // Change to actual project ID
const metadata = {
  name: 'Cross SDK CDN Sample',
  description: 'Sample using Cross SDK via CDN',
  url: window.location.origin,
  icons: ['https://your-app-icon.com/icon.png'] // Change to actual icon URL
}
```

## CDN Usage

### Version Management

Cross SDK CDN supports multiple versioning strategies:

```html
<!-- Specific version (recommended for production) -->
<script src="https://sdk-cdn.crosstoken.io/cross-sdk/1.15.0/cross-sdk.js"></script>

<!-- Latest version (for development/testing) -->
<script src="https://sdk-cdn.crosstoken.io/cross-sdk/latest/cross-sdk.js"></script>

<!-- React SDK -->
<script src="https://sdk-cdn.crosstoken.io/cross-sdk/1.15.0/cross-sdk-react.js"></script>
```

### Version Strategy Recommendations

| Use Case           | Version Tag | Description                         |
| ------------------ | ----------- | ----------------------------------- |
| **Production**     | `@1.8.1`    | Specific version for stability      |
| **Development**    | `@latest`   | Always get the newest version       |
| **Legacy Support** | `@1.7.0`    | Previous versions for compatibility |

### Using SDK

```javascript
// SDK is exposed globally as window.CrossSdk
const sdk = window.CrossSdk

// Initialize SDK
await sdk.initCrossSdk({
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My App',
    description: 'My App Description',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png']
  },
  chains: [sdk.crossTestnet]
})

// Connect wallet
const session = await sdk.connect()

// Get account information
const accounts = await sdk.getAccounts()
const balance = await sdk.getBalance()

// Sign message
const signature = await sdk.signMessage({
  message: 'Hello World',
  account: accounts[0]
})

// Send transaction
const hash = await sdk.sendTransaction({
  to: '0x...',
  value: sdk.parseEther('0.001'),
  account: accounts[0]
})
```

## Supported Networks

- Cross Testnet (Chain ID: 1001)
- Cross Mainnet (Chain ID: 1)
- BSC Testnet (Chain ID: 97)
- BSC Mainnet (Chain ID: 56)

## Important Notes

1. **Project ID**: You must set a valid project ID for actual use.
2. **HTTPS**: Use HTTPS in production environments.
3. **Version Pinning**: Use specific versions in production for stability.
4. **Error Handling**: More robust error handling is needed for actual applications.
5. **Backward Compatibility**: Previous versions remain available via CDN.
6. **CORS**: The sample includes CORS headers for development. Disable in production.
7. **CDN CORS Limitation**: Current CDN setup may have CORS restrictions for ES modules. For production use, ensure the CDN server includes proper CORS headers or use UMD/IIFE format.

## CDN CORS Issues

If you encounter CORS errors when loading the SDK from CDN, it means the CDN server needs to include proper CORS headers. The CDN server should include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Temporary Solutions:**

1. **Use a CORS proxy** (for development only)
2. **Download SDK locally** (not recommended for production)
3. **Request CDN server update** (recommended for production)

**For Production:**

- Ensure CDN server has proper CORS headers
- Use UMD/IIFE format instead of ES modules
- Consider self-hosting the SDK files

## Development

### Local CDN Testing

If CDN is not yet deployed, you can use locally built files:

```html
<!-- Use local build files -->
<script src="../../packages/cdn/dist/cross-sdk.js"></script>
```

### Building

To build CDN package locally:

```bash
# From project root
npm run build:cdn
```

### Publishing New Versions

When publishing a new version:

1. Update version in `packages/cdn/package.json`
2. Build the package: `npm run build`
3. Publish to npm: `npm publish`
4. CDN automatically becomes available at the new version

## Advanced Troubleshooting

### SDK Not Loading

1. Check if CDN URL is correct
2. Check network connection
3. Check error messages in browser console
4. Verify version tag exists
5. Check browser's developer tools Network tab

### Connection Issues

1. Verify project ID is correct
2. Check metadata configuration
3. Verify supported network settings
4. Check if wallet extension is installed and enabled

### Transaction Failures

1. Check if account has sufficient balance
2. Verify network configuration
3. Check gas fee settings
4. Ensure wallet is connected to the correct network

### Version Issues

1. Check if the specified version exists
2. Try using `@latest` for testing
3. Verify npm package is published
4. Clear browser cache and reload

### Browser Compatibility

- Chrome/Chromium: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Edge: ✅ Fully supported
- Mobile browsers: ✅ Supported (with wallet app integration)

## License

MIT License - see LICENSE file for details.

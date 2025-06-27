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
└── README.md           # This file
```

## Usage

### 1. Run Locally

```bash
# From project root
cd examples/sdk-cdn

# Run simple HTTP server (Python 3)
python3 -m http.server 8080

# Or use Node.js http-server
npx http-server -p 8080
```

### 2. Access in Browser

```
http://localhost:8080
```

### 3. Configuration

Update the following settings in `app.js`:

```javascript
const projectId = 'YOUR_PROJECT_ID'; // Change to actual project ID
const metadata = {
    name: 'Cross SDK CDN Sample',
    description: 'Sample using Cross SDK via CDN',
    url: window.location.origin,
    icons: ['https://your-app-icon.com/icon.png'] // Change to actual icon URL
};
```

## CDN Usage

### Version Management

Cross SDK CDN supports multiple versioning strategies:

```html
<!-- Specific version (recommended for production) -->
<script src="https://test-sdk-cdn.crosstoken.io/cross-sdk/1.8.1/cross-sdk.js"></script>

<!-- Latest version (for development/testing) -->
<script src="https://test-sdk-cdn.crosstoken.io/cross-sdk/latest/cross-sdk.js"></script>

<!-- React SDK -->
<script src="https://test-sdk-cdn.crosstoken.io/cross-sdk/1.8.1/cross-sdk-react.js"></script>
```

### Version Strategy Recommendations

| Use Case | Version Tag | Description |
|----------|-------------|-------------|
| **Production** | `@1.8.1` | Specific version for stability |
| **Development** | `@latest` | Always get the newest version |
| **Legacy Support** | `@1.7.0` | Previous versions for compatibility |

### Using SDK

```javascript
// SDK is exposed globally as window.CrossSdk
const sdk = window.CrossSdk;

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
});

// Connect wallet
const session = await sdk.connect();

// Get account information
const accounts = await sdk.getAccounts();
const balance = await sdk.getBalance();

// Sign message
const signature = await sdk.signMessage({
    message: 'Hello World',
    account: accounts[0]
});

// Send transaction
const hash = await sdk.sendTransaction({
    to: '0x...',
    value: sdk.parseEther('0.001'),
    account: accounts[0]
});
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

## Troubleshooting

### SDK Not Loading

1. Check if CDN URL is correct
2. Check network connection
3. Check error messages in browser console
4. Verify version tag exists

### Connection Issues

1. Verify project ID is correct
2. Check metadata configuration
3. Verify supported network settings

### Transaction Failures

1. Check if account has sufficient balance
2. Verify network configuration
3. Check gas fee settings

### Version Issues

1. Check if the specified version exists
2. Try using `@latest` for testing
3. Verify npm package is published

## License

This sample is provided under the MIT License. 
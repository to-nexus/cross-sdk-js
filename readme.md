# Cross SDK for JavaScript

[![Version](https://img.shields.io/npm/v/@to-nexus/cross-sdk.svg)](https://www.npmjs.com/package/@to-nexus/cross-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> 🚀 Your on-ramp to web3 multichain. Cross SDK is a versatile library that makes it super easy to connect users with your Dapp and start interacting with the blockchain.

## 📚 Documentation

- [JavaScript SDK Documentation](https://cross.readme.io/update/docs/js/)
- [API Reference](https://cross.readme.io/update/docs/js/api/)

## ✨ Features

- 🔗 **Easy Wallet Connection**: Seamlessly connect to various wallets
- 🌐 **Multi-chain Support**: Cross, BSC, and more blockchain networks
- 🎨 **Customizable UI**: Beautiful and modern interface components
- 🛡️ **Type Safety**: Full TypeScript support
- 📱 **Mobile Ready**: Cross-platform compatibility
- 🔄 **Token Management**: Balance tracking and token operations
- 💸 **Transaction Handling**: Send, receive, and interact with smart contracts

## 🏗️ Architecture

This monorepo contains the following packages:

### Core Packages
- `@to-nexus/cross-sdk` - Main SDK package
- `@to-nexus/appkit` - AppKit components
- `@to-nexus/appkit-core` - Core functionality
- `@to-nexus/appkit-utils` - Utility functions
- `@to-nexus/common` - Common types and utilities

### UI Components
- `@to-nexus/ui` - Core UI components
- `@to-nexus/scaffold-ui` - Scaffold UI components
- `@to-nexus/appkit-wallet-button` - Wallet button component

### Adapters
- `@to-nexus/appkit-adapter-ethers` - Ethers.js adapter
- `@to-nexus/appkit-adapter-wagmi` - Wagmi adapter

### Authentication
- `@to-nexus/siwe` - Sign-in with Ethereum
- `@to-nexus/siwx` - Sign-in with X (extended)

### Tools
- `@to-nexus/cli` - CLI tools
- `@to-nexus/cdn` - CDN distribution

## 🚀 Quick Start

### Installation

```bash
npm install @to-nexus/cross-sdk
# or
pnpm install @to-nexus/cross-sdk
# or
yarn add @to-nexus/cross-sdk
```

### Basic Usage

```typescript
import { initCrossSdk } from '@to-nexus/cross-sdk'

// Initialize the SDK
const sdk = initCrossSdk({
  projectId: 'your-project-id',
  metadata: {
    name: 'Your App',
    description: 'Your App Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  }
})

// Connect wallet
await sdk.connect()
```

### React Integration

```tsx
import { initCrossSdk, AccountController } from '@to-nexus/cross-sdk'
import { useEffect, useState } from 'react'

function App() {
  const [account, setAccount] = useState(null)

  useEffect(() => {
    const sdk = initCrossSdk({
      projectId: 'your-project-id'
    })

    // Subscribe to account changes
    AccountController.subscribe(state => {
      setAccount(state.address)
    })
  }, [])

  return (
    <div>
      {account ? `Connected: ${account}` : 'Not connected'}
    </div>
  )
}
```

## 🛠️ Development

### Prerequisites

- Node.js ^20.18.0
    - pnpm
    - turbo

### Environment Setup

1. **Clone the repository**
    ```bash
   git clone https://github.com/your-org/cross-sdk-js.git
   cd cross-sdk-js
   ```

2. **Install dependencies**
    ```bash
    pnpm install
    ```

3. **Set up environment variables**
   ```bash
   # For examples
   cd examples/sdk-react
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```bash
   VITE_PROJECT_ID=your-project-id
   VITE_ENV_MODE=development
   ```

### Available Scripts

- `pnpm build` - Build all packages
- `pnpm watch` - Watch mode for development
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Lint all packages
- `pnpm prettier` - Format code
- `pnpm typecheck` - Type checking

### Working with Examples

- `pnpm examples` - Run all examples
- `pnpm --filter sdk-react dev` - Run React example
- `pnpm --filter sdk-vanilla dev` - Run Vanilla JS example
- `pnpm --filter sdk-cdn dev` - Run CDN example

### Building Examples

```bash
# Build all examples
pnpm build:examples

# Build specific example
pnpm --filter sdk-react build
```

## 📁 Project Structure

```
cross-sdk-js/
├── packages/
│   ├── sdk/              # Main SDK package
│   ├── appkit/           # AppKit components
│   ├── core/             # Core functionality
│   ├── ui/               # UI components
│   ├── adapters/         # Blockchain adapters
│   ├── common/           # Common utilities
│   └── ...
├── examples/
│   ├── sdk-react/        # React example
│   ├── sdk-vanilla/      # Vanilla JS example
│   └── sdk-cdn/          # CDN example
└── scripts/              # Build scripts
```

## 🌐 Supported Networks

- **Cross Chain** (Mainnet & Testnet)
- **Binance Smart Chain** (Mainnet & Testnet)
- More networks coming soon...

## 🔧 Configuration

### SDK Options

```typescript
interface CrossSdkParams {
  projectId: string
  redirectUrl?: string
  metadata?: {
    name: string
    description: string
    url: string
    icons: string[]
  }
  themeMode?: 'light' | 'dark'
  defaultNetwork?: SupportedNetwork
}
```

### Theme Customization

```typescript
const sdk = initCrossSdk({
  projectId: 'your-project-id',
  themeMode: 'dark', // or 'light'
  // Custom theme variables can be set via CSS
})
```

## 📦 Publishing

### Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

    ```bash
# Add a changeset
pnpm changeset

# Version packages
pnpm changeset:version

# Publish packages
pnpm changeset:publish
```

### Release Channels

- `latest` - Stable releases
- `beta` - Beta releases
- `alpha` - Alpha releases
- `canary` - Canary releases

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass
- Use conventional commits

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by the Cross team
- Special thanks to the web3 community
- Powered by modern web technologies

---

For more information, visit [Cross Documentation](https://cross.readme.io/update/docs/js/) or join our [Discord](https://discord.gg/cross).

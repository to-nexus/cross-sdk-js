# Cross SDK CDN

Cross SDK CDN provides easy-to-use JavaScript libraries for integrating Cross SDK functionality into your web applications. Available for both Vanilla JavaScript and React environments.

## Installation

### Vanilla JavaScript (HTML)

Add the following script tag to your HTML file:

```html
<script src="https://your-cdn.com/sdk.js"></script>
```

### React

Add the following script tag to your HTML file:

```html
<script src="https://your-cdn.com/sdk-react.js"></script>
```

## Usage

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cross SDK Vanilla Example</title>
</head>
<body>
    <button id="connect-wallet">Connect Wallet</button>
    <button id="sign-message">Sign Message</button>
    <button id="send-transaction">Send Transaction</button>
    
    <div id="account-info"></div>
    <div id="network-info"></div>

    <script src="https://your-cdn.com/sdk.js"></script>
    <script>
        // Initialize Cross SDK
        const crossSdk = window.CrossSdk.initCrossSdkWithParams({
            projectId: 'your-project-id',
            redirectUrl: window.location.href,
            metadata: {
                name: 'My App',
                description: 'My Cross SDK App',
                url: 'https://myapp.com',
                icons: ['https://myapp.com/icon.png']
            },
            themeMode: 'light'
        });

        // Get wallet button instance
        const walletButton = window.CrossSdk.useAppKitWallet();

        // Connect wallet
        document.getElementById('connect-wallet').addEventListener('click', async () => {
            try {
                await walletButton.connect('cross_wallet');
                console.log('Wallet connected!');
            } catch (error) {
                console.error('Connection failed:', error);
            }
        });

        // Sign message
        document.getElementById('sign-message').addEventListener('click', async () => {
            try {
                const signedMessage = await window.CrossSdk.ConnectionController.signMessage({
                    message: `Hello, world! ${Date.now()}`,
                    customData: {
                        metadata: 'This is metadata for signed message'
                    }
                });
                console.log('Signed message:', signedMessage);
            } catch (error) {
                console.error('Signing failed:', error);
            }
        });

        // Send transaction
        document.getElementById('send-transaction').addEventListener('click', async () => {
            try {
                const transaction = await window.CrossSdk.SendController.sendTransaction({
                    to: '0x...',
                    value: '1000000000000000000', // 1 CROSS
                    data: '0x'
                });
                console.log('Transaction sent:', transaction);
            } catch (error) {
                console.error('Transaction failed:', error);
            }
        });

        // Subscribe to account state changes
        window.CrossSdk.AccountController.subscribeKey('address', (address) => {
            document.getElementById('account-info').textContent = 
                address ? `Connected: ${address}` : 'Not connected';
        });

        // Subscribe to network state changes
        window.CrossSdk.ConnectionController.subscribeKey('caipNetwork', (network) => {
            document.getElementById('network-info').textContent = 
                network ? `Network: ${network.name}` : 'No network';
        });
    </script>
</body>
</html>
```

### React

```jsx
import React, { useEffect, useState } from 'react';

function App() {
    const [account, setAccount] = useState(null);
    const [network, setNetwork] = useState(null);

    useEffect(() => {
        // Initialize Cross SDK
        const crossSdk = window.CrossSdkReact.initCrossSdkWithParams({
            projectId: 'your-project-id',
            redirectUrl: window.location.href,
            metadata: {
                name: 'My React App',
                description: 'My Cross SDK React App',
                url: 'https://myapp.com',
                icons: ['https://myapp.com/icon.png']
            },
            themeMode: 'light'
        });

        // Subscribe to account state
        window.CrossSdkReact.AccountController.subscribeKey('address', (address) => {
            setAccount(address);
        });

        // Subscribe to network state
        window.CrossSdkReact.ConnectionController.subscribeKey('caipNetwork', (network) => {
            setNetwork(network);
        });
    }, []);

    const connectWallet = async () => {
        try {
            const walletButton = window.CrossSdkReact.useAppKitWallet();
            await walletButton.connect('cross_wallet');
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const signMessage = async () => {
        try {
            const signedMessage = await window.CrossSdkReact.ConnectionController.signMessage({
                message: `Hello, world! ${Date.now()}`,
                customData: {
                    metadata: 'This is metadata for signed message'
                }
            });
            console.log('Signed message:', signedMessage);
        } catch (error) {
            console.error('Signing failed:', error);
        }
    };

    const sendTransaction = async () => {
        try {
            const transaction = await window.CrossSdkReact.SendController.sendTransaction({
                to: '0x...',
                value: '1000000000000000000', // 1 CROSS
                data: '0x'
            });
            console.log('Transaction sent:', transaction);
        } catch (error) {
            console.error('Transaction failed:', error);
        }
    };

    return (
        <div>
            <h1>Cross SDK React Example</h1>
            
            <div>
                <button onClick={connectWallet}>Connect Wallet</button>
                <button onClick={signMessage}>Sign Message</button>
                <button onClick={sendTransaction}>Send Transaction</button>
            </div>

            <div>
                <p>Account: {account || 'Not connected'}</p>
                <p>Network: {network?.name || 'No network'}</p>
            </div>
        </div>
    );
}

export default App;
```

## Available Networks

The SDK supports the following networks:

- **Cross Mainnet** - Production Cross network
- **Cross Testnet** - Test Cross network  
- **BSC Mainnet** - Binance Smart Chain mainnet
- **BSC Testnet** - Binance Smart Chain testnet

## API Reference

### Core Functions

- `initCrossSdk(projectId, redirectUrl?, metadata?, themeMode?, defaultNetwork?)` - Initialize Cross SDK
- `initCrossSdkWithParams(params)` - Initialize Cross SDK with parameters object
- `useAppKitWallet()` - Get wallet button instance

### Controllers

- `AccountController` - Manage account state and information
- `ConnectionController` - Handle wallet connections and signing
- `SendController` - Send transactions and interact with contracts
- `ConstantsUtil` - Utility constants and helper functions

### Networks

- `crossMainnet` - Cross mainnet configuration
- `crossTestnet` - Cross testnet configuration
- `bscMainnet` - BSC mainnet configuration
- `bscTestnet` - BSC testnet configuration

## Examples

For complete examples, see:
- [Vanilla JavaScript Example](../../examples/sdk-vanilla/)
- [React Example](../../examples/sdk-react/)

## Getting Started

1. **Get a Project ID**: Contact the Cross team to get your unique project ID
2. **Choose your environment**: Vanilla JS or React
3. **Add the CDN script**: Include the appropriate script tag
4. **Initialize the SDK**: Call `initCrossSdkWithParams()` with your configuration
5. **Start building**: Use the provided controllers and functions

## Support

- [Documentation](https://cross.readme.io/update/docs/integration/)
- [GitHub](https://github.com/to-nexus/sdk)
- [Nexus](https://to.nexus)

## License

This project is licensed under the MIT License.

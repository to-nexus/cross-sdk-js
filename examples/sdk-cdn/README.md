#### 📚 [Documentation](https://cross.readme.io/update/docs/js/)

# CROSS SDK - CDN example

## Features

This example demonstrates:

- **Cross Wallet** connection (QR Code & Extension via Cross SDK modal)
- **Cross Extension** - Browser extension wallet
- **MetaMask Extension** - Browser extension wallet
- **Connect + Auth** - One-click connection with SIWE authentication
  - 📖 For detailed usage and implementation guide, see [Authentication Guide](../../docs/authenticate-wallet-connect.md) ([English](../../docs/authenticate-wallet-connect-en.md))

> ⚠️ **Note**: MetaMask QR Code is not supported in CDN mode due to Node.js module dependencies (`events` module). Use `sdk-vanilla` example for full MetaMask QR Code support.

---

## Setup

1.  Prerequisites

    - Node.js ^20.18.0
    - pnpm

2.  Install dependencies

    - Install `http-server` for local development:

    ```bash
    cd examples/sdk-cdn
    pnpm install
    ```

3.  Run the example

    - Start the local server:

    ```bash
    pnpm run dev
    ```

    - Default port: `8080`. Access at `http://localhost:8080`

4.  Supported wallets

    - **CROSSx Wallet**: QR Code and Extension via Cross SDK modal
    - **Cross Extension**: Browser extension wallet
    - **MetaMask Extension**: Browser extension wallet

    > ⚠️ **Note**: MetaMask QR Code is not supported in CDN mode due to Node.js module dependencies (`events` module). Use `sdk-vanilla` example for full MetaMask QR Code support.

5.  Update CDN files

    - To update SDK files to the latest version:

    ```bash
    pnpm run update-cdn
    # or
    ./update-cdn-files.sh
    ```

6.  Configuration

    - Project IDs are hardcoded in `app.js`:
      - Cross SDK: `0979fd7c92ec3dbd8e78f433c3e5a523`
      - MetaMask (WalletConnect): `a48aa6e93d89fbc0f047637579e65356`
    - For production, replace with your own Project IDs in `app.js`

7.  Technical limitations

    - **No npm packages**: All dependencies loaded via CDN
    - **No build process**: Pure JavaScript without bundling
    - **MetaMask QR Code unsupported**: WalletConnect provider requires Node.js `events` module, which cannot be resolved in browser environments without a bundler
    - **For full features**: Use `sdk-vanilla`, `sdk-react`, or `sdk-wagmi` examples instead

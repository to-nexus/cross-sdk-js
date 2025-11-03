#### 📚 [Documentation](https://cross.readme.io/update/docs/js/)

# CROSS SDK - Vanilla JS examples

1. Prerequsites
:   - Node.js ^20.18.0
    - pnpm
    - turbo

2. Prepare Environment
:   - Create .env file in project
    ```bash
    cd packages/sdk-react
    touch .env
    ```
    .env file should contain
    ```bash
    VITE_PROJECT_ID=0979fd7c92ec3dbd8e78f433c3e5a523 // use this for test
    VITE_ENV_MODE=production   // development or production
    
    # Optional: MetaMask (Reown) Project ID (default: a48aa6e93d89fbc0f047637579e65356)
    VITE_METAMASK_PROJECT_ID=a48aa6e93d89fbc0f047637579e65356
    
    # Optional: Universal Link for Cross Wallet (default: production URL)
    VITE_UNIVERSAL_LINK=https://stg-cross-wallet.crosstoken.io  // stage
    # VITE_UNIVERSAL_LINK=https://dev-cross-wallet.crosstoken.io  // development
    # VITE_UNIVERSAL_LINK=https://cross-wallet.crosstoken.io  // production (default)
    ```
    - SDK package is now publicly visible, so github token is not required.
3. Install dependencies
:   - Install dependencies on root
    ```bash
    pnpm install
    ```
    - Run as production mode
    ```bash
    cd packages/sdk-react
    npm run build
    vite preview --port 4173
    ```

    localhost:4173 is enlisted as whitelist, so please use port 4173 for testing.

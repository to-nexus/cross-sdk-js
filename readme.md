#### 📚 [Documentation](https://cross.readme.io/update/docs/js/)

# Cross SDK for JavaScript

Your on-ramp to web3 multichain. AppKit is a versatile library that makes it super easy to connect users with your Dapp and start interacting with the blockchain.

#### 📚 [Documentation](https://cross.readme.io/update/docs/js/)

# Cross SDK examples

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

#### 📚 [Documentation](https://cross.readme.io/update/docs/js/)

# CROSS SDK - Wagmi example

1.  Prerequisites

    - Node.js ^20.18.0
    - pnpm
    - turbo

2.  Prepare environment

    - Create a `.env` file inside the example

    ```bash
    cd examples/sdk-wagmi
    touch .env
    ```

    `.env` file should contain

    ```bash
    VITE_PROJECT_ID=0979fd7c92ec3dbd8e78f433c3e5a523
        # Optional: MetaMask (Reown) Project ID (default: a48aa6e93d89fbc0f047637579e65356)
        VITE_METAMASK_PROJECT_ID=a48aa6e93d89fbc0f047637579e65356

        # Optional: Universal Link for Cross Wallet (default: crossx:// deep link)
        VITE_UNIVERSAL_LINK=https://cross-wallet.crosstoken.io
    ```

    **Environment variable guide:**

    - `VITE_PROJECT_ID`: Project ID for Cross SDK (required)
    - `VITE_METAMASK_PROJECT_ID`: (Optional) MetaMask (Reown) Project ID
      - Defaults to the built-in value if not provided
      - Request a new Reown Project ID at [cloud.reown.com](https://cloud.reown.com)
    - `VITE_UNIVERSAL_LINK`: (Optional) Universal link for the Cross Wallet app
      - Falls back to the `crossx://` deep link when omitted

3.  Install dependencies

    - From the repository root:

    ```bash
    pnpm install
    ```

4.  Run the example

    - Start the dev server:

    ```bash
    cd examples/sdk-wagmi
    pnpm run dev
    ```

    - Default port: `3014`. Use this port for local testing.

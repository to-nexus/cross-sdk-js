---
'@to-nexus/appkit-adapter-bitcoin': major
'@to-nexus/appkit-adapter-ethers': major
'@to-nexus/appkit-adapter-polkadot': major
'@to-nexus/appkit-adapter-solana': major
'@to-nexus/appkit-adapter-wagmi': major
'@to-nexus/appkit': major
'@to-nexus/appkit-utils': major
'@to-nexus/sdk-cdn': major
'@to-nexus/appkit-common': major
'@to-nexus/appkit-core': major
'@to-nexus/appkit-experimental': major
'@to-nexus/appkit-scaffold-ui': major
'@to-nexus/sdk': major
'@to-nexus/appkit-siwe': major
'@to-nexus/appkit-siwx': major
'@to-nexus/appkit-ui': major
'@to-nexus/appkit-wallet': major
'@to-nexus/appkit-wallet-button': major
---

Simplified signTypedDataV4 method signature by removing address parameter requirement. The wallet provider automatically determines the signing address, eliminating redundant parameter passing. Updated type definitions and examples accordingly.

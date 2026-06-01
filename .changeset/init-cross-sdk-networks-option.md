---
'@to-nexus/sdk': patch
---

Add an optional `networks` parameter to `initCrossSdk` / `initCrossSdkWithParams`.

Previously the SDK always registered the full built-in network list
(`networkController.getNetworks()`) with AppKit regardless of the chains a
dApp actually wanted. Because every chain (including Kaia testnet, id `1001`)
was registered and requested in the WalletConnect session, the active network
could resolve to — or be restored from storage as — an unintended chain even
when `defaultNetwork` was set to CROSS.

Callers can now pass an explicit `networks` list to restrict the dApp to
specific chains. When omitted, the previous behavior (full built-in list) is
preserved, so this change is backward compatible.

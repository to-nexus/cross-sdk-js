---
'@to-nexus/appkit': patch
---

Fix EVM requests being routed to an unintended chain.

- `sendTransaction` now passes the active `caipNetwork` to the adapter, like
  `writeContract` / `estimateGas` already do. Previously the ethers adapter
  received `Number(undefined)` (`NaN`) as the chain id and built
  `BrowserProvider(provider, NaN)`, so the transaction chain was inferred from
  the provider's current chain instead of the active network.
- `WcHelpersUtil.createNamespaces` now sets `defaultChain` (the first network
  of each namespace) on the WalletConnect namespace. Without it the wallet
  falls back to `chains[0]` or its own previously-selected chain when deciding
  the session's primary chain.

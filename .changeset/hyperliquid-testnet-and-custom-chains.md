---
'@to-nexus/appkit': patch
'@to-nexus/appkit-core': patch
'@to-nexus/sdk': patch
---

Support EVM chains the SDK ships no preset for, and add Hyperliquid EVM Testnet (998).

The chain catalog lives in the backend (`chain/info`), so a chain can be
`required: true` there before this SDK has a preset for it — Hyperliquid EVM
Testnet was in exactly that state. `CrossSdkParams.networks` /
`defaultNetwork` were typed as a closed union of presets, so such a chain could
not be registered at all, and consumers had no supported path to add one:
AppKit freezes its supported set into `caipNetworks` at init.

- **New preset** `hyperliquidTestnet` (998), matching the catalog entry. No
  `contracts.multicall3` — none is deployed there (the catalog reports the zero
  address), and viem falls back to a plain `eth_call` when the contract is
  absent. Added to the built-in network list so it resolves before any catalog
  fetch.
- **`SupportedNetworks` is no longer a closed union.** It is now
  `PresetNetwork | AppKitNetwork`, so any chain may be registered — built with
  `defineChain`, or straight off the catalog with `mapApiToNetwork(info)`. Both
  helpers, plus the `AppKitNetwork` type, are now re-exported from
  `@to-nexus/sdk` so consumers need not depend on `@to-nexus/appkit` directly.
  `PresetNetwork` is exported for callers that want the narrow set, and now
  includes `oneMainnet` / `oneTestnet` / `roninTestnet`, which shipped as
  values but were missing from the union.
- **Fix: a registered chain could be flagged unsupported forever.**
  `ChainController.checkIfSupportedNetwork` / `checkIfSupportedChainId`
  compared network ids with `===`, but registered ids are numbers while ids
  parsed out of a CAIP id (`'eip155:998'` → `'998'`) are strings — so the
  comparison never matched and the "app doesn't support your current network"
  modal reappeared on every action, with no way to dismiss it. Ids now compare
  across both forms; non-numeric ids (solana, bip122) still compare exactly.
- **Fix: `getUnsupportedNetwork()` built a string `id`.** Numeric references
  (every eip155 chain id) are now numbers, so the fallback network no longer
  poisons those comparisons at the source.
- **Fix: the adapter `switchNetwork` handler used a strict id compare** and sent
  chains that *are* registered down the `setUnsupportedNetwork` branch.
  Adapters report `chainId` as a number or a string depending on the connector;
  the handler now tolerates both, matching the `chainChanged` path.

Registering a chain makes it switchable and readable. Signing on it
additionally requires the wallet to accept `eip155:<id>` — that is a
wallet-side capability, unchanged by this release.

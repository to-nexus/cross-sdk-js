---
'@to-nexus/appkit-adapter-wagmi': patch
---

Cross Extension 연결을 EIP-6963 announce 기반으로 전환.

`crossExtensionConnector`가 `window.crossWallet`만 보던 것을, 표준 EIP-6963
`announceProvider`(rdns `nexus.to.crosswallet.desktop`)로 announce된 provider를
우선 사용하고 없을 때만 `window.crossWallet`로 fallback하도록 변경. 이로써
window.ethereum 점유와 무관하게 동작하며, EIP-6963만 announce하는 신규
익스텐션과 window.crossWallet도 주입하는 기존 익스텐션 모두와 호환된다.

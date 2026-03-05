import { u as AccountController, v as AppKit, d as CoreHelperUtil, P as PACKAGE_VERSION, W as WalletButtonController, w as ApiController, x as ConnectionController, y as ConstantsUtil, z as ConnectorUtil, B as WalletUtil, D as ConnectorController, O as OptionsController, E as EthersAdapter, g as ConstantsUtil$1, F as networkController, G as ConstantsUtil$2, Z, I as roninTestnet, J as roninMainnet, K as etherTestnet, L as etherMainnet, N as kaiaTestnet, Q as kaiaMainnet, V as bscTestnet, X as bscMainnet, Y as crossTestnet, _ as crossMainnet, C as ChainController, $ as SendController } from "./index.es-QQ-ABb65.js";
function createDefaultSIWXConfig(options = {}) {
  let currentChainId = void 0;
  AccountController.subscribeKey("caipAddress", (caipAddress) => {
    if (caipAddress) {
      const parts = caipAddress.split(":");
      if (parts.length >= 2) {
        currentChainId = `${parts[0]}:${parts[1]}`;
      }
    }
  });
  return {
    /**
     * Creates a SIWE message with standard fields
     */
    createMessage: async (input) => {
      const chainId = currentChainId || input.chainId;
      const issuedAt = /* @__PURE__ */ new Date();
      const expirationTime = typeof options.expirationTime === "function" ? options.expirationTime(issuedAt) : options.expirationTime || new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
      const nonce = options.getNonce ? await options.getNonce() : Math.random().toString(36).substring(2, 15);
      const message = {
        ...input,
        chainId,
        domain: options.domain || window.location.host,
        uri: options.uri || window.location.origin,
        version: "1",
        nonce,
        issuedAt: issuedAt.toISOString().replace(/\.\d{3}Z$/, "Z"),
        // Remove milliseconds for SIWE compatibility
        expirationTime,
        statement: options.statement || "Sign in with your wallet",
        toString: () => {
          const parts = [
            `${message.domain} wants you to sign in with your Ethereum account:`,
            message.accountAddress,
            "",
            // First blank line
            message.statement || void 0,
            // Statement (optional)
            "",
            // Second blank line
            `URI: ${message.uri}`,
            `Version: ${message.version}`,
            `Chain ID: ${message.chainId}`,
            `Nonce: ${message.nonce}`,
            `Issued At: ${message.issuedAt}`
          ];
          if (message.expirationTime) {
            parts.push(`Expiration Time: ${message.expirationTime}`);
          }
          return parts.filter((part) => part !== void 0).join("\n");
        }
      };
      return message;
    },
    /**
     * Stores a SIWX session (defaults to localStorage)
     */
    addSession: options.addSession || (async (session) => {
      console.log("✅ SIWX Session added:", session);
      localStorage.setItem("siwx_session", JSON.stringify(session));
    }),
    /**
     * Revokes a SIWX session (defaults to localStorage removal)
     */
    revokeSession: options.revokeSession || (async (chainId, address) => {
      console.log("🗑️ SIWX Session revoked:", { chainId, address });
      localStorage.removeItem("siwx_session");
    }),
    /**
     * Sets multiple SIWX sessions (defaults to localStorage)
     */
    setSessions: options.setSessions || (async (sessions) => {
      console.log("📝 SIWX Sessions set:", sessions);
      if (sessions.length > 0) {
        localStorage.setItem("siwx_sessions", JSON.stringify(sessions));
      } else {
        localStorage.removeItem("siwx_sessions");
      }
    }),
    /**
     * Retrieves SIWX sessions for a given chain and address (defaults to localStorage)
     */
    getSessions: options.getSessions || (async (chainId, address) => {
      const sessionStr = localStorage.getItem("siwx_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session.data.chainId === chainId && session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
            return [session];
          }
        } catch (error) {
          console.error("Error parsing siwx_session:", error);
        }
      }
      const sessionsStr = localStorage.getItem("siwx_sessions");
      if (sessionsStr) {
        try {
          const sessions = JSON.parse(sessionsStr);
          return sessions.filter((s) => s.data.chainId === chainId && s.data.accountAddress.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error("Error parsing siwx_sessions:", error);
        }
      }
      return [];
    }),
    /**
     * Whether SIWX authentication is required (defaults to false - optional)
     */
    getRequired: options.getRequired || (() => false)
  };
}
function createAppKit(options) {
  return new AppKit({
    ...options,
    sdkVersion: CoreHelperUtil.generateSdkVersion(options.adapters ?? [], "html", PACKAGE_VERSION)
  });
}
class AppKitWalletButton {
  constructor() {
  }
  isReady() {
    return WalletButtonController.state.ready;
  }
  subscribeIsReady(callback) {
    ApiController.subscribeKey("walletButtons", (val) => {
      if (val.length) {
        callback({ isReady: true });
      } else {
        callback({ isReady: false });
      }
    });
  }
  async disconnect() {
    WalletButtonController.setPending(true);
    WalletButtonController.setError(void 0);
    await ConnectionController.disconnect();
    WalletButtonController.setPending(false);
  }
  async connect(wallet) {
    try {
      WalletButtonController.setPending(true);
      WalletButtonController.setError(void 0);
      if (ConstantsUtil.Socials.some((social) => social === wallet)) {
        const result2 = await ConnectorUtil.connectSocial(wallet);
        this.handleSuccess(result2);
        return result2;
      }
      const walletButton2 = WalletUtil.getWalletButton(wallet);
      const connector = walletButton2 ? ConnectorController.getConnector(walletButton2.id, walletButton2.rdns) : void 0;
      if (connector) {
        const result2 = await ConnectorUtil.connectExternal(connector);
        this.handleSuccess(result2);
        return result2;
      }
      const { customWallets } = OptionsController.state;
      const customWallet = customWallets == null ? void 0 : customWallets.find((w) => w.id === wallet);
      const currentConnectors = ConnectorController.state.connectors;
      const result = await ConnectorUtil.connectWalletConnect({
        walletConnect: wallet === "cross_wallet",
        connector: currentConnectors.find((c) => c.id === wallet),
        wallet: customWallet
      });
      this.handleSuccess(result);
      return result;
    } catch (err) {
      this.handleError(err);
      throw err;
    } finally {
      WalletButtonController.setPending(false);
    }
  }
  handleSuccess(result) {
    console.log("Connection successful:", result);
  }
  handleError(err) {
    console.error("Connection failed:", err);
    WalletButtonController.setError(err);
  }
}
let walletButton = void 0;
function createAppKitWalletButton() {
  if (!walletButton) {
    walletButton = new AppKitWalletButton();
  }
  return walletButton;
}
const _ = new EthersAdapter(), M = {
  name: "Cross SDK",
  description: "Cross SDK for HTML",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
};
let r = null, C, k;
const U = (t) => {
  if (r)
    return r;
  const {
    projectId: n,
    redirectUrl: l,
    metadata: a,
    themeMode: i,
    defaultNetwork: e,
    adapters: c,
    mobileLink: o,
    siwx: s
  } = t;
  return C = o, k = s, r = W(
    n,
    l,
    a,
    i,
    e,
    c,
    o,
    s
  ), r;
}, W = (t, n, l, a, i, e, c, o) => {
  var d, m;
  const s = {
    ...M,
    ...l,
    redirect: {
      universal: n
    }
  }, u = c || C || ((m = (d = ConstantsUtil$1).getCrossWalletDeepLink) == null ? void 0 : m.call(d)) || "crossx://", h = o || k;
  !CoreHelperUtil.isMobile() && typeof localStorage < "u" && localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");
  const p = {
    id: "cross_wallet",
    name: "CROSSx Wallet",
    image_url: "https://contents.crosstoken.io/wallet/token/images/CROSSx.svg",
    app_store: "https://apps.apple.com/us/app/crossx-games/id6741250674",
    play_store: "https://play.google.com/store/apps/details?id=com.nexus.crosswallet",
    chrome_store: "https://chromewebstore.google.com/detail/crossx/nninbdadmocnokibpaaohnoepbnpdgcg",
    rdns: "nexus.to.crosswallet.desktop",
    // 명시적으로 빈 문자열로 설정하여 오버라이드
    mobile_link: "",
    desktop_link: "",
    webapp_link: "",
    injected: [
      {
        injected_id: "nexus.to.crosswallet.desktop"
      }
    ]
  };
  return CoreHelperUtil.isMobile() && Object.assign(p, { mobile_link: u }), createAppKit({
    adapters: e && e.length > 0 ? e : [_],
    networks: [
      ...networkController.getNetworks()
      // 타입 호환성을 위해 튜플로 변환이 필요할 수 있으나, createAppKit이 배열을 받으므로 spread로 처리
    ],
    defaultNetwork: i,
    metadata: s,
    projectId: t,
    themeMode: a || "light",
    siwx: h,
    features: {
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
      email: false,
      emailShowWallets: false,
      socials: false,
      history: false,
      analytics: false,
      legalCheckbox: false
    },
    enableCoinbase: false,
    customWallets: [p],
    allWallets: "HIDE"
  });
}, D = () => createAppKitWalletButton(), K = "1.19.1-beta.1";
if (typeof window !== "undefined") {
  window.CrossSdk = {
    initCrossSdk: W,
    initCrossSdkWithParams: U,
    useAppKitWallet: D,
    createDefaultSIWXConfig,
    ConnectionController,
    ConnectorUtil,
    SendController,
    AccountController,
    ChainController,
    CoreHelperUtil,
    OptionsController,
    crossMainnet,
    crossTestnet,
    bscMainnet,
    bscTestnet,
    kaiaMainnet,
    kaiaTestnet,
    etherMainnet,
    etherTestnet,
    roninMainnet,
    roninTestnet,
    UniversalProvider: Z,
    ConstantsUtil: ConstantsUtil$2,
    sdkVersion: K
  };
}
export {
  AccountController,
  ChainController,
  ConnectionController,
  ConnectorUtil,
  ConstantsUtil$2 as ConstantsUtil,
  CoreHelperUtil,
  OptionsController,
  SendController,
  Z as UniversalProvider,
  bscMainnet,
  bscTestnet,
  createDefaultSIWXConfig,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  W as initCrossSdk,
  U as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet,
  K as sdkVersion,
  D as useAppKitWallet
};
//# sourceMappingURL=cross-sdk.js.map

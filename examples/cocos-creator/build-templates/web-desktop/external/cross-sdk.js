import { s as AccountController, u as AppKit, c as CoreHelperUtil, P as PACKAGE_VERSION, W as WalletButtonController, v as ApiController, w as ConnectionController, y as ConstantsUtil, z as ConnectorUtil, B as WalletUtil, D as ConnectorController, O as OptionsController, E as EthersAdapter, f as ConstantsUtil$1, F as networkList, G as ConstantsUtil$2, Z, I as etherTestnet, J as etherMainnet, K as kaiaTestnet, L as kaiaMainnet, N as bscTestnet, Q as bscMainnet, V as crossTestnet, X as crossMainnet, C as ChainController, Y as SendController } from "./index.es-CVx6Eg70.js";
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
        issuedAt: issuedAt.toISOString(),
        expirationTime,
        statement: options.statement || "Sign in with your wallet",
        toString: () => [
          `${message.domain} wants you to sign in with your account:`,
          message.accountAddress,
          "",
          message.statement || "",
          "",
          `URI: ${message.uri}`,
          `Version: ${message.version}`,
          `Chain ID: ${message.chainId}`,
          `Nonce: ${message.nonce}`,
          `Issued At: ${message.issuedAt}`,
          message.expirationTime ? `Expiration Time: ${message.expirationTime}` : ""
        ].filter(Boolean).join("\n")
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
const K = new EthersAdapter(), W = (() => {
  var e, o;
  return ((o = (e = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : o.call(e)) || "https://cross-wallet.crosstoken.io/wc";
})(), D = {
  name: "Cross SDK",
  description: "Cross SDK for HTML",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
};
let r = null, p, m;
const R = (e) => {
  if (r)
    return console.warn("[Cross SDK] Already initialized. Returning existing instance."), r;
  const {
    projectId: o,
    redirectUrl: a,
    metadata: i,
    themeMode: c,
    defaultNetwork: s,
    adapters: l,
    mobileLink: t,
    siwx: n
  } = e;
  return console.log("[Cross SDK] Initializing with mobileLink:", t), console.log("[Cross SDK] Initializing with siwx:", n ? "configured" : "undefined"), p = t, m = n, r = _(
    o,
    a,
    i,
    c,
    s,
    l,
    t,
    n
  ), r;
}, _ = (e, o, a, i, c, s, l, t) => {
  var C, u, h, k;
  const n = {
    ...D,
    ...a,
    redirect: {
      universal: o
    }
  }, f = l || p || ((u = (C = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : u.call(C)) || W, g = t || m;
  return console.log("[Cross SDK] Resolved mobile_link:", f), console.log("[Cross SDK] - mobileLink param:", l), console.log("[Cross SDK] - cachedMobileLink:", p), console.log("[Cross SDK] - fallback:", (k = (h = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : k.call(h)), console.log("[Cross SDK] Resolved siwx:", g ? "configured" : "undefined"), console.log("[Cross SDK] - siwx param:", t ? "configured" : "undefined"), console.log("[Cross SDK] - cachedSiwx:", m ? "configured" : "undefined"), createAppKit({
    adapters: s && s.length > 0 ? s : [K],
    networks: networkList,
    defaultNetwork: c,
    metadata: n,
    projectId: e,
    themeMode: i || "light",
    siwx: g,
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
    customWallets: [
      {
        id: "cross_wallet",
        name: "CROSSx Wallet",
        image_url: "https://contents.crosstoken.io/wallet/token/images/CROSSx.svg",
        mobile_link: f,
        app_store: "https://apps.apple.com/us/app/crossx-games/id6741250674",
        play_store: "https://play.google.com/store/apps/details?id=com.nexus.crosswallet",
        chrome_store: "https://chromewebstore.google.com/detail/crossx/nninbdadmocnokibpaaohnoepbnpdgcg",
        rdns: "nexus.to.crosswallet.desktop",
        injected: [
          {
            injected_id: "nexus.to.crosswallet.desktop"
          }
        ]
      }
    ],
    allWallets: "HIDE"
  });
}, T = () => createAppKitWalletButton(), U = "1.18.2-beta.1";
if (typeof window !== "undefined") {
  window.CrossSdk = {
    initCrossSdk: _,
    initCrossSdkWithParams: R,
    useAppKitWallet: T,
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
    UniversalProvider: Z,
    ConstantsUtil: ConstantsUtil$2,
    sdkVersion: U
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
  _ as initCrossSdk,
  R as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  U as sdkVersion,
  T as useAppKitWallet
};
//# sourceMappingURL=cross-sdk.js.map

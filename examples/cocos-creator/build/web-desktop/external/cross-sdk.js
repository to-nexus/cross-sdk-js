import { s as AccountController, u as AppKit, c as CoreHelperUtil, P as PACKAGE_VERSION, W as WalletButtonController, v as ApiController, w as ConnectionController, y as ConstantsUtil, z as ConnectorUtil, B as WalletUtil, D as ConnectorController, O as OptionsController, E as EthersAdapter, f as ConstantsUtil$1, F as networkList, G as ConstantsUtil$2, Z, I as roninTestnet, J as roninMainnet, K as etherTestnet, L as etherMainnet, N as kaiaTestnet, Q as kaiaMainnet, V as bscTestnet, X as bscMainnet, Y as crossTestnet, _ as crossMainnet, C as ChainController, $ as SendController } from "./index.es-BHEXD4wz.js";
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
const b = new EthersAdapter(), S = (() => {
  var e, t;
  return ((t = (e = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : t.call(e)) || "https://cross-wallet.crosstoken.io/wc";
})(), W = {
  name: "Cross SDK",
  description: "Cross SDK for HTML",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
};
let r = null, f, h;
const K = (e) => {
  if (r)
    return r;
  const {
    projectId: t,
    redirectUrl: a,
    metadata: l,
    themeMode: i,
    defaultNetwork: o,
    adapters: c,
    mobileLink: s,
    siwx: n
  } = e;
  return f = s, h = n, r = _(
    t,
    a,
    l,
    i,
    o,
    c,
    s,
    n
  ), r;
}, _ = (e, t, a, l, i, o, c, s) => {
  var p, d;
  const n = {
    ...W,
    ...a,
    redirect: {
      universal: t
    }
  }, u = c || f || ((d = (p = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : d.call(p)) || S, C = s || h;
  return createAppKit({
    adapters: o && o.length > 0 ? o : [b],
    networks: networkList,
    defaultNetwork: i,
    metadata: n,
    projectId: e,
    themeMode: l || "light",
    siwx: C,
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
        mobile_link: u,
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
}, U = () => createAppKitWalletButton(), I = "1.18.3-beta.4";
if (typeof window !== "undefined") {
  window.CrossSdk = {
    initCrossSdk: _,
    initCrossSdkWithParams: K,
    useAppKitWallet: U,
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
    sdkVersion: I
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
  K as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet,
  I as sdkVersion,
  U as useAppKitWallet
};
//# sourceMappingURL=cross-sdk.js.map

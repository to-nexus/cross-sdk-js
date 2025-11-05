import { s as AppKit, c as CoreHelperUtil, P as PACKAGE_VERSION, W as WalletButtonController, u as ApiController, v as ConnectionController, w as ConstantsUtil, y as ConnectorUtil, z as WalletUtil, B as ConnectorController, O as OptionsController, E as EthersAdapter, f as ConstantsUtil$1, D as networkList, F as ConstantsUtil$2, Z, G as etherTestnet, I as etherMainnet, J as kaiaTestnet, K as kaiaMainnet, L as bscTestnet, N as bscMainnet, Q as crossTestnet, V as crossMainnet, X as AccountController, Y as SendController } from "./index.es-DIcT9sP3.js";
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
const d = new EthersAdapter(), f = (() => {
  var e, t;
  return ((t = (e = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : t.call(e)) || "https://cross-wallet.crosstoken.io/wc";
})(), h = {
  name: "Cross SDK",
  description: "Cross SDK for HTML",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
}, _ = (e) => {
  const { projectId: t, redirectUrl: o, metadata: a, themeMode: r, defaultNetwork: s, adapters: n } = e;
  return u(t, o, a, r, s, n);
}, u = (e, t, o, a, r, s) => {
  const n = {
    ...h,
    ...o,
    redirect: {
      universal: t
    }
  };
  return createAppKit({
    adapters: s && s.length > 0 ? s : [d],
    networks: networkList,
    defaultNetwork: r,
    metadata: n,
    projectId: e,
    themeMode: a || "light",
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
}, b = () => createAppKitWalletButton(), S = "1.18.1-beta.0";
if (typeof window !== "undefined") {
  window.CrossSdk = {
    initCrossSdk: u,
    initCrossSdkWithParams: _,
    useAppKitWallet: b,
    ConnectionController,
    ConnectorUtil,
    SendController,
    AccountController,
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
    sdkVersion: S
  };
}
export {
  AccountController,
  ConnectionController,
  ConnectorUtil,
  ConstantsUtil$2 as ConstantsUtil,
  SendController,
  Z as UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  u as initCrossSdk,
  _ as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  S as sdkVersion,
  b as useAppKitWallet
};
//# sourceMappingURL=cross-sdk.js.map

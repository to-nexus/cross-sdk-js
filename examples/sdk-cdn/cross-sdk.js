import { h as AppKit, e as CoreHelperUtil, P as PACKAGE_VERSION, W as WalletButtonController, j as ApiController, k as ConnectionController, l as ConstantsUtil, m as ConnectorUtil, p as WalletUtil, q as ConnectorController, O as OptionsController, E as EthersAdapter, s as networkList, t as ConstantsUtil$1, Z, u as etherTestnet, v as etherMainnet, w as kaiaTestnet, y as kaiaMainnet, z as bscTestnet, B as bscMainnet, D as crossTestnet, F as crossMainnet, G as AccountController, H as SendController } from "./index.es-DLRhv-CL.js";
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
      const customWallet = customWallets == null ? void 0 : customWallets.find((w2) => w2.id === wallet);
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
const p = new EthersAdapter(), d = {
  name: "Cross SDK",
  description: "Cross SDK for HTML",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
}, w = (e) => {
  const { projectId: t, redirectUrl: s, metadata: o, themeMode: a, defaultNetwork: r } = e;
  return m(t, s, o, a, r);
}, m = (e, t, s, o, a) => {
  const r = {
    ...d,
    ...s,
    redirect: {
      universal: t
    }
  };
  return createAppKit({
    adapters: [p],
    networks: networkList,
    defaultNetwork: a,
    metadata: r,
    projectId: e,
    themeMode: o || "light",
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
        name: "CROSS Wallet",
        image_url: "https://contents.crosstoken.io/wallet/token/images/CROSSx.svg",
        mobile_link: "crossx://",
        app_store: "https://apps.apple.com/us/app/crossx-games/id6741250674",
        play_store: "https://play.google.com/store/apps/details?id=com.nexus.crosswallet",
        chrome_store: "https://chromewebstore.google.com/detail/cross-wallet/your-extension-id",
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
}, C = () => createAppKitWalletButton();
if (typeof window !== "undefined") {
  window.CrossSdk = {
    initCrossSdk: m,
    initCrossSdkWithParams: w,
    useAppKitWallet: C,
    ConnectionController,
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
    ConstantsUtil: ConstantsUtil$1
  };
}
export {
  AccountController,
  ConnectionController,
  ConstantsUtil$1 as ConstantsUtil,
  SendController,
  Z as UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  m as initCrossSdk,
  w as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  C as useAppKitWallet
};
//# sourceMappingURL=cross-sdk.js.map

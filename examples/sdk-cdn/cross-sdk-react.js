import { a0 as subscribe, C as ChainController, w as ConnectionController, D as ConnectorController, c as CoreHelperUtil, a1 as ProviderUtil, a2 as subscribe$1, W as WalletButtonController, v as ApiController, y as ConstantsUtil, z as ConnectorUtil, B as WalletUtil, O as OptionsController, s as AccountController, u as AppKit, P as PACKAGE_VERSION, E as EthersAdapter, f as ConstantsUtil$1, F as networkController, G as ConstantsUtil$2, Z, K as etherTestnet, L as etherMainnet, N as kaiaTestnet, Q as kaiaMainnet, V as bscTestnet, X as bscMainnet, Y as crossTestnet, _ as crossMainnet, $ as SendController } from "./index.es-wzwiJP3f.js";
import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
function useAppKitNetworkCore() {
  const [activeCaipNetwork, setActiveCaipNetwork] = useState(ChainController.state.activeCaipNetwork);
  useEffect(() => {
    const unsubscribe = subscribe(ChainController.state, () => {
      setActiveCaipNetwork(ChainController.state.activeCaipNetwork);
    });
    return unsubscribe;
  }, []);
  return {
    caipNetwork: activeCaipNetwork,
    chainId: activeCaipNetwork == null ? void 0 : activeCaipNetwork.id,
    caipNetworkId: activeCaipNetwork == null ? void 0 : activeCaipNetwork.caipNetworkId
  };
}
function getAccountState(namespace) {
  var _a;
  const state = ChainController.state;
  const chainNamespace = namespace || state.activeChain;
  if (!chainNamespace) {
    return {
      allAccounts: [],
      address: void 0,
      caipAddress: void 0,
      status: void 0,
      isConnected: false,
      embeddedWalletInfo: void 0,
      balance: void 0,
      balanceSymbol: void 0,
      balanceLoading: void 0,
      tokenBalance: void 0
    };
  }
  const chainAccountState = (_a = state.chains.get(chainNamespace)) == null ? void 0 : _a.accountState;
  const authConnector = ConnectorController.getAuthConnector(chainNamespace);
  return {
    allAccounts: (chainAccountState == null ? void 0 : chainAccountState.allAccounts) || [],
    caipAddress: chainAccountState == null ? void 0 : chainAccountState.caipAddress,
    address: CoreHelperUtil.getPlainAddress(chainAccountState == null ? void 0 : chainAccountState.caipAddress),
    isConnected: Boolean(chainAccountState == null ? void 0 : chainAccountState.caipAddress),
    status: chainAccountState == null ? void 0 : chainAccountState.status,
    embeddedWalletInfo: authConnector ? {
      user: chainAccountState == null ? void 0 : chainAccountState.user,
      authProvider: (chainAccountState == null ? void 0 : chainAccountState.socialProvider) || "email",
      accountType: chainAccountState == null ? void 0 : chainAccountState.preferredAccountType,
      isSmartAccountDeployed: Boolean(chainAccountState == null ? void 0 : chainAccountState.smartAccountDeployed)
    } : void 0,
    balance: chainAccountState == null ? void 0 : chainAccountState.balance,
    balanceSymbol: chainAccountState == null ? void 0 : chainAccountState.balanceSymbol,
    balanceLoading: chainAccountState == null ? void 0 : chainAccountState.balanceLoading,
    tokenBalance: chainAccountState == null ? void 0 : chainAccountState.tokenBalance
  };
}
function useAppKitAccount(options) {
  const [accountState, setAccountState] = useState(() => getAccountState(options == null ? void 0 : options.namespace));
  useEffect(() => {
    const unsubscribe = subscribe(ChainController.state, () => {
      setAccountState(getAccountState(options == null ? void 0 : options.namespace));
    });
    return unsubscribe;
  }, [options == null ? void 0 : options.namespace]);
  return accountState;
}
function useDisconnect() {
  async function disconnect() {
    await ConnectionController.disconnect();
  }
  return { disconnect };
}
let modal$1 = void 0;
function getAppKit(appKit) {
  if (appKit) {
    modal$1 = appKit;
  }
}
async function getUniversalProvider() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "getUniversalProvider" hook');
  }
  return await modal$1.getUniversalProvider();
}
function useAppKitProvider(chainNamespace) {
  const [providerState, setProviderState] = useState(() => ({
    walletProvider: ProviderUtil.state.providers[chainNamespace],
    walletProviderType: ProviderUtil.state.providerIds[chainNamespace]
  }));
  useEffect(() => {
    const unsubscribe = subscribe$1(ProviderUtil.state, () => {
      setProviderState({
        walletProvider: ProviderUtil.state.providers[chainNamespace],
        walletProviderType: ProviderUtil.state.providerIds[chainNamespace]
      });
    });
    return unsubscribe;
  }, [chainNamespace]);
  return providerState;
}
function useAppKitTheme() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "useAppKitTheme" hook');
  }
  function setThemeMode(themeMode2) {
    if (themeMode2) {
      modal$1 == null ? void 0 : modal$1.setThemeMode(themeMode2);
    }
  }
  function setThemeVariables(themeVariables2) {
    if (themeVariables2) {
      modal$1 == null ? void 0 : modal$1.setThemeVariables(themeVariables2);
    }
  }
  const [themeMode, setInternalThemeMode] = useState(modal$1.getThemeMode());
  const [themeVariables, setInternalThemeVariables] = useState(modal$1.getThemeVariables());
  useEffect(() => {
    const unsubscribe = modal$1 == null ? void 0 : modal$1.subscribeTheme((state) => {
      setInternalThemeMode(state.themeMode);
      setInternalThemeVariables(state.themeVariables);
    });
    return () => {
      unsubscribe == null ? void 0 : unsubscribe();
    };
  }, []);
  return {
    themeMode,
    themeVariables,
    setThemeMode,
    setThemeVariables
  };
}
function useAppKit() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "useAppKit" hook');
  }
  async function connect() {
    if (modal$1 == null ? void 0 : modal$1.getIsConnectedState())
      return;
    await (modal$1 == null ? void 0 : modal$1.open());
  }
  async function authenticateWalletConnect() {
    return await (modal$1 == null ? void 0 : modal$1.authenticateWalletConnect());
  }
  return { connect, authenticateWalletConnect };
}
function useWalletInfo() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "useWalletInfo" hook');
  }
  const walletInfo = useSyncExternalStore(modal$1.subscribeWalletInfo, modal$1.getWalletInfo, modal$1.getWalletInfo);
  return { walletInfo };
}
function useAppKitState() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "useAppKitState" hook');
  }
  const [state, setState] = useState(modal$1.getState());
  useEffect(() => {
    const unsubscribe = modal$1 == null ? void 0 : modal$1.subscribeState((newState) => {
      setState({ ...newState });
    });
    return () => {
      unsubscribe == null ? void 0 : unsubscribe();
    };
  }, []);
  return state;
}
function useAppKitEvents() {
  if (!modal$1) {
    throw new Error('Please call "createAppKit" before using "useAppKitEvents" hook');
  }
  const [event, setEvents] = useState(modal$1.getEvent());
  useEffect(() => {
    const unsubscribe = modal$1 == null ? void 0 : modal$1.subscribeEvents((newEvent) => {
      setEvents({ ...newEvent });
    });
    return () => {
      unsubscribe == null ? void 0 : unsubscribe();
    };
  }, []);
  return event;
}
function useAppKitWallet(parameters) {
  const [connectors, setConnectors] = useState(ConnectorController.state.connectors);
  const [walletButtonState, setWalletButtonState] = useState({
    pending: WalletButtonController.state.pending,
    ready: WalletButtonController.state.ready,
    error: WalletButtonController.state.error,
    data: WalletButtonController.state.data
  });
  useEffect(() => {
    const unsubConnector = subscribe$1(ConnectorController.state, () => {
      setConnectors(ConnectorController.state.connectors);
    });
    const unsubWalletButton = subscribe$1(WalletButtonController.state, () => {
      setWalletButtonState({
        pending: WalletButtonController.state.pending,
        ready: WalletButtonController.state.ready,
        error: WalletButtonController.state.error,
        data: WalletButtonController.state.data
      });
    });
    return () => {
      unsubConnector();
      unsubWalletButton();
    };
  }, []);
  const { pending: isWalletButtonConnecting, ready: isWalletButtonReady, error: walletButtonError, data: walletButtonData } = walletButtonState;
  const { onSuccess, onError } = parameters ?? {};
  useEffect(() => ChainController.subscribeKey("activeCaipAddress", (val) => {
    if (val) {
      WalletButtonController.setError(void 0);
      WalletButtonController.setPending(false);
    }
  }), []);
  useEffect(() => ApiController.subscribeKey("walletButtons", (val) => {
    if (val.length) {
      WalletButtonController.setReady(true);
    }
  }), []);
  const handleSuccess = useCallback((caipAddress) => {
    WalletButtonController.setData(caipAddress);
    onSuccess == null ? void 0 : onSuccess(caipAddress);
  }, [onSuccess]);
  const handleError = useCallback((err) => {
    const finalError = err instanceof Error ? err : new Error("Something went wrong");
    WalletButtonController.setError(finalError);
    onError == null ? void 0 : onError(finalError);
  }, [onError]);
  const connect = useCallback(async (wallet) => {
    try {
      WalletButtonController.setPending(true);
      WalletButtonController.setError(void 0);
      if (ConstantsUtil.Socials.some((social) => social === wallet)) {
        await ConnectorUtil.connectSocial(wallet).then(handleSuccess);
        return;
      }
      const walletButton = WalletUtil.getWalletButton(wallet);
      const connector = walletButton ? ConnectorController.getConnector(walletButton.id, walletButton.rdns) : void 0;
      if (connector) {
        await ConnectorUtil.connectExternal(connector).then(handleSuccess);
        return;
      }
      const { customWallets } = OptionsController.state;
      const customWallet = customWallets == null ? void 0 : customWallets.find((w2) => w2.id === wallet);
      if (customWallet && wallet === "cross_wallet") {
        await ConnectorUtil.connectWalletConnect({
          walletConnect: wallet === "cross_wallet",
          connector: connectors.find((c) => c.id === wallet),
          wallet: customWallet
        }).then(handleSuccess);
        return;
      }
      if ((customWallet == null ? void 0 : customWallet.rdns) && wallet !== "cross_wallet") {
        const currentConnectors = ConnectorController.state.connectors;
        const announced = currentConnectors.filter((c) => c.type === "ANNOUNCED" && c.id === customWallet.rdns);
        if (announced && announced.length > 0) {
          const browserConnector = announced[0];
          if (browserConnector) {
            await ConnectorUtil.connectExternal(browserConnector).then(handleSuccess);
            return;
          }
        }
        throw new Error(`${customWallet.name} extension not found. Please install the ${customWallet.name} browser extension.`);
      }
      await ConnectorUtil.connectWalletConnect({
        walletConnect: wallet === "cross_wallet",
        connector: connectors.find((c) => c.id === wallet),
        wallet: customWallet
      }).then(handleSuccess);
    } catch (err) {
      handleError(err);
    } finally {
      WalletButtonController.setPending(false);
    }
  }, [connectors, handleSuccess, handleError]);
  const connectCrossWallet = useCallback(async () => {
    connect("cross_wallet");
  }, [connect]);
  const connectCrossExtensionWallet = useCallback(async () => {
    try {
      WalletButtonController.setPending(true);
      WalletButtonController.setError(void 0);
      const result = await ConnectorUtil.connectCrossExtensionWallet();
      handleSuccess(result);
    } catch (err) {
      handleError(err);
    } finally {
      WalletButtonController.setPending(false);
    }
  }, [handleSuccess, handleError]);
  const authenticateCrossExtensionWallet = useCallback(async () => {
    try {
      WalletButtonController.setPending(true);
      WalletButtonController.setError(void 0);
      const result = await ConnectorUtil.authenticateCrossExtensionWallet();
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      WalletButtonController.setPending(false);
    }
  }, [handleError]);
  const isInstalledCrossExtensionWallet = useCallback(() => {
    return ConnectorUtil.isInstalledCrossExtensionWallet();
  }, []);
  return {
    data: walletButtonData,
    error: walletButtonError,
    isReady: isWalletButtonReady,
    isPending: isWalletButtonConnecting,
    isError: Boolean(walletButtonError),
    isSuccess: Boolean(walletButtonData),
    connect,
    connectCrossWallet,
    connectCrossExtensionWallet,
    authenticateCrossExtensionWallet,
    isInstalledCrossExtensionWallet
  };
}
let modal = void 0;
function createAppKit(options) {
  if (!modal) {
    modal = new AppKit({
      ...options,
      sdkVersion: CoreHelperUtil.generateSdkVersion(options.adapters ?? [], "react", PACKAGE_VERSION)
    });
    getAppKit(modal);
  }
  return modal;
}
function useAppKitNetwork() {
  const { caipNetwork, caipNetworkId, chainId } = useAppKitNetworkCore();
  function switchNetwork(network) {
    modal == null ? void 0 : modal.switchNetwork(network);
  }
  useEffect(() => {
    if (AccountController.state.address && caipNetwork) {
      switchNetwork(caipNetwork);
    }
  }, [AccountController.state.address, caipNetwork]);
  return {
    caipNetwork,
    caipNetworkId,
    chainId,
    switchNetwork
  };
}
const g = new EthersAdapter(), b = {
  name: "Cross SDK",
  description: "Cross SDK for React",
  url: "https://to.nexus",
  icons: ["https://contents.crosstoken.io/img/sample_app_circle_icon.png"]
}, K = (t) => {
  const {
    projectId: s,
    redirectUrl: o,
    metadata: r,
    themeMode: n,
    defaultNetwork: e,
    adapters: l,
    mobileLink: a,
    siwx: i
  } = t;
  return w(
    s,
    o,
    r,
    n,
    e,
    l,
    a,
    i
  );
}, w = (t, s, o, r, n, e, l, a) => {
  var c, m;
  const i = {
    ...b,
    ...o,
    redirect: {
      universal: s
    }
  }, d = l || ((m = (c = ConstantsUtil$1).getCrossWalletWebappLink) == null ? void 0 : m.call(c)) || "https://cross-wallet.crosstoken.io", p = {
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
  return CoreHelperUtil.isMobile() && Object.assign(p, { mobile_link: d }), createAppKit({
    adapters: e && e.length > 0 ? e : [g],
    networks: [
      ...networkController.getNetworks()
    ],
    defaultNetwork: n,
    metadata: i,
    projectId: t,
    themeMode: r || "light",
    siwx: a,
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
};
if (typeof window !== "undefined") {
  window.CrossSdkReact = {
    initCrossSdk: w,
    initCrossSdkWithParams: K,
    useAppKit,
    useAppKitState,
    useAppKitTheme,
    useAppKitEvents,
    useAppKitAccount,
    useWalletInfo,
    useAppKitNetwork,
    useDisconnect,
    useAppKitProvider,
    useAppKitWallet,
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
    getUniversalProvider,
    ConstantsUtil: ConstantsUtil$2
  };
}
export {
  AccountController,
  ConnectionController,
  ConstantsUtil$2 as ConstantsUtil,
  SendController,
  Z as UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  getUniversalProvider,
  w as initCrossSdk,
  K as initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  useAppKit,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useAppKitTheme,
  useAppKitWallet,
  useDisconnect,
  useWalletInfo
};
//# sourceMappingURL=cross-sdk-react.js.map

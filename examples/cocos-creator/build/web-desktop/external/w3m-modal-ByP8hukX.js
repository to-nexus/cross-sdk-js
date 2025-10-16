import { i, a as i$1, O as OptionsController, M as ModalController, C as ChainController, A as ApiController, b as AssetUtil, x, c as CoreHelperUtil, o, R as RouterController, S as SIWXUtil, T as ThemeController, U as UiHelperUtil, d as initializeTheming, e as SnackController, f as ConstantsUtil, n, r, g as customElement } from "./index.es-C5h6IJQJ.js";
const styles = i`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  :host(.embedded) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  /* 미니 윈도우 모드 - 최우선 적용 */
  @media (pointer: coarse) and (max-height: 300px) {
    wui-card {
      max-width: 300px !important;
      width: 300px !important;
      height: 300px !important;
      max-height: 300px !important;
      margin: 0;
    }
  }

  /* 실제 모바일 디바이스의 랜드스케이프 모드에서만 모달 확장 */
  @media (orientation: landscape) and (pointer: coarse) and (max-width: 1200px) and (min-width: 650px) and (min-height: 300px) {
    wui-card {
      max-width: 700px;
      width: 700px;
      height: 360px;
      max-height: 360px;
      margin: 0;
    }
  }

  :host(.embedded) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`;
var __decorate = function(decorators, target, key, desc) {
  var c = arguments.length, r2 = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r2 = Reflect.decorate(decorators, target, key, desc);
  else for (var i2 = decorators.length - 1; i2 >= 0; i2--) if (d = decorators[i2]) r2 = (c < 3 ? d(r2) : c > 3 ? d(target, key, r2) : d(target, key)) || r2;
  return c > 3 && r2 && Object.defineProperty(target, key, r2), r2;
};
const SCROLL_LOCK = "scroll-lock";
let W3mModal = class W3mModal2 extends i$1 {
  constructor() {
    super();
    this.unsubscribe = [];
    this.abortController = void 0;
    this.hasPrefetched = false;
    this.enableEmbedded = OptionsController.state.enableEmbedded;
    this.open = ModalController.state.open;
    this.caipAddress = ChainController.state.activeCaipAddress;
    this.caipNetwork = ChainController.state.activeCaipNetwork;
    this.shake = ModalController.state.shake;
    this.initializeTheming();
    ApiController.prefetchAnalyticsConfig();
    this.unsubscribe.push(...[
      ModalController.subscribeKey("open", (val) => val ? this.onOpen() : this.onClose()),
      ModalController.subscribeKey("shake", (val) => this.shake = val),
      ChainController.subscribeKey("activeCaipNetwork", (val) => this.onNewNetwork(val)),
      ChainController.subscribeKey("activeCaipAddress", (val) => this.onNewAddress(val)),
      OptionsController.subscribeKey("enableEmbedded", (val) => this.enableEmbedded = val)
    ]);
  }
  firstUpdated() {
    var _a, _b;
    AssetUtil.fetchNetworkImage((_b = (_a = this.caipNetwork) == null ? void 0 : _a.assets) == null ? void 0 : _b.imageId);
    if (this.caipAddress) {
      if (this.enableEmbedded) {
        ModalController.close();
        this.prefetch();
        return;
      }
      this.onNewAddress(this.caipAddress);
    }
    if (this.open) {
      this.onOpen();
    }
    if (this.enableEmbedded) {
      this.prefetch();
    }
  }
  disconnectedCallback() {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.onRemoveKeyboardListener();
  }
  render() {
    this.style.cssText = `
      --local-border-bottom-mobile-radius: ${this.enableEmbedded ? "clamp(0px, var(--wui-border-radius-l), 44px)" : "0px"};
    `;
    if (this.enableEmbedded) {
      return x`${this.contentTemplate()}
        <cross-w3m-tooltip></cross-w3m-tooltip> `;
    }
    return this.open ? x`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="cross-w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <cross-w3m-tooltip></cross-w3m-tooltip>
        ` : null;
  }
  contentTemplate() {
    const isMiniWindow = CoreHelperUtil.isMiniWindow();
    return x` <wui-card
      shake="${this.shake}"
      data-embedded="${o(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="cross-w3m-modal-card"
    >
      ${isMiniWindow ? null : x`<cross-w3m-header></cross-w3m-header>`}
      <cross-w3m-router></cross-w3m-router>
      <cross-w3m-snackbar></cross-w3m-snackbar>
      <cross-w3m-alertbar></cross-w3m-alertbar>
    </wui-card>`;
  }
  async onOverlayClick(event) {
    if (event.target === event.currentTarget) {
      await this.handleClose();
    }
  }
  async handleClose() {
    const isUnsupportedChain = RouterController.state.view === "UnsupportedChain";
    if (isUnsupportedChain || await SIWXUtil.isSIWXCloseDisabled()) {
      ModalController.shake();
    } else {
      ModalController.close();
    }
  }
  initializeTheming() {
    const { themeVariables, themeMode } = ThemeController.state;
    const defaultThemeMode = UiHelperUtil.getColorTheme(themeMode);
    initializeTheming(themeVariables, defaultThemeMode);
  }
  onClose() {
    this.open = false;
    this.classList.remove("open");
    this.onScrollUnlock();
    SnackController.hide();
    this.onRemoveKeyboardListener();
  }
  onOpen() {
    this.prefetch();
    this.open = true;
    this.classList.add("open");
    this.onScrollLock();
    this.onAddKeyboardListener();
  }
  onScrollLock() {
    const styleTag = document.createElement("style");
    styleTag.dataset["w3m"] = SCROLL_LOCK;
    styleTag.textContent = `
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      cross-w3m-modal {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(styleTag);
  }
  onScrollUnlock() {
    const styleTag = document.head.querySelector(`style[data-w3m="${SCROLL_LOCK}"]`);
    if (styleTag) {
      styleTag.remove();
    }
  }
  onAddKeyboardListener() {
    var _a;
    this.abortController = new AbortController();
    const card = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector("wui-card");
    card == null ? void 0 : card.focus();
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.handleClose();
      } else if (event.key === "Tab") {
        const { tagName } = event.target;
        if (tagName && !tagName.includes("W3M-") && !tagName.includes("WUI-")) {
          card == null ? void 0 : card.focus();
        }
      }
    }, this.abortController);
  }
  onRemoveKeyboardListener() {
    var _a;
    (_a = this.abortController) == null ? void 0 : _a.abort();
    this.abortController = void 0;
  }
  async onNewAddress(caipAddress) {
    const isSwitchingNamespace = ChainController.state.isSwitchingNamespace;
    const nextConnected = CoreHelperUtil.getPlainAddress(caipAddress);
    const isDisconnectedInSameNamespace = !nextConnected && !isSwitchingNamespace;
    const isSwitchingNamespaceAndConnected = isSwitchingNamespace && nextConnected;
    if (isDisconnectedInSameNamespace) {
      ModalController.close();
    } else if (isSwitchingNamespaceAndConnected) {
      RouterController.goBack();
    }
    await SIWXUtil.initializeIfEnabled();
    this.caipAddress = caipAddress;
    ChainController.setIsSwitchingNamespace(false);
  }
  onNewNetwork(nextCaipNetwork) {
    var _a, _b, _c, _d, _e;
    AssetUtil.fetchNetworkImage((_a = nextCaipNetwork == null ? void 0 : nextCaipNetwork.assets) == null ? void 0 : _a.imageId);
    const prevCaipNetworkId = (_c = (_b = this.caipNetwork) == null ? void 0 : _b.caipNetworkId) == null ? void 0 : _c.toString();
    const nextNetworkId = (_d = nextCaipNetwork == null ? void 0 : nextCaipNetwork.caipNetworkId) == null ? void 0 : _d.toString();
    const networkChanged = prevCaipNetworkId && nextNetworkId && prevCaipNetworkId !== nextNetworkId;
    const isSwitchingNamespace = ChainController.state.isSwitchingNamespace;
    const isUnsupportedNetwork = ((_e = this.caipNetwork) == null ? void 0 : _e.name) === ConstantsUtil.UNSUPPORTED_NETWORK_NAME;
    const isConnectingExternal = RouterController.state.view === "ConnectingExternal";
    const isNotConnected = !this.caipAddress;
    const isNetworkChangedInSameNamespace = networkChanged && !isUnsupportedNetwork && !isSwitchingNamespace;
    const isUnsupportedNetworkScreen = RouterController.state.view === "UnsupportedChain";
    if (!isConnectingExternal && (isNotConnected || isUnsupportedNetworkScreen || isNetworkChangedInSameNamespace)) {
      RouterController.goBack();
    }
    this.caipNetwork = nextCaipNetwork;
  }
  prefetch() {
    if (!this.hasPrefetched) {
      this.hasPrefetched = true;
      ApiController.prefetch();
    }
  }
};
W3mModal.styles = styles;
__decorate([
  n({ type: Boolean })
], W3mModal.prototype, "enableEmbedded", void 0);
__decorate([
  r()
], W3mModal.prototype, "open", void 0);
__decorate([
  r()
], W3mModal.prototype, "caipAddress", void 0);
__decorate([
  r()
], W3mModal.prototype, "caipNetwork", void 0);
__decorate([
  r()
], W3mModal.prototype, "shake", void 0);
W3mModal = __decorate([
  customElement("cross-w3m-modal")
], W3mModal);
export {
  W3mModal
};
//# sourceMappingURL=w3m-modal-ByP8hukX.js.map

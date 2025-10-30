import {
  AccountController,
  AssetUtil,
  ChainController,
  CoreHelperUtil,
  RouterController,
  SnackController,
  ThemeController
} from '@to-nexus/appkit-core'
import { UiHelperUtil, customElement } from '@to-nexus/appkit-ui'
import { W3mFrameRpcConstants } from '@to-nexus/appkit-wallet'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-wallet-receive-view')
export class W3mWalletReceiveView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private address = AccountController.state.address

  @state() private profileName = AccountController.state.profileName

  @state() private network = ChainController.state.activeCaipNetwork

  @state() private preferredAccountType = AccountController.state.preferredAccountType

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        AccountController.subscribe(val => {
          if (val.address) {
            this.address = val.address
            this.profileName = val.profileName
            this.preferredAccountType = val.preferredAccountType
          } else {
            SnackController.showError('Account not found')
          }
        })
      ],
      ChainController.subscribeKey('activeCaipNetwork', val => {
        if (val?.id) {
          this.network = val
        }
      })
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.address) {
      throw new Error('cross-w3m-wallet-receive-view: No account provided')
    }

    const networkImage = AssetUtil.getNetworkImage(this.network)

    return html` <cross-wui-flex
      flexDirection="column"
      .padding=${['0', 'l', 'l', 'l'] as const}
      alignItems="center"
    >
      <cross-wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${UiHelperUtil.getTruncateString({
          string: this.profileName || this.address || '',
          charsStart: this.profileName ? 18 : 4,
          charsEnd: this.profileName ? 0 : 4,
          truncate: this.profileName ? 'end' : 'middle'
        })}
        icon="copy"
        size="sm"
        imageSrc=${networkImage ? networkImage : ''}
        variant="gray"
      ></cross-wui-chip-button>
      <cross-wui-flex
        flexDirection="column"
        .padding=${['l', '0', '0', '0'] as const}
        alignItems="center"
        gap="s"
      >
        <cross-wui-qr-code
          size=${232}
          theme=${ThemeController.state.themeMode}
          uri=${this.address}
          ?arenaClear=${true}
          color=${ifDefined(ThemeController.state.themeVariables['--w3m-qr-color'])}
          data-testid="wui-qr-code"
        ></cross-wui-qr-code>
        <cross-wui-text variant="paragraph-500" color="fg-100" align="center">
          Copy your address or scan this QR code
        </cross-wui-text>
      </cross-wui-flex>
      ${this.networkTemplate()}
    </cross-wui-flex>`
  }

  // -- Private ------------------------------------------- //
  networkTemplate() {
    const requestedCaipNetworks = ChainController.getAllRequestedCaipNetworks()
    const isNetworkEnabledForSmartAccounts = ChainController.checkIfSmartAccountEnabled()
    const caipNetwork = ChainController.state.activeCaipNetwork

    if (
      this.preferredAccountType === W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT &&
      isNetworkEnabledForSmartAccounts
    ) {
      if (!caipNetwork) {
        return null
      }

      return html`<cross-wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[AssetUtil.getNetworkImage(caipNetwork) ?? '']}
      ></cross-wui-compatible-network>`
    }
    const slicedNetworks = requestedCaipNetworks
      ?.filter(network => network?.assets?.imageId)
      ?.slice(0, 5)
    const imagesArray = slicedNetworks.map(AssetUtil.getNetworkImage).filter(Boolean) as string[]

    return html`<cross-wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${imagesArray}
    ></cross-wui-compatible-network>`
  }

  onReceiveClick() {
    RouterController.push('WalletCompatibleNetworks')
  }

  onCopyClick() {
    try {
      if (this.address) {
        CoreHelperUtil.copyToClopboard(this.address)
        SnackController.showSuccess('Address copied')
      }
    } catch {
      SnackController.showError('Failed to copy')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-wallet-receive-view': W3mWalletReceiveView
  }
}

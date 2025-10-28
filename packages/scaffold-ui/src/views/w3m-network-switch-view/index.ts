import { type ChainNamespace, ConstantsUtil as CommonConstantsUtil } from '@to-nexus/appkit-common'
import {
  AssetUtil,
  ChainController,
  ConnectorController,
  RouterController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-network-switch-view')
export class W3mNetworkSwitchView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private network = RouterController.state.data?.network

  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private showRetry = false

  @state() public error = false

  public constructor() {
    super()
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  public override firstUpdated() {
    this.onSwitchNetwork()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.network) {
      throw new Error('cross-w3m-network-switch-view: No network provided')
    }

    this.onShowRetry()
    const label = this.getLabel()
    const subLabel = this.getSubLabel()

    return html`
      <cross-wui-flex
        data-error=${this.error}
        flexDirection="column"
        alignItems="center"
        .padding=${['3xl', 'xl', '3xl', 'xl'] as const}
        gap="xl"
      >
        <cross-wui-flex justifyContent="center" alignItems="center">
          <cross-wui-network-image
            size="lg"
            imageSrc=${ifDefined(AssetUtil.getNetworkImage(this.network))}
          ></cross-wui-network-image>

          ${this.error ? null : html`<cross-wui-loading-hexagon></cross-wui-loading-hexagon>`}

          <cross-wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            ?border=${true}
            borderColor="wui-color-bg-125"
          ></cross-wui-icon-box>
        </cross-wui-flex>

        <cross-wui-flex flexDirection="column" alignItems="center" gap="xs">
          <cross-wui-text align="center" variant="paragraph-500" color="fg-100">${label}</cross-wui-text>
          <cross-wui-text align="center" variant="small-500" color="fg-200">${subLabel}</cross-wui-text>
        </cross-wui-flex>

        <cross-wui-button
          data-retry=${this.showRetry}
          variant="accent"
          size="md"
          .disabled=${!this.error}
          @click=${this.onSwitchNetwork.bind(this)}
        >
          <cross-wui-icon color="inherit" slot="iconLeft" name="refresh"></cross-wui-icon>
          Try again
        </cross-wui-button>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private getSubLabel() {
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)
    const authConnector = ConnectorController.getAuthConnector()
    if (authConnector && connectorId === CommonConstantsUtil.CONNECTOR_ID.AUTH) {
      return ''
    }

    return this.error
      ? 'Switch can be declined if chain is not supported by a wallet or previous request is still active'
      : 'Accept connection request in your wallet'
  }

  private getLabel() {
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)
    const authConnector = ConnectorController.getAuthConnector()
    if (authConnector && connectorId === CommonConstantsUtil.CONNECTOR_ID.AUTH) {
      return `Switching to ${this.network?.name ?? 'Unknown'} network...`
    }

    return this.error ? 'Switch declined' : 'Approve in wallet'
  }

  private onShowRetry() {
    if (this.error && !this.showRetry) {
      this.showRetry = true
      const retryButton = this.shadowRoot?.querySelector('cross-wui-button') as HTMLElement
      retryButton?.animate([{ opacity: 0 }, { opacity: 1 }], {
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }

  private async onSwitchNetwork() {
    try {
      this.error = false
      if (this.network) {
        await ChainController.switchActiveNetwork(this.network)
      }
    } catch (error) {
      this.error = true
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-network-switch-view': W3mNetworkSwitchView
  }
}

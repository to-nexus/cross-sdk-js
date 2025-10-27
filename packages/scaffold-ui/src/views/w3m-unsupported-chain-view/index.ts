import type { CaipNetwork } from '@to-nexus/appkit-common'
import {
  AccountController,
  AssetController,
  AssetUtil,
  ChainController,
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  ModalController,
  RouterController,
  SnackController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-unsupported-chain-view')
export class W3mUnsupportedChainView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  protected readonly swapUnsupportedChain = RouterController.state.data?.swapUnsupportedChain

  private unsubscribe: (() => void)[] = []

  // -- State & Properties --------------------------------- //
  @state() private disconecting = false

  public constructor() {
    super()
    this.unsubscribe.push(AssetController.subscribeNetworkImages(() => this.requestUpdate()))
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex class="container" flexDirection="column" gap="0">
        <cross-wui-flex
          class="container"
          flexDirection="column"
          .padding=${['m', 'xl', 'xs', 'xl'] as const}
          alignItems="center"
          gap="xl"
        >
          ${this.descriptionTemplate()}
        </cross-wui-flex>

        <cross-wui-flex flexDirection="column" padding="s" gap="xs">
          ${this.networksTemplate()}
        </cross-wui-flex>

        <cross-wui-separator text="or"></cross-wui-separator>
        <cross-wui-flex flexDirection="column" padding="s" gap="xs">
          <cross-wui-list-item
            variant="icon"
            iconVariant="overlay"
            icon="disconnect"
            ?chevron=${false}
            .loading=${this.disconecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <cross-wui-text variant="paragraph-500" color="fg-200">Disconnect</cross-wui-text>
          </cross-wui-list-item>
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private descriptionTemplate() {
    if (this.swapUnsupportedChain) {
      return html`
        <cross-wui-text variant="small-400" color="fg-200" align="center">
          The swap feature doesn’t support your current network. Switch to an available option to
          continue.
        </cross-wui-text>
      `
    }

    return html`
      <cross-wui-text variant="small-400" color="fg-200" align="center">
        This app doesn’t support your current network. Switch to an available option to continue.
      </cross-wui-text>
    `
  }

  private networksTemplate() {
    const requestedCaipNetworks = ChainController.getAllRequestedCaipNetworks()
    const approvedCaipNetworkIds = ChainController.getAllApprovedCaipNetworkIds()

    const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
      approvedCaipNetworkIds,
      requestedCaipNetworks
    )

    const filteredNetworks = this.swapUnsupportedChain
      ? sortedNetworks.filter(network =>
          ConstantsUtil.SWAP_SUPPORTED_NETWORKS.includes(network.caipNetworkId)
        )
      : sortedNetworks

    return filteredNetworks.map(
      network => html`
        <cross-wui-list-network
          imageSrc=${ifDefined(AssetUtil.getNetworkImage(network))}
          name=${network.name ?? 'Unknown'}
          @click=${() => this.onSwitchNetwork(network)}
        >
        </cross-wui-list-network>
      `
    )
  }

  private async onDisconnect() {
    try {
      this.disconecting = true
      await ConnectionController.disconnect()
      EventsController.sendEvent({
        type: 'track',
        event: 'DISCONNECT_SUCCESS'
      })
      ModalController.close()
    } catch {
      EventsController.sendEvent({ type: 'track', event: 'DISCONNECT_ERROR' })
      SnackController.showError('Failed to disconnect')
    } finally {
      this.disconecting = false
    }
  }

  private async onSwitchNetwork(network: CaipNetwork) {
    const caipAddress = AccountController.state.caipAddress
    const approvedCaipNetworkIds = ChainController.getAllApprovedCaipNetworkIds()
    const supportsAllNetworks = ChainController.getNetworkProp(
      'supportsAllNetworks',
      network.chainNamespace
    )

    const routerData = RouterController.state.data

    if (caipAddress) {
      if (approvedCaipNetworkIds?.includes(network.caipNetworkId)) {
        await ChainController.switchActiveNetwork(network)
      } else if (supportsAllNetworks) {
        RouterController.push('SwitchNetwork', { ...routerData, network })
      } else {
        RouterController.push('SwitchNetwork', { ...routerData, network })
      }
    } else if (!caipAddress) {
      ChainController.setActiveCaipNetwork(network)
      RouterController.push('Connect')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-unsupported-chain-view': W3mUnsupportedChainView
  }
}

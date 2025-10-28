import type { Balance } from '@to-nexus/appkit-common'
import {
  ChainController,
  CoreHelperUtil,
  RouterController,
  SendController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import styles from './styles.js'

@customElement('cross-w3m-wallet-send-select-token-view')
export class W3mSendSelectTokenView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private tokenBalances = SendController.state.tokenBalances

  @state() private tokens?: Balance[]

  @state() private filteredTokens?: Balance[]

  @state() private search = ''

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        SendController.subscribe(val => {
          this.tokenBalances = val.tokenBalances
        })
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex flexDirection="column">
        ${this.templateSearchInput()} <cross-wui-separator></cross-wui-separator> ${this.templateTokens()}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private templateSearchInput() {
    return html`
      <cross-wui-flex gap="xs" padding="s">
        <cross-wui-input-text
          @inputChange=${this.onInputChange.bind(this)}
          class="network-search-input"
          size="sm"
          placeholder="Search token"
          icon="search"
        ></cross-wui-input-text>
      </cross-wui-flex>
    `
  }

  private templateTokens() {
    this.tokens = this.tokenBalances?.filter(
      token => token.chainId === ChainController.state.activeCaipNetwork?.caipNetworkId
    )
    if (this.search) {
      this.filteredTokens = this.tokenBalances?.filter(token =>
        token.name.toLowerCase().includes(this.search.toLowerCase())
      )
    } else {
      this.filteredTokens = this.tokens
    }

    return html`
      <cross-wui-flex
        class="contentContainer"
        flexDirection="column"
        .padding=${['0', 's', '0', 's'] as const}
      >
        <cross-wui-flex justifyContent="flex-start" .padding=${['m', 's', 's', 's'] as const}>
          <cross-wui-text variant="paragraph-500" color="fg-200">Your tokens</cross-wui-text>
        </cross-wui-flex>
        <cross-wui-flex flexDirection="column" gap="xs">
          ${this.filteredTokens && this.filteredTokens.length > 0
            ? this.filteredTokens.map(
                token =>
                  html`<cross-wui-list-token
                    @click=${this.handleTokenClick.bind(this, token)}
                    ?clickable=${true}
                    tokenName=${token.name}
                    tokenImageUrl=${token.iconUrl}
                    tokenAmount=${token.quantity.numeric}
                    tokenValue=${token.value}
                    tokenCurrency=${token.symbol}
                  ></cross-wui-list-token>`
              )
            : html`<cross-wui-flex
                .padding=${['4xl', '0', '0', '0'] as const}
                alignItems="center"
                flexDirection="column"
                gap="l"
              >
                <cross-wui-icon-box
                  icon="coinPlaceholder"
                  size="inherit"
                  iconColor="fg-200"
                  backgroundColor="fg-200"
                  iconSize="lg"
                ></cross-wui-icon-box>
                <cross-wui-flex
                  class="textContent"
                  gap="xs"
                  flexDirection="column"
                  justifyContent="center"
                  flexDirection="column"
                >
                  <cross-wui-text variant="paragraph-500" align="center" color="fg-100"
                    >No tokens found</wui-text
                  >
                  <cross-wui-text variant="small-400" align="center" color="fg-200"
                    >Your tokens will appear here</wui-text
                  >
                </cross-wui-flex>
                <cross-wui-link @click=${this.onBuyClick.bind(this)}>Buy</cross-wui-link>
              </cross-wui-flex>`}
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  private onBuyClick() {
    RouterController.push('OnRampProviders')
  }
  private onInputChange(event: CustomEvent<string>) {
    this.onDebouncedSearch(event.detail)
  }

  private onDebouncedSearch = CoreHelperUtil.debounce((value: string) => {
    this.search = value
  })

  private handleTokenClick(token: Balance) {
    SendController.setToken(token)
    SendController.setTokenAmount(undefined)
    RouterController.goBack()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-wallet-send-select-token-view': W3mSendSelectTokenView
  }
}
